import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, mintTo } from "@solana/spl-token";
import { createAta } from "./create_ata";

/**
 * Mints tokens to a recipient's Associated Token Account
 *
 * @param connection - Solana connection object
 * @param payer - Keypair that will pay for the transaction
 * @param mint - Public key of the token mint
 * @param mintAuthority - Keypair with mint authority
 * @param recipient - Public key of the recipient
 * @param amount - Amount of tokens to mint (in base units)
 * @param createAtaIfMissing - Whether to create the ATA if it doesn't exist (default: true)
 * @returns Promise resolving to the recipient's ATA
 */
export async function mintTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  mintAuthority: Keypair,
  recipient: PublicKey,
  amount: number | bigint,
  createAtaIfMissing: boolean = true
): Promise<PublicKey> {
  try {
    console.log(`Minting ${amount} tokens to ${recipient.toString()}...`);

    // Get the recipient's ATA
    let recipientAta = await getAssociatedTokenAddress(mint, recipient);

    // Create the ATA if it doesn't exist and the flag is set
    if (createAtaIfMissing) {
      try {
        recipientAta = await createAta(connection, payer, mint, recipient);
      } catch (error) {
        // Handle case where ATA already exists
        console.log("Using existing ATA");
      }
    }

    // Convert amount to bigint if it's a number
    const amountBigInt = typeof amount === "number" ? BigInt(amount) : amount;

    // Mint tokens to the recipient's ATA
    const signature = await mintTo(
      connection,
      payer,
      mint,
      recipientAta,
      mintAuthority,
      amountBigInt
    );

    console.log(
      `Successfully minted ${amount} tokens to ${recipientAta.toString()}`
    );
    console.log(`Transaction signature: ${signature}`);

    return recipientAta;
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }
}
