import { OrderIntent, OrderSide } from "./OrderIntent.js";
import * as anchor from "@coral-xyz/anchor";
import {
  BASE_MINT,
  CHARLES_KEYPAIR,
  DEREK_KEYPAIR,
  QUOTE_MINT,
} from "../test/constants.js";
import { FermiSequencerClient } from "./sequencer.client.js";

const { BN } = anchor.default;

const main2 = async () => {
  const client = new FermiSequencerClient();

  const messageBytesBackendString =
    "46524d5f4445585f4f524445523a604c0042950100000d572574fa9849299b06cc2e2e6cc8d5eb1aca96c5b8be3d4e4719e661952bfd0164000000000000006400000000000000fe07bf6700000000e3e169c1ca0d30efd2e6b1545f14139693f928db6724c65ecbb27c0d3966052b25ff6340d2ed8c532055e0948337b8afa01ae590893d66d712ce803dcfeeb5dd";

  const messageBytesFrontendString =
    "46524d5f4445585f4f524445523a604c0042950100000d572574fa9849299b06cc2e2e6cc8d5eb1aca96c5b8be3d4e4719e661952bfd0064000000000000006400000000000000fe07bf6700000000e3e169c1ca0d30efd2e6b1545f14139693f928db6724c65ecbb27c0d3966052b25ff6340d2ed8c532055e0948337b8afa01ae590893d66d712ce803dcfeeb5dd";

  const messageBytesBackend = Buffer.from(messageBytesBackendString, "hex");
  const messageBytesFrontend = Buffer.from(messageBytesFrontendString, "hex");

  const orderIntentBackend = OrderIntent.deserialize(messageBytesBackend);
  const orderIntentFrontend = OrderIntent.deserialize(messageBytesFrontend);

  console.log({
    orderIntentBackend: orderIntentBackend.toJSON(),
    orderIntentFrontend: orderIntentFrontend.toJSON(),
  });
};

const main = async () => {
  const client = new FermiSequencerClient();

  const derekBuyIntent = await client.placeOrderIntent({
    price: 100,
    quantity: 100,
    side: OrderSide.BUY,
    ownerKeypair: DEREK_KEYPAIR,
    baseMint: BASE_MINT,
    quoteMint: QUOTE_MINT,
  });

  console.log("DEREK BUY INTENT PLACED", derekBuyIntent);

  const charlesSellIntent = await client.placeOrderIntent({
    price: 100,
    quantity: 100,
    side: OrderSide.SELL,
    ownerKeypair: CHARLES_KEYPAIR,
    baseMint: BASE_MINT,
    quoteMint: QUOTE_MINT,
  });

  console.log("CHARLES SELL INTENT PLACED", charlesSellIntent);
};

main2();
