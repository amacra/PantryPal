// test_10_Challenging_Compliance.js
// CCT: #10 Challenging Compliance – test_delete_account_clears_all_data_spec

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

function deleteAccount(UserID) {
  Users.delete(UserID);
  for (let i = UserSearchHistory.length - 1; i >= 0; i--) {
    if (UserSearchHistory[i].UserID === UserID) {
      UserSearchHistory.splice(i, 1);
    }
  }
}

// ----- Test #10: Challenging Compliance -----
async function test_delete_account_clears_all_data_spec() {
  const email = "test_challenging@example.com";

  signup(email);
  suggest(email, ["tomato"]);
  suggest(email, ["onion"]);
  suggest(email, ["garlic"]);

  assert.ok(Users.get(email), "User exists before deletion");
  assert.ok(
    UserSearchHistory.some((h) => h.UserID === email),
    "History exists before deletion"
  );

  deleteAccount(email);

  assert.ok(!Users.get(email), "User must not exist after deletion");
  assert.ok(
    !UserSearchHistory.some((h) => h.UserID === email),
    "No history records must remain after deletion"
  );
}

// Run
(async () => {
  try {
    await test_delete_account_clears_all_data_spec();
    console.log("✅ test_delete_account_clears_all_data_spec passed");
  } catch (err) {
    console.error("❌ test_delete_account_clears_all_data_spec failed:", err);
    process.exitCode = 1;
  }
})();
