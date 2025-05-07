import * as anchor from "@coral-xyz/anchor";                      // Anchor TS client APIs :contentReference[oaicite:0]{index=0}
import { Keypair, SystemProgram, PublicKey } from "@solana/web3.js";         // Solana web3 primitives :contentReference[oaicite:1]{index=1}
import idlJson from "../voting_app/target/idl/voting_app.json" assert {type: 'json'};                     // Your program’s generated IDL :contentReference[oaicite:2]{index=2}

// 1. Configure local cluster & wallet from .env (ANCHOR_PROVIDER_URL, WALLET)
//    AnchorProvider.env() picks these up automatically :contentReference[oaicite:3]{index=3}
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// 3. Program ID from ENV
const programId = new PublicKey("5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb");

// 4. Instantiate the program
const program = new anchor.Program(idlJson, programId, provider);

async function main() {
  // 5. Generate a new vote account keypair
  const voteAccount = Keypair.generate();

  // 6. Call `initialize` with your labels
  const tx = await program.methods
    .initialize(["Cat", "Dog", "Cow"])
    .accounts({
      voteAccount: voteAccount.publicKey
    })
    .signers([voteAccount])
    .rpc();

  console.log("✅ Initialization tx:", tx);
  console.log("🗳️  Vote account pubkey:", voteAccount.publicKey.toBase58());
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error running test client:", err);
    process.exit(1);
  });