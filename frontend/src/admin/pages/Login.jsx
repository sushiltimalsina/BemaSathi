import React, { useState } from "react";
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

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await adminLogin({ email, password });
      login(res.data?.admin || { email }, res.data?.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Invalid credentials, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark px-4">
      <div className="w-full max-w-md bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl shadow p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            Access the BeemaSathi admin console
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-300 bg-red-100/50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
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
