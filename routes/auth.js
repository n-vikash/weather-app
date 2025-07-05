const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/mailer");
const { sendResetEmail } = require("../utils/mailer");
// ✅ Render Pages
router.get("/signup", (req, res) => res.render("signup", { error: null }));
router.get("/signin", (req, res) => res.render("signin", { error: null }));
router.get("/forgot", (req, res) => {
  res.render("forgot", { message: null, error: null }); 
});
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.render("logout"));
});

// ✅ POST: Signup with email verification
router.post("/signup", async (req, res) => {
  const { username, email, phone, password, gender } = req.body;

  if (!username || !email || !phone || !password || !gender) {
    return res.render("signup", { error: "Please fill in all fields." });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.render("signup", { error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      username,
      email,
      phone,
      gender,
      password: hashedPassword,
      verified: false,
      verifyToken
    });

    await newUser.save();
    await sendVerificationEmail(email, verifyToken); // 📧 send link

    res.render("success", {
      name: username,
      message: "Signup successful! Please check your email to verify your account."
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.render("error", { error: "Signup failed. Try again." });
  }
});

// ✅ GET: Email verification handler
router.get("/verify-email", async (req, res) => {
  const token = req.query.token;

  try {
    const user = await User.findOne({ verifyToken: token });
    if (!user) {
      return res.render("error", { error: "Invalid or expired verification link." });
    }

    // ✅ Set verified flag and clear the token
    user.verified = true;
    user.verifyToken = undefined;
    await user.save();

    res.render("success", {
      name: user.username,
      message: "✅ Email verified successfully! You can now log in."
    });

  } catch (err) {
    console.error("❌ Email Verification Error:", err);
    res.render("error", { error: "Email verification failed. Try again later." });
  }
});

// ✅ POST: Signin
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("signin", { error: "Invalid credentials." });
    }

    if (!user.verified) {
      return res.render("signin", { error: "Please verify your email before signing in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("signin", { error: "Invalid credentials." });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender
    };

    res.redirect("/auth/dashboard");

  } catch (err) {
    console.error("Signin Error:", err);
    res.render("signin", { error: "Something went wrong during sign-in." });
  }
});


router.post("/forgot", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("forgot", { error: "Email not found", message: null });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendResetEmail(email, token); // 📬 Sends reset link via email
    res.render("forgot", { message: "✅ Reset link sent to your email", error: null });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.render("forgot", { message: null, error: "Something went wrong. Try again." });
  }
});


// ✅ GET: Reset Password Form
router.get("/reset-password", async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render("error", { error: "❌ Invalid or expired reset link." });
    }

    res.render("reset-password", { token, error: null });
  } catch (err) {
    console.error("Reset Password GET Error:", err);
    res.render("error", { error: "❌ Could not load reset page." });
  }
});

// ✅ POST: Save New Password
router.post("/reset-password", async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.render("reset-password", { token, error: "Please fill both password fields." });
  }

  if (password !== confirmPassword) {
    return res.render("reset-password", { token, error: "Passwords do not match." });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render("error", { error: "❌ Reset link expired or invalid." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.render("success", {
      name: user.username,
      message: "✅ Password reset successfully! You can now sign in."
    });

  } catch (err) {
    console.error("Reset Password POST Error:", err);
    res.render("error", { error: "❌ Failed to reset password. Try again." });
  }
});

module.exports = router;
