import { BASE_MINT, CHARLES_KEYPAIR, QUOTE_MINT } from "../test/constants.js";
import { FermiSequencerClient, OrderIntentSide } from "./sequencer.client.js";

const test = () => {
  const client = new FermiSequencerClient();

  client.placeOrderIntent({
    price: 1000000000,
    quantity: 1000000000,
    side: OrderIntentSide.BUY,
    ownerKeypair: CHARLES_KEYPAIR,
    baseMint: BASE_MINT,  
    quoteMint: QUOTE_MINT,  
  });
  
  console.log("got client");
};

test();
