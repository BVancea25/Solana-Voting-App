// src/pages/CreateSession.jsx
import React, { useState } from "react";
import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/idl.json";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export default function CreateSession() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const PROGRAM_ID = new PublicKey(idl.metadata.address);

  const [labelsInput, setLabelsInput] = useState("");
  const [closeUnix, setCloseUnix] = useState(Math.floor(Date.now() / 1000) + 3600);
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedInput, setAllowedInput] = useState("");

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState({
    labels: "",
    closeTime: "",
    allowed: "",
  });
  const [txSig, setTxSig] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const validate = () => {
    let valid = true;
    const errs = { labels: "", closeTime: "", allowed: "" };

    // Only letters, numbers, spaces in labels; commas to separate
    const labelPattern = /^[A-Za-z0-9 ]+(\s*,\s*[A-Za-z0-9 ]+)*$/;
    if (!labelPattern.test(labelsInput.trim())) {
      errs.labels = "Folosește doar litere, cifre și spații, separate prin virgule";
      valid = false;
    } else {
      const parts = labelsInput.split(",").map(s => s.trim());
      if (parts.length < 1 || parts.length > 10) {
        errs.labels = "Introduce între 1 și 10 opțiuni";
        valid = false;
      }
    }

    if (closeUnix <= Math.floor(Date.now() / 1000)) {
      errs.closeTime = "Timpul trebuie să fie în viitor";
      valid = false;
    }

    if (isPrivate) {
      // Base58 pubkey pattern and comma separated
      const keyPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}(\s*,\s*[1-9A-HJ-NP-Za-km-z]{32,44})*$/;
      if (!keyPattern.test(allowedInput.trim())) {
        errs.allowed = "Folosește doar adrese Base58 separate prin virgule";
        valid = false;
      }
    }

    setFieldErrors(errs);
    return valid;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!wallet.publicKey) {
      setSubmitError("Conectează portofelul pentru a crea sesiunea");
      return;
    }
    if (!validate()) return;

    try {
      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        anchor.AnchorProvider.defaultOptions()
      );
      anchor.setProvider(provider);

      const program = new anchor.Program(idl, PROGRAM_ID, provider);
      const voteAccount = Keypair.generate();

      // labels and allowed keys already validated
      const labels = labelsInput.split(",").map(s => s.trim());
      let allowedKeys = [];
      if (isPrivate) {
        allowedKeys = allowedInput.split(",").map(s => new PublicKey(s.trim()));
      }

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
    } catch (err) {
      console.error(err);
      setSubmitError(err.error?.errorMessage || err.message);
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
                  Options (comma-separated, only letters, numbers, spaces)
                </label>
                <input
                  type="text"
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="Option A, Option B, Option C"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {fieldErrors.labels && (
                  <p className="text-red-600 mt-1">{fieldErrors.labels}</p>
                )}
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
                {fieldErrors.closeTime && (
                  <p className="text-red-600 mt-1">{fieldErrors.closeTime}</p>
                )}
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
                    Allowed Voter Addresses (comma-separated, Base58)
                  </label>
                  <textarea
                    value={allowedInput}
                    onChange={(e) => setAllowedInput(e.target.value)}
                    placeholder="Enter public keys separated by commas"
                    className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {fieldErrors.allowed && (
                    <p className="text-red-600 mt-1">{fieldErrors.allowed}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-lg transition"
              >
                Initialize Session
              </button>

              {submitError && <p className="text-red-600 mt-2">❌ {submitError}</p>}
              {txSig && (
                <p className="text-green-600 mt-2">
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
            </form>
          ) : (
            <p>You need to connect your wallet to create a session!</p>
          )}
        </div>
      </div>
    </div>
  );
}
