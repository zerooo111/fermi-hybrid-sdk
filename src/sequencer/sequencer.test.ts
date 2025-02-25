import { OrderIntent, OrderSide } from "./OrderIntent.js";
import * as anchor from "@coral-xyz/anchor";
import { BASE_MINT, DEREK_KEYPAIR, QUOTE_MINT } from "../test/constants.js";
import { FermiSequencerClient } from "./sequencer.client.js";

const { BN } = anchor.default;

const testOrderIntent = new OrderIntent(
  new BN(1),
  DEREK_KEYPAIR.publicKey,
  OrderSide.BUY,
  new BN(100),
  new BN(100),
  new BN(new Date().getTime() + 1000 * 60 * 60 * 24),
  BASE_MINT,
  QUOTE_MINT
);

const client = new FermiSequencerClient();

client.placeOrderIntent({
  price: 100,
  quantity: 100,
  side: OrderSide.BUY,
  ownerKeypair: DEREK_KEYPAIR,
  baseMint: BASE_MINT,
  quoteMint: QUOTE_MINT,
});
