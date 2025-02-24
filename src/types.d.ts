import { Keypair, PublicKey } from "@solana/web3.js";
import { OrderIntentSide } from "./sequencer/sequencer.client";

interface OrderIntent {
  order_id: number;
  expiry: number;
  price: number;
  quantity: number;
  side: OrderIntentSide;
  owner: string;
  base_mint: string;
  quote_mint: string;
}

type PlaceOrderIntentParams = {
  price: number;
  quantity: number;
  ownerKeypair: Keypair;
  side: OrderIntentSide;
  expiry?: number;
  orderId?: number;
  baseMint: PublicKey;
  quoteMint: PublicKey;
};
