const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./app');
function setup(overrides = {}) {
  const users = new Map(), history = [], commands = [];
  let upstreamCalls = 0;
  const env = { JWT_SECRET: 'test-secret-with-at-least-32-characters', SPOONACULAR_API_KEY: 'test', ...overrides };
  const ddb = { async send(command) {
    commands.push(command);
    const x = command.input;
    switch (command.constructor.name) {
      case 'GetCommand': return { Item: users.get(x.Key.UserID) };
      case 'PutCommand':
        if (users.has(x.Item.UserID)) throw Object.assign(new Error(), { name: 'ConditionalCheckFailedException' });
        users.set(x.Item.UserID, x.Item); return {};
      case 'UpdateCommand': users.get(x.Key.UserID).deleting = true; return {};
      case 'DeleteCommand': users.delete(x.Key.UserID); return {};
      case 'QueryCommand': return { Items: history.filter(h => h.UserID === x.ExpressionAttributeValues[':id']).map(({UserID, timestamp}) => ({UserID, timestamp})) };
      case 'BatchWriteCommand':
        for (const r of x.RequestItems.UserSearchHistory) {
          const k = r.DeleteRequest.Key;
          const i = history.findIndex(h => h.UserID === k.UserID && h.timestamp === k.timestamp);
          if (i >= 0) history.splice(i, 1);
        }
        return {};
      case 'TransactWriteCommand': {
        const condition = x.TransactItems[0].ConditionCheck;
        const user = users.get(condition.Key.UserID);
        if (!user || user.deleting || user.salt !== condition.ExpressionAttributeValues[':salt']) throw Object.assign(new Error(), { name: 'TransactionCanceledException' });
        history.push(x.TransactItems[1].Put.Item); return {};
      }
      default: throw new Error(command.constructor.name);
    }
  }};
  let fail = false;
  const app = createApp({ ddb, env, fetchImpl: async () => { upstreamCalls++; if (fail) throw new Error('outage'); return { ok: true, json: async () => [{ id: 1, title: 'Rice', usedIngredients: [{ name: 'rice' }] }] }; } });
  const call = async (path, body = {}, token, method = 'POST') => {
    const r = await app({ rawPath: path, requestContext: { http: { method } }, headers: token ? { authorization: `Bearer ${token}` } : {}, body: typeof body === 'string' ? body : JSON.stringify(body) });
    return { status: r.statusCode, body: JSON.parse(r.body) };
  };
  const signup = async () => (await call('/signup', { email: 'Cook@Example.com', password: 'Secret123!', consent: true })).body.sessionToken;
  return { ddb, call, signup, users, history, commands, fail: () => { fail = true; }, calls: () => upstreamCalls };
}
test('actual handlers: signup, duplicate, login, authorization, history TTL, deletion and token revocation', async () => {
  const s = setup();
  const token = await s.signup();
  assert.ok(token);
  assert.equal(s.users.get('cook@example.com').passwordHash.length, 64);
  assert.equal((await s.signup()), undefined);
  assert.equal((await s.call('/login', { email: 'cook@example.com', password: 'incorrect' })).status, 401);
  assert.equal((await s.call('/login', { email: 'cook@example.com', password: 'Secret123!' })).status, 200);
  assert.equal((await s.call('/suggest', { ingredients: ['rice'] })).status, 401);
  assert.equal((await s.call('/suggest', { ingredients: ['rice'], UserID: 'other@example.com' }, token)).status, 403);
  assert.equal((await s.call('/suggest', { ingredients: ['rice'] }, token)).body.recipes.length, 1);
  assert.equal(s.history[0].expiresAt, Math.floor(s.history[0].timestamp / 1000) + 2592000);
  assert.equal((await s.call('/delete_account', { confirmDelete: false }, token)).status, 400);
  assert.equal((await s.call('/delete_account', { confirmDelete: true }, token)).status, 200);
  assert.equal(s.users.size, 0); assert.equal(s.history.length, 0);
  await s.signup();
  assert.equal((await s.call('/suggest', { ingredients: ['rice'] }, token)).status, 401);
});
test('validation and malformed JSON', async () => {
  const s = setup(), token = await s.signup();
  assert.equal((await s.call('/suggest', '{', token)).status, 400);
  for (const ingredients of [[], [3], [' '], Array(51).fill('rice')]) assert.equal((await s.call('/suggest', { ingredients }, token)).status, 400);
  assert.equal((await s.call('/health', {}, null, 'GET')).status, 200);
  assert.equal((await s.call('/suggest', {}, token, 'GET')).status, 405);
});
test('upstream failures open circuit and kill switch bypasses fetch', async () => {
  const s = setup(), token = await s.signup(); s.fail();
  for (let i = 0; i < 5; i++) assert.equal((await s.call('/suggest', { ingredients: ['rice'] }, token)).body.stale, true);
  assert.equal(s.calls(), 3);
  const disabled = setup({ CALL_EXTERNAL_API: 'false' }), t = await disabled.signup();
  assert.equal((await disabled.call('/suggest', { ingredients: ['rice'] }, t)).body.reason, 'disabled');
  assert.equal(disabled.calls(), 0);
});
test('deletion retry resumes a marked account and removes multiple batches', async () => {
  const s = setup(), token = await s.signup();
  s.users.get('cook@example.com').deleting = true;
  for (let timestamp = 0; timestamp < 60; timestamp++) s.history.push({ UserID: 'cook@example.com', timestamp });
  assert.equal((await s.call('/suggest', { ingredients: ['rice'] }, token)).status, 401);
  assert.equal((await s.call('/delete_account', { confirmDelete: true }, token)).status, 200);
  assert.equal(s.history.length, 0);
  assert.equal(s.commands.filter(c => c.constructor.name === 'BatchWriteCommand').length, 3);
});
test('in-flight suggestion cannot write history after deletion begins', async () => {
  const s = setup(), token = await s.signup();
  // Mark deleting between authentication read and transactional write via fetch.
  const ddb = { async send(c) {
    if (c.constructor.name === 'GetCommand') return { Item: s.users.get(c.input.Key.UserID) };
    if (c.constructor.name === 'TransactWriteCommand') {
      assert.equal(s.users.get('cook@example.com').deleting, true);
      throw Object.assign(new Error(), { name: 'TransactionCanceledException' });
    }
    throw new Error('Unexpected command');
  }};
  const app = createApp({ ddb, env: { JWT_SECRET: 'test-secret-with-at-least-32-characters', SPOONACULAR_API_KEY: 'test' }, fetchImpl: async () => { s.users.get('cook@example.com').deleting = true; return { ok: true, json: async () => [] }; } });
  const result = await app({ rawPath: '/suggest', httpMethod: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ ingredients: ['rice'] }) });
  assert.equal(result.statusCode, 401);
  assert.equal(s.history.length, 0);
});
test('deletion follows pages and retries unprocessed writes', async () => {
  const s = setup(), token = await s.signup();
  s.history.push({ UserID: 'cook@example.com', timestamp: 1 }, { UserID: 'cook@example.com', timestamp: 2 });
  const send = s.ddb.send.bind(s.ddb);
  let pages = 0, batches = 0;
  s.ddb.send = async command => {
    if (command.constructor.name === 'QueryCommand') {
      pages++;
      return pages === 1 ? { Items: [{ UserID: 'cook@example.com', timestamp: 1 }], LastEvaluatedKey: { UserID: 'cook@example.com', timestamp: 1 } } : { Items: [{ UserID: 'cook@example.com', timestamp: 2 }] };
    }
    if (command.constructor.name === 'BatchWriteCommand' && ++batches === 1) return { UnprocessedItems: command.input.RequestItems };
    return send(command);
  };
  assert.equal((await s.call('/delete_account', { confirmDelete: true }, token)).status, 200);
  assert.equal(pages, 2); assert.equal(batches, 3);
  assert.equal(s.history.length, 0);
});
