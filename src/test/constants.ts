import { Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";

console.log("loading constants");

export const DEREK_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(fs.readFileSync("keypairs/Derek_keypair.json", "utf-8"))
  )
);

export const CHARLES_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(fs.readFileSync("keypairs/Charles_keypair.json", "utf-8"))
  )
);

export const BASE_MINT = new PublicKey(
  "9VXJQZVEVMuYBqoXZWeiZymbP6FETsq6npPQZxLkCPSW"
);

export const QUOTE_MINT = new PublicKey(
  "Drfmg6JxU95x3P6H6seKakMUmJ2G3vZBUJ5puyQTUNij"
);

export const VAULT_PROGRAM_ID = new PublicKey(
  "2AcUsdsFXdUfKm5pd7JLQqNAKhgsZZz7e8Pc7E6Dowbx"
);
