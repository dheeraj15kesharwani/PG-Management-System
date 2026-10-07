const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PG",
      required: true,
    },

    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      default: null,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    monthlyRent: {
      type: Number,
      required: true,
      min: 0,
    },

    advanceAmount: {
      type: Number,
      default: 3000,
    },

    refundableAmount: {
      type: Number,
      default: 1500,
    },

    maintenanceDeduction: {
      type: Number,
      default: 1500,
    },

    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      relation: {
        type: String,
        trim: true,
      },
    },

    noticeDate: {
      type: Date,
      default: null,
    },

    checkoutDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "notice", "checked_out"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;