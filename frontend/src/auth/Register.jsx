import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { UserPlusIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { broadcastAuthUpdate } from "../utils/authBroadcast";
import { useGoogleLogin } from "@react-oauth/google";

const BUDGET_RANGES = ["< 5k/yr", "5k-10k", "10k-20k", "20k-50k", "50k+"];
const MEDICAL_CONDITIONS = [
  { id: "diabetes", label: "Diabetes" },
  { id: "heart", label: "Heart Issues" },
  { id: "hypertension", label: "Hypertension" },
  { id: "asthma", label: "Asthma" },
];

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirm_password: "",
    dob: "",
    coverage_type: "individual",
    family_members: 1,
    is_smoker: false,
    budget_range: "10k-20k",
    pre_existing_conditions: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [socialUser, setSocialUser] = useState(null); // Stores Google Data
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [familyMembersError, setFamilyMembersError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (value) => {
    if (!value) return "";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return ok ? "" : "Enter a valid email address.";
  };

  const validatePhone = (value) => {
    if (!value) return "";
    const ok = /^9[0-9]{9}$/.test(value);
    return ok ? "" : "Phone must be 10 digits starting with 9.";
  };

  const passwordRules = (value) => {
    if (!value) return "";
    if (value.length < 8) return "Password must be at least 8 chars.";
    if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
    if (!/[0-9]/.test(value)) return "Password must include a number.";
    if (!/[^A-Za-z0-9]/.test(value)) return "Password must include a symbol.";
    return "";
  };

  const validatePasswords = (nextForm) => {
    const pwdError = passwordRules(nextForm.password);
    setPasswordError(pwdError);
    const confirmMsg =
      nextForm.confirm_password && nextForm.confirm_password !== nextForm.password
        ? "Passwords do not match."
        : "";
    setConfirmError(confirmMsg);
    return !pwdError && !confirmMsg;
  };

  const validateAge = (dob) => {
    if (!dob) return "Date of Birth is required.";
    if (new Date(dob) >= new Date()) return "Date of Birth cannot be today or in the future.";
    return ""; // No longer blocking registration for under 18
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await API.post("/auth/google/callback", {
          token: tokenResponse.access_token,
        });

        const { user, token, is_new } = res.data;
        console.log("GOOGLE_OAUTH_RESPONSE:", { is_new, has_dob: !!user.dob });

        if (is_new) {
          setSocialUser({
            ...user,
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}`,
          });
          // Update form for validation consistency in Step 2
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
          navigate("/client/dashboard");
        }
      } catch (err) {
        console.error("GOOGLE_LOGIN_ERROR:", err);
        const msg = err.response?.data?.message || err.response?.data?.error || "Google sync failed. Please try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google popup failed to open."),
  });

  const handleGoogleLogin = () => googleLogin();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFamilyMembersError("");

    try {
      const ageMsg = validateAge(form.dob);
      if (ageMsg) {
        setError(ageMsg);
        setLoading(false);
        return;
      }

      if (!socialUser) {
        const phoneMsg = validatePhone(form.phone);
        setPhoneError(phoneMsg);
        if (phoneMsg) {
          setLoading(false);
          return;
        }

        const emailMsg = validateEmail(form.email);
        setEmailError(emailMsg);
        if (emailMsg) {
          setLoading(false);
          return;
        }

        const ok = validatePasswords(form);
        if (!ok) {
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...form,
        health_score: 100, // Best case for starting price
      };

      let res;
      if (socialUser) {
        // Step 2 for social user: Update their profile
        const tempToken = sessionStorage.getItem("temp_client_token");
        res = await API.put("/user/profile", payload, {
          headers: { Authorization: `Bearer ${tempToken}` }
        });

        // After profile completion, if unverified, show the "Check Email" screen
        if (!res.data.user.email_verified_at) {
          setIsRegistered(true);
          setSuccess("Profile updated! Please check your email to verify and access your dashboard.");
          setLoading(false);
          return;
        }

        // On success, the temp token becomes the real token
        res.data.token = tempToken;
      } else {
        // Normal registration
        res = await API.post("/register", payload);
      }

      if (res.data.requires_verification) {
        setSuccess(res.data.message || "Registration successful! Please check your email to verify your account.");
        setIsRegistered(true);
      } else if (res.data.token) {
        sessionStorage.setItem("client_token", res.data.token);
        sessionStorage.removeItem("temp_client_token");
        const userToStore = res.data.user || (socialUser ? { ...socialUser, ...form } : null);

        if (userToStore) {
          const userPayload = JSON.stringify(userToStore);
          sessionStorage.setItem("client_user", userPayload);
          broadcastAuthUpdate("client", res.data.token, userPayload);
        } else if (form.name || form.email) {
          const fallbackUser = JSON.stringify({
            name: form.name,
            email: form.email,
          });
          sessionStorage.setItem("client_user", fallbackUser);
          broadcastAuthUpdate("client", res.data.token, fallbackUser);
        }
        setSuccess("Registration successful.");
        navigate("/client/dashboard");
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (!err?.response || status >= 500) {
        setError("Server down, please try again later.");
      } else {
        const fieldErrors = err.response?.data?.errors || {};
        const familyMsg = Array.isArray(fieldErrors.family_members)
          ? fieldErrors.family_members[0]
          : "";
        if (familyMsg) {
          setFamilyMembersError(familyMsg);
        }
        const msg =
          err.response?.data?.message ||
          Object.values(fieldErrors).flat().join(" ") ||
          "Registration failed.";
        setError(msg);
      }
    }

    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError("");
    try {
      await API.post("/email/resend", { email: form.email });
      setSuccess("Verification email resent! Please check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend email.");
    } finally {
      setLoading(false);
    }
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
        {/* HEADER */}
        <div className="text-center mb-6">
          <UserPlusIcon className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto" />

          <h1 className="text-2xl font-bold mt-2">Register</h1>

          <p className="text-sm opacity-70">
            Create your BeemaSathi account
          </p>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
        {success && (
          <p className="text-green-600 text-sm text-center mb-3">{success}</p>
        )}

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
              <Link
                to="/login"
                className="w-full inline-block py-3 rounded-xl bg-primary-light dark:bg-primary-dark text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all text-center"
              >
                Go to Login
              </Link>
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
              {/* SOCIAL LOGIN */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark transition-all text-sm font-semibold group"
              >
                {loading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full"></span>
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    <span className="opacity-70 group-hover:opacity-100 italic transition-opacity">Continue with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 py-2 opacity-20">
                <div className="h-[1px] flex-1 bg-current"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">OR</span>
                <div className="h-[1px] flex-1 bg-current"></div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* NAME, EMAIL, PASSWORD, DOB */}
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Password", key: "password", type: "password", helper: "(min. 8 chars, uppercase, number & symbol)" },
                  { label: "Confirm Password", key: "confirm_password", type: "password", helper: "(must match password)" },
                  { label: "Date of Birth", key: "dob", type: "date" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold opacity-70 mb-1 block">
                      {field.label} {field.helper && <span className="text-[10px] opacity-40 font-normal">{field.helper}</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={
                          field.key === "password"
                            ? (showPassword ? "text" : "password")
                            : field.key === "confirm_password"
                              ? (showConfirmPassword ? "text" : "password")
                              : field.type
                        }
                        value={form[field.key]}
                        onChange={(e) =>
                          setForm((prev) => {
                            const next = { ...prev, [field.key]: e.target.value };
                            if (field.key === "email") setEmailError(validateEmail(next.email));
                            if (field.key === "password" || field.key === "confirm_password") {
                              validatePasswords(next);
                            }
                            return next;
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all font-medium"
                        required
                      />
                      {(field.key === "password" || field.key === "confirm_password") && (
                        <button
                          type="button"
                          onClick={() =>
                            field.key === "password"
                              ? setShowPassword(!showPassword)
                              : setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          {field.key === "password" ? (
                            showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />
                          ) : (
                            showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {field.key === "email" && emailError && <p className="text-[10px] text-red-500 mt-1">{emailError}</p>}
                    {field.key === "password" && passwordError && <p className="text-[10px] text-red-500 mt-1">{passwordError}</p>}
                    {field.key === "confirm_password" && confirmError && <p className="text-[10px] text-red-500 mt-1">{confirmError}</p>}
                  </div>
                ))}

                {/* COVERAGE TYPE SEARCH */}
                <div>
                  <label className="text-xs font-semibold opacity-70 mb-1 block">Coverage Type</label>
                  <select
                    value={form.coverage_type}
                    onChange={(e) => setForm({ ...form, coverage_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark font-medium"
                  >
                    <option value="individual">For Myself (Individual)</option>
                    <option value="family">For My Family (Floater)</option>
                  </select>
                </div>

                {/* FAMILY MEMBERS COUNT */}
                {form.coverage_type === "family" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-semibold opacity-70 mb-1 block">Number of Family Members <span className="text-[9px] opacity-50">(including yourself)</span></label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={form.family_members}
                      onChange={(e) => setForm({ ...form, family_members: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all font-medium"
                      required
                    />
                    {familyMembersError && <p className="text-[10px] text-red-500 mt-1">{familyMembersError}</p>}
                  </div>
                )}

                {/* LIVE QUOTE PREVIEW */}
                {form.dob && !error && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm opacity-60">Plans start at</span>
                      <span className="text-xl font-black text-green-700 dark:text-green-400">
                        Rs. {
                          (() => {
                            const bDay = new Date(form.dob);
                            const now = new Date();
                            if (bDay >= now) return "0";
                            const age = now.getFullYear() - bDay.getFullYear();
                            const base = form.coverage_type === 'family' ? 9500 : 4200;
                            const mod = age > 30 ? 1 + (age - 30) * 0.04 : 1;
                            return Math.round(base * mod).toLocaleString();
                          })()
                        }
                      </span>
                      <span className="text-[10px] opacity-40">/year*</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg transform active:scale-95 transition-all mt-2 ${loading ? "bg-green-400/50" : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                    }`}
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </form>
            </>
          ) : (
            /* STEP 2: SOCIAL ONBOARDING */
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6 p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-4">
                <img src={socialUser.avatar} className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800" alt="Avatar" />
                <div>
                  <h3 className="font-bold text-sm">Welcome, {socialUser.name}!</h3>
                  <p className="text-[10px] opacity-60">{socialUser.email}</p>
                </div>
              </div>

              <p className="text-xs opacity-70 mb-5 leading-relaxed">
                Google account linked! Just two final details to generate your **Live Quote Matrix**.
              </p>

              <form onSubmit={handleRegister} className="space-y-6">
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
              </form>
              <button
                onClick={() => setSocialUser(null)}
                className="w-full text-[10px] opacity-40 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest text-center mt-4"
              >
                Use a different account
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {!socialUser && !isRegistered && (
          <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark text-center">
            <p className="text-xs opacity-50">
              Already have an account?{" "}
              <Link to="/login" className="text-green-600 dark:text-green-400 font-bold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
