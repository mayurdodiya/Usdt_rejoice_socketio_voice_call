const mongoose = require("mongoose");

const currencySchema = mongoose.Schema(
  {
    currencyName: {
      type: String,
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
    logo: {
      type: String,
      trim: true,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtual populate (CurrencyRate → Currency)
currencySchema.virtual("currencyRates", {
  ref: "currencyRates",
  localField: "_id",
  foreignField: "currencyId",
});

const Currency = mongoose.model("currencies", currencySchema);

module.exports = Currency;
