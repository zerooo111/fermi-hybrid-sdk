import { sha512 } from "@noble/hashes/sha512";
import * as ed25519 from "@noble/ed25519";

// Configure ed25519 to use SHA-512
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

export * from "./sequencer/sequencer.client";
