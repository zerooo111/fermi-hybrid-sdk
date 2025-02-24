import { sign, verify } from "@noble/ed25519";
import { Keypair } from "@solana/web3.js";
import { OrderIntent, PlaceOrderIntentParams } from "../types";

const FERMI_DEX_ORDER_PREFIX = "FRM_DEX_ORDER:";

/**
 * Represents the side of an order in the Fermi DEX.
 * Orders can either be buy orders (bids) or sell orders (asks).
 */
export enum OrderIntentSide {
  BUY = "Buy",
  SELL = "Sell",
}

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
export class FermiHybridClient {
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
    const signature = sign(messageBytes, owner.secretKey.slice(0, 32));
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
    const isValid = verify(signature, messageBytes, owner.publicKey.toBytes());
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
   * @returns Promise<any> - The response from the DEX
   * @throws Error if submission fails
   */
  async submitOrderIntent(
    orderIntent: OrderIntent,
    signature: Uint8Array
  ): Promise<any> {
    // Convert binary signature to hex for API submission
    const signatureHex = Buffer.from(signature).toString("hex");

    const body = {
      intent: orderIntent,
      signature: signatureHex,
    };

    const response = await fetch(`${this.baseUrl}/place_order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Failed to submit order intent: ${errorData?.message || response.statusText}`
      );
    }
    return response.json();
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

      // Encode the order intent with the Fermi DEX prefix for signing
      const encodedMessage = this.encodeMessageWithPrefix(
        JSON.stringify(orderIntent, null, 2)
      );

      const signature = this.signAndVerifyMessage(
        encodedMessage,
        props.ownerKeypair
      );

      await this.submitOrderIntent(orderIntent, signature);

      return orderIntent;
    } catch (error) {
      console.error("Failed to place order:", error);
      throw error;
    }
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
  }: PlaceOrderIntentParams): void {
    if (price <= 0 || quantity <= 0) {
      throw new Error("Price and quantity must be positive");
    }
    if (!ownerKeypair) {
      throw new Error("Owner keypair is required");
    }
  }

  /**
   * Creates an order intent object from the provided parameters
   * Handles default values for optional fields:
   * - orderId: current timestamp + price if not provided
   * - expiry: 1 hour from now if not provided
   */
  private createOrderIntent({
    price,
    quantity,
    side,
    expiry,
    orderId,
    ownerKeypair,
  }: PlaceOrderIntentParams): OrderIntent {
    return {
      price,
      quantity,
      order_id: orderId ?? Date.now() + price,
      side,
      owner: ownerKeypair.publicKey.toBase58(),
      expiry: expiry ?? Math.floor(Date.now() / 1000) + 60 * 60, // Default 1 hour expiry
    };
  }

  /**
   * Encodes a message with the Fermi DEX prefix
   * This is required by the protocol to prevent message signing attacks
   * @param input - Message to encode
   * @returns Uint8Array - Prefixed and encoded message
   */
  private encodeMessageWithPrefix(input: string): Uint8Array {
    const message = this.textEncoder.encode(input);
    const prefix = this.textEncoder.encode(FERMI_DEX_ORDER_PREFIX);
    const fullMessage = new Uint8Array(prefix.length + message.length);

    fullMessage.set(prefix);
    fullMessage.set(message, prefix.length);

    return fullMessage;
  }
}
