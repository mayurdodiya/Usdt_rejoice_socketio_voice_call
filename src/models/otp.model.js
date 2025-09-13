const mongoose = require("mongoose");
const validator = require("validator");

const otpSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    hasVerifiedOtp: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      trim: true,
      default: null,
    },
    expiryTime: {
      type: Date,
      default: null,
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
/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
otpSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};


const Otp = mongoose.model("otps", otpSchema);
module.exports = Otp;
