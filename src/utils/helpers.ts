import { Keypair } from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import fs from "fs";

/**
 * Get the address of the associated token account for a given mint and owner
 *
 * @param mint                     Token mint account
 * @param owner                    Owner of the new account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Address of the associated token account
 */
export async function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = true,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): Promise<PublicKey> {
  if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBuffer()))
    throw new Error("TokenOwnerOffCurve!");

  const [address] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    associatedTokenProgramId,
  );

  return address;
}

export async function createAssociatedTokenAccountIdempotentInstruction(
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): Promise<TransactionInstruction> {
  const account = await getAssociatedTokenAddress(mint, owner);
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([0x1]),
  });
}

export const createMint = async (
  provider: anchor.AnchorProvider,
  mint: anchor.web3.Keypair,
  decimal: number,
): Promise<void> => {
  try {
    // const programId = getDevPgmId();
    const tx = new anchor.web3.Transaction();
    tx.add(
      anchor.web3.SystemProgram.createAccount({
        programId: spl.TOKEN_PROGRAM_ID,
        // programId: programId,
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: spl.MintLayout.span,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(
          spl.MintLayout.span,
        ),
      }),
    );
    tx.add(
      spl.createInitializeMintInstruction(
        mint.publicKey,
        decimal,
        provider.wallet.publicKey,
        provider.wallet.publicKey,
      ),
    );
    await provider.sendAndConfirm(tx, [mint]);
  } catch (err: any) {
    console.error("[Error]: createMint");
    console.error(err);
  }
};

export const checkOrCreateAssociatedTokenAccount = async (
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
): Promise<PublicKey> => {
  // Find the ATA for the given mint and owner
  const ata = await spl.getAssociatedTokenAddress(mint, owner, false);

  // Check if the ATA already exists
  const accountInfo = await provider.connection.getAccountInfo(ata);

  if (accountInfo == null) {
    // ATA does not exist,
    console.log("////////////////");
    console.log("ATA account not found for ", owner.toBase58());
    console.log("Creating ATA account for ", owner.toBase58());
    await createAssociatedTokenAccount(provider, mint, ata, owner);
    console.log("////////////////");
  }

  return ata;
};

export async function checkMintOfATA(
  connection: Connection,
  ataAddress: anchor.Address,
): Promise<string> {
  try {
    const ataInfo = await connection.getAccountInfo(new PublicKey(ataAddress));
    if (ataInfo === null) {
      throw new Error("Account not found");
    }

    // The mint address is the first 32 bytes of the account data
    const mintAddress = new PublicKey(ataInfo.data.slice(0, 32));
    return mintAddress.toBase58();
  } catch (error) {
    console.error("Error in checkMintOfATA:", error);
    throw error;
  }
}

export const createAssociatedTokenAccount = async (
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  ata: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
): Promise<void> => {
  const tx = new anchor.web3.Transaction();
  tx.add(
    spl.createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,
      ata,
      owner,
      mint,
    ),
  );
  await provider.sendAndConfirm(tx, []);
};

export const mintTo = async (
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  ta: anchor.web3.PublicKey,
  amount: bigint,
): Promise<void> => {
  const tx = new anchor.web3.Transaction();
  tx.add(
    spl.createMintToInstruction(
      mint,
      ta,
      provider.wallet.publicKey,
      amount,
      [],
    ),
  );
  await provider.sendAndConfirm(tx, []);
};

export const fetchTokenBalance = async (
  userPubKey: PublicKey,
  mintPubKey: PublicKey,
  connection: Connection,
) => {
  try {
    const associatedTokenAddress = await spl.getAssociatedTokenAddress(
      mintPubKey,
      userPubKey,
      false,
    );
    const account = await spl.getAccount(connection, associatedTokenAddress);

    return account?.amount.toString();
  } catch (error) {
    console.error("Error in fetchTokenBalance:", error);
    throw error;
  }
};

export const getLocalKeypair = (path: string) => {
  const secretKey = JSON.parse(fs.readFileSync(path, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  return keypair;
};
