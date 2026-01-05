import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../utils/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setEmailError("");
    setPasswordError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
      if (!trimmedEmail) {
        setEmailError("Email is required.");
        setLoading(false);
        return;
      }
      if (!emailValid) {
        setEmailError("Invalid email.");
        setLoading(false);
        return;
      }
      if (!password) {
        setPasswordError("Password is required.");
        setLoading(false);
        return;
      }

      const res = await adminLogin({ email: trimmedEmail, password });
      login(res.data?.admin || { email: trimmedEmail }, res.data?.token);
      navigate("/admin/dashboard");
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (!err?.response || status >= 500) {
        setError("Server down, please try again later.");
      } else if (status === 404 || message === "Admin account not found") {
        setEmailError("Invalid email.");
      } else if (status === 401 || message === "Invalid password") {
        setPasswordError("Invalid password.");
      } else {
        setError("Invalid credentials, please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="w-full max-w-md bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl shadow p-8 space-y-6 text-text-light dark:text-text-dark">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            Access the BeemaSathi admin console
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-light dark:text-text-dark">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark text-text-light dark:text-text-dark placeholder:text-muted-light dark:placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-primary-light/50"
              required
            />
            {emailError && (
              <p className="text-xs text-red-600 dark:text-red-300">{emailError}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-light dark:text-text-dark">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark text-text-light dark:text-text-dark placeholder:text-muted-light dark:placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-primary-light/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-light dark:text-primary-dark"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-600 dark:text-red-300">{passwordError}</p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-700 dark:text-red-300 bg-red-100/60 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary-light text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
