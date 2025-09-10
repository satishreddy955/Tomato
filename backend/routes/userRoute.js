import express from 'express';
import { loginUser, registerUser, sendResetOTP, resetPassword } from '../controllers/userController.js';

const userRouter = express.Router();

// Auth endpoints
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Forgot password / OTP
userRouter.post("/send-otp", sendResetOTP);
userRouter.post("/reset-password", resetPassword);

export default userRouter;
