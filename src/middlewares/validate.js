const Joi = require("joi");
const pick = require("../utils/pick");
const apiResponse = require("../utils/api.response");

const errors = {
  errors: {
    wrap: {
      label: "",
    },
  },
};

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ["params", "query", "body"]);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(object, errors);

  if (error) {
    const errorMessage = error.details.map((details) => details.message.replace(/"/g, "")).join(", ");
    return apiResponse.NOT_FOUND({ res, message: errorMessage });
  }
  Object.assign(req, value);
  return next();
};

module.exports = validate;
