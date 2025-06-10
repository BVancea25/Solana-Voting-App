import React, { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/idl.json";
import { PublicKey } from "@solana/web3.js";

export default function OngoingSessions() {
  const { connection } = useConnection();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Your program ID
  const PROGRAM_ID = new PublicKey(
    "5bMC9ahzar51f1ER4eoN34JWr2NtQdsAwfECQ985Bfvb"
  );

  useEffect(() => {
    (async () => {
      try {
        // 1) Build an Anchor provider with just the connection
        const provider = new anchor.AnchorProvider(
          connection,
          // dummy walletAdapter-like object (no signing needed for reads)
          { publicKey: null, signTransaction: null, signAllTransactions: null },
          anchor.AnchorProvider.defaultOptions()
        );
        anchor.setProvider(provider);

        // 2) Instantiate the program client
        const program = new anchor.Program(idl, PROGRAM_ID, provider);

        // 3) Fetch all VoteAccount instances
        const allAccounts = await program.account.voteAccount.all();

        // 4) Filter those still open
        const now = Math.floor(Date.now() / 1000);
        const open = allAccounts.filter(({ account }) => account.closeTime > now);
        console.log(open);
        // 5) Map to a simpler shape for rendering
        const mapped = open.map(({ publicKey, account }) => ({
        address: publicKey.toBase58(),
        closeTime: account.closeTime.toNumber(),
        options: account.options.map(opt => ({
            label: opt.label,
            count: opt.count.toNumber(),
        })),
        }));
        setSessions(mapped);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch sessions");
      } finally {
        setLoading(false);
      }
    })();
  }, [connection]);

  if (loading) return <p className="p-4">Loading sessions…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (sessions.length === 0)
    return <p className="p-4">No ongoing voting sessions found.</p>;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Ongoing Voting Sessions</h2>
      {sessions.map((sess) => (
        <div
          key={sess.address}
          className="border rounded p-4 shadow-sm bg-white"
        >
          <p className="font-mono text-sm break-all">
            <strong>Address:</strong> {sess.address}
          </p>
          <p>
            <strong>Closes:</strong>{" "}
            {new Date(sess.closeTime * 1000).toLocaleString()}
          </p>
          <ul className="list-disc list-inside mt-2">
            {sess.options.map((opt, i) => (
              <li key={i}>
                {opt.label} — {opt.count} vote{opt.count !== 1 ? "s" : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}