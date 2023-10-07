const nodemailer = require("nodemailer");

require("dotenv").config();

const sendEmail = async (data) => {
  const config = {
    host: "smtp.meta.ua",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD_EMAIL,
    },
  };

  const transporter = nodemailer.createTransport(config);

  const emailOptions = {
    ...data,
    from: process.env.EMAIL,
  };

  await transporter
    .sendMail(emailOptions)
    .then(res.status(200).json({ message: "Verification successful" }))
    .catch(new HttpError(404, "User not found"));
};

module.exports = sendEmail;
