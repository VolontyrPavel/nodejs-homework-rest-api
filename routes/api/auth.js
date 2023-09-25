const express = require("express");

const ctrl = require("../../controllers/auth");

const { validateBody, authenticate } = require("../../middlewares");

const {
  addUserSchema,
} = require("../../utils/validation/userValidationSchema");

const router = express.Router();

router.post("/register", validateBody(addUserSchema), ctrl.register);

router.post("/login", validateBody(addUserSchema), ctrl.login);

router.post("/logout", authenticate, ctrl.logout);

router.get("/current", authenticate, ctrl.current);

module.exports = router;
