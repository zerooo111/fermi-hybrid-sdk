import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { createMint as splCreateMint } from '@solana/spl-token';

/**
 * Creates a new token mint with the specified parameters
 * 
 * @param connection - Solana connection object
 * @param payer - Keypair that will pay for the transaction
 * @param mintAuthority - Public key that will be set as the mint authority
 * @param freezeAuthority - Public key that will be set as the freeze authority (optional)
 * @param decimals - Number of decimals for the token (default: 9)
 * @returns Promise resolving to the newly created mint's public key
 */
export async function createMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null = null,
  decimals: number = 9
): Promise<PublicKey> {
  try {
    console.log(`Creating new token mint with ${decimals} decimals...`);
    
    // Generate a new keypair for the mint account
    const mintKeypair = Keypair.generate();
    console.log(`Mint address: ${mintKeypair.publicKey.toString()}`);
    
    // Create the mint account
    const mintPubkey = await splCreateMint(
      connection,
      payer,
      mintAuthority,
      freezeAuthority,
      decimals,
      mintKeypair
    );
    
    console.log(`Successfully created mint: ${mintPubkey.toString()}`);
    return mintPubkey;
  } catch (error) {
    console.error('Error creating mint:', error);
    throw error;
  }
}
