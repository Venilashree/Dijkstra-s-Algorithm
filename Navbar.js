// ─────────────────────────────────────────────────────────────
//  Navbar.jsx  —  Navigation Bar Component
//
//  WHAT THIS DOES:
//    Shows the top navigation with 4 tab buttons.
//    Highlights the currently active tab.
//
//  PROPS RECEIVED:
//    • page    → the current active page name (string)
//    • setPage → function to change the active page
//
//  CONCEPT — Props:
//    Props are like function parameters.
//    Parent (App) passes data → Child (Navbar) receives and uses it.
// ─────────────────────────────────────────────────────────────

import React from "react";

function Navbar({ page, setPage }) {
  return (
    <nav className="navbar">
      {/* Brand / Logo */}
      <div className="brand">📦 DeliveryShortest</div>

      {/*
        Tab Buttons — one for each page.
        className uses a ternary to add "active" class when
        this tab matches the current page.
      */}

      <button
        className={page === "home" ? "tab active" : "tab"}
        onClick={() => setPage("home")}
      >
        🏠 Home
      </button>

      <button
        className={page === "add" ? "tab active" : "tab"}
        onClick={() => setPage("add")}
      >
        ➕ Add Route
      </button>

      <button
        className={page === "routes" ? "tab active" : "tab"}
        onClick={() => setPage("routes")}
      >
        📋 Routes
      </button>

      <button
        className={page === "sim" ? "tab active" : "tab"}
        onClick={() => setPage("sim")}
      >
        🚴 Simulation
      </button>
    </nav>
  );
}

export default Navbar;