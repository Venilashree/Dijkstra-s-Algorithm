require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const routeRoutes = require("./routes/routeRoutes");

const app = express();

/* 🔥 IMPORTANT: use DIFFERENT port from React */
const PORT = process.env.PORT || 5000;

/* ── DB ── */
connectDB();

/* ── Middleware ── */
app.use(cors());
app.use(express.json());

/* ── API ROUTES ── */
app.use("/api/routes", routeRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running",
    time: new Date().toISOString(),
  });
});

/* ── START SERVER ── */
app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
  console.log(`📦 MongoDB connected`);
});