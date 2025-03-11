import * as ed from "@noble/ed25519";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { OrderIntent } from "./OrderIntent.ts";
import { createHash } from "crypto";
import { sha512 } from "@noble/hashes/sha512";
import axios from "axios";

// Configure ed25519 to use SHA-512
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface OrderIntentJSON {
  orderId: string;
  owner: string;
  side: "Buy" | "Sell";
  price: string;
  quantity: string;
  expiry: string;
  base_mint: string;
  quote_mint: string;
}

/**
 * Parameters required for placing an order intent
 */
export interface PlaceOrderIntentParams {
  price: number;
  quantity: number;
  side: "Buy" | "Sell";
  ownerKeypair: Keypair;
  expiry?: number;
  orderId?: number;
  baseMint: PublicKey;
  quoteMint: PublicKey;
}

/**
 * API response structure for successful order placement
 */
interface OrderPlacementSuccess {
  code: 200;
  message: string;
  data: {
    order_id: number;
    status: string;
  };
}

/**
 * API response structure for errors
 */
interface OrderPlacementError {
  code: number;
  message: string;
  error: string;
}

type OrderPlacementResponse = OrderPlacementSuccess | OrderPlacementError;

/**
 * FermiHybridClient is the main client for interacting with the Fermi DEX.
 * It provides functionality for:
 * - Order placement and management
 * - Message signing and verification
 * - Health checks
 *
 * The client uses Ed25519 for cryptographic operations and implements
 * the Fermi DEX protocol for order submission.
 */
export class FermiSequencerClient {
  private baseUrl: string;

  /**
   * Creates a new instance of the Fermi Hybrid Client
   * @param config - Optional configuration object
   * @param config.baseUrl - Base URL for the Fermi DEX API (defaults to testnet)
   */
  constructor(config: { baseUrl?: string } = {}) {
    this.baseUrl = config.baseUrl || "http://54.80.177.213:8080";
  }

  async placeOrderIntent({
    order_id,
    ownerKp,
    side,
    price,
    quantity,
    expiry,
    base_mint,
    quote_mint,
  }: {
    order_id: number;
    ownerKp: Keypair;
    side: "Buy" | "Sell";
    price: number;
    quantity: number;
    expiry: number;
    base_mint: PublicKey;
    quote_mint: PublicKey;
  }) {
    console.log("PLACE ORDER INTENT");

    const orderIntent = new OrderIntent(
      new BN(order_id),
      ownerKp.publicKey,
      side,
      new BN(price),
      new BN(quantity),
      new BN(expiry),
      base_mint,
      quote_mint,
    );

    console.log("ENCODING ORDER INTENT");
    // Encode Message
    const serializedData = OrderIntent.serialize(orderIntent);
    const prefix = Buffer.from("FRM_DEX_ORDER");
    const encodedMessage = Buffer.concat([prefix, serializedData]);

    // hash the message
    console.log("Hashing the message");

    const sha256Hash = createHash("sha256")
      .update(new Uint8Array(encodedMessage))
      .digest();

    const sha256Hash_hex = Buffer.from(sha256Hash).toString("hex");

    console.log("Hash successfull: ", sha256Hash_hex);

    console.log("Signing the message");

    // Sign message
    const signatureBytes = ed.sign(
      Buffer.from(sha256Hash_hex),
      ownerKp.secretKey.slice(0, 32),
    );

    const hexSignature = Buffer.from(signatureBytes).toString("hex");

    console.log("Signature done : ", hexSignature);

    // console.log("Local verification");
    // // Verify the signature
    // const isValid = ed.verify(
    //   signatureBytes,
    //   Buffer.from(sha256Hash_hex),
    //   ownerKp.publicKey.toBase58(),
    // );

    // if (!isValid) {
    //   console.log("Local verification failed");
    //   throw new Error("Local Verification failed");
    // }

    // console.log("Local verification passed ");

    console.log("sending request to sequencer");

    const body = {
      intent: {
        order_id: orderIntent.order_id.toNumber(),
        owner: orderIntent.owner.toBase58(),
        side: orderIntent.side,
        price: orderIntent.price.toNumber(),
        quantity: orderIntent.quantity.toNumber(),
        expiry: orderIntent.expiry.toNumber(),
        base_mint: orderIntent.base_mint.toBase58(),
        quote_mint: orderIntent.quote_mint.toBase58(),
      },
      signature: hexSignature,
    };

    console.log("sequencer request body", body);

    const response = await axios.post(`${this.baseUrl}/place_order`, body);

    console.log("Got response from sequencer");

    console.log("Response for /place_order: ", response.data);

    return response;
  }

  async getOrderbook() {
    return await axios.get(this.baseUrl + "/orderbook");
  }

  cancelOrderIntent() {}
}
