const { ROLE } = require("../utils/constant");
const { CurrencyModel } = require("../models");

// Currency seeder
const currencySeeder = async () => {
  try {
    const currencyExist = await CurrencyModel.findOne({ currencyName: process.env.SINGLE_CURRENCY }); // Get Currency by name.

    if (!currencyExist) {
      await CurrencyModel.create({
        currencyName: process.env.SINGLE_CURRENCY,
        buyRate: process.env.CURRENCY_BUY_RATE,
        sellRate: process.env.CURRENCY_SELL_RATE,
        logo: "",
        isActive: true,
      });
    }

    console.log("✅ Currency seeder run successfully...");
  } catch (error) {
    console.log("❌ Error from currency seeder :", error);
  }
};

module.exports = currencySeeder;
