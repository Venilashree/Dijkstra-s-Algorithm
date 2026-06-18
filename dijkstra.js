// ─────────────────────────────────────────────────────────────
//  dijkstra.js  —  Dijkstra's Shortest Path Algorithm
//
//  This is a PURE UTILITY file — it has no React in it at all.
//  It only deals with graph logic (data structures + math).
//
//  HOW DIJKSTRA WORKS (simple explanation):
//  ─────────────────────────────────────────
//  Imagine you're at a train station. You want to reach another
//  city with minimum total distance. Dijkstra says:
//
//    1. Start at source. Your distance = 0. All others = Infinity.
//    2. Pick the unvisited city with the SMALLEST known distance.
//    3. Look at all its neighbors. If going through the current
//       city to a neighbor is SHORTER than the known distance,
//       update it (this is called "relaxation").
//    4. Mark current city as visited. Repeat from step 2.
//    5. Stop when you reach the destination.
//
//  At the end, trace back using `prev` to get the actual path.
// ─────────────────────────────────────────────────────────────

/**
 * dijkstra(routes, source, destination)
 *

 */
export function dijkstra(routes, source, destination) {

  // ── Step 1: Build an Adjacency List (the Graph) ──────────
  //
  // An adjacency list represents which nodes connect to which.
  // Example: graph["A"] = [{ node:"B", weight:5 }, { node:"C", weight:2 }]
  //
  // Since roads go both ways, we add BOTH directions for each route.

  const graph = {}; //create a empty

  routes.forEach(({ from, to, distance }) => {
    if (!graph[from]) graph[from] = [];//empty arr
    if (!graph[to])   graph[to]   = [];

    graph[from].push({ node: to,   weight: distance }); // A → B add edges
    graph[to].push  ({ node: from, weight: distance }); // B → A (undirected)
  });

  // ── Step 2: Get all unique node names ────────────────────
  const nodes = [...new Set(routes.flatMap(r => [r.from, r.to]))];

  // ── Step 3: Initialize distance table ────────────────────
  //
  // dist[node] = shortest known distance from source to that node
  // prev[node] = which node we came from to reach this node
  //
  // We start with Infinity (unknown) for all, except source = 0

  const dist    = {}; // e.g. { A: 0, B: Infinity, C: Infinity }
  const prev    = {}; // e.g. { A: null, B: null, C: null }
  const visited = new Set();
  const steps   = []; // human-readable explanation log

  nodes.forEach(n => {
    dist[n] = Infinity;
    prev[n] = null;
  });
  dist[source] = 0;

  // ── Step 4: Main Dijkstra Loop ───────────────────────────
  while (true) {

    // Pick the unvisited node with the SMALLEST current distance
    let current = null;  //being processed
    let minDist = Infinity;

    nodes.forEach(n => {
      if (!visited.has(n) && dist[n] < minDist) {
        minDist = dist[n];
        current = n;
      }
    });

    // If no reachable node found, or we reached destination → stop
    if (!current || current === destination) break;

    // Mark as visited (we won't revisit this node)
    visited.add(current);
    steps.push(`🔍 Visiting "${current}" — shortest distance so far: ${dist[current]} km`);

    // ── Step 5: Relax neighbors ───────────────────────────
    //
    // "Relaxation" = check if going through `current` gives
    // a shorter path to each neighbor.

    (graph[current] || []).forEach(({ node, weight }) => {
      const newDist = dist[current] + weight;

      if (newDist < dist[node]) {
        // Found a shorter path! Update it.
        dist[node] = newDist;
        prev[node] = current;
        steps.push(
          `  ✅ Updated "${node}": ${dist[current]} + ${weight} = ${newDist} km`
        );
      } else {
        steps.push(
          `  ❌ Skipped "${node}": ${dist[current]} + ${weight} = ${newDist} km (not better than ${dist[node]} km)`
        );
      }
    });
  }

  // ── Step 6: Reconstruct the path ─────────────────────────
  //
  // Walk backwards from destination using the `prev` map.
  // prev[destination] → prev[prev[destination]] → ... → source

  const path = [];
  let node = destination;

  while (node) {
    path.unshift(node); // add to front
    node = prev[node];
  }

  return {
    path,                        // e.g. ["Warehouse", "MG Road", "Whitefield"]
    distance: dist[destination], // e.g. 12
    steps,                       // algorithm log for display
  };
}


/**
 * getAllNodes(routes)
 * Returns a unique list of all node names from the routes array.
 *
 * @param {Array} routes
 * @returns {Array} unique node names
 */
export function getAllNodes(routes) {
  return [...new Set(routes.flatMap(r => [r.from, r.to]))];
}


/**
 * computeLayout(nodes, routes, W, H)
 *
 * Calculates X,Y positions for each node on a canvas.
 * Uses a FORCE-DIRECTED approach:
 *   • Nodes repel each other (like magnets with same pole)
 *   • Edges attract connected nodes (like rubber bands)
 * After many iterations, nodes settle into a readable layout.
 *
 * @param {Array}  nodes  - list of node names
 * @param {Array}  routes - list of { from, to, distance }
 * @param {number} W      - canvas width
 * @param {number} H      - canvas height
 * @returns {Object} positions: { nodeName: { x, y }, ... }
 */
export function computeLayout(nodes, routes, W, H) {
  if (!nodes.length) return {};

  const pos = {};
  const n   = nodes.length;
  const cx  = W / 2; // center X
  const cy  = H / 2; // center Y
  const rad = Math.min(W, H) * 0.32; // initial circle radius

  // Place nodes evenly around a circle to start
  nodes.forEach((nd, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    pos[nd] = {
      x: cx + rad * Math.cos(angle),
      y: cy + rad * Math.sin(angle),
    };
  });

  // Run 90 force-simulation iterations
  for (let iter = 0; iter < 90; iter++) {
    const forces = {};
    nodes.forEach(nd => forces[nd] = { x: 0, y: 0 });

    // REPULSION: every pair of nodes pushes each other away
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const A  = nodes[a], B = nodes[b];
        const dx = pos[A].x - pos[B].x;
        const dy = pos[A].y - pos[B].y;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        const fv = 3500 / (d * d); // repulsion force

        forces[A].x += fv * dx / d;
        forces[A].y += fv * dy / d;
        forces[B].x -= fv * dx / d;
        forces[B].y -= fv * dy / d;
      }
    }

    // ATTRACTION: connected nodes pull toward each other
    routes.forEach(r => {
      const A = r.from, B = r.to;
      if (!pos[A] || !pos[B]) return;
      const dx    = pos[B].x - pos[A].x;
      const dy    = pos[B].y - pos[A].y;
      const d     = Math.sqrt(dx * dx + dy * dy) || 1;
      const ideal = Math.min(W, H) * 0.36; // ideal edge length
      const fv    = 0.04 * (d - ideal);    // spring force

      forces[A].x += fv * dx / d;
      forces[A].y += fv * dy / d;
      forces[B].x -= fv * dx / d;
      forces[B].y -= fv * dy / d;
    });

    // Apply forces (clamped to canvas bounds)
    nodes.forEach(nd => {
      pos[nd].x = Math.max(60, Math.min(W - 60, pos[nd].x + forces[nd].x * 0.1));
      pos[nd].y = Math.max(45, Math.min(H - 45, pos[nd].y + forces[nd].y * 0.1));
    });
  }

  return pos;
}