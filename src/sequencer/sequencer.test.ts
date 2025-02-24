import { Keypair, PublicKey } from "@solana/web3.js";
import { FermiHybridClient, OrderIntentSide } from "./sequencer.client";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Derek's keypair from JSON file
const DEREK_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(
      readFileSync(
        resolve(__dirname, "../../keypairs/Derek_keypair.json"),
        "utf-8"
      )
    )
  )
);

const checkHealthTest = async () => {
  console.log("🔍 Checking if client is healthy");
  const client = new FermiHybridClient();
  const isHealthy = await client.checkHealth();

  if (!isHealthy) {
    console.warn("🚨 Client is not healthy");
  } else {
    console.log("✅ Client is healthy");
  }
};

const placeOrderIntentTest = async () => {
  console.log("🔍 Placing Order Intent");

  try {
    const client = new FermiHybridClient();

    // Generate test keypairs for base and quote mints
    const baseMint = Keypair.generate().publicKey;
    const quoteMint = Keypair.generate().publicKey;

    const orderIntent = await client.placeOrderIntent({
      price: 100,
      quantity: 10,
      side: OrderIntentSide.BUY,
      ownerKeypair: DEREK_KEYPAIR,
      baseMint,
      quoteMint,
    });

    console.log("✅ Order Intent Placed", {
      orderId: orderIntent.order_id,
      side: orderIntent.side,
      price: orderIntent.price,
      quantity: orderIntent.quantity,
      baseMint: orderIntent.base_mint,
      quoteMint: orderIntent.quote_mint,
      owner: orderIntent.owner,
    });
  } catch (error) {
    console.error("🚨 Error placing order intent", error);
  }
};

const runTest = async (name: string, testFn: () => Promise<void>) => {
  console.log(`------------------`);
  console.log(`🔍 Running ${name}`);
  const start = performance.now();
  await testFn();
  const end = performance.now();
  const duration = end - start;
  console.log(`🕒 Test took ${duration} milliseconds`);
  console.log(`✅ ${name} completed`);
  console.log(`------------------`);
};

const main = async () => {
  await runTest("Health Check", checkHealthTest);
  await runTest("Place Order Intent", placeOrderIntentTest);
};

// Use top-level await for ES modules
await main();
