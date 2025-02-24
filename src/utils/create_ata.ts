import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccount,
} from "@solana/spl-token";

/**
 * Creates an Associated Token Account (ATA) for a given owner and mint
 *
 * @param connection - Solana connection object
 * @param payer - Keypair that will pay for the transaction
 * @param mint - Public key of the token mint
 * @param owner - Public key of the account that will own the ATA
 * @param allowOwnerOffCurve - Whether to allow the owner to be a PDA (default: false)
 * @returns Promise resolving to the ATA public key
 */
export async function createAta(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve: boolean = false
): Promise<PublicKey> {
  // Get the ATA address
  const ata = await getAssociatedTokenAddress(mint, owner, allowOwnerOffCurve);

  try {
    // Try to create the ATA
    await createAssociatedTokenAccount(connection, payer, mint, owner, {
      commitment: "confirmed",
    });
  } catch (error: any) {
    // If account already exists, that's fine
    if (error.message.includes("already in use")) {
      console.log("ATA already exists");
    } else {
      throw error;
    }
  }

  return ata;
}
