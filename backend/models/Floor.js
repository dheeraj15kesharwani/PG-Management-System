const mongoose = require("mongoose");

const floorSchema = new mongoose.Schema(
  {
    floorNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Block",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Floor = mongoose.model("Floor", floorSchema);

module.exports = Floor;