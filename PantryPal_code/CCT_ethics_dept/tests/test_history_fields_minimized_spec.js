// test_04_Limiting_Collection.js
// CCT: #4 Limiting Collection – test_history_fields_minimized_spec

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
}

function suggest(UserID, ingredients = ["rice", "chicken"]) {
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

  const item = {
    UserID,
    timestamp: now,
    ingredients: ingredients.map((s) => String(s).trim()),
    recipesPreview: ["Mock Rice Bowl"],
    expiresAt,
  };
  UserSearchHistory.push(item);
}

// ----- Test #4: Limiting Collection -----
async function test_history_fields_minimized_spec() {
  const email = "test_collection@example.com";
  signup(email);
  suggest(email);

  const historyItems = UserSearchHistory.filter((h) => h.UserID === email);
  assert.ok(historyItems.length > 0, "History should exist for user");

  const h = historyItems[0];
  const keys = Object.keys(h).sort();
  assert.deepStrictEqual(
    keys,
    ["UserID", "timestamp", "ingredients", "recipesPreview", "expiresAt"].sort(),
    "History item must only contain minimal approved fields"
  );
}

// Run
(async () => {
  try {
    await test_history_fields_minimized_spec();
    console.log("✅ test_history_fields_minimized_spec passed");
  } catch (err) {
    console.error("❌ test_history_fields_minimized_spec failed:", err);
    process.exitCode = 1;
  }
})();
