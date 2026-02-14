import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/api";
import { LockClosedIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { broadcastAuthUpdate } from "../utils/authBroadcast";
import { useGoogleLogin } from "@react-oauth/google";

const validateAge = (dob) => {
  if (!dob) return "Date of Birth is required.";
  if (new Date(dob) >= new Date()) return "Date of Birth cannot be today or in the future.";
  return ""; // No longer blocking registration for under 18
};
const BUDGET_RANGES = ["< 5k/yr", "5k-10k", "10k-20k", "20k-50k", "50k+"];
const MEDICAL_CONDITIONS = [
  { id: "diabetes", label: "Diabetes" },
  { id: "heart", label: "Heart Issues" },
  { id: "hypertension", label: "Hypertension" },
  { id: "asthma", label: "Asthma" },
];

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    phone: "",
    address: "",
    coverage_type: "individual",
    family_members: 2,
    is_smoker: false,
    health_score: 100,
    budget_range: "10k-20k",
    pre_existing_conditions: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [socialUser, setSocialUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

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
          // Check verification status even for existing social users
          if (!user.email_verified_at) {
            setIsRegistered(true);
            setForm(prev => ({ ...prev, email: user.email }));
            return;
          }

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
      if (err.response?.data?.unverified) {
        setError(
          <div className="flex flex-col gap-2">
            <span>{err.response.data.message}</span>
            <button
              onClick={handleResendVerification}
              className="text-primary-light dark:text-primary-dark font-bold hover:underline"
            >
              Resend verification email?
            </button>
          </div>
        );
      } else {
        setError(err.response?.data?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await API.post("/email/resend", { email: form.email });
      setSuccess("Verification email resent! Please check your inbox.");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ageErr = validateAge(form.dob);
    if (ageErr) {
      setError(ageErr);
      setLoading(false);
      return;
    }

    if (form.phone && !/^9[0-9]{9}$/.test(form.phone)) {
      setError("Phone must be 10 digits starting with 9.");
      setLoading(false);
      return;
    }

    try {
      const tempToken = sessionStorage.getItem("temp_client_token");
      const res = await API.put("/user/profile", { ...form }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      // After profile completion, if unverified, show the "Check Email" screen
      if (!res.data.user.email_verified_at) {
        setIsRegistered(true);
        // We still have the email in form.email
        return;
      }

      sessionStorage.setItem("client_token", tempToken);
      sessionStorage.removeItem("temp_client_token");
      sessionStorage.setItem("client_user", JSON.stringify(res.data.user));
      broadcastAuthUpdate("client", tempToken, JSON.stringify(res.data.user));
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const fieldErrors = err.response?.data?.errors || {};
      const msg =
        err.response?.data?.message ||
        Object.values(fieldErrors).flat()[0] ||
        "Failed to update profile.";
      setError(msg);
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
        {error && !isRegistered && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        <div className="space-y-4">
          {isRegistered ? (
            <div className="text-center animate-in fade-in zoom-in duration-500 py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email!</h2>
              <p className="text-xs opacity-70 leading-relaxed mb-6">
                We've sent a verification link to <strong>{form.email}</strong>.
                Please click the link in the email to activate your account.
              </p>
              <button
                onClick={() => {
                  setIsRegistered(false);
                  setSocialUser(null);
                  setSuccess("");
                  setError("");
                }}
                className="w-full inline-block py-3 rounded-xl bg-primary-light dark:bg-primary-dark text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all text-center"
              >
                Back to Login
              </button>
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full mt-4 text-[10px] opacity-40 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest disabled:opacity-20"
              >
                {loading ? "Resending..." : "Didn't get the email? Resend"}
              </button>
            </div>
          ) : !socialUser ? (
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

              <form onSubmit={handleSocialRegister} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block ml-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 block ml-1">Coverage Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['individual', 'family'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, coverage_type: t })}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.coverage_type === t
                          ? 'border-primary-light bg-primary-light/10 text-primary-light shadow-inner'
                          : 'border-border-light dark:border-border-dark opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                      >
                        {t === 'individual' ? '🧍 Individual' : '👨‍👩‍👧‍👦 Family'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.coverage_type === "family" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 block ml-1">Family Members Count</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={form.family_members}
                      onChange={(e) => setForm({ ...form, family_members: e.target.value })}
                      className="w-full px-5 py-4 text-sm rounded-2xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all font-bold outline-none"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl bg-primary-light hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? "Completing Profile..." : "Complete Profile"}
                </button>

                <button
                  type="button"
                  onClick={() => setSocialUser(null)}
                  className="w-full text-[10px] opacity-40 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest text-center"
                >
                  Use a different account
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-[10px] opacity-30 text-center mt-12 font-black uppercase tracking-[0.3em]">
          Secure & Encrypted Insurance Infrastructure
        </p>
      </div>
    </div>
  );
};

export default Login;
