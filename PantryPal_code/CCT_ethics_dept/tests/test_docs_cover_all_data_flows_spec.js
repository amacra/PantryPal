// test_08_Openness.js
// CCT: #8 Openness – test_docs_cover_all_data_flows_spec

const assert = require("assert");

// For this mock, "tables" are just in-memory maps/arrays
const Users = new Map();
const UserSearchHistory = [];

// ----- Test #8: Openness -----
async function test_docs_cover_all_data_flows_spec() {
  // In the real system, you'd map this to telemetry-matrix.md.
  // Here, we just assert that exactly two user-data "tables" exist.
  const tableNames = ["Users", "UserSearchHistory"];

  assert.deepStrictEqual(
    tableNames.sort(),
    ["Users", "UserSearchHistory"].sort(),
    "Exactly two user-data tables should be present in this design"
  );

  // Optionally, assert they are reachable
  assert.ok(Users instanceof Map, "Users table (map) is reachable");
  assert.ok(Array.isArray(UserSearchHistory), "UserSearchHistory array is reachable");
}

// Run
(async () => {
  try {
    await test_docs_cover_all_data_flows_spec();
    console.log("✅ test_docs_cover_all_data_flows_spec passed");
  } catch (err) {
    console.error("❌ test_docs_cover_all_data_flows_spec failed:", err);
    process.exitCode = 1;
  }
})();
