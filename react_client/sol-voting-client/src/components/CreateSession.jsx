// src/pages/CreateSession.jsx
import React, { useState } from "react";
import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/idl.json";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export default function CreateSession() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const PROGRAM_ID = new PublicKey("5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb");

  const [labelsInput, setLabelsInput] = useState("");
  const [closeUnix, setCloseUnix] = useState(Math.floor(Date.now() / 1000) + 3600);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedInput, setAllowedInput] = useState("");
  const [txSig, setTxSig] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.publicKey) {
      setError("Wallet not connected");
      return;
    }

    try {
      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        anchor.AnchorProvider.defaultOptions()
      );
      anchor.setProvider(provider);

      const program = new anchor.Program(idl, PROGRAM_ID, provider);
      const voteAccount = Keypair.generate();

      const labels = labelsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      if (labels.length < 1 || labels.length > 10) {
        setError("Must supply between 1 and 10 labels");
        return;
      }

      // Parse allowed list if private
      let allowedKeys = [];
      if (isPrivate) {
        allowedKeys = allowedInput
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
          .map((pk) => new PublicKey(pk));
      }
      console.log(allowedKeys);
      const tx = await program.methods
        .initialize(labels, new anchor.BN(closeUnix), allowedKeys)
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
      setError(err.error?.errorMessage || err.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-purple-800 px-6 py-4">
          <h2 className="text-2xl text-white font-bold">Create Voting Session</h2>
        </div>
        <div className="p-6 space-y-6">
          {wallet.connected ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-purple-800 font-semibold mb-1">
                  Options (comma-separated, max 10):
                </label>
                <input
                  type="text"
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="Option A, Option B, Option C"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-800 font-semibold mb-1">
                  Close Time (Unix Timestamp):
                </label>
                <input
                  type="number"
                  value={closeUnix}
                  onChange={(e) => setCloseUnix(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="private"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded"
                />
                <label htmlFor="private" className="text-purple-800">
                  Private session
                </label>
              </div>

              {isPrivate && (
                <div>
                  <label className="block text-purple-800 font-semibold mb-1">
                    Allowed Voter Addresses (comma-separated):
                  </label>
                  <textarea
                    value={allowedInput}
                    onChange={(e) => setAllowedInput(e.target.value)}
                    placeholder="Enter public keys separated by commas"
                    className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-lg transition"
              >
                Initialize Session
              </button>
            </form>
          ) : (<div><p>You need to connect your wallet to create a session!</p></div>)}

          {txSig && (
            <p className="text-green-600">
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
      </div>
    </div>
        
  );
}
