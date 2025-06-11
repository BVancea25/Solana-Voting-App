import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./components/NavBar";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
       <NavBar />
      <main className="mt-6 p-4">
        <Outlet />
      </main>
    </div>
  );
}
