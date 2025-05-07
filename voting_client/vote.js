import * as anchor from "@coral-xyz/anchor";                      // Anchor TS client APIs :contentReference[oaicite:0]{index=0}
import { Keypair, SystemProgram, PublicKey, sendAndConfirmTransaction, Connection } from "@solana/web3.js";         // Solana web3 primitives :contentReference[oaicite:1]{index=1}
import idlJson from "../voting_app/target/idl/voting_app.json" assert {type: 'json'};  
// const provider = anchor.AnchorProvider.env();
// anchor.setProvider(provider);

const programId="5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb";
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const wallet = anchor.AnchorProvider.env().wallet;
const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
anchor.setProvider(provider);

const program = new anchor.Program(idlJson, programId, provider);
async function main() {
  // 5. Generate a new vote account keypair
  const voteAccount = new PublicKey("5h1W3WvB5mHMrQ7byTJseX4MUodmz1pTxuYX8XZWY1P1");
  // 6. Call `initialize` with your labels
  const tx = await program.methods
    .vote(1)
    .accounts({
        voteAccount
    })
    .rpc()
  console.log("✅ Initialization tx:", tx);
  
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error running test client:", err);
    process.exit(1);
  });