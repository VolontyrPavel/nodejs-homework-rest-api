const Joi = require("joi");

const addUserValidationSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = {
  addUserValidationSchema,
};
