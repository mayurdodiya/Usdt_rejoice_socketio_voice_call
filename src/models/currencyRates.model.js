const mongoose = require("mongoose");

const currencyRateSchema = mongoose.Schema(
  {
    currencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "currencies",
      trim: true,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      trim: true,
      default: null,
    },
    buyRate: {
      type: Number,
      default: null,
    },
    sellRate: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const CurrencyRate = mongoose.model("currencyRates", currencyRateSchema);
module.exports = CurrencyRate;
