const Joi = require("joi");
const { search } = require("../routes");
const { CURRENCY_RATE_TYPE } = require("../utils/constant");

// Login.
const login = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required(),
    password: Joi.string().trim().required().min(6),
  }),
};

// Update agent
const updateProfile = {
  body: Joi.object().keys({
    firstName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    password: Joi.string()
      .trim()
      .optional()
      .min(6)
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/)
      .messages({
        "string.pattern.base": "Password must contain at least one letter and one number.",
        "string.min": "Password must be at least 6 characters long.",
      }),
    confirmPassword: Joi.string().trim().min(6).valid(Joi.ref("password")).when("password", {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

    countryCode: Joi.string().trim().optional(),
    phone: Joi.string().trim().optional(),
    profilePicture: Joi.string().trim().optional(),
  }),
};

// addCurrencyRate
const addCurrencyRate = {
  params: Joi.object().keys({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "id must be a valid MongoDB ObjectId.",
        "any.required": "id is required.",
      }),
  }),
  body: Joi.object().keys({
    buyRate: Joi.number().required(),
    sellRate: Joi.number().required(),
  }),
};

// updateCurrencyRate
const updateCurrencyRate = {
  params: Joi.object().keys({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "id must be a valid MongoDB ObjectId.",
        "any.required": "id is required.",
      }),
  }),
  body: Joi.object().keys({
    buyRate: Joi.number().optional(),
    sellRate: Joi.number().optional(),
  }),
};

// getMyCurrencyRates
const getMyCurrencyRates = {
  query: Joi.object().keys({
    search: Joi.string().trim().optional().allow("", null),
    page: Joi.number().optional(),
    size: Joi.number().optional(),
  }),
};

const listAgentsWithCurrencyRates = {
  query: Joi.object().keys({
    type: Joi.string().valid(CURRENCY_RATE_TYPE.BUY_RATE, CURRENCY_RATE_TYPE.SELL_RATE).required(),
    page: Joi.number().optional(),
    size: Joi.number().optional(),
    search: Joi.string().trim().optional().allow("", null),
  }),
};

// all auth validations are exported from here
module.exports = {
  login,
  updateProfile,
  addCurrencyRate,
  updateCurrencyRate,
  getMyCurrencyRates,
  listAgentsWithCurrencyRates,
};
