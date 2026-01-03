import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { UserPlusIcon } from "@heroicons/react/24/outline";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirm_password: "",
    dob: "",
    budget_range: "",
    coverage_type: "individual",
    family_members: "1",
    is_smoker: "0",
    pre_existing_conditions: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
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
        is_smoker: form.is_smoker === "1",
        family_members:
          form.coverage_type === "family"
            ? Number(form.family_members || 2)
            : 1,
      };

      const res = await API.post("/register", payload);

      if (res.data.token) {
        localStorage.setItem("client_token", res.data.token);
        sessionStorage.setItem("client_token", res.data.token);
        if (res.data.user) {
          const userPayload = JSON.stringify(res.data.user);
          localStorage.setItem("client_user", userPayload);
          sessionStorage.setItem("client_user", userPayload);
        } else if (form.name || form.email) {
          const fallbackUser = JSON.stringify({
            name: form.name,
            email: form.email,
          });
          localStorage.setItem("client_user", fallbackUser);
          sessionStorage.setItem("client_user", fallbackUser);
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
        const msg =
          err.response?.data?.message ||
          Object.values(err.response?.data?.errors || {}).flat().join(" ") ||
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

        <form onSubmit={handleRegister} className="space-y-4">
          {/* INPUT GENERATOR FUNCTION */}
          {[
            { label: "Full Name", key: "name", type: "text" },
            { label: "Phone Number", key: "phone", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Address", key: "address", type: "text" },
            { label: "Password", key: "password", type: "password" },
            { label: "Confirm Password", key: "confirm_password", type: "password" },
            { label: "Date of Birth", key: "dob", type: "date" },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-xs font-semibold opacity-80">
                {field.label}
              </label>

              <input
                type={field.type}
                value={form[field.key]}
                onChange={(e) =>
                  setForm((prev) => {
                    const next = { ...prev, [field.key]: e.target.value };
                    if (field.key === "phone") {
                      setPhoneError(validatePhone(next.phone));
                    }
                    if (field.key === "email") {
                      setEmailError(validateEmail(next.email));
                    }
                    if (field.key === "password" || field.key === "confirm_password") {
                      validatePasswords(next);
                    }
                    return next;
                  })
                }
                className="
                  w-full mt-1 px-3 py-2 text-sm rounded-lg
                  bg-background-light dark:bg-background-dark
                  border border-border-light dark:border-border-dark
                  text-text-light dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-green-500/50
                "
                required
              />
              {field.key === "phone" && phoneError && (
                <p className="text-[11px] text-red-500 mt-1">{phoneError}</p>
              )}
              {field.key === "email" && emailError && (
                <p className="text-[11px] text-red-500 mt-1">{emailError}</p>
              )}
              {field.key === "password" && passwordError && (
                <p className="text-[11px] text-red-500 mt-1">{passwordError}</p>
              )}
              {field.key === "password" && !passwordError && (
                <p className="text-[11px] opacity-70 mt-1">
                  Use 8+ characters with uppercase, lowercase, number, and symbol.
                </p>
              )}
              {field.key === "confirm_password" && confirmError && (
                <p className="text-[11px] text-red-500 mt-1">{confirmError}</p>
              )}
            </div>
          ))}

          {/* BUDGET RANGE */}
          <div>
            <label className="text-xs font-semibold opacity-80">
              Yearly Budget
            </label>
            <select
              value={form.budget_range}
              onChange={(e) =>
                setForm({ ...form, budget_range: e.target.value })
              }
              className="
                w-full mt-1 px-3 py-2 rounded-lg text-sm
                bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark
                text-text-light dark:text-text-dark
              "
              required
            >
              <option value="">Select...</option>
              <option value="<10000">Below 10,000</option>
              <option value="10000-20000">10,000 – 20,000</option>
              <option value="20000-30000">20,000 – 30,000</option>
              <option value=">30000">Above 30,000</option>
            </select>
          </div>

          {/* COVERAGE TYPE */}
          <div>
            <label className="text-xs font-semibold opacity-80">
              Coverage Type
            </label>
            <select
              value={form.coverage_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  coverage_type: e.target.value,
                  family_members:
                    e.target.value === "family" ? form.family_members || "2" : "1",
                })
              }
              className="
                w-full mt-1 px-3 py-2 rounded-lg text-sm
                bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark
                text-text-light dark:text-text-dark
              "
              required
            >
              <option value="individual">Individual</option>
              <option value="family">Family</option>
            </select>
          </div>

          {/* FAMILY MEMBERS */}
          {form.coverage_type === "family" && (
            <div>
              <label className="text-xs font-semibold opacity-80">
                Number of Family Members Covered
              </label>
              <input
                type="number"
                min="2"
                max="20"
                value={form.family_members}
                onChange={(e) =>
                  setForm({ ...form, family_members: e.target.value })
                }
                className="
                  w-full mt-1 px-3 py-2 rounded-lg text-sm
                  bg-background-light dark:bg-background-dark
                  border border-border-light dark:border-border-dark
                  text-text-light dark:text-text-dark
                "
                required
              />
              <p className="text-[11px] opacity-70 mt-1">
                Note: if any family member is a smoker or has pre-existing conditions,
                please select them below.
              </p>
            </div>
          )}

          {/* SMOKER */}
          <div>
            <label className="text-xs font-semibold opacity-80">
              Smoking Habit
            </label>
            <select
              value={form.is_smoker}
              onChange={(e) =>
                setForm({ ...form, is_smoker: e.target.value })
              }
              className="
                w-full mt-1 px-3 py-2 rounded-lg text-sm
                bg-background-light dark:bg-background-dark
                border border-border-light dark:border-border-dark
                text-text-light dark:text-text-dark
              "
              required
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
            {form.coverage_type === "family" && (
              <p className="text-[11px] opacity-70 mt-1">
                Choose "Yes" if any covered family member smokes.
              </p>
            )}
          </div>

          {/* CONDITIONS */}
          <div>
            <label className="text-xs font-semibold opacity-80">
              Pre-existing Conditions
            </label>

            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              {["diabetes", "heart", "hypertension", "asthma"].map((c) => (
                <label key={c} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={c}
                    checked={form.pre_existing_conditions.includes(c)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const isChecked = e.target.checked;

                      setForm((prev) => ({
                        ...prev,
                        pre_existing_conditions: isChecked
                          ? [...prev.pre_existing_conditions, value]
                          : prev.pre_existing_conditions.filter(
                              (x) => x !== value
                            ),
                      }));
                    }}
                  />
                  <span className="capitalize opacity-80">{c}</span>
                </label>
              ))}
            </div>
            {form.coverage_type === "family" && (
              <p className="text-[11px] opacity-70 mt-2">
                Select conditions if any covered family member has them.
              </p>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-lg text-white font-semibold text-sm transition
              ${
                loading
                  ? "bg-green-400/50 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }
            `}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

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
