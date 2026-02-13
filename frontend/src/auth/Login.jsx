import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/api";
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { broadcastAuthUpdate } from "../utils/authBroadcast";
import { useGoogleLogin } from "@react-oauth/google";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    dob: "",
    coverage_type: "individual",
    family_members: 2,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [socialUser, setSocialUser] = useState(null);

  // Build redirect target from query (?redirect=...)
  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

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
      // Leave as-is
    }

    return target && target.startsWith("/") ? target : "/client/dashboard";
  }, [location.search]);

  // If already logged in
  useEffect(() => {
    const token = sessionStorage.getItem("client_token");
    if (token) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await API.post("/auth/google/callback", {
          token: tokenResponse.access_token,
        });

        const { user, token, is_new } = res.data;

        if (is_new) {
          setSocialUser({
            ...user,
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}`,
          });
          setForm(prev => ({
            ...prev,
            name: user.name,
            email: user.email,
          }));
          sessionStorage.setItem("temp_client_token", token);
        } else {
          sessionStorage.setItem("client_token", token);
          sessionStorage.setItem("client_user", JSON.stringify(user));
          broadcastAuthUpdate("client", token, JSON.stringify(user));
          setSuccess("Welcome back!");
          navigate(redirectPath, { replace: true });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Google sync failed.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google login failed."),
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailError("");
    setPasswordError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email) return setEmailError("Email is required.");
    if (!password) return setPasswordError("Password is required.");

    try {
      const res = await API.post("/login", { email, password });
      if (res.data.token) {
        sessionStorage.setItem("client_token", res.data.token);
        sessionStorage.setItem("client_user", JSON.stringify(res.data.user));
        broadcastAuthUpdate("client", res.data.token, JSON.stringify(res.data.user));
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const tempToken = sessionStorage.getItem("temp_client_token");
      const res = await API.put("/update-profile", { ...form }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      sessionStorage.setItem("client_token", tempToken);
      sessionStorage.removeItem("temp_client_token");
      sessionStorage.setItem("client_user", JSON.stringify(res.data.user));
      broadcastAuthUpdate("client", tempToken, JSON.stringify(res.data.user));
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="w-full max-w-md rounded-2xl p-8 shadow-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark transition-all">

        {/* HEADER */}
        <div className="text-center mb-6">
          <LockClosedIcon className="w-10 h-10 text-primary-light dark:text-primary-dark mx-auto" />
          <h1 className="text-2xl font-bold mt-2">Login</h1>
          <p className="text-sm opacity-70 mt-1">Access your BeemaSathi account</p>
        </div>

        {success && <p className="text-green-600 text-sm text-center mb-3">{success}</p>}
        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        <div className="space-y-4">
          {!socialUser ? (
            <>
              {/* GOOGLE BUTTON */}
              <button
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group active:scale-[0.98]"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                <span className="text-sm font-bold opacity-80 group-hover:opacity-100">Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 py-2">
                <div className="h-[1px] flex-1 bg-border-light dark:bg-border-dark"></div>
                <span className="text-[10px] uppercase opacity-40 font-bold">Or with Email</span>
                <div className="h-[1px] flex-1 bg-border-light dark:bg-border-dark"></div>
              </div>

              {/* FORM */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold opacity-80">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary-light/60 transition-all"
                    placeholder="example@gmail.com"
                    required
                  />
                  {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold opacity-80">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary-light/60 transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-light dark:text-primary-dark"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-white font-semibold text-sm bg-primary-light dark:bg-primary-dark hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="text-center space-y-2 mt-4">
                <p className="text-xs opacity-70">
                  Don't have an account? <Link to="/register" className="text-primary-light dark:text-primary-dark hover:underline">Register</Link>
                </p>
                <Link to="/reset-password" name="forgot" className="block text-xs text-primary-light dark:text-primary-dark hover:underline">Forgot your password?</Link>
              </div>
            </>
          ) : (
            /* STEP 2: WELCOME (Google Onboarding) */
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6 p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-4">
                <img src={socialUser.avatar} className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800" alt="Avatar" />
                <div>
                  <h3 className="font-bold text-sm">Welcome, {socialUser.name}!</h3>
                  <p className="text-[10px] opacity-60">{socialUser.email}</p>
                </div>
              </div>

              <p className="text-xs opacity-70 mb-5 leading-relaxed">
                Google account linked! Just a few final details to complete your profile.
              </p>

              <form onSubmit={handleSocialRegister} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold opacity-70 mb-1 block">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-green-500/30 transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold opacity-70 mb-1 block">Primary Coverage Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['individual', 'family'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, coverage_type: t })}
                        className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all ${form.coverage_type === t
                          ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                          : 'border-border-light dark:border-border-dark opacity-60 hover:opacity-100'
                          }`}
                      >
                        {t === 'individual' ? '🧍 Individual' : '👨‍👩‍👧 Family'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.coverage_type === "family" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-semibold opacity-70 mb-1 block">Number of Family Members <span className="text-[9px] opacity-50">(including yourself)</span></label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={form.family_members}
                      onChange={(e) => setForm({ ...form, family_members: e.target.value })}
                      className="w-full px-4 py-3 text-sm rounded-xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-green-500/30 transition-all font-medium"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-white font-black text-sm shadow-xl bg-green-600 hover:bg-green-700 active:scale-95 transition-all"
                >
                  {loading ? "Completing Profile..." : "Complete Profile"}
                </button>

                <button
                  onClick={() => setSocialUser(null)}
                  className="w-full text-[10px] opacity-40 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest text-center"
                >
                  Use a different account
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
