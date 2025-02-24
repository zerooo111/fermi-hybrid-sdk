import { Keypair } from "@solana/web3.js";

/**
 * Represents the side of an order in the Fermi DEX.
 * Orders can either be buy orders (bids) or sell orders (asks).
 */
export enum OrderIntentSide {
  BUY = "Buy",
  SELL = "Sell",
}

interface OrderIntent {
  order_id: number;
  expiry: number;
  price: number;
  quantity: number;
  side: OrderIntentSide;
  owner: string;
}

type PlaceOrderIntentParams = {
  price: number;
  quantity: number;
  ownerKeypair: Keypair;
  side: OrderIntentSide;
  expiry?: number;
  orderId?: number;
};
