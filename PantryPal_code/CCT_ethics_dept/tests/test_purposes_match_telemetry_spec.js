// test_02_Identifying_Purposes.js
// CCT: #2 Identifying Purposes – test_purposes_match_telemetry_spec

const assert = require("assert");
const crypto = require("crypto");

// ----- In-memory "tables" -----
const Users = new Map();
const UserSearchHistory = [];

// ----- Helpers -----
function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 32, "sha256")
    .toString("hex");
}

function signup(email, password = "Secret123") {
  const UserID = email.trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const createdAt = Date.now();

  Users.set(UserID, { UserID, passwordHash, salt, createdAt });
  return { UserID };
}

function suggest(UserID, ingredients = ["eggs", "spinach"]) {
  const normalizedIngredients = ingredients.map((s) => String(s).trim());
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

  const recipes = [
    { id: 1, title: "Mock Recipe 1" },
    { id: 2, title: "Mock Recipe 2" },
  ];

  const item = {
    UserID,
    timestamp: now,
    ingredients: normalizedIngredients,
    recipesPreview: recipes.map((r) => r.title),
    expiresAt,
  };

  UserSearchHistory.push(item);
  return recipes;
}

// ----- Test #2: Identifying Purposes -----
async function test_purposes_match_telemetry_spec() {
  const email = "test_purposes@example.com";

  signup(email);
  suggest(email, ["rice", "beans"]);

  const user = Users.get(email);
  assert.ok(user, "User should exist");

  // Indirectly validate "purposes" by verifying no extra fields beyond telemetry spec.
  const userKeys = Object.keys(user).sort();
  assert.deepStrictEqual(
    userKeys,
    ["UserID", "createdAt", "passwordHash", "salt"].sort(),
    "User record should not contain undocumented fields"
  );

  const historyItems = UserSearchHistory.filter((h) => h.UserID === email);
  assert.ok(historyItems.length > 0, "History should exist");

  const h = historyItems[0];
  const historyKeys = Object.keys(h).sort();
  assert.deepStrictEqual(
    historyKeys,
    ["UserID", "timestamp", "ingredients", "recipesPreview", "expiresAt"].sort(),
    "History record should not contain undocumented fields"
  );
}

// Run
(async () => {
  try {
    await test_purposes_match_telemetry_spec();
    console.log("✅ test_purposes_match_telemetry_spec passed");
  } catch (err) {
    console.error("❌ test_purposes_match_telemetry_spec failed:", err);
    process.exitCode = 1;
  }
})();
