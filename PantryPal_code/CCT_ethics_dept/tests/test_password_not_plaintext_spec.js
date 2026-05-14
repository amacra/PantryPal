// test_07_Safeguards.js
// CCT: #7 Safeguards – test_password_not_plaintext_spec

const assert = require("assert");
const crypto = require("crypto");

// ----- In-memory "tables" -----
const Users = new Map();

// ----- Helpers -----
function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 32, "sha256")
    .toString("hex");
}

function signup(email, password = "SuperSecret123!") {
  const UserID = email.trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const createdAt = Date.now();
  Users.set(UserID, { UserID, passwordHash, salt, createdAt });
}

// ----- Test #7: Safeguards -----
async function test_password_not_plaintext_spec() {
  const email = "test_safeguards@example.com";
  const rawPassword = "SuperSecret123!";

  signup(email, rawPassword);

  const user = Users.get(email);
  assert.ok(user, "User must exist");

  assert.notStrictEqual(
    user.passwordHash,
    rawPassword,
    "passwordHash must not equal plaintext password"
  );

  assert.ok(
    typeof user.salt === "string" && user.salt.length > 0,
    "salt must be present and non-empty"
  );
}

// Run
(async () => {
  try {
    await test_password_not_plaintext_spec();
    console.log("✅ test_password_not_plaintext_spec passed");
  } catch (err) {
    console.error("❌ test_password_not_plaintext_spec failed:", err);
    process.exitCode = 1;
  }
})();
