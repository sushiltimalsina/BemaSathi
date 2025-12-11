import React, { useState } from "react";
import API from "../api/api";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestToken = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your account email to request a reset token.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/password/forgot", { email: email.trim() });
      const tok = res.data?.reset_token;
      setToken(tok || token);
      setMessage(
        tok
          ? `Reset token generated: ${tok}`
          : "Reset link sent if the email exists."
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to generate reset token.";
      setError(msg);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setError("");
    setMessage("");
    if (!email.trim() || !token.trim() || !password) {
      setError("Email, token, and new password are required.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await API.post("/password/reset", {
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirm,
      });
      setMessage("Password reset successful. You can now log in.");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Reset failed. Check token/email.";
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-5
        bg-background-light dark:bg-background-dark
        text-text-light dark:text-text-dark
        transition-colors
      "
    >
      <div
        className="
          w-full max-w-md rounded-2xl p-8 shadow-lg
          bg-card-light dark:bg-card-dark
          border border-border-light dark:border-border-dark
          transition-all
        "
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm opacity-70 mt-1">
            Request OTP and set a new password.
          </p>
        </div>

        {message && (
          <p className="text-green-600 dark:text-green-400 text-sm text-center mb-3">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm text-center mb-3">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold opacity-80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full mt-1 px-3 py-2 rounded-lg text-sm
                bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark
                text-text-light dark:text-text-dark
                focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
              "
              placeholder="Your account email"
            />
            <button
              type="button"
              onClick={requestToken}
              disabled={loading}
              className={`
                mt-2 w-full py-2 rounded-lg text-white font-semibold text-sm transition
                ${
                  loading
                    ? "bg-primary-light/40 dark:bg-primary-dark/40 cursor-not-allowed"
                    : "bg-primary-light dark:bg-primary-dark hover:opacity-90"
                }
              `}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-80">OTP</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="
                  w-full mt-1 px-3 py-2 rounded-lg text-sm
                  bg-background-light dark:bg-background-dark
                  border border-border-light dark:border-border-dark
                  text-text-light dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
                "
                placeholder=" Enter OTP sent to your email"
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-80">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full mt-1 px-3 py-2 rounded-lg text-sm
                  bg-background-light dark:bg-background-dark
                  border border-border-light dark:border-border-dark
                  text-text-light dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
                "
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-80">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="
                  w-full mt-1 px-3 py-2 rounded-lg text-sm
                  bg-background-light dark:bg-background-dark
                  border border-border-light dark:border-border-dark
                  text-text-light dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
                "
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className={`
              w-full py-2 rounded-lg text-white font-semibold text-sm transition
              ${
                loading
                  ? "bg-primary-light/40 dark:bg-primary-dark/40 cursor-not-allowed"
                  : "bg-primary-light dark:bg-primary-dark hover:opacity-90"
              }
            `}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>

        <p className="text-center text-xs opacity-70 mt-5">
          Remembered it?{" "}
          <Link
            to="/login"
            className="text-primary-light dark:text-primary-dark hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
