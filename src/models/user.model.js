const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { ROLE } = require("../utils/constant");
const { generateUniqId, generateUniqueName } = require("../utils/utils");
const { faker } = require("@faker-js/faker");

const userSchema = mongoose.Schema(
  {
    role: {
      type: String,
      enum: [ROLE.USER, ROLE.ADMIN, ROLE.AGENT],
      default: ROLE.USER,
    },
    firstName: {
      type: String,
      trim: true,
      default: null,
    },
    lastName: {
      type: String,
      trim: true,
      default: null,
    },
    uniqName: {
      type: String,
      unique: true,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    profilePicture: {
      type: String,
      trim: true,
      default: "",
    },
    countryCode: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      trim: true,
      minlength: 6,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error("Password must contain at least one letter and one number");
        }
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hasActiveVoiceCall: {
      type: Boolean,
      default: false,
    },
    fcmToken: { type: String, default: "" },
    socketId: { type: String, default: null },
    onlineStatus: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },

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

// virtual key
userSchema.virtual("otps", {
  ref: "otps",
  localField: "_id",
  foreignField: "userId",
});

// Virtual populate (CurrencyRate → user)
userSchema.virtual("currencyRates", {
  ref: "currencyRates",
  localField: "_id",
  foreignField: "userId",
});

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});


/**
 * @typedef User
 */
const User = mongoose.model("users", userSchema);

module.exports = User;


// userSchema.getIndexes();