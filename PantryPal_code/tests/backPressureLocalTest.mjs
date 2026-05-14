// ----- Configuration -----
const TOTAL_REQUESTS = 20; // total requests to simulate
const CONCURRENT_LIMIT = 5; // number of parallel "workers"
const FAILURE_RATE = 0.2; // 20% requests randomly fail
const LATENCY_MS = 100; // simulated API latency

// ----- Mock API call -----
async function mockApiCall() {
  // simulate latency
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  // simulate failure randomly
  if (Math.random() < FAILURE_RATE) {
    throw new Error("Simulated API failure");
  }

  // simulate successful response
  return { recipes: [{ id: 1, title: "Mock Recipe" }] };
}

// ----- Worker function -----
async function worker(id, results) {
  try {
    const res = await mockApiCall();
    results.push({ request: id, response: res });
  } catch (e) {
    results.push({ request: id, error: e.message });
  }
}

// ----- Simulation function -----
async function simulateRequests(total, concurrency) {
  console.log(`Simulating ${total} requests with concurrency ${concurrency}\n`);
  let index = 1;
  const results = [];

  async function runWorker() {
    while (index <= total) {
      const current = index++;
      await worker(current, results);
    }
  }

  // launch concurrent workers
  await Promise.all(Array.from({ length: concurrency }, runWorker));
  return results;
}

// ----- Run simulation -----
(async () => {
  const output = await simulateRequests(TOTAL_REQUESTS, CONCURRENT_LIMIT);
  console.log("=== Back-Pressure Simulation Results ===");
  output.forEach((r) => console.log(r));
})();
