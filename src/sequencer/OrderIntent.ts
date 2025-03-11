import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";

export class CancelOrderIntent {
  public order_id: BN;
  public owner: PublicKey;

  constructor(order_id: BN, owner: PublicKey) {
    this.order_id = order_id;
    this.owner = owner;
  }

  static layout() {
    return borsh.struct([borsh.u64("order_id"), borsh.publicKey("owner")]);
  }

  static serialize(cancelOrderIntent: CancelOrderIntent) {
    const buffer = Buffer.alloc(CancelOrderIntent.layout().span);
    CancelOrderIntent.layout().encode(cancelOrderIntent, buffer);
    return buffer;
  }

  static deserialize(buffer: Buffer): CancelOrderIntent {
    const decoded = CancelOrderIntent.layout().decode(buffer);
    return decoded;
  }

  toJSON() {
    return {
      order_id: Number(this.order_id),
      owner: this.owner.toBase58(),
    };
  }
}

export class OrderIntent {
  order_id: BN;
  owner: PublicKey;
  side: "Buy" | "Sell";
  price: BN;
  quantity: BN;
  expiry: BN;
  base_mint: PublicKey;
  quote_mint: PublicKey;

  constructor(
    order_id: BN,
    owner: PublicKey,
    side: "Buy" | "Sell",
    price: BN,
    quantity: BN,
    expiry: BN,
    base_mint: PublicKey,
    quote_mint: PublicKey,
  ) {
    this.order_id = order_id;
    this.owner = owner;
    this.side = side;
    this.price = price;
    this.quantity = quantity;
    this.expiry = expiry;
    this.base_mint = base_mint;
    this.quote_mint = quote_mint;
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("order_id"),
        borsh.publicKey("owner"),
        borsh.u8("side"),
        borsh.u64("price"),
        borsh.u64("quantity"),
        borsh.u64("expiry"),
        borsh.publicKey("base_mint"),
        borsh.publicKey("quote_mint"),
      ],
      property,
    );
  }

  static serialize(orderIntent: OrderIntent) {
    const buffer = Buffer.alloc(OrderIntent.layout().span);
    const sideValue = orderIntent.side === "Buy" ? 0 : 1;
    const serializable = {
      ...orderIntent,
      side: sideValue,
    };
    OrderIntent.layout().encode(serializable, buffer);
    return buffer;
  }

  static deserialize(buffer: Buffer): OrderIntent {
    const decoded = OrderIntent.layout().decode(buffer);
    // Convert the numeric side back to string

    return {
      ...decoded,
    } as OrderIntent;
  }

  toJSON() {
    return {
      order_id: Number(this.order_id),
      owner: this.owner.toBase58(),
      side: this.side,
      price: Number(this.price),
      quantity: Number(this.quantity),
      expiry: Number(this.expiry),
      base_mint: this.base_mint.toBase58(),
      quote_mint: this.quote_mint.toBase58(),
    };
  }
}
