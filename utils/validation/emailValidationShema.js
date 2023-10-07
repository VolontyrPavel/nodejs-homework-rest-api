const Joi = require("joi");

const emailValidationShema = Joi.object({
    email: Joi.string().required(),
})

module.exports = {
    emailValidationShema,
  };