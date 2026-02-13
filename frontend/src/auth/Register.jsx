import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { UserPlusIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { broadcastAuthUpdate } from "../utils/authBroadcast";
import { useGoogleLogin } from "@react-oauth/google";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    dob: "",
    coverage_type: "individual",
    family_members: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    return ok ? "" : "Enter a valid 10-digit phone number starting with 9.";
  };

  const passwordRules = (value) => {
    if (!value || value.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
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
          // VERY IMPORTANT: Sync form with social data so validation passes
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

      const payload = {
        ...form,
        is_smoker: false, // Default for lite reg
        health_score: 100, // Best case for starting price
      };

      let res;
      if (socialUser) {
        // Step 2 for social user: Update their profile
        const tempToken = sessionStorage.getItem("temp_client_token");
        res = await API.put("/update-profile", payload, {
          headers: { Authorization: `Bearer ${tempToken}` }
        });
        // On success, the temp token becomes the real token
        res.data.token = tempToken;
      } else {
        // Normal registration
        res = await API.post("/register", payload);
      }

      if (res.data.token) {
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
          {!socialUser ? (
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
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
                    Continue with Google
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 py-2">
                <div className="h-[1px] flex-1 bg-border-light dark:bg-border-dark"></div>
                <span className="text-[10px] uppercase opacity-40 font-bold">Or with Email</span>
                <div className="h-[1px] flex-1 bg-border-light dark:bg-border-dark"></div>
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
                {form.dob && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm opacity-60">Plans start at</span>
                      <span className="text-xl font-black text-green-700 dark:text-green-400">
                        Rs. {
                          (() => {
                            const age = new Date().getFullYear() - new Date(form.dob).getFullYear();
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

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold opacity-70 mb-1 block">Your Date of Birth</label>
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

                {/* FAMILY MEMBERS COUNT (SOCIAL) */}
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
                    {familyMembersError && <p className="text-[10px] text-red-500 mt-1">{familyMembersError}</p>}
                  </div>
                )}

                {/* LIVE QUOTE PREVIEW */}
                {form.dob && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-xl shadow-green-600/20 transform hover:scale-[1.02] transition-all">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Calculated Instant Rate</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black">
                        Rs. {
                          (() => {
                            const age = new Date().getFullYear() - new Date(form.dob).getFullYear();
                            const base = form.coverage_type === 'family' ? 9500 : 4200;
                            const mod = age > 30 ? 1 + (age - 30) * 0.04 : 1;
                            return Math.round(base * mod).toLocaleString();
                          })()
                        }
                      </span>
                      <span className="text-xs opacity-80">/year*</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-white font-black text-sm shadow-xl active:scale-95 transition-all ${loading ? "bg-green-400/50" : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                    }`}
                >
                  {loading ? "Processing..." : "Register"}
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

        {/* FOOTER */}
        <p className="text-center text-xs opacity-70 mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
