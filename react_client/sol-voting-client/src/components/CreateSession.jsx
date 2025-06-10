// src/pages/CreateSession.jsx
import React, { useState } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/idl.json"
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function CreateSession() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Program ID from your `declare_id!` in Rust
  const PROGRAM_ID = new PublicKey(
    "5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb"
  );

  // Component state
  const [labelsInput, setLabelsInput] = useState("");
  const [closeUnix, setCloseUnix] = useState(
    Math.floor(Date.now() / 1000) + 3600
  );
  const [txSig, setTxSig] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.publicKey) {
      setError("Wallet not connected");
      return;
    }

    try {
      // Build Anchor provider
      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        anchor.AnchorProvider.defaultOptions()
      );
      anchor.setProvider(provider);

      // Program client
      const program = new anchor.Program(idl, PROGRAM_ID, provider);

      // New keypair for the vote account
      const voteAccount = Keypair.generate();

      // Parse and validate labels
      const labels = labelsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (labels.length === 0 || labels.length > 10) {
        setError("Must supply between 1 and 10 labels");
        return;
      }

      // Call the initialize RPC
      const tx = await program.methods
        .initialize(labels, new anchor.BN(closeUnix))
        .accounts({
          voteAccount: voteAccount.publicKey,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voteAccount])
        .rpc();

      setTxSig(tx);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Create Voting Session</h2>
      <WalletMultiButton />
      {wallet.connected && (
        <form onSubmit={onSubmit} className="space-y-2">
          <div>
            <label className="block font-medium">
              Options (comma-separated, max 10):
            </label>
            <input
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Option A, Option B, Option C"
            />
          </div>
          <div>
            <label className="block font-medium">Close Time (unix ts):</label>
            <input
              type="number"
              value={closeUnix}
              onChange={(e) => setCloseUnix(Number(e.target.value))}
              className="w-full border rounded p-2"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Initialize Session
          </button>
        </form>
      )}
      {txSig && (
        <p className="text-green-700">
          ✅ Session created! Tx:&nbsp;
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {txSig}
          </a>
        </p>
      )}
      {error && <p className="text-red-600">❌ {error}</p>}
    </div>
  );
}
