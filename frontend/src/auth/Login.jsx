import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/api";
import { LockClosedIcon } from "@heroicons/react/24/outline";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Build redirect target from query (?redirect=...), handling legacy unencoded values.
  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

    // If redirect wasn't encoded, other params (like p1/p2) will be split out; stitch them back.
    const extraPairs = [];
    params.forEach((value, key) => {
      if (key !== "redirect") extraPairs.push(`${key}=${value}`);
    });

    let target = redirect || "/client/dashboard";
    if (redirect && extraPairs.length) {
      target = `${redirect}${redirect.includes("?") ? "&" : "?"}${extraPairs.join("&")}`;
    }

    try {
      target = decodeURIComponent(target);
    } catch {
      // Leave as-is if decode fails
    }

    return target && target.startsWith("/") ? target : "/client/dashboard";
  }, [location.search]);

  // If already logged in, go straight to the redirect target.
  useEffect(() => {
    const token = sessionStorage.getItem("client_token");
    if (token) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/login", form);

      if (res.data.token) {
        localStorage.setItem("client_token", res.data.token);
        sessionStorage.setItem("client_token", res.data.token);
        if (res.data.user) {
          const userPayload = JSON.stringify(res.data.user);
          localStorage.setItem("client_user", userPayload);
          sessionStorage.setItem("client_user", userPayload);
        }
        navigate(redirectPath, { replace: true });
      } else {
        setError("Invalid response from server.");
      }
    } catch {
      setError("Invalid email or password.");
    }

    setLoading(false);
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-5
        bg-background-light dark:bg-background-dark 
        text-text-light dark:text-text-dark
        transition-colors duration-300
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
        {/* HEADER */}
        <div className="text-center mb-6">
          <LockClosedIcon className="w-10 h-10 text-primary-light dark:text-primary-dark mx-auto" />

          <h1 className="text-2xl font-bold mt-2 text-text-light dark:text-text-dark">
            Login
          </h1>

          <p className="text-sm opacity-70 mt-1">
            Access your BeemaSathi account
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label className="text-xs font-semibold opacity-80">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="
                w-full mt-1 px-3 py-2 rounded-lg text-sm
                bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark
                text-text-light dark:text-text-dark
                focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
              "
              placeholder="example@gmail.com"
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-xs font-semibold opacity-80">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="
                w-full mt-1 px-3 py-2 rounded-lg text-sm
                bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark
                text-text-light dark:text-text-dark
                focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark
              "
              placeholder="Enter your password"
              required
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-lg text-white font-semibold text-sm transition
              ${
                loading
                  ? "bg-primary-light/40 dark:bg-primary-dark/40 cursor-not-allowed"
                  : "bg-primary-light dark:bg-primary-dark hover:opacity-90"
              }
            `}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* LINK */}
        <p className="text-center text-xs opacity-70 mt-5">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary-light dark:text-primary-dark hover:underline"
          >
            Register
          </Link>
        </p>
        <p className="text-center text-xs opacity-70 mt-3">
          <Link
            to="/reset-password"
            className="text-primary-light dark:text-primary-dark hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
