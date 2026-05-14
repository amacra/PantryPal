// test_09_Individual_Access.js
// CCT: #9 Individual Access – test_access_via_support_process_spec

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

function suggest(UserID, ingredients) {
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  UserSearchHistory.push({
    UserID,
    timestamp: now,
    ingredients: ingredients.map((s) => String(s).trim()),
    recipesPreview: [`Recipe for ${ingredients.join(", ")}`],
    expiresAt,
  });
}

// Simulated "support process" access function
function getUserData(UserID) {
  const user = Users.get(UserID) || null;
  const history = UserSearchHistory.filter((h) => h.UserID === UserID);
  return { user, history };
}

// ----- Test #9: Individual Access -----
async function test_access_via_support_process_spec() {
  const email = "test_access@example.com";
  signup(email);
  suggest(email, ["eggs", "milk"]);
  suggest(email, ["rice"]);

  const result = getUserData(email);
  assert.ok(result.user, "Support process should see a user record");
  assert.ok(
    result.history.length >= 2,
    "Support process should see this user's history records"
  );
}

// Run
(async () => {
  try {
    await test_access_via_support_process_spec();
    console.log("✅ test_access_via_support_process_spec passed");
  } catch (err) {
    console.error("❌ test_access_via_support_process_spec failed:", err);
    process.exitCode = 1;
  }
})();
