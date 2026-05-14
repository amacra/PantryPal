// test_01_Accountability.js
// CCT: #1 Accountability – test_data_inventory_spec

const assert = require("assert");
const crypto = require("crypto");

// ----- In-memory "tables" -----
const Users = new Map(); // key: UserID (email)
const UserSearchHistory = []; // array of { UserID, timestamp, ingredients, recipesPreview, expiresAt }

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
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // ~30 days

  const recipes = [
    { id: 1, title: "Mock Recipe 1" },
    { id: 2, title: "Mock Recipe 2" },
    { id: 3, title: "Mock Recipe 3" },
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

// ----- Test #1: Accountability -----
async function test_data_inventory_spec() {
  const email = "test_accountability@example.com";

  // Arrange
  signup(email);
  suggest(email, ["eggs", "spinach"]);

  // Check Users table shape
  const user = Users.get(email);
  assert.ok(user, "User record should exist");

  const userKeys = Object.keys(user).sort();
  assert.deepStrictEqual(
    userKeys,
    ["UserID", "createdAt", "passwordHash", "salt"].sort(),
    "Users table should only have UserID, passwordHash, salt, createdAt"
  );

  // Check UserSearchHistory shape
  const historyItems = UserSearchHistory.filter(
    (h) => h.UserID === email
  );
  assert.ok(historyItems.length > 0, "History should contain at least one item");

  const h = historyItems[0];
  const historyKeys = Object.keys(h).sort();
  assert.deepStrictEqual(
    historyKeys,
    ["UserID", "timestamp", "ingredients", "recipesPreview", "expiresAt"].sort(),
    "History items should only have UserID, timestamp, ingredients, recipesPreview, expiresAt"
  );
}

// Run
(async () => {
  try {
    await test_data_inventory_spec();
    console.log("✅ test_data_inventory_spec passed");
  } catch (err) {
    console.error("❌ test_data_inventory_spec failed:", err);
    process.exitCode = 1;
  }
})();
