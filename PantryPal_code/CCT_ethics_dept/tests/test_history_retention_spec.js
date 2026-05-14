// test_05_Limiting_Use_Disclosure_Retention.js
// CCT: #5 Limiting Use, Disclosure & Retention – test_history_retention_spec

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

  const item = {
    UserID,
    timestamp: now,
    ingredients: ingredients.map((s) => String(s).trim()),
    recipesPreview: [`Recipe for ${ingredients.join(", ")}`],
    expiresAt,
  };

  UserSearchHistory.push(item);

  // Enforce "last 10" semantics per user
  const perUser = UserSearchHistory.filter((h) => h.UserID === UserID);
  if (perUser.length > 10) {
    // remove oldest extras
    const sorted = perUser.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = sorted.slice(0, perUser.length - 10);
    for (const r of toRemove) {
      const idx = UserSearchHistory.indexOf(r);
      if (idx !== -1) UserSearchHistory.splice(idx, 1);
    }
  }
}

// ----- Test #5: Limiting Use, Disclosure & Retention -----
async function test_history_retention_spec() {
  const email = "test_retention@example.com";
  signup(email);

  for (let i = 0; i < 15; i++) {
    suggest(email, [`ingredient_${i}`, "salt"]);
  }

  const historyItems = UserSearchHistory.filter((h) => h.UserID === email);
  assert.ok(historyItems.length <= 10, "No more than 10 history items per user");

  const now = Date.now();
  for (const h of historyItems) {
    assert.ok(
      h.expiresAt > now,
      "expiresAt should be in the future (~30 days TTL)"
    );
  }
}

// Run
(async () => {
  try {
    await test_history_retention_spec();
    console.log("✅ test_history_retention_spec passed");
  } catch (err) {
    console.error("❌ test_history_retention_spec failed:", err);
    process.exitCode = 1;
  }
})();
