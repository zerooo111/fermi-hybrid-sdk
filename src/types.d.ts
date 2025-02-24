import { Keypair } from "@solana/web3.js";



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
