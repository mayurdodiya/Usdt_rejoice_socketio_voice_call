const Joi = require("joi");

const validateSocket = (schema) => (data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    errors: { label: "key" },
  });

  if (error) {
    return {
      success: false,
      errors: error.details.map((d) => d.message.replace(/"/g, "")),
    };
  }

  return { success: true, value };
};

module.exports = validateSocket;
