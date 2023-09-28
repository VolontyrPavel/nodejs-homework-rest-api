const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");

const { User } = require("../models/users");
const { HttpError } = require("../utils");
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

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
  });

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

module.exports = {
  register,
  login,
  logout,
  current,
  updateAvatar,
};
