
import React from "react";
import { NavLink } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function NavBar() {
  return (
    <nav className="bg-purple-800 text-purple-50 shadow-lg py-4 ring-1 ring-purple-300">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6">
        <div className="flex items-center space-x-8">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "text-white font-semibold border-b-2 border-white pb-1"
                : "hover:text-white transition"
            }
          >
            Create Session
          </NavLink>
          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              isActive
                ? "text-white font-semibold border-b-2 border-white pb-1"
                : "hover:text-white transition"
            }
          >
            Ongoing Sessions
          </NavLink>
        </div>
        <div className="flex-shrink-0">
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
}
