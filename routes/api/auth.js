const express = require("express");

const ctrl = require("../../controllers/auth");

const { validateBody, authenticate, upload } = require("../../middlewares");

const {
  addUserValidationSchema,
} = require("../../utils/validation/userValidationSchema");

const {emailValidationShema} = require("../../utils/validation/emailValidationShema.js")

const router = express.Router();

router.post("/register", validateBody(addUserValidationSchema), ctrl.register);

router.post("/login", validateBody(addUserValidationSchema), ctrl.login);

router.post("/logout", authenticate, ctrl.logout);

router.get("/current", authenticate, ctrl.current);

router.patch("/avatars", authenticate, upload.single("avatar"), ctrl.updateAvatar);

router.get("/verify/:verificationToken", ctrl.verifyEmail);

router.post("/verify/", validateBody(emailValidationShema), ctrl.resendVerifyEmail);

module.exports = router;
