const CircuitBreaker = require("opossum");

// Mock API function
async function fetchRecipesMock(shouldFail = false) {
  if (shouldFail) throw new Error("Simulated API failure");
  return [
    { id: 1, title: "Mock Recipe 1" },
    { id: 2, title: "Mock Recipe 2" },
  ];
}

// Circuit breaker with short timeout for quick testing
const breaker = new CircuitBreaker(fetchRecipesMock, {
  timeout: 1000, // 1s per call
  errorThresholdPercentage: 20, // 20% failures trips the circuit
  resetTimeout: 5000, // 5s cooldown for quick testing
});

// Fallback returns stale data
breaker.fallback(() => ({
  stale: true,
  recipes: [{ id: 0, title: "Stale Recipe 0" }],
}));

// ----- Basic single-run tests -----
async function singleRunTests() {
  console.log("=== Test 1: Successful call ===");
  console.log(await breaker.fire(false));

  console.log("\n=== Test 2: Simulate failures ===");
  for (let i = 0; i < 5; i++) {
    try {
      await breaker.fire(true);
    } catch (err) {
      console.log("Error caught:", err.message);
    }
  }

  console.log("\n=== Test 3: Circuit fallback ===");
  console.log(await breaker.fire(false));

  console.log("\n=== Test 4: Circuit retry after cooldown ===");
  setTimeout(async () => {
    console.log("=== Test 4: Retry after cooldown ===");
    console.log(await breaker.fire(false));
  }, 6000);
}

// ----- Continuous API flap simulation -----
async function simulateApiFlap() {
  console.log("\n=== Simulating repeated API flaps ===");

  let cycle = 0;
  const interval = setInterval(async () => {
    cycle++;
    const shouldFail = Math.random() < 0.5; // 50% chance of failure

    try {
      const result = await breaker.fire(shouldFail);
      console.log(`Cycle ${cycle}: Success`, result);
    } catch (err) {
      console.log(`Cycle ${cycle}: Error caught`, err.message);
    }

    if (cycle >= 20) {
      // stop after 20 cycles
      clearInterval(interval);
      console.log("=== Simulation complete ===");
    }
  }, 1000); // run a cycle every 1 second
}

// Run both
singleRunTests().then(() => simulateApiFlap());
