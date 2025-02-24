import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { LiquidityVaultClient } from "../vault/vault.client";
import {
  BASE_MINT,
  CHARLES_KEYPAIR,
  DEREK_KEYPAIR,
  QUOTE_MINT,
  VAULT_PROGRAM_ID,
} from "./constants";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createMint, getLocalKeypair } from "../utils";
import { checkOrCreateAssociatedTokenAccount } from "../utils/helpers";

console.log("main.test.ts");

console.log("constants:", {
  derek: DEREK_KEYPAIR.publicKey.toBase58(),
  charles: CHARLES_KEYPAIR.publicKey.toBase58(),
  baseMint: BASE_MINT.toBase58(),
  quoteMint: QUOTE_MINT.toBase58(),
});

const main = async () => {
  // 1. Create liquidity vaults for base and quote mints
  // await createVaultAndDepositTokens(DEREK_KEYPAIR, BASE_MINT);
  // await createVaultAndDepositTokens(DEREK_KEYPAIR, QUOTE_MINT);
  const derek = getLocalKeypair("keypairs/Derek_keypair.json");
  const charles = getLocalKeypair("keypairs/Charles_keypair.json");
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "finalized"
  );

  const wallet = new Wallet(charles);
  const provider = new AnchorProvider(connection, wallet, connection);

  const client = new LiquidityVaultClient(provider, VAULT_PROGRAM_ID);

  const derivedAtaForCharles = await checkOrCreateAssociatedTokenAccount(
    provider,
    new PublicKey("GqwCeeTTsE48fZMWzFy26PCVucgvaP9Dsct1uY4y7e8R"),
    charles.publicKey
  );

  console.log("derivedAtaForCharles:", derivedAtaForCharles);

  const deposit = await client.deposit(
    1000000000,
    new PublicKey("GqwCeeTTsE48fZMWzFy26PCVucgvaP9Dsct1uY4y7e8R"),
    new PublicKey(derivedAtaForCharles),
    charles.publicKey
  );

  console.log("deposit:", deposit);
};

main();
