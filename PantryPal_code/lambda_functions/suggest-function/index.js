// index.js for SuggestMealsFunction

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const jwt = require("jsonwebtoken");

// ----- Config -----

const REGION = process.env.AWS_REGION || "ca-central-1";
const HISTORY_TABLE = process.env.HISTORY_TABLE || "UserSearchHistory";
const JWT_SECRET = process.env.JWT_SECRET || null; // optional for now
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL =
  "https://api.spoonacular.com/recipes/findByIngredients";

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

// ----- Helpers -----

function getUserIdFromEvent(event, body) {
  // Try Authorization: Bearer <token> first (for when login is wired up)
  const headers = event.headers || {};
  const authHeader = headers.Authorization || headers.authorization;

  if (JWT_SECRET && authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return payload.sub; // we used sub = userId in LoginFunction
    } catch (e) {
      console.warn("JWT verification failed:", e.message);
      // fall through to body-based userId
    }
  }

  // Fallback for now: pass userId/UserID in the body (for testing)
  if (body && (body.userId || body.UserID)) {
    return body.userId || body.UserID;
  }

  return null;
}

function normalizeIngredients(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }

  // assume comma-separated string
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Save a small history record
async function saveSearchHistory(userId, ingredients, recipes) {
  if (!userId) return;

  const now = Date.now();

  const item = {
    UserID: userId,
    timestamp: now,
    ingredients,
    recipesPreview: recipes.map((r) => r.title),
  };

  const cmd = new PutCommand({
    TableName: HISTORY_TABLE,
    Item: item,
  });

  await ddb.send(cmd);
}

// Call Spoonacular "findByIngredients" API and map to our schema
async function fetchRecipesFromSpoonacular(ingredients) {
  if (!SPOONACULAR_API_KEY) {
    throw new Error("Spoonacular API key not configured");
  }

  // Spoonacular expects "eggs,spinach,cheese"
  const ingredientsParam = ingredients.join(",");

  const url = new URL(SPOONACULAR_BASE_URL);
  url.searchParams.set("apiKey", SPOONACULAR_API_KEY);
  url.searchParams.set("ingredients", ingredientsParam);
  url.searchParams.set("number", "5"); // fetch a few, then take top 3
  url.searchParams.set("ranking", "1"); // 1 = maximize used ingredients
  url.searchParams.set("ignorePantry", "true");

  console.log("Calling Spoonacular:", url.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    console.error("Spoonacular error:", response.status, text);
    throw new Error("Spoonacular API error: " + response.status);
  }

  const data = await response.json();
  const list = Array.isArray(data) ? data : [];

  const mapped = list.map((r) => {
    const used = (r.usedIngredients || []).map(
      (i) => i.original || i.name || i.originalName
    );
    const missed = (r.missedIngredients || []).map(
      (i) => i.original || i.name || i.originalName
    );

    return {
      id: r.id,
      title: r.title,
      image: r.image,
      usedIngredients: used,
      missingIngredients: missed,
      // spoonacular doesn't always give a direct URL here, but we can construct one
      // this is fine for a student project
      spoonacularSourceUrl: `https://spoonacular.com/recipes/${encodeURIComponent(
        r.title.toLowerCase().replace(/\s+/g, "-")
      )}-${r.id}`,
    };
  });

  return mapped.slice(0, 3);
}

// ----- Handler -----

exports.handler = async (event) => {
  console.log("Incoming event:", JSON.stringify(event));

  try {
    if (event.httpMethod && event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};

    const userId = getUserIdFromEvent(event, body);
    if (!userId) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error:
            "Unauthorized (missing userId in body or valid Authorization token)",
        }),
      };
    }

    const ingredients = normalizeIngredients(body.ingredients);
    if (!ingredients.length) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "ingredients are required" }),
      };
    }

    const recipes = await fetchRecipesFromSpoonacular(ingredients);

    try {
      await saveSearchHistory(userId, ingredients, recipes);
    } catch (e) {
      console.warn("Failed to save search history:", e);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        ingredients,
        recipes,
      }),
    };
  } catch (err) {
    console.error("Error in SuggestMealsFunction:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
