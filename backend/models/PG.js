const mongoose = require("mongoose");

const pgSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["boys", "girls", "co-ed"],
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    totalBeds: {
      type: Number,
      default: 0,
    },

    totalRooms: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PG = mongoose.model("PG", pgSchema);

module.exports = PG;