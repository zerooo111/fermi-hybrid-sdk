import { Keypair } from "@solana/web3.js";
import fs from "fs";

export const getLocalKeypair = (path: string) => {
  const secretKey = JSON.parse(fs.readFileSync(path, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  return keypair;
};
