import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { LiquidityVaultClient } from "../vault/vault.client";
import {
  BASE_MINT,
  CHARLES_KEYPAIR,
  DEREK_KEYPAIR,
  QUOTE_MINT,
  VAULT_PROGRAM_ID,
} from "./constants";
import { AnchorProvider, BN, Wallet } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createMint, getLocalKeypair } from "../utils";
import { checkOrCreateAssociatedTokenAccount, mintTo } from "../utils/helpers";

console.log("main.test.ts");

console.log("constants:", {
  derek: DEREK_KEYPAIR.publicKey.toBase58(),
  charles: CHARLES_KEYPAIR.publicKey.toBase58(),
  baseMint: BASE_MINT.toBase58(),
  quoteMint: QUOTE_MINT.toBase58(),
});

const createMintAndVault = async (client: LiquidityVaultClient) => {
  // Create Mint
  const mintPk = await createMint(
    client.provider.connection,
    client.owner,
    client.owner.publicKey,
    null,
    6
  );

  console.log("mintPk:", mintPk.toBase58());

  // Create Vaults
  const vaultPk = await client.createVault(mintPk);
  console.log("vaultPk:", vaultPk.toBase58());

  return {
    mintPk,
    vaultPk,
  };
};

const depositTokens = async (
  client: LiquidityVaultClient,
  tokenMint: PublicKey
) => {
  // get or create ata
  const ata = await checkOrCreateAssociatedTokenAccount(
    client.provider,
    tokenMint,
    client.owner.publicKey
  );

  console.log("ata:", ata);

  // Mint Tokens to Ata
  await mintTo(
    client.provider,
    tokenMint,
    new PublicKey(ata),
    new BN(1000000000)
  );

  console.log("minted tokens to ata");

  const depositTx = await client.deposit(100, tokenMint, new PublicKey(ata));
  console.log("depositTx:", depositTx);

  console.log({
    ata,
    tokenMint,
  });
};

const CONSTS = {
  derek: {
    mint: new PublicKey("GLYuRh9avWERYZXHNTfz1Cdo3craUF65Ct5EUDLHeVAA"),
    ata: new PublicKey("5Wq6GSBPajv6yax2nHTrctMVo88MmMXu7Po6QmtxowhE"),
    vault: new PublicKey("2FGKMMsSuJiZeMKKzv7E4kxWGf4jHBpyPzPe9M6PhBXz"),
  },
  charles: {
    mint: new PublicKey("3ZKxAAeMb2KVspkioJy8R1jfpnvSc2WF7hwihgQPxzyJ"),
    ata: new PublicKey("GNgwoa54WcpYgRRbCqoNkVxvtCzH13uJTxmKB8zez9nx"),
    vault: new PublicKey("drCzTUpF73zRnH86rPh1YGVwGe8Kenqk27LTDEUzaZq"),
  },
};

const main = async () => {
  // 1. Create liquidity vaults for base and quote mints

  const derek = getLocalKeypair("keypairs/Derek_keypair.json");
  const charles = getLocalKeypair("keypairs/Charles_keypair.json");

  console.log("DEREK FLOW");

  const derekClient = new LiquidityVaultClient(derek, VAULT_PROGRAM_ID);

  // const {
  //   mintPk: derekMintPk,
  //   vaultPk: derekVaultPk,
  // } = await createMintAndVault(derekClient);

  await depositTokens(derekClient, CONSTS.derek.mint);

  console.log("CHARLES FLOW");

  const charlesClient = new LiquidityVaultClient(charles, VAULT_PROGRAM_ID);

  // const {
  //   mintPk: charlesMintPk,
  //   vaultPk: charlesVaultPk,
  // } = await createMintAndVault(charlesClient);

  await depositTokens(charlesClient, CONSTS.charles.mint);

  console.log("DONE");
};

main();
