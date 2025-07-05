const nodemailer = require("nodemailer");
require("dotenv").config(); // ✅ Load env variables

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // ✅ Match your .env keys
    pass: process.env.MAIL_PASS
  }
});

async function sendVerificationEmail(to, token) {
  const verificationURL = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;


  await transporter.sendMail({
    from: `"Weather App" <${process.env.MAIL_USER}>`,
    to,
    subject: "Verify your email",
    text: `Click the link to verify your email: ${verificationURL}`,
    html: `<p>Click here to verify your email: <a href="${verificationURL}">${verificationURL}</a></p>`
  });
}
async function sendResetEmail(to, token) {
  const baseURL = process.env.RESET_PASSWORD_BASE_URL || "http://localhost:3000";
  const resetURL = `${baseURL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Weather App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: `<p>Click to reset your password: <a href="${resetURL}">${resetURL}</a></p>`
  });
}


// ✅ Export only what you need
module.exports = { sendVerificationEmail,
  sendResetEmail };

