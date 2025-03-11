import { LiquidityVaultClient } from "../vault/vault.client.ts";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

import fs from "node:fs";
import {
  checkOrCreateAssociatedTokenAccount,
  mintTo,
} from "../utils/helpers.ts";
import { createMint } from "../utils/create_mint.ts";
import { FermiSequencerClient } from "../sequencer/sequencer.client.ts";

console.log("Fetching constants");

const CONSTANTS = {
  API_BASE_URL: "http://54.80.177.213:8080",

  CONNECTION: new Connection("https://api.devnet.solana.com"),

  VAULT_PROGRAM_ID: new PublicKey(
    "CVB232NjzFcJUAcaEsbqTTAwGah37MYor57Vy97CCEx2",
  ),

  CHARLES_KEYPAIR: Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(fs.readFileSync("keypairs/Charles_keypair.json", "utf-8")),
    ),
  ),

  DEREK_KEYPAIR: Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(fs.readFileSync("keypairs/Derek_keypair.json", "utf-8")),
    ),
  ),

  FERMI_AUTHORITY: new PublicKey(
    "8bHSuk6dpjquTw44vwr3sLukDSMLNkQLTcttGtC5pJtb",
  ),

  BASE_MINT: new PublicKey("GZPkitUF1PPUnijGx8NEBPjC1ZR5m8bs1eLH8YtQy3vT"),
  QUOTE_MINT: new PublicKey("FAkA6wP9qB9fmVjZxsLSWGpJcAVctpFbDztAyKVTdVn9"),

  // Add more constants here
};

console.log("✅ Got Constants");

const createMintAndAirdrop = async (
  authority: Keypair,
  airdropRecipients: PublicKey[],
) => {
  // Create mint
  console.log(
    `-- CREATING NEW MINT ( authority : ${authority.publicKey.toBase58()} ----------------------`,
  );
  const authorityWallet = new anchor.Wallet(authority);
  const authorityProvider = new anchor.AnchorProvider(
    CONSTANTS.CONNECTION,
    authorityWallet,
    anchor.AnchorProvider.defaultOptions(),
  );
  const payer = authority;
  const mintAuthority = payer.publicKey;
  const freezeAuthority = null;
  const decimals = 9;

  const mintPublicKey = await createMint(
    CONSTANTS.CONNECTION,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals,
  );

  console.log(`✅ Mint created: ${mintPublicKey.toBase58()}`);
  console.log("------------------------------------------------");

  // Airdrop tokens
  console.log(
    `-- AIRDROP TOKENS ( tokenMint : ${mintPublicKey.toBase58()} ----------------------`,
  );
  console.log(
    "Recipients :",
    airdropRecipients.map((pk) => pk.toBase58()),
  );

  const airdropAmount = 100 * 10 ** decimals;

  for (const recipient of airdropRecipients) {
    console.log("----");
    console.log(`Airdropping ${airdropAmount} to :`, recipient.toBase58());

    const tokenAccount = await checkOrCreateAssociatedTokenAccount(
      authorityProvider,
      mintPublicKey,
      recipient,
    );

    console.log(`ATA : `, tokenAccount.toBase58());

    await mintTo(
      authorityProvider,
      mintPublicKey,
      tokenAccount,
      BigInt(airdropAmount.toString()),
    );
    console.log("✅ Airdrop successfull");
    console.log("----");
  }
  console.log("------------------------------------------------");

  return mintPublicKey;
};

const initTokenVault = async (
  client: LiquidityVaultClient,
  tokenMintPublicKey: PublicKey,
) => {
  console.log(
    `---- CREATING VAULT ( token: ${tokenMintPublicKey.toBase58()}) ----------------------`,
  );

  // Create vault
  const data = await client.initVault(tokenMintPublicKey);
  console.log(JSON.stringify(data, null, 2));

  console.log(
    "----✅ VAULT CREATED--------------------------------------------",
  );
  return data;
};

const depositTokensToVault = async (
  client: LiquidityVaultClient,
  tokenMint: PublicKey,
  amount: number,
) => {
  console.log(
    `---- DEPOSIT TOKENS ( token: ${tokenMint.toBase58()} | AUTHORITY : ${client.walletPk.toString()}) ----------------------`,
  );

  const userAta = await checkOrCreateAssociatedTokenAccount(
    client.provider,
    tokenMint,
    client.walletPk,
  );

  await client.deposit(amount, tokenMint, userAta);

  console.log(
    "----✅ DEPOSIT SUCCESSFULL--------------------------------------------",
  );
};

const main = async () => {
  console.log("🚀 Starting script");

  // Create Mint -> Airdrop tokens -> Create Vaults
  let authority = CONSTANTS.CHARLES_KEYPAIR;

  let authorityVaultClient = new LiquidityVaultClient(
    authority,
    CONSTANTS.VAULT_PROGRAM_ID,
  );

  // PART 1 : Create and airdrop tokens -- Skip this part if you have already created the mints

  // console.log("Creating Base Mint ");
  // const baseMint = await createMintAndAirdrop(authority, [
  //   CONSTANTS.CHARLES_KEYPAIR.publicKey,
  //   CONSTANTS.DEREK_KEYPAIR.publicKey,
  // ]);

  // console.log("BASE MINT CREATED: ", baseMint.toBase58());
  // console.log("-------------------------------------");
  // console.log("Creating Quote Mint");

  // const quoteMint = await createMintAndAirdrop(authority, [
  //   CONSTANTS.CHARLES_KEYPAIR.publicKey,
  //   CONSTANTS.DEREK_KEYPAIR.publicKey,
  // ]);

  // console.log("QUOTE MINT CREATED :", quoteMint.toBase58());
  // console.log("🚀 Script complete");

  // Create Vault

  // COMMENT these lines if you want to run PART 1 as well
  // UNCOMMENT if you want to skip PART 1
  let baseMint = CONSTANTS.BASE_MINT;
  let quoteMint = CONSTANTS.QUOTE_MINT;

  // PART 2 : init vaults
  // await initTokenVault(authorityVaultClient, baseMint);
  // await initTokenVault(authorityVaultClient, quoteMint);

  // PART 3 : Deposit Tokens
  // const derekVaultClient = new LiquidityVaultClient(
  //   CONSTANTS.DEREK_KEYPAIR,
  //   CONSTANTS.VAULT_PROGRAM_ID,
  // );

  // Derek deposits base token
  // await depositTokensToVault(derekVaultClient, baseMint, 1000);

  // Derek deposits quote token
  // await depositTokensToVault(derekVaultClient, quoteMint, 1000);

  // const charlesVaultClient = new LiquidityVaultClient(
  //   CONSTANTS.CHARLES_KEYPAIR,
  //   CONSTANTS.VAULT_PROGRAM_ID,
  // );

  // Charles deposits base token
  // await depositTokensToVault(charlesVaultClient, baseMint, 1000);

  // Charles deposits quote token
  // await depositTokensToVault(charlesVaultClient, quoteMint, 1000);

  // PART 4: Place Order -- Derek buys , Charles sells

  const sequencer = new FermiSequencerClient({
    baseUrl: CONSTANTS.API_BASE_URL,
  });

  let orderbook;

  orderbook = await sequencer.getOrderbook();
  console.log(orderbook);
  console.log("Order Book : ", orderbook);

  // Derek places buy order
  sequencer.placeOrderIntent({
    ownerKp: CONSTANTS.DEREK_KEYPAIR,
    order_id: 11,
    price: 2,
    quantity: 2,
    expiry: Date.now() + 60 * 60 * 1000,
    base_mint: baseMint,
    quote_mint: quoteMint,
    side: "Buy",
  });

  // Get order book
  orderbook = await sequencer.getOrderbook();
  console.log("Order Book : ", orderbook);

  // Charles places sell order
  // //
  // sequencer.placeOrderIntent({
  //   ownerKp: CONSTANTS.CHARLES_KEYPAIR,
  //   order_id: 22,
  //   price: 2,
  //   quantity: 2,
  //   expiry: Date.now() + 60 * 60 * 1000,
  //   base_mint: baseMint,
  //   quote_mint: quoteMint,
  //   side: "Sell",
  // });
};

main().catch(console.error);
