const crypto = require('node:crypto');
const { promisify } = require('node:util');
const jwt = require('jsonwebtoken');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, BatchWriteCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const pbkdf2 = promisify(crypto.pbkdf2);
const hash = async (password, salt) => (await pbkdf2(password, salt, 100000, 32, 'sha256')).toString('hex');
const emailOf = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

function createApp({ ddb, fetchImpl = fetch, env = process.env, now = Date.now, sleep = ms => new Promise(r => setTimeout(r, ms)) }) {
  const users = env.USERS_TABLE || 'Users';
  const history = env.HISTORY_TABLE || 'UserSearchHistory';
  let failures = 0, openUntil = 0, probing = false;
  const reply = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  const issue = user => jwt.sign({ sid: user.salt }, env.JWT_SECRET, { algorithm: 'HS256', subject: user.UserID, issuer: 'pantrypal', audience: 'pantrypal-web', expiresIn: '1h' });
  async function authenticate(event, body, allowDeleting = false) {
    const authorization = Object.entries(event.headers || {}).find(([k]) => k.toLowerCase() === 'authorization')?.[1];
    let claims;
    try { claims = jwt.verify((authorization || '').replace(/^Bearer /, ''), env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'pantrypal', audience: 'pantrypal-web' }); }
    catch { throw new HttpError(401, 'Invalid or expired session'); }
    const { Item: user } = await ddb.send(new GetCommand({ TableName: users, Key: { UserID: claims.sub }, ConsistentRead: true }));
    if (!user || (user.deleting && !allowDeleting) || user.salt !== claims.sid) throw new HttpError(401, 'Invalid or expired session');
    for (const key of ['UserID', 'userId', 'email']) {
      if (body[key] !== undefined && emailOf(body[key]) !== user.UserID) throw new HttpError(403, 'Account identity does not match session');
    }
    return user;
  }
  async function removeHistory(UserID) {
    let cursor;
    do {
      const page = await ddb.send(new QueryCommand({ TableName: history, KeyConditionExpression: 'UserID = :id', ExpressionAttributeValues: { ':id': UserID }, ProjectionExpression: 'UserID, #ts', ExpressionAttributeNames: { '#ts': 'timestamp' }, ConsistentRead: true, ExclusiveStartKey: cursor }));
      for (let i = 0; i < (page.Items || []).length; i += 25) {
        let pending = { [history]: page.Items.slice(i, i + 25).map(Key => ({ DeleteRequest: { Key } })) };
        for (let attempt = 0; Object.keys(pending).length; attempt++) {
          if (attempt >= 6) throw new Error('History deletion retries exhausted');
          const result = await ddb.send(new BatchWriteCommand({ RequestItems: pending }));
          pending = Object.fromEntries(Object.entries(result.UnprocessedItems || {}).filter(([, items]) => items.length));
          if (Object.keys(pending).length) await sleep(50 * 2 ** attempt);
        }
      }
      cursor = page.LastEvaluatedKey;
    } while (cursor);
  }
  async function recipesFor(ingredients) {
    if (env.CALL_EXTERNAL_API === 'false') return { recipes: [], stale: true, reason: 'disabled' };
    if (now() < openUntil || probing) return { recipes: [], stale: true, reason: 'upstream_unavailable' };
    const halfOpen = openUntil > 0;
    if (halfOpen) probing = true;
    try {
      if (!env.SPOONACULAR_API_KEY) throw new Error('Missing upstream configuration');
      const url = new URL('https://api.spoonacular.com/recipes/findByIngredients');
      url.search = new URLSearchParams({ apiKey: env.SPOONACULAR_API_KEY, ingredients: ingredients.join(','), number: '5', ranking: '1', ignorePantry: 'true' }).toString();
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(4000), redirect: 'error' });
      if (!response.ok) throw new Error('Upstream request failed');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid upstream response');
      const recipes = data.slice(0, 3).map(r => ({ id: r.id, title: r.title, image: r.image, usedIngredients: (r.usedIngredients || []).map(i => i.original || i.name), missingIngredients: (r.missedIngredients || []).map(i => i.original || i.name), spoonacularSourceUrl: `https://spoonacular.com/recipes/${encodeURIComponent(String(r.title).toLowerCase().replace(/\s+/g, '-'))}-${r.id}`, recipeAttribution: { source: 'Spoonacular', text: 'Recipe provided by Spoonacular' } }));
      failures = 0; openUntil = 0;
      return { recipes, stale: false };
    } catch {
      failures++;
      if (halfOpen || failures >= 3) openUntil = now() + 30000;
      return { recipes: [], stale: true, reason: 'upstream_unavailable' };
    } finally { probing = false; }
  }
  return async event => {
    try {
      const method = event.requestContext?.http?.method || event.httpMethod;
      const path = (event.rawPath || event.path || '/suggest').replace(/\/$/, '');
      if (method === 'GET' && path === '/health') return reply(200, { status: 'ok' });
      if (method !== 'POST') throw new HttpError(405, 'Method not allowed');
      if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
      let body;
      try { body = typeof event.body === 'string' ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : event.body || {}; }
      catch { throw new HttpError(400, 'Invalid JSON'); }
      if (!body || Array.isArray(body) || typeof body !== 'object') throw new HttpError(400, 'Expected a JSON object');
      if (path === '/signup' || path === '/login') {
        const UserID = emailOf(body.email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(UserID) || UserID.length > 254 || typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) throw new HttpError(400, 'Valid email and password (8–128 characters) required');
        if (path === '/signup') {
          if (body.consent !== true) throw new HttpError(400, 'Consent is required');
          const salt = crypto.randomBytes(16).toString('hex');
          const user = { UserID, salt, passwordHash: await hash(body.password, salt), createdAt: new Date(now()).toISOString() };
          try { await ddb.send(new PutCommand({ TableName: users, Item: user, ConditionExpression: 'attribute_not_exists(UserID)' })); }
          catch (error) { if (error.name === 'ConditionalCheckFailedException') throw new HttpError(409, 'User already exists'); throw error; }
          return reply(201, { UserID, sessionToken: issue(user), expiresIn: 3600 });
        }
        const { Item: user } = await ddb.send(new GetCommand({ TableName: users, Key: { UserID }, ConsistentRead: true }));
        const candidate = await hash(body.password, user?.salt || '00000000000000000000000000000000');
        if (!user || user.deleting || !user.passwordHash || user.passwordHash.length !== candidate.length || !crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(user.passwordHash))) throw new HttpError(401, 'Invalid credentials');
        return reply(200, { UserID, sessionToken: issue(user), expiresIn: 3600 });
      }
      if (!['/suggest', '/delete_account'].includes(path)) throw new HttpError(404, 'Not found');
      const user = await authenticate(event, body, path === '/delete_account');
      if (path === '/delete_account') {
        if (body.confirmDelete !== true) throw new HttpError(400, 'confirmDelete must be true');
        await ddb.send(new UpdateCommand({ TableName: users, Key: { UserID: user.UserID }, UpdateExpression: 'SET deleting = :yes', ConditionExpression: 'salt = :salt', ExpressionAttributeValues: { ':yes': true, ':salt': user.salt } }));
        await removeHistory(user.UserID);
        await ddb.send(new DeleteCommand({ TableName: users, Key: { UserID: user.UserID }, ConditionExpression: 'salt = :salt', ExpressionAttributeValues: { ':salt': user.salt } }));
        return reply(200, { message: 'Account and associated history deleted' });
      }
      const raw = typeof body.ingredients === 'string' ? body.ingredients.split(',') : body.ingredients;
      if (!Array.isArray(raw) || !raw.length || raw.length > 50 || raw.some(i => typeof i !== 'string' || !i.trim() || i.length > 100)) throw new HttpError(400, 'Provide 1–50 ingredient names, each at most 100 characters');
      const ingredients = [...new Set(raw.map(i => i.trim()))];
      const result = await recipesFor(ingredients);
      const timestamp = now();
      try {
        await ddb.send(new TransactWriteCommand({ TransactItems: [
          { ConditionCheck: { TableName: users, Key: { UserID: user.UserID }, ConditionExpression: 'salt = :salt AND attribute_not_exists(deleting)', ExpressionAttributeValues: { ':salt': user.salt } } },
          { Put: { TableName: history, Item: { UserID: user.UserID, timestamp, ingredients, recipesPreview: result.recipes.map(r => r.title), expiresAt: Math.floor(timestamp / 1000) + 30 * 86400 } } }
        ] }));
      } catch (error) {
        if (error.name === 'TransactionCanceledException') throw new HttpError(401, 'Session is no longer active');
        console.warn(JSON.stringify({ event: 'history_write_failed', requestId: event.requestContext?.requestId }));
      }
      return reply(200, { ingredients, ...result });
    } catch (error) {
      if (!error.status) console.error(JSON.stringify({ event: 'request_failed', requestId: event.requestContext?.requestId, type: error.name }));
      return reply(error.status || 500, { error: error.status ? error.message : 'Internal server error' });
    }
  };
}
module.exports = { createApp };
