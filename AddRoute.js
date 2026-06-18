// ─────────────────────────────────────────────────────────────
//  AddRoute.jsx  —  Add Route Page Component
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from "react";
import { getAllNodes, computeLayout } from "../utils/dijkstra";

function AddRoute({ routes, setRoutes }) {

  // ── Local State ───────────────────────────────────────────
  const [srcNode, setSrcNode] = useState("");
  const [dstNode, setDstNode] = useState("");
  const [numRoutes, setNumRoutes] = useState("");

  const [rows, setRows] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Canvas Ref ────────────────────────────────────────────
  const canvasRef = useRef(null);

  // ── Generate Rows ─────────────────────────────────────────
  function handleGenerate() {

    const n = parseInt(numRoutes);

    if (!srcNode || !dstNode || !n || n < 1) {
      alert("Please fill Source, Destination and Number of Routes.");
      return;
    }

    const generated = Array.from({ length: n }, (_, i) => ({
      from: i === 0 ? srcNode : "",
      to: i === n - 1 ? dstNode : "",
      distance: "",
    }));

    setRows(generated);
    setShowSuccess(false);
  }

  // ── Update Row ────────────────────────────────────────────
  function updateRow(index, field, value) {

    const updated = rows.map((row, i) =>
      i === index
        ? { ...row, [field]: value }
        : row
    );

    setRows(updated);
  }

  // ── Delete Row ────────────────────────────────────────────
  function deleteRow(index) {
    setRows(rows.filter((_, i) => i !== index));
  }

  // ── SAVE TO MONGODB + FRONTEND ────────────────────────────
  async function handleSubmit() {

    // Keep only valid rows
    const valid = rows.filter(
      r =>
        r.from.trim() &&
        r.to.trim() &&
        parseFloat(r.distance) > 0
    ).map(r => ({
      from: r.from.trim(),
      to: r.to.trim(),
      distance: parseFloat(r.distance),
    }));

    if (!valid.length) {
      alert("Please fill at least one complete route.");
      return;
    }

    try {

      // 🔥 SEND TO BACKEND
      const res = await fetch("http://localhost:5000/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routes: valid,
        }),
      });

      const data = await res.json();

      console.log("✅ SAVED:", data);

      if (data.success) {

        // 🔥 UPDATE FRONTEND
        setRoutes(prev => [...prev, ...data.routes]);

        // Reset form
        setRows([]);
        setSrcNode("");
        setDstNode("");
        setNumRoutes("");

        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

      } else {
        alert("Failed to save routes");
      }

    } catch (err) {

      console.error("❌ ERROR:", err);
      alert("Server error while saving");

    }
  }

  // ── Preview Graph ─────────────────────────────────────────
  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const newRoutes = rows.filter(
      r =>
        r.from.trim() &&
        r.to.trim() &&
        parseFloat(r.distance) > 0
    ).map(r => ({
      from: r.from.trim(),
      to: r.to.trim(),
      distance: parseFloat(r.distance),
}));

// Existing routes + newly added routes
const preview = [...routes, ...newRoutes];

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0c0f1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!preview.length) return;

    // Layout
    const nodes = getAllNodes(preview);

    const pos = computeLayout(
      nodes,
      preview,
      canvas.width,
      canvas.height
    );

    // Draw edges
    preview.forEach(r => {

      const a = pos[r.from];
      const b = pos[r.to];

      if (!a || !b) return;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      const isNewRoute = newRoutes.some(
        nr =>
          nr.from === r.from &&
          nr.to === r.to &&
          nr.distance === r.distance
);

ctx.strokeStyle = isNewRoute
  ? "#25d09c"   // green for newly added routes
  : "#4f9cf9";  // blue for existing routes
      ctx.lineWidth = 2;
      ctx.stroke();

      // Distance label
      ctx.fillStyle = "#4a5575";
      ctx.font = "bold 14px JetBrains Mono";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";

      ctx.fillText(
        `${r.distance}km`,
        (a.x + b.x) / 2,
        (a.y + b.y) / 2 - 5
      );
    });

    // Draw nodes
    nodes.forEach(nd => {

      const p = pos[nd];
      if (!p) return;

      // Circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);

      ctx.fillStyle = "#161c2c";
      ctx.fill();

      ctx.strokeStyle = "#4f9cf9";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.fillStyle = "#e8ecff";
      ctx.font = "bold 14px Space Grotesk";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        nd.length > 6
          ? nd.slice(0, 5) + "…"
          : nd,
        p.x,
        p.y
      );
    });

  }, [rows, routes]);

  // ── Render ────────────────────────────────────────────────
  return (

    <div className="page">

      <h2 className="page-title">➕ Add Route</h2>

      <p className="page-sub">
        Enter source, destination and route connections.
      </p>

      {/* Top Form */}
      <div className="card">

        <div className="form-row-3">

          <div className="form-group">
            <label>Source Node</label>

            <input
              placeholder="e.g. Warehouse"
              value={srcNode}
              onChange={(e) => setSrcNode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Destination Node</label>

            <input
              placeholder="e.g. Airport"
              value={dstNode}
              onChange={(e) => setDstNode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>No. of Routes</label>

            <input
              type="number"
              min="1"
              max="12"
              placeholder="3"
              value={numRoutes}
              onChange={(e) => setNumRoutes(e.target.value)}
            />
          </div>

        </div>

        <button
          className="btn btn-outline"
          onClick={handleGenerate}
        >
          Generate Route Inputs →
        </button>

        {/* Dynamic Rows */}
        {rows.length > 0 && (

          <div className="route-rows-wrap">

            <p className="section-label">
              Enter route connection(s):
            </p>

            {rows.map((row, index) => (

              <div
                key={index}
                className="route-row"
              >

                <div className="form-group">
                  <label>From</label>

                  <input
                    placeholder="Node A"
                    value={row.from}
                    onChange={(e) =>
                      updateRow(index, "from", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>To</label>

                  <input
                    placeholder="Node B"
                    value={row.to}
                    onChange={(e) =>
                      updateRow(index, "to", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Distance (km)</label>

                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="5"
                    value={row.distance}
                    onChange={(e) =>
                      updateRow(index, "distance", e.target.value)
                    }
                  />
                </div>

                <button
                  className="del-btn"
                  onClick={() => deleteRow(index)}
                >
                  ✕
                </button>

              </div>
            ))}

            {/* Save */}
            <button
              className="btn btn-yellow"
              onClick={handleSubmit}
            >
              ✅ Add All Routes
            </button>

          </div>
        )}

        {/* Success */}
        {showSuccess && (
          <div className="success-msg">
            ✅ Routes added successfully!
          </div>
        )}

      </div>

      {/* Preview */}
      {rows.length > 0 && (

        <div className="preview-card">

          <h4>Complete Network Preview</h4>

          <canvas
          ref={canvasRef}
          width={1000}
          height={450}
          className="preview-canvas"
          />

        </div>
      )}

    </div>
  );
}

export default AddRoute;