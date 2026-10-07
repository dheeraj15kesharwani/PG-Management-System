const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PG",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Block = mongoose.model("Block", blockSchema);

module.exports = Block;