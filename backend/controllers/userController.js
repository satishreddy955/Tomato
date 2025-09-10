import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import otpModel from "../models/otpModel.js";
import nodemailer from "nodemailer";

// Create JWT token
const createToken = (id) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// ------------------ AUTH ------------------

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = createToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// Register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await userModel.findOne({ email });
    if (exists) return res.json({ success: false, message: "User already exists" });

    if (!validator.isEmail(email)) return res.json({ success: false, message: "Invalid email" });
    if (password.length < 8) return res.json({ success: false, message: "Password must be 8+ chars" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword });
    const user = await newUser.save();

    const token = createToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// ------------------ PASSWORD RESET ------------------

// Step 1: Send OTP
const sendResetOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Save OTP in DB (expires in 5 minutes)
    await otpModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Food App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error sending OTP" });
  }
};

// Step 2: Verify OTP & Reset Password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const record = await otpModel.findOne({ email, otp });
    if (!record) return res.json({ success: false, message: "Invalid or expired OTP" });

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Delete OTP after successful reset
    await otpModel.deleteMany({ email });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error resetting password" });
  }
};

export { loginUser, registerUser, sendResetOTP, resetPassword };
