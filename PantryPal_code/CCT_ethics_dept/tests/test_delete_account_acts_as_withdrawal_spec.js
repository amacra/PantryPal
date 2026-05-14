// test_03_Consent.js
// CCT: #3 Consent – test_delete_account_acts_as_withdrawal_spec

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

function suggest(UserID, ingredients = ["tomato", "pasta"]) {
  const normalizedIngredients = ingredients.map((s) => String(s).trim());
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

  const item = {
    UserID,
    timestamp: now,
    ingredients: normalizedIngredients,
    recipesPreview: ["Mock Pasta"],
    expiresAt,
  };

  UserSearchHistory.push(item);
}

function deleteAccount(UserID) {
  Users.delete(UserID);
  for (let i = UserSearchHistory.length - 1; i >= 0; i--) {
    if (UserSearchHistory[i].UserID === UserID) {
      UserSearchHistory.splice(i, 1);
    }
  }
}

// ----- Test #3: Consent / Withdrawal -----
async function test_delete_account_acts_as_withdrawal_spec() {
  const email = "test_consent@example.com";

  signup(email);
  suggest(email, ["tomato", "pasta"]);
  suggest(email, ["cheese"]);

  assert.ok(Users.get(email), "User exists before deletion");
  assert.ok(
    UserSearchHistory.some((h) => h.UserID === email),
    "History exists before deletion"
  );

  deleteAccount(email);

  assert.ok(!Users.get(email), "User should be removed after deleteAccount");
  assert.ok(
    !UserSearchHistory.some((h) => h.UserID === email),
    "All history for user should be removed after deleteAccount"
  );
}

// Run
(async () => {
  try {
    await test_delete_account_acts_as_withdrawal_spec();
    console.log("✅ test_delete_account_acts_as_withdrawal_spec passed");
  } catch (err) {
    console.error("❌ test_delete_account_acts_as_withdrawal_spec failed:", err);
    process.exitCode = 1;
  }
})();
