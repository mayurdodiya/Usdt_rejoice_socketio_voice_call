const { ROLE } = require("../utils/constant");
const { UserModel } = require("../models");

// Admin seeder
const adminSeeder = async () => {
  try {
    const adminExist = await UserModel.findOne({ email: process.env.ADMIN_EMAIL }); // Get Admin by email.

    if (!adminExist) {
      await UserModel.create({
        role: ROLE.ADMIN,
        firstName: process.env.ADMIN_NAME,
        lastName: "user",
        email: process.env.ADMIN_EMAIL,
        countryCode: process.env.ADMIN_COUNTRY_CODE,
        phone: process.env.ADMIN_PHONE,
        password: process.env.ADMIN_PASSWORD,
      });
    }

    console.log("✅ Admin seeder run successfully...");
  } catch (error) {
    console.log("❌ Error from admin seeder :", error);
  }
};

module.exports = adminSeeder;
