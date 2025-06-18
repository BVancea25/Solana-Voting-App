// src/pages/VoteSession.jsx
import React, { useEffect, useState} from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/idl.json";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useParams } from "react-router-dom";

export default function VoteSession() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [options, setOptions] = useState([]);
  const [closeTime, setCloseTime] = useState(null);
  const [choice, setChoice] = useState(null);
  const [txSig, setTxSig] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const PROGRAM_ID = new PublicKey("5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb");

  const { sessionAddress } = useParams();   
  const sessionPubkey = new PublicKey(sessionAddress);

  useEffect(() => {
    (async () => {
      try {
        const provider = new anchor.AnchorProvider(
          connection,
          wallet,
          anchor.AnchorProvider.defaultOptions()
        );
        anchor.setProvider(provider);

        const program = new anchor.Program(idl, PROGRAM_ID, provider);

        const account = await program.account.voteAccount.fetch(sessionPubkey);

        setOptions(
          account.options.map((o, i) => ({ label: o.label, count: o.count.toNumber(), index: i }))
        );
        setCloseTime(account.closeTime.toNumber());
      } catch (err) {
        console.error(err);
        setError("Failed to load session data");
      } finally {
        setLoading(false);
      }
    })();
  }, [connection, wallet, sessionPubkey]);

  const onVote = async () => {
    if (choice === null) {
      setError("Please select an option");
      return;
    }
    try {
      setError(null);
      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        anchor.AnchorProvider.defaultOptions()
      );
      anchor.setProvider(provider);
      const program = new anchor.Program(idl, PROGRAM_ID, provider);

      const tx = await program.methods
        .vote(choice)
        .accounts({ voteAccount: sessionPubkey, user: wallet.publicKey })
        .rpc();

      setTxSig(tx);
    } catch (err) {
      console.error(err);
      // AnchorError contains code and msg
      const errMsg = err.error?.errorMessage || err.message;
      setError(errMsg);
    }
  };

  if (loading)
    return <p className="p-6 text-center text-purple-600">Loading session…</p>;
  if (error)
    return <p className="p-6 text-center text-red-600">❌ {error}</p>;
  if (Date.now() / 1000 > closeTime)
    return <p className="p-6 text-center text-gray-700">This session is closed.</p>;

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold text-purple-800 mb-4">Cast Your Vote</h2>
      <ul className="space-y-3">
        {options.map((opt) => (
          <li key={opt.index}>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="vote"
                value={opt.index}
                onChange={() => setChoice(opt.index)}
                className="form-radio text-purple-600 focus:ring-purple-500"
              />
              <span className="flex-1 text-gray-800">{opt.label}</span>
              <span className="text-sm text-gray-500">{opt.count} votes</span>
            </label>
          </li>
        ))}
      </ul>
      <button
        onClick={onVote}
        disabled={!wallet.connected}
        className="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
      >
        Vote
      </button>
      {txSig && (
        <p className="mt-4 text-green-600 text-center">
          ✅ Voted! Tx:&nbsp;
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
    </div>
  );
}
