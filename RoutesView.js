// ─────────────────────────────────────────────────────────────
//  RoutesView.jsx  —  View Routes Page Component
//
//  WHAT THIS DOES:
//    Displays all saved routes in a table.
//    Allows the user to Edit or Delete any route.
//
//  PROPS RECEIVED:
//    • routes    → the current routes array from App
//    • setRoutes → function to update routes in App
//
//  CONCEPTS USED:
//    • Array.filter() → delete a route by removing it from array
//    • Array.map()    → edit a route by replacing one item
//    • Conditional rendering → show empty state if no routes
// ─────────────────────────────────────────────────────────────

import React from "react";

function RoutesView({ routes, setRoutes }) {

  // ── Delete a route by ID ───────────────────────────────
  async function deleteRoute(id) {
    try {

      // Delete route from database
      await fetch(`http://localhost:5000/api/routes/${id}`, {
        method: "DELETE",
      });

      // Fetch updated routes
      const res = await fetch("http://localhost:5000/api/routes");
      const data = await res.json();

      // Update frontend state
      setRoutes(data.routes);

    } catch (err) {
      console.error("Delete Error:", err);
    }
  }

  // ── Edit a route ───────────────────────────────────────
  async function editRoute(id) {

    // Find current route
    const current = routes.find(r => r._id === id);

    // Prompt user for updated values
    const newFrom = prompt("Enter new FROM node:", current.from);
    if (!newFrom) return;

    const newTo = prompt("Enter new TO node:", current.to);
    if (!newTo) return;

    const newDist = prompt(
      "Enter new DISTANCE (km):",
      current.distance
    );

    if (!newDist) return;

    try {

      // Send PUT request to backend
      const res = await fetch(
        `http://localhost:5000/api/routes/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: newFrom.trim(),
            to: newTo.trim(),
            distance: Number(newDist),
          }),
        }
      );

      const data = await res.json();

      // Update frontend state
      if (data.success) {

        setRoutes(
          routes.map(r =>
            r._id === id ? data.route : r
          )
        );

        alert("✅ Route updated successfully!");

      } else {
        alert("❌ Failed to update route");
      }

    } catch (err) {
      console.error("Edit Error:", err);
    }
  }

  // ── Clear all routes ──────────────────────────────────
  async function clearAll() {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete ALL routes?"
    );

    if (!confirmDelete) return;

    try {

      // Delete all routes
      await fetch("http://localhost:5000/api/routes", {
        method: "DELETE",
      });

      // Clear frontend
      setRoutes([]);

      alert("🗑 All routes deleted!");

    } catch (err) {
      console.error("Clear All Error:", err);
    }
  }

  // ── Render UI ─────────────────────────────────────────
  return (
    <div className="page">

      {/* Page Heading */}
      <h2 className="page-title">📋 Routes</h2>

      <p className="page-sub">
        Manage your saved delivery connections.
        Edit or delete individual routes.
      </p>

      <div className="card">

        {/* Top Bar */}
        <div className="table-header">

          <span className="badge badge-yellow">
            {routes.length} route(s)
          </span>

          <button
            className="btn btn-danger"
            onClick={clearAll}
          >
            🗑 Clear All
          </button>

        </div>

        {/* Empty State */}
        {routes.length === 0 ? (

          <p className="empty-msg">
            No routes yet.
            Go to <strong>Add Route</strong> to create some.
          </p>

        ) : (

          /* Routes Table */
          <table className="routes-table">

            <thead>
              <tr>
                <th>#</th>
                <th>From</th>
                <th>To</th>
                <th>Distance</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {routes.map((r, index) => (

                <tr key={r._id || index}>

                  {/* Route Number */}
                  <td>
                    <span className="badge badge-yellow">
                      {index + 1}
                    </span>
                  </td>

                  {/* From */}
                  <td>{r.from}</td>

                  {/* To */}
                  <td>{r.to}</td>

                  {/* Distance */}
                  <td>
                    <span className="badge badge-green">
                      {r.distance} km
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="action-cell">

                    {/* Edit Button */}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => editRoute(r._id)}
                    >
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteRoute(r._id)}
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>
    </div>
  );
}

export default RoutesView;