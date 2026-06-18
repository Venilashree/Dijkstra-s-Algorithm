// ─────────────────────────────────────────────────────────────
//  Home.jsx  —  Home Page Component
//
//  WHAT THIS DOES:
//    Shows the welcome screen with a hero section and
//    feature cards. Has two buttons to go to other pages.
//
//  PROPS RECEIVED:
//    • setPage → function to navigate to another page
//
//  CONCEPT — Simple Presentational Component:
//    This component has NO state and NO logic.
//    It just displays content and triggers navigation.
//    These are called "presentational" or "dumb" components.
// ─────────────────────────────────────────────────────────────

import React from "react";

function Home({ setPage }) {
  return (
    <div className="page">

      {/* ── Hero Section ─────────────────────────────────── */}
      <div className="hero">
        <h1>
          Smart Delivery<br />
          <em>Route Optimizer</em>
        </h1>

        <p>
          A visual tool that uses <strong>Dijkstra's Algorithm</strong> to find
          the shortest delivery path with animated simulation.
        </p>

        <div className="hero-btns">
          {/* Clicking these buttons changes the page via setPage prop */}
          <button className="btn btn-yellow" onClick={() => setPage("add")}>
            ➕ Add Routes
          </button>
          <button className="btn btn-green" onClick={() => setPage("sim")}>
            🚴 Run Simulation
          </button>
        </div>
      </div>

      {/* ── Feature Cards ────────────────────────────────── */}
      <div className="feat-grid">

        <div className="feat-card">
          <div className="feat-icon">🗺️</div>
          <h4>Dynamic Graph</h4>
          <p>Add any nodes and edges — the graph builds itself automatically.</p>
        </div>

        <div className="feat-card">
          <div className="feat-icon">⚡</div>
          <h4>Dijkstra's Algorithm</h4>
          <p>Finds the globally shortest path every time with greedy exploration.</p>
        </div>

        <div className="feat-card">
          <div className="feat-icon">🎬</div>
          <h4>Live Animation</h4>
          <p>Watch the delivery rider travel the shortest path with a glowing trail.</p>
        </div>

        <div className="feat-card">
          <div className="feat-icon">🔴</div>
          <h4>Why Not This Route?</h4>
          <p>Click any red edge to see exactly why Dijkstra skipped it.</p>
        </div>

      </div>

      {/* ── Algorithm Explanation Card ────────────────────── */}
      <div className="algo-card">
        <h3>How Dijkstra's Algorithm Works</h3>
        <ol>
          <li><strong>Start</strong> at the source node. Set its distance to 0, all others to ∞.</li>
          <li><strong>Pick</strong> the unvisited node with the smallest distance.</li>
          <li><strong>Relax</strong> its neighbors — update if a shorter path is found.</li>
          <li><strong>Mark</strong> the current node as visited.</li>
          <li><strong>Repeat</strong> until the destination is reached.</li>
        </ol>
      </div>

    </div>
  );
}

export default Home;