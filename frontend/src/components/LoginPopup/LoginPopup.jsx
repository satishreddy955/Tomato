import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken, setUser } = useContext(StoreContext);
  const [currState, setCurrState] = useState("Sign Up"); // "Sign Up" | "Login" | "ForgotPassword"
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Forgot Password states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const navigate = useNavigate();

  const onChangehandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------- AUTH HANDLER ----------------
  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;

    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    try {
      const response = await axios.post(newUrl, data);
      if (response.data.success) {
        const { token, user } = response.data;

        // ✅ Save token
        setToken(token);
        localStorage.setItem("token", token);

        // ✅ Save user details
        if (user) {
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
        } else {
          const fallbackUser = { name: data.name || "User", email: data.email };
          setUser(fallbackUser);
          localStorage.setItem("user", JSON.stringify(fallbackUser));
        }

        setShowLogin(false);
        navigate("/home");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong, please try again.");
    }
  };

  // ---------------- FORGOT PASSWORD HANDLERS ----------------

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${url}/api/user/send-otp`, {
        email: data.email,
      });
      if (res.data.success) {
        alert("OTP sent to your email!");
        setOtpSent(true);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error sending OTP");
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${url}/api/user/reset-password`, {
        email: data.email,
        otp,
        newPassword,
      });
      if (res.data.success) {
        alert("Password reset successful! Please login.");
        setCurrState("Login");
        setOtp("");
        setNewPassword("");
        setOtpSent(false);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error resetting password");
    }
  };

  return (
    <div className="login-popup">
      <form
        onSubmit={
          currState === "ForgotPassword"
            ? otpSent
              ? handleResetPassword
              : handleSendOtp
            : onLogin
        }
        className="login-popup-container"
      >
        <div className="login-popup-title">
          <h2>
            {currState === "ForgotPassword"
              ? "Forgot Password"
              : currState}
          </h2>
          <img
            src={assets.cross_icon}
            onClick={() => setShowLogin(false)}
            alt="close"
          />
        </div>

        <div className="login-popup-inputs">
          {currState === "Sign Up" && (
            <input
              name="name"
              onChange={onChangehandler}
              value={data.name}
              type="text"
              placeholder="Your Name"
              required
            />
          )}

          {(currState === "Login" ||
            currState === "Sign Up" ||
            currState === "ForgotPassword") && (
            <input
              type="email"
              placeholder="Your Email"
              required
              name="email"
              onChange={onChangehandler}
              value={data.email}
            />
          )}

          {currState === "Sign Up" || currState === "Login" ? (
            <input
              type="password"
              placeholder="Password"
              required
              name="password"
              onChange={onChangehandler}
              value={data.password}
            />
          ) : null}

          {/* Forgot Password extra fields */}
          {currState === "ForgotPassword" && otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </>
          )}
        </div>

        <button type="submit">
          {currState === "Sign Up"
            ? "Create Account"
            : currState === "Login"
            ? "Login"
            : otpSent
            ? "Reset Password"
            : "Send OTP"}
        </button>

        {currState !== "ForgotPassword" && (
          <div className="login-popup-condition">
            <input type="checkbox" required />
            <p>
              By continuing, I agree to the terms of use & privacy policy.
            </p>
          </div>
        )}

        {/* Switch links */}
        {currState === "Login" ? (
          <p>
            Don’t have an account?{" "}
            <span onClick={() => setCurrState("Sign Up")}>Sign up here</span>
            <br />
            <span
              style={{ color: "blue", cursor: "pointer" }}
              onClick={() => setCurrState("ForgotPassword")}
            >
              Forgot Password?
            </span>
          </p>
        ) : currState === "Sign Up" ? (
          <p>
            Already registered?{" "}
            <span onClick={() => setCurrState("Login")}>Login here</span>
          </p>
        ) : (
          <p>
            Back to{" "}
            <span onClick={() => setCurrState("Login")}>Login</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
