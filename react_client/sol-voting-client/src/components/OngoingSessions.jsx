// src/pages/OngoingSessions.jsx
import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/idl.json";
import { PublicKey, SystemProgram } from "@solana/web3.js";

export default function OngoingSessions() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const PROGRAM_ID = new PublicKey(idl.metadata.address);

  // Fetch sessions
  useEffect(() => {
    (async () => {
      try {
        const provider = new anchor.AnchorProvider(
          connection,
          { publicKey, signTransaction, signAllTransactions: null },
          anchor.AnchorProvider.defaultOptions()
        );
        anchor.setProvider(provider);

        const program = new anchor.Program(idl, PROGRAM_ID, provider);
        const allAccounts = await program.account.voteAccount.all();

        const now = Math.floor(Date.now() / 1000);
        const open = allAccounts.filter(({ account }) =>
          account.closeTime.toNumber() > now
        );

        const mapped = open.map(({ publicKey: pk, account }) => ({
          address: pk.toBase58(),
          closeTime: account.closeTime.toNumber(),
          options: account.options.map((o) => ({ label: o.label, count: o.count.toNumber() })),
        }));

        setSessions(mapped);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch sessions");
      } finally {
        setLoading(false);
      }
    })();
  }, [connection, publicKey, signTransaction]);

  // Close session handler
  const handleClose = async (address) => {
    if (!publicKey) return;
    try {
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions: null },
        anchor.AnchorProvider.defaultOptions()
      );
      anchor.setProvider(provider);
      const program = new anchor.Program(idl, PROGRAM_ID, provider);
      const sessionPubkey = new PublicKey(address);

      await program.methods
        .closeSession()
        .accounts({ voteAccount: sessionPubkey, refund: publicKey })
        .rpc();

      // Refresh list
      setSessions(sessions.filter((s) => s.address !== address));
    } catch (err) {
      console.error("Close failed", err);
      setError(err.error?.errorMessage || err.message);
    }
  };

  // Filter
  const filtered = sessions.filter((sess) =>
    sess.address.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-6 flex justify-center">
        <span className="text-purple-600">Loading sessions…</span>
      </div>
    );
  if (error)
    return <p className="p-6 text-center text-red-600">❌ {error}</p>;
  if (!sessions.length)
    return <p className="p-6 text-center text-gray-700">No ongoing voting sessions found.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4 space-y-6">
      <h2 className="text-3xl font-bold text-purple-800 border-b-2 pb-2">
        Ongoing Voting Sessions
      </h2>

      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Filter by address..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((sess) => (
          <div
            key={sess.address}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition"
          >
            <div className="bg-purple-700 px-4 py-2">
              <p className="font-mono text-sm text-purple-50 break-all">
                {sess.address}
              </p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Closes:</strong>{" "}
                  {new Date(sess.closeTime * 1000).toLocaleString()}
                </p>
                <p className="text-gray-700 font-medium">Options:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  {sess.options.map((opt, i) => (
                    <li key={i}>{opt.label}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => navigate(`/vote/${sess.address}`)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
                >
                  View & Vote
                </button>
                <p className="text-gray-700 font-medium">Vote Counts:</p>
                <ul className="list-none space-y-1">
                  {sess.options.map((opt, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{opt.label}</span>
                      <span className="font-semibold text-purple-600">
                        {opt.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
