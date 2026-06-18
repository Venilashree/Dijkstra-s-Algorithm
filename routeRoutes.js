const express = require("express");
const router = express.Router();
const Route = require("../models/Route");

/* ─────────────────────────────────────────────
  DIJKSTRA (UNCHANGED - YOUR LOGIC IS GOOD)
───────────────────────────────────────────── */
function dijkstra(routes, source, destination) {
  const graph = {};

  routes.forEach(({ from, to, distance }) => {
    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];

    graph[from].push({ node: to, weight: distance });
    graph[to].push({ node: from, weight: distance });
  });

  const nodes = [...new Set(routes.flatMap(r => [r.from, r.to]))];
  const dist = {};
  const prev = {};
  const visited = new Set();
  const steps = [];

  nodes.forEach(n => {
    dist[n] = Infinity;
    prev[n] = null;
  });

  dist[source] = 0;

  while (true) {
    let current = null;
    let min = Infinity;

    nodes.forEach(n => {
      if (!visited.has(n) && dist[n] < min) {
        min = dist[n];
        current = n;
      }
    });

    if (!current || current === destination) break;

    visited.add(current);
    steps.push(`Visiting "${current}" — cost: ${dist[current]} km`);

    (graph[current] || []).forEach(({ node, weight }) => {
      const nd = dist[current] + weight;

      if (nd < dist[node]) {
        dist[node] = nd;
        prev[node] = current;
        steps.push(`✅ Updated "${node}" → ${nd}`);
      } else {
        steps.push(`❌ Skipped "${node}"`);
      }
    });
  }

  const path = [];
  let node = destination;

  while (node) {
    path.unshift(node);
    node = prev[node];
  }

  return {
    path,
    distance: dist[destination],
    steps,
  };
}

/* ───────────────────────── GET ALL ROUTES ───────────────────────── */
/* ───────────────────────── GET ALL ROUTES ───────────────────────── */
router.get("/", async (req, res) => {
  console.log("🔥 HIT GET /api/routes"); // 👈 ADD THIS HERE

  try {
    const routes = await Route.find().sort({ createdAt: 1 });

    console.log("📦 DB ROUTES SENT:", routes);

    res.json({
      success: true,
      count: routes.length,
      routes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
/* ───────────────────────── POST ROUTES (FIXED) ───────────────────── */
router.post("/", async (req, res) => {
  try {
    console.log("🔥 POST BODY RECEIVED:", req.body); // 👈 ADD THIS LINE HERE

    let routes = req.body.routes;

    if (!Array.isArray(routes)) {
      routes = [req.body];
    }

    const saved = await Route.insertMany(routes);

    console.log("✅ SAVED TO DB:", saved); // 👈 optional but very useful

    res.status(201).json({
      success: true,
      count: saved.length,
      routes: saved,
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ───────────────────────── UPDATE ───────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const { from, to, distance } = req.body;

    const updated = await Route.findByIdAndUpdate(
      req.params.id,
      { from, to, distance },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      route: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ───────────────────────── DELETE ONE ───────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Route.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ───────────────────────── CLEAR ALL ───────────────────────── */
router.delete("/", async (req, res) => {
  try {
    const result = await Route.deleteMany({});

    res.json({
      success: true,
      message: `${result.deletedCount} routes deleted`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ───────────────────────── NODES ───────────────────────── */
router.get("/nodes", async (req, res) => {
  try {
    const routes = await Route.find({}, "from to");
    const nodes = [...new Set(routes.flatMap(r => [r.from, r.to]))];

    res.json({
      success: true,
      nodes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ───────────────────────── STATS ───────────────────────── */
router.get("/stats", async (req, res) => {
  try {
    const routes = await Route.find();

    const nodes = [...new Set(routes.flatMap(r => [r.from, r.to]))];

    const totalDistance = routes.reduce(
      (sum, r) => sum + r.distance,
      0
    );

    res.json({
      success: true,
      stats: {
        totalRoutes: routes.length,
        totalNodes: nodes.length,
        totalDistance,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ───────────────────────── SHORTEST PATH ───────────────────────── */
router.post("/shortest-path", async (req, res) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: "Source and destination required",
      });
    }

    const routes = await Route.find();
    const nodes = [...new Set(routes.flatMap(r => [r.from, r.to]))];

    if (!nodes.includes(source) || !nodes.includes(destination)) {
      return res.status(404).json({
        success: false,
        message: "Invalid nodes",
      });
    }

    const result = dijkstra(routes, source, destination);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;