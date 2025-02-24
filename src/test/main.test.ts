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

console.log("main.test.ts");

console.log("constants:", {
  derek: DEREK_KEYPAIR.publicKey.toBase58(),
  charles: CHARLES_KEYPAIR.publicKey.toBase58(),
  baseMint: BASE_MINT.toBase58(),
  quoteMint: QUOTE_MINT.toBase58(),
});

const createVaultAndDepositTokens = async (owner: Keypair, mint: PublicKey) => {
  console.log("CreateVaultAndDepositTokens", { owner, mint });
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const wallet = new Wallet(owner);

  const provider = new AnchorProvider(connection, wallet, connection);

  const liquidityVaultClient = new LiquidityVaultClient(
    provider,
    VAULT_PROGRAM_ID
  );

  console.log("mint:", mint.toBase58());

  const vaultPk = await liquidityVaultClient.createVault(
    mint,
    VAULT_PROGRAM_ID
  );
  console.log("created vault:", vaultPk);

  console.log("getting user token account");

  const userTokenAccount = await getAssociatedTokenAddress(
    mint,
    owner.publicKey,
    true
  );

  console.log("userTokenAccount:", userTokenAccount.toBase58());

  const deposit = await liquidityVaultClient.deposit(
    1000000000,
    new PublicKey(vaultPk),
    userTokenAccount,
    owner.publicKey
  );

  console.log("deposit:", deposit);
};

const main = async () => {
  // 1. Create liquidity vaults for base and quote mints
  await createVaultAndDepositTokens(DEREK_KEYPAIR, BASE_MINT);
  await createVaultAndDepositTokens(DEREK_KEYPAIR, QUOTE_MINT);
};

main();
