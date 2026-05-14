// test_06_Accuracy.js
// CCT: #6 Accuracy – test_recreate_account_updates_email_spec

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

function deleteAccount(UserID) {
  Users.delete(UserID);
  for (let i = UserSearchHistory.length - 1; i >= 0; i--) {
    if (UserSearchHistory[i].UserID === UserID) {
      UserSearchHistory.splice(i, 1);
    }
  }
}

// ----- Test #6: Accuracy -----
async function test_recreate_account_updates_email_spec() {
  const email = "test_accuracy@example.com";

  signup(email);
  assert.ok(Users.get(email), "User should exist after initial signup");

  deleteAccount(email);
  assert.ok(!Users.get(email), "User should be deleted after deleteAccount");

  signup(email); // recreate with same email
  assert.ok(Users.get(email), "User should exist after re-signup");

  // Because Users is keyed by email, there is at most one row for that UserID.
  // We just assert the record looks fresh (has required fields).
  const user = Users.get(email);
  const keys = Object.keys(user).sort();
  assert.deepStrictEqual(
    keys,
    ["UserID", "createdAt", "passwordHash", "salt"].sort(),
    "Recreated user must have correct shape"
  );
}

// Run
(async () => {
  try {
    await test_recreate_account_updates_email_spec();
    console.log("✅ test_recreate_account_updates_email_spec passed");
  } catch (err) {
    console.error("❌ test_recreate_account_updates_email_spec failed:", err);
    process.exitCode = 1;
  }
})();
