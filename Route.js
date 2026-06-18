const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: [true, "Source node is required"],
      trim: true,
    },
    to: {
      type: String,
      required: [true, "Destination node is required"],
      trim: true,
    },
    distance: {
      type: Number,
      required: [true, "Distance is required"],
      min: [0.1, "Distance must be greater than 0"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Route", routeSchema);