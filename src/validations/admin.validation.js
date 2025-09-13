const Joi = require("joi");
const { CURRENCY_RATE_TYPE } = require("../utils/constant");

// Create agent
const createAgent = {
  body: Joi.object().keys({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().trim().email().required(),
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
    // confirmPassword: Joi.string().trim().required().valid(Joi.ref("password")).min(6),
    countryCode: Joi.string().trim().optional(),
    phone: Joi.string().trim().optional(),
  }),
};

// Update agent
const updateAgent = {
  body: Joi.object().keys({
    firstName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    email: Joi.string().trim().email().optional(),
    countryCode: Joi.string().trim().optional(),
    phone: Joi.string().trim().optional(),
  }),
};

// getAgentList
const getAgentList = {
  query: Joi.object().keys({
    search: Joi.string().trim().optional().allow("", null),
    page: Joi.number().optional(),
    size: Joi.number().optional(),
    status: Joi.string().valid("true", "false").optional(),
  }),
};

// get user list
const getUserList = {
  query: Joi.object().keys({
    search: Joi.string().trim().optional().allow("", null),
    page: Joi.number().optional(),
    size: Joi.number().optional(),
    status: Joi.string().valid("true", "false").optional(),
  }),
};

// currency module
// create currency
const createCurrency = {
  body: Joi.object().keys({
    currencyName: Joi.string().trim().required(),
    logo: Joi.string().trim().optional(),
    buyRate: Joi.number().required(),
    sellRate: Joi.number().required(),
  }),
};

// getMyCurrencyList
const getMyCurrencyList = {
  query: Joi.object().keys({
    search: Joi.string().trim().optional().allow("", null),
    page: Joi.number().optional(),
    size: Joi.number().optional(),
  }),
};

// update currency
const updateCurrency = {
  body: Joi.object().keys({
    currencyName: Joi.string().trim().optional(),
    logo: Joi.string().trim().optional(),
    buyRate: Joi.number().optional(),
    sellRate: Joi.number().optional(),
  })
};

const listAgentsWithCurrencyRates = {
  query: Joi.object().keys({
    type: Joi.string().valid(CURRENCY_RATE_TYPE.BUY_RATE, CURRENCY_RATE_TYPE.SELL_RATE).required(),
    page: Joi.number().optional(),
    size: Joi.number().optional(),
    search: Joi.string().trim().optional().allow("", null),
  }),
};

// All auth validations are exported from here
module.exports = {
  createAgent,
  updateAgent,
  getAgentList,
  getUserList,
  createCurrency,
  getMyCurrencyList,
  updateCurrency,
  listAgentsWithCurrencyRates,
};
