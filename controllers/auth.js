const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const { User } = require("../models/users");
const { HttpError, sendEmail } = require("../utils");
const controllerWrapper = require("../utils/controllerWrapper");
const { promises } = require("dns");

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = controllerWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw new HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const avatarURL = gravatar.url(email);

  const verificationCode = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationCode,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationCode}">Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    email: newUser.email,
    name: newUser.name,
  });
});

const login = controllerWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new HttpError(401, "Email or password is wrong");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw new HttpError(401, "Email or password invalid");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
  });
});

const logout = controllerWrapper(async (req, res, next) => {
  const { _id } = req.user;
  const user = await User.findByIdAndUpdate(_id, { token: "" });

  if (!user) {
    throw new HttpError(401, "Not authorized");
  }

  res.status(204).json({ message: "No Content" });
});

const current = controllerWrapper(async (req, res, next) => {
  const { email, name } = req.user;

  if (!email || !name) {
    throw new HttpError(401, "Not authorized");
  }

  res.json({
    email,
    name,
  });
});

const updateAvatar = controllerWrapper(async (req, res, next) => {
  const { _id } = req.user;
  const { path: tempUpLoad, originalname } = req.file;
  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);

  Jimp.read(filename, (err, avatar) => {
    if (err) throw err;
    avatar.resize(250, 250);
  });

  await fs.rename(tempUpLoad, resultUpload);

  const avatarURL = path.join("avatars", filename);

  Jimp.read(avatarURL)
    .then((avatar) => {
      avatar.resize(250, 250);
    })
    .catch((err) => {
      return err.message;
    });

  const user = await User.findByIdAndUpdate(_id, { avatarURL });

  if (!user) {
    throw new HttpError(401, "Not authorized");
  }

  res.json({
    avatarURL: `${avatarURL}`,
  });
});

const verifyEmail = controllerWrapper(async (req, res, next) => {
  const { veryficationCode } = req.params;
  const user = await User.findOne({ veryficationCode });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationCode: "",
  });
  res.json({
    message: "Verification successful",
  });
});

const resendVerifyEmail = controllerWrapper(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(400, "missing required field email");
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationCode}">Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(200).json({ message: "Verification email sent" })
});

module.exports = {
  register,
  login,
  logout,
  current,
  updateAvatar,
  verifyEmail,
  resendVerifyEmail,
};
