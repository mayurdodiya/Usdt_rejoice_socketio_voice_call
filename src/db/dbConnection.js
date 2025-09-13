const mongoose = require("mongoose");
const User = require("../models/user.model");

module.exports = connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      autoIndex: true,
      useUnifiedTopology: true,
    });

    // const result = await User.collection.dropIndexes();
    // console.log("Indexes dropped:", result);

    console.log("✅ Database Connected successfully...");
  } catch (error) {
    console.log("❌ Database Connections Error :", error);
  }
};
