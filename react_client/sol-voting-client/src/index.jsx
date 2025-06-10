import React from "react";
import App from "./App";
import { createRoot } from "react-dom/client";
// Solana / wallet‐adapter imports
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider }               from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  // …add more adapters here if you like
} from "@solana/wallet-adapter-wallets";

// Optional: default styles for the modal
import "@solana/wallet-adapter-react-ui/styles.css";
import { createBrowserRouter, RouterProvider, Route } from "react-router";
import CreateSession from "./components/CreateSession";
import OngoingSessions from "./components/OngoingSessions";

const SOLANA_NETWORK = "devnet"; // or "mainnet-beta", "testnet"
const RPC_ENDPOINT   = `https://api.${SOLANA_NETWORK}.solana.com`;

const router = createBrowserRouter([
  {
    path: "/",
    element: <CreateSession />,
  },
  {
    path: "/sessions",
    element: <OngoingSessions />,
  },
  // …other routes
]);

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <ConnectionProvider endpoint={RPC_ENDPOINT}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <RouterProvider router={router}>
          <App />
        </RouterProvider>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>,
);
