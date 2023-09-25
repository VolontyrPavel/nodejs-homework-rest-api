const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models/users");
const { HttpError } = require("../utils");
const controllerWrapper = require("../utils/controllerWrapper");

const register = controllerWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ ...req.body, password: hashPassword });

  res.status(201).json({
    email: newUser.email,
    name: newUser.name,
  });
});

const login = controllerWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid");
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
    throw HttpError(401, "Not authorized");
  }

  res.status(204).json({ message: "No Content" });
});

const current = controllerWrapper(async (req, res, next) => {
  const { email, name } = req.user;

  if (!email || !name) {
    throw HttpError(401, "Not authorized");
  }

  res.json({
    email,
    name,
  });
});

module.exports = {
  register,
  login,
  logout,
  current,
};
