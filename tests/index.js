import { Keypair } from "@solana/web3.js";
import { FermiHybridClient, OrderIntentSide } from "../dist/index.js";

const checkHealthTest = async () => {
  const client = new FermiHybridClient();
  const isHealthy = await client.checkHealth();

  if (!isHealthy) {
    console.warn("🚨 Client is not healthy");
  } else {
    console.log("✅ Client is healthy");
  }
};

const placeOrderIntentTest = async () => {

  try {
    const client = new FermiHybridClient();

    const orderIntent = await client.placeOrderIntent({
      price: 100,
      quantity: 10,
      side: OrderIntentSide.BUY,
      ownerKeypair: Keypair.generate(),
    });

    console.log("✅ Order Intent Placed");
  } catch (error) {
    console.error("🚨 Error placing order intent", error);
  }
};

const runTest = async (name, testFn) => {
  console.log(`------------------`);
  console.log(`🔍 Running ${name}`);
  const start = performance.now();
  await testFn();
  const end = performance.now();
  const duration = end - start;
  console.log(`🕒 Test took ${duration} milliseconds`);
  console.log(`------------------`);
};

const main = async () => {
  await runTest("Health Check", checkHealthTest);
  await runTest("Place Order Intent", placeOrderIntentTest);
};

main();
