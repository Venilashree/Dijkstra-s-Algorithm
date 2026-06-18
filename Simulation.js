// ─────────────────────────────────────────────────────────────
//  Simulation.jsx  —  Simulation Page Component
//
//  WHAT THIS DOES:
//    1. Shows Source + Destination dropdowns
//    2. On "Find Shortest Path" → runs Dijkstra
//    3. Draws the full graph on a <canvas>
//    4. Animates a 🚴 rider along the shortest path
//    5. Shows result: path + total distance + algorithm steps
//    6. Click red edges → popup explains why Dijkstra skipped them
//
//  PROPS RECEIVED:
//    • routes → the global routes list from App
//
//  CONCEPTS USED:
//    • useRef    → to hold canvas element + animation frame ID
//    • useState  → result, rider position, popup state
//    • useEffect → draw graph whenever result/routes change
//    • requestAnimationFrame → smooth rider animation loop
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from "react";
import { dijkstra, getAllNodes, computeLayout } from "../utils/dijkstra";

// Graph colors (defined once, used in canvas drawing)
const COLOR = {
  green: "#00ff9d",
  red: "#ff3b5c",
  accent: "#ffcc00",
  purple: "#c084fc",
  text: "#ffffff",
  muted: "#cbd5e1",
  card2: "#1e293b",
  border: "#60a5fa",
};

function Simulation({ routes }) {

  // ── State ─────────────────────────────────────────────────
  const [src, setSrc]         = useState(""); // selected source node
  const [dst, setDst]         = useState(""); // selected destination node
  const [result, setResult]   = useState(null); // Dijkstra result object
  const [popup, setPopup]     = useState(null); // { reason, detail } for red edge click
  const [status, setStatus]   = useState("");   // status text below canvas

  // ── Refs ──────────────────────────────────────────────────
  const canvasRef    = useRef(null);   // the <canvas> DOM element
  const animFrameRef = useRef(null);   // animation frame ID (for cleanup)
  const riderTRef    = useRef(0);      // animation progress 0→1
  const dashOffRef   = useRef(0);      // animated dash offset for path edges
  const posRef       = useRef({});     // node positions { name: {x,y} }
  const edgeTargets  = useRef([]);     // clickable rejected edges (for popup)

  // ── Get all unique nodes from routes ─────────────────────
  const allNodes = getAllNodes(routes);

  // ── DRAWING FUNCTION ──────────────────────────────────────
  // useCallback memoizes this function — it won't be recreated
  // on every render unless `routes` or `result` changes.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Clear and fill background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#080910";
  
    ctx.fillRect(0, 0, W, H);

    // If no routes, show placeholder text
    if (!routes.length) {
      ctx.fillStyle  = COLOR.muted;
      ctx.font       = "20px Space Grotesk, sans-serif";
      ctx.textAlign  = "center";
      ctx.fillText("No routes yet — add some routes first.", W / 2, H / 2);
      return;
    }

    // Compute layout if needed
    const nodes = getAllNodes(routes);
    if (!Object.keys(posRef.current).length || Object.keys(posRef.current).length !== nodes.length) {
      posRef.current = computeLayout(nodes, routes, W, H);
    }
    const pos = posRef.current;

    // Build a Set of edges that are ON the shortest path
    // e.g. Set {"A→B", "B→A", "B→C", "C→B"}
    const pathEdges = result
      ? new Set(
          result.path.slice(0, -1).flatMap((_, i) => {
            const a = result.path[i], b = result.path[i + 1];
            return [a + "→" + b, b + "→" + a];
          })
        )
      : new Set();

    edgeTargets.current = []; // reset click targets

    // ── Draw Edges ────────────────────────────────────────
    routes.forEach(r => {
      const a = pos[r.from], b = pos[r.to];
      if (!a || !b) return;

      const isPath    = pathEdges.has(r.from + "→" + r.to) || pathEdges.has(r.to + "→" + r.from);
      const isRejected = result && !isPath;

      if (isPath) {
        // Glowing green path edge
        ctx.save();
        ctx.shadowColor = COLOR.green;
        ctx.shadowBlur  = 20;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = COLOR.green;
        ctx.lineWidth   = 4;
        ctx.stroke();
        ctx.restore();

        // Animated white dash overlay on path edge
        ctx.save();
        ctx.setLineDash([7, 7]);
        ctx.lineDashOffset = -dashOffRef.current; // animates along edge
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.38)";
        ctx.lineWidth   = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

      } else if (isRejected) {
        // Red dashed rejected edge
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,82,82,0.5)";
        ctx.lineWidth   = 2;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Store coordinates so we can detect clicks on this edge
        edgeTargets.current.push({ r, ax: a.x, ay: a.y, bx: b.x, by: b.y });

      } else {
        // Idle grey edge (no result yet)
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = COLOR.border;
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      // Distance label on each edge
      // Distance label on each edge
const mx = (a.x + b.x) / 2;
const my = (a.y + b.y) / 2;

// Background box for visibility
ctx.fillStyle = "rgba(0,0,0,0.85)";
ctx.fillRect(mx - 28, my - 18, 56, 22);

// Bigger and brighter text
ctx.font = "bold 14px JetBrains Mono, monospace";
ctx.textAlign = "center";
ctx.fillStyle = isPath
  ? "#00ff9d"
  : isRejected
  ? "#ff6b6b"
  : "#ffffff";

      ctx.fillText(`${r.distance} km`, mx, my - 2);
    });

    // ── Draw Nodes ────────────────────────────────────────
    nodes.forEach(nd => {
      const p = pos[nd];
      if (!p) return;

      const inPath = result && result.path.includes(nd);
      const isSrc  = result && nd === result.path[0];
      const isDst  = result && nd === result.path[result.path.length - 1];

      // Glow ring for path nodes
      if (inPath) {
        ctx.save();
        ctx.shadowColor = isSrc ? COLOR.accent : isDst ? COLOR.purple : COLOR.green;
        ctx.shadowBlur  = 24;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = "transparent";
        ctx.fill();
        ctx.restore();
      }

      // Node circle fill
      ctx.beginPath();
      ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = isSrc ? "#281600" : isDst ? "#180e2a" : inPath ? "#0c2018" : "#0e1628";
      ctx.fill();
      ctx.strokeStyle = isSrc ? COLOR.accent : isDst ? COLOR.purple : inPath ? COLOR.green : COLOR.border;
      ctx.lineWidth   = inPath ? 2.5 : 1.5;
      ctx.stroke();

      // Node name inside circle
      ctx.fillStyle     = isSrc ? COLOR.accent : isDst ? COLOR.purple : inPath ? COLOR.green : COLOR.text;
      ctx.font          = "bold 9px Space Grotesk, sans-serif";
      ctx.textAlign     = "center";
      ctx.textBaseline  = "middle";
      ctx.fillText(nd.length > 6 ? nd.slice(0, 5) + "…" : nd, p.x, p.y);

      // Node name below circle
      ctx.fillStyle     = inPath ? COLOR.green : "#384060";
      ctx.font          = "8.5px Space Grotesk, sans-serif";
      ctx.textBaseline  = "alphabetic";
      ctx.fillText(nd, p.x, p.y + 33);
    });

    // ── Draw Rider 🚴 ─────────────────────────────────────
    if (result && riderTRef.current >= 0) {
      const rp = getRiderPosition(riderTRef.current, result.path, pos);
      ctx.save();
      ctx.shadowColor   = COLOR.accent;
      ctx.shadowBlur    = 18;
      ctx.font          = "34px serif";
      ctx.textAlign     = "center";
      ctx.textBaseline  = "middle";
      ctx.fillText("🚴", rp.x, rp.y - 12);
      ctx.restore();
    }

  }, [routes, result]);

  // ── Helper: get rider X,Y for animation progress t (0→1) ─
  function getRiderPosition(t, path, pos) {
    if (!path || path.length < 2) return pos[path[0]] || { x: 0, y: 0 };
    const segments = path.length - 1;
    const total    = t * segments;
    const seg      = Math.min(Math.floor(total), segments - 1);
    const segT     = total - seg;
    const a        = pos[path[seg]];
    const b        = pos[path[seg + 1]];
    return {
      x: a.x + (b.x - a.x) * segT,
      y: a.y + (b.y - a.y) * segT,
    };
  }

  // ── Animation Loop ────────────────────────────────────────
  function startAnimation(dijkResult, totalMs) {
    const startTime = performance.now();

    function loop() {
      const elapsed = performance.now() - startTime;
      riderTRef.current  = Math.min(elapsed / totalMs, 1); // 0 → 1
      dashOffRef.current = (dashOffRef.current + 0.45) % 20; // dash movement

      draw(); // redraw frame

      if (riderTRef.current < 1) {
        // Keep animating
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        // Animation done
        setStatus("✅ Arrived! Animation complete.");
      }
    }

    animFrameRef.current = requestAnimationFrame(loop);
  }

  // ── Idle animation (dashes move even before simulation) ──
  useEffect(() => {
    let running = true;

    function idleLoop() {
      if (!running) return;
      dashOffRef.current = (dashOffRef.current + 0.3) % 20;
      draw();
      requestAnimationFrame(idleLoop);
    }

    idleLoop();
    return () => { running = false; };
  }, [draw]);

  // ── Resize handler: recompute layout when window resizes ──
  useEffect(() => {
    function handleResize() {
      posRef.current = {};
      draw();
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // ── Run Dijkstra + Start Animation ────────────────────────
  function runSimulation() {
    if (!routes.length)    { alert("Add routes first!");                    return; }
    if (!src || !dst)      { alert("Select source and destination.");        return; }
    if (src === dst)        { alert("Source and destination must differ.");   return; }

    // Cancel any running animation
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Reset
    riderTRef.current  = 0;
    posRef.current     = {};
    dashOffRef.current = 0;

    // Run Dijkstra (from our utility)
    const dijResult = dijkstra(routes, src, dst);

    if (dijResult.distance === Infinity) {
      alert(`No path found from "${src}" to "${dst}". They may be disconnected.`);
      return;
    }

    setResult(dijResult);
    setStatus("🚴 Rider is on the way…");

    // Animation duration: longer paths = more time
    const totalMs = Math.max(2800, dijResult.path.length * 1000);
    startAnimation(dijResult, totalMs);
  }

  // ── Reset everything ──────────────────────────────────────
  function resetSimulation() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    riderTRef.current  = 0;
    posRef.current     = {};
    dashOffRef.current = 0;
    setResult(null);
    setStatus("");
    setSrc("");
    setDst("");
    draw();
  }

  // ── Canvas Click → Show popup for rejected edge ───────────
  function handleCanvasClick(e) {
    if (!result) return;

    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    // Scale click coords to canvas internal resolution
    const cx = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const cy = (e.clientY - rect.top)  * (canvas.height / rect.height);

    // Check if click is near any rejected edge
    let closestEdge = null;
    let minDist     = 18; // click tolerance in pixels

    edgeTargets.current.forEach(({ r, ax, ay, bx, by }) => {
      // Distance from point (cx,cy) to line segment (ax,ay)→(bx,by)
      const dx  = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const t   = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / (len * len)));
      const d   = Math.sqrt((cx - ax - t * dx) ** 2 + (cy - ay - t * dy) ** 2);

      if (d < minDist) { minDist = d; closestEdge = r; }
    });

    if (closestEdge) {
      setPopup({
        reason: `Edge "${closestEdge.from} → ${closestEdge.to}" (${closestEdge.distance} km) was skipped.`,
        detail: `Shortest path found: ${result.distance} km\n\nThis edge costs ${closestEdge.distance} km by itself. Including it would produce a longer or suboptimal total path.\n\nDijkstra always picks the minimum cumulative cost — this edge was never the best relaxation choice.`,
      });
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="page">
      <h2 className="page-title">🚴 Delivery Simulation</h2>
      <p className="page-sub">
        Select source & destination to animate the shortest path.
        Click <span style={{ color: COLOR.red }}>red dashed edges</span> to see why they were rejected.
      </p>

      {/* ── Controls ─────────────────────────────────────── */}
      <div className="sim-controls">

        <div className="form-group">
          <label>SOURCE</label>
          <select value={src} onChange={e => setSrc(e.target.value)}>
            <option value="">-- Source --</option>
            {allNodes.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>DESTINATION</label>
          <select value={dst} onChange={e => setDst(e.target.value)}>
            <option value="">-- Dest --</option>
            {allNodes.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>

        <button className="btn btn-yellow" onClick={runSimulation}>
          ⚡ Find &amp; Animate
        </button>

        <button className="btn btn-outline" onClick={resetSimulation}>
          ↩ Reset
        </button>

      </div>

      {/* ── Canvas (Graph is drawn here) ─────────────────── */}
      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={1400}
          height={850}
          className="graph-canvas"
          onClick={handleCanvasClick}
        />
      </div>

      {/* Status text below canvas */}
      {status && <p className="sim-status">{status}</p>}

      {/* ── Result Box ───────────────────────────────────── */}
      {result && (
        <div className="result-box">
          <h3>✅ Shortest Path Found</h3>

          {/* Path as connected pills */}
          <div className="path-pills">
            {result.path.map((node, i) => (
              <React.Fragment key={node}>
                <span className="pill pill-active">{node}</span>
                {i < result.path.length - 1 && <span className="arrow">→</span>}
              </React.Fragment>
            ))}
          </div>

          <p className="result-dist">
            Total Distance: <strong>{result.distance} km</strong>
          </p>

          {/* Algorithm step log */}
          <div className="steps-log">
            {result.steps.map((step, i) => (
              <div key={i} className="step-line">{step}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rejection Popup ───────────────────────────────── */}
      {popup && (
        <div className="popup-overlay" onClick={() => setPopup(null)}>
          <div className="popup" onClick={e => e.stopPropagation()}>
            <h3>🔴 Why Not This Route?</h3>
            <p>{popup.reason}</p>
            <pre className="popup-detail">{popup.detail}</pre>
            <button className="btn btn-outline" onClick={() => setPopup(null)}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Simulation;