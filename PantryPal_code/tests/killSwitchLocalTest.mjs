import CircuitBreaker from "opossum";

// Mock API call
async function mockFetchRecipes(ingredients) {
  return [{ id: 1, title: "Mock Recipe 1" }];
}

// Circuit breaker (not strictly needed for kill switch, but included for consistency)
const breaker = new CircuitBreaker(mockFetchRecipes, {
  timeout: 5000,
  errorThresholdPercentage: 20,
  resetTimeout: 2000, // short for local testing
});

breaker.fallback(() => [{ id: 0, title: "Fallback Recipe" }]);

async function handler(event, callExternalApi = true) {
  const ingredients = event.ingredients || [];

  // 🔹 Manual kill switch
  if (!callExternalApi) {
    console.log("Kill switch active: bypassing external API");
    return { recipes: [], stale: true };
  }

  // Normal circuit breaker flow
  const recipes = await breaker.fire(ingredients);
  return { recipes };
}

// === Tests ===
async function runKillSwitchTests() {
  console.log("=== Test 1: Kill switch OFF (API allowed) ===");
  const result1 = await handler({ ingredients: ["eggs", "milk"] }, true);
  console.log(result1);

  console.log("=== Test 2: Kill switch ON (API bypassed) ===");
  const result2 = await handler({ ingredients: ["eggs", "milk"] }, false);
  console.log(result2);
}

runKillSwitchTests();
