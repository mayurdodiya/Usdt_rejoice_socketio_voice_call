const Joi = require("joi");
const { ROLE } = require("../utils/constant");

// Login.
const login = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required(),
    password: Joi.string().trim().required(),
    role: Joi.string().valid(ROLE.ADMIN, ROLE.USER, ROLE.AGENT).required(),
    fcmToken: Joi.string().optional(),
  }),
};

const signup = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    countryCode: Joi.string().optional(),
    phone: Joi.string().optional(),
    password: Joi.string()
      .trim()
      .required()
      .min(6)
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/)
      .messages({
        "string.pattern.base": "Password must contain at least one letter and one number.",
        "string.min": "Password must be at least 6 characters long.",
        "any.required": "Password is required.",
      }),
    confirmPassword: Joi.string().trim().required().valid(Joi.ref("password")).messages({
      "any.required": "Confirm Password is required.",
      "any.only": "Confirm Password must match Password.",
    }),
    fcmToken: Joi.string().optional(),
  }),
};

// Send OTP.
const sendOtp = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required(),
  }),
};

// Verify OTP.
const verifyOtp = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required(),
    otp: Joi.string().required(),
  }),
};

// Forgot password.
const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().trim().required(),
  }),
};

// Change password.
const changePassword = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required(),
    newPassword: Joi.string()
      .trim()
      .required()
      .min(6)
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/)
      .messages({
        "string.pattern.base": "Password must contain at least one letter and one number.",
        "string.min": "Password must be at least 6 characters long.",
        "any.required": "Password is required.",
      }),
    confirmPassword: Joi.string().trim().required().valid(Joi.ref("newPassword")).min(6),
  }),
};

// All auth validations are exported from here
module.exports = {
  login,
  signup,
  sendOtp,
  verifyOtp,
  forgotPassword,
  changePassword,
};
