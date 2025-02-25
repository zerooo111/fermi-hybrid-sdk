import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { OrderIntent } from "./OrderIntent.js";
import { OrderSide } from "./OrderIntent.js";

// Configure ed25519 to use SHA-512
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const FERMI_DEX_ORDER_PREFIX = "FRM_DEX_ORDER:";

export interface OrderIntentJSON {
  orderId: string;
  owner: string;
  side: OrderSide;
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
  side: OrderSide;
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
  // TextEncoder is used for converting strings to Uint8Array for cryptographic operations
  private textEncoder = new TextEncoder();

  /**
   * Creates a new instance of the Fermi Hybrid Client
   * @param config - Optional configuration object
   * @param config.baseUrl - Base URL for the Fermi DEX API (defaults to testnet)
   */
  constructor(config: { baseUrl?: string } = {}) {
    this.baseUrl = config.baseUrl || "http://54.80.177.213:8080";
  }

  /**
   * Checks if the Fermi DEX API is healthy and responding
   * @returns Promise<boolean> - True if the API is healthy
   * @throws Error if the health check fails
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  }

  /**
   * Signs a message using Ed25519 with the owner's keypair
   * @param messageBytes - Message to sign as Uint8Array
   * @param owner - Keypair to sign the message with
   * @returns Uint8Array - The signature
   */
  signMessage(messageBytes: Uint8Array, owner: Keypair): Uint8Array {
    // Note: We only use first 32 bytes of secretKey as per Ed25519 spec
    const signature = ed.sign(messageBytes, owner.secretKey.slice(0, 32));
    return signature;
  }

  /**
   * Verifies a message signature using Ed25519
   * @param messageBytes - Original message as Uint8Array
   * @param signature - Signature to verify
   * @param owner - Keypair containing the public key for verification
   * @returns boolean - True if signature is valid
   */
  verifyMessage(
    messageBytes: Uint8Array,
    signature: Uint8Array,
    owner: Keypair
  ): boolean {
    const isValid = ed.verify(
      signature,
      messageBytes,
      owner.publicKey.toBytes()
    );
    return isValid;
  }

  /**
   * Signs a message and verifies the signature in one operation
   * This is used as a safety check to ensure signatures are valid before submission
   * @param messageBytes - Message to sign
   * @param owner - Keypair for signing
   * @returns Uint8Array - The verified signature
   * @throws Error if signature verification fails
   */
  signAndVerifyMessage(messageBytes: Uint8Array, owner: Keypair): Uint8Array {
    const signature = this.signMessage(messageBytes, owner);
    const isValid = this.verifyMessage(messageBytes, signature, owner);

    if (!isValid) {
      throw new Error("Message signature verification failed");
    }

    return signature;
  }

  /**
   * Submits a signed order intent to the Fermi DEX Sequencer
   * @param orderIntent - The order intent to submit
   * @param signature - The signature proving ownership
   * @returns Promise<OrderPlacementResponse> - The response from the DEX
   * @throws Error if submission fails
   */
  async submitOrderIntent(
    orderIntent: OrderIntent,
    signature: Uint8Array
  ): Promise<OrderPlacementResponse> {
    const signatureHex = Buffer.from(signature).toString("hex");

    const body = {
      intent: orderIntent.toJSON(),
      signature: signatureHex,
    };

    const response = await fetch(`${this.baseUrl}/place_order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Failed to submit order intent: ${data?.message || response.statusText}`
      );
    }

    return data;
  }

  /**
   * Validates order parameters before submission
   * @param price - Order price
   * @param quantity - Order quantity
   * @param ownerKeypair - Keypair for signing
   * @throws Error if validation fails
   */
  private validateOrderIntent({
    price,
    quantity,
    ownerKeypair,
    baseMint,
    quoteMint,
  }: PlaceOrderIntentParams): void {
    if (price <= 0 || quantity <= 0) {
      throw new Error("Price and quantity must be positive");
    }
    if (!ownerKeypair) {
      throw new Error("Owner keypair is required");
    }
    if (!baseMint || !quoteMint) {
      throw new Error("Base mint and quote mint are required");
    }
  }

  /**
   * Creates an order intent object from the provided parameters
   */
  private createOrderIntent({
    price,
    quantity,
    side,
    expiry,
    orderId,
    ownerKeypair,
    baseMint,
    quoteMint,
  }: PlaceOrderIntentParams): OrderIntent {
    return new OrderIntent(
      new BN(orderId ?? Date.now() + price),
      ownerKeypair.publicKey,
      side,
      new BN(price),
      new BN(quantity),
      new BN(expiry ?? Math.floor(Date.now() / 1000) + 60 * 60),
      baseMint,
      quoteMint
    );
  }

  /**
   * Encodes a message with the Fermi DEX prefix using Borsh serialization
   */
  private encodeMessageWithPrefix(orderIntent: OrderIntent): Uint8Array {
    const serializedData = OrderIntent.serialize(orderIntent);
    const prefix = Buffer.from(FERMI_DEX_ORDER_PREFIX);
    const fullMessage = Buffer.concat([prefix, serializedData]);
    return new Uint8Array(fullMessage);
  }

  /**
   * Deserializes an order intent from a buffer
   */
  deserializeOrderIntent(buffer: Buffer): OrderIntent {
    return OrderIntent.deserialize(buffer);
  }

  /**
   * Main method for placing an order on the Fermi DEX
   * Handles the entire flow:
   * 1. Validates the order parameters
   * 2. Creates the order intent
   * 3. Signs and verifies the intent
   * 4. Submits to the DEX
   *
   * @param props - Order parameters including price, quantity, side, and keypair
   * @returns Promise<OrderIntent> - The created and submitted order
   * @throws Error if any step fails
   */
  async placeOrderIntent(props: PlaceOrderIntentParams): Promise<any> {
    try {
      this.validateOrderIntent(props);

      const orderIntent = this.createOrderIntent(props);

      // Encode the order intent with the Fermi DEX prefix for signing using Borsh
      const encodedMessage = this.encodeMessageWithPrefix(orderIntent);
      
      console.log({
        encodedMessage: Buffer.from(encodedMessage).toString("hex"),
      });

      const signature = this.signAndVerifyMessage(
        encodedMessage,
        props.ownerKeypair
      );

      console.log({ signature: Buffer.from(signature).toString("hex") });
      const response = await this.submitOrderIntent(orderIntent, signature);

      console.log({ response });

      return orderIntent;
    } catch (error) {
      console.error("Failed to place order:", error);
      throw error;
    }
  }
}
