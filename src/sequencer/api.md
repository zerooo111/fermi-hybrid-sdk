# Fermi Hybrid Sequencer API Documentation

## Overview

The Fermi Hybrid Sequencer is a Solana-based order matching and settlement system that combines off-chain order matching with on-chain settlement. It provides a REST API for order placement and handles automatic order matching and settlement.

## Core Components

### 1. Order Types

#### OrderIntent

```rust
pub struct OrderIntent {
    pub order_id: u64,
    pub owner: Pubkey,
    pub side: OrderSide,
    pub price: u64,
    pub quantity: u64,
    pub expiry: u64,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
}
```

Represents the core order data structure containing trade details.

#### Order

```rust
pub struct Order {
    pub intent: OrderIntent,
    pub signature: Signature,
}
```

Combines the order intent with its cryptographic signature.

### 2. REST API Endpoints

#### Place Order

- **Endpoint**: `POST /place_order`
- **Content-Type**: `application/json`
- **CORS**: Enabled for all origins
- **Request Body**:

```json
{
  "intent": {
    "order_id": "u64",
    "owner": "string (base58 encoded public key)",
    "side": "Buy | Sell",
    "price": "u64",
    "quantity": "u64",
    "expiry": "u64",
    "base_mint": "string (base58 encoded public key)",
    "quote_mint": "string (base58 encoded public key)"
  },
  "signature": "string (hex encoded signature)"
}
```

- **Response**:
  - Success (200):
    ```json
    {
      "code": 200,
      "message": "Order placed successfully",
      "data": {
        "order_id": "u64",
        "status": "placed"
      }
    }
    ```
  - Error (400/401/500):
    ```json
    {
      "code": "number",
      "message": "string",
      "error": "string"
    }
    ```

### 3. OrderBook

#### Methods

```rust
pub struct OrderBook {
    pub fn new() -> Self
    pub fn place_order(&mut self, order_id: u64, side: OrderSide, price: u64, quantity: u64, base_mint: Pubkey, quote_mint: Pubkey, keypair: &Keypair)
    pub fn add_order(&mut self, order: Order)
    pub fn match_orders(&mut self) -> Vec<MatchedTrade>
}
```

### 4. Settlement System

#### SettlementBatch

```rust
pub struct SettlementBatch {
    pub batch_id: u64,
    pub trades: Vec<MatchedTrade>,
}
```

#### Settlement Functions

- `execute_settlement_batch`: Handles internal settlement
- `execute_settlement_batch_external`: Handles external settlement with Fermi vault integration

### 5. Security Features

#### Signature Verification

- Ed25519 signature verification for all orders
- Message format: `FRM_DEX_ORDER:<order_data>`
- Supports both JSON and Borsh serialization formats
