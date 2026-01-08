import React, { useEffect, useMemo, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import API from "../api/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../admin/context/ToastContext";

const OTP_LEN = 6;

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LEN).fill(""));
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(0);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [otpRemaining, setOtpRemaining] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const otpValue = useMemo(() => otpDigits.join(""), [otpDigits]);

  const validateEmail = (value) => {
    if (!value) return "Enter your email.";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return ok ? "" : "Enter a valid email address.";
  };

  const passwordRules = (value) => {
    if (!value || value.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(value)) return "Password must include a number.";
    if (!/[^A-Za-z0-9]/.test(value)) return "Password must include a symbol.";
    return "";
  };

  const validatePasswords = (nextPassword, nextConfirm) => {
    const pwdError = passwordRules(nextPassword);
    setPasswordError(pwdError);
    const confirmMsg =
      nextConfirm && nextPassword && nextConfirm !== nextPassword
        ? "Passwords do not match."
        : "";
    setConfirmError(confirmMsg);
    return !pwdError && !confirmMsg;
  };

  const focusOtp = (idx) => {
    const el = document.getElementById(`otp-${idx}`);
    el?.focus();
    el?.select?.();
  };

  const setOtpAt = (idx, val) => {
    setOtpDigits((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleOtpChange = (value, idx) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setOtpAt(idx, "");
      return;
    }
    const chars = digitsOnly.slice(0, OTP_LEN - idx).split("");
    setOtpDigits((prev) => {
      const next = [...prev];
      chars.forEach((ch, i) => {
        next[idx + i] = ch;
      });
      return next;
    });
    const nextIndex = idx + chars.length;
    if (nextIndex < OTP_LEN) {
      focusOtp(nextIndex);
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    const key = e.key;
    if (key === "Backspace") {
      e.preventDefault();
      if (otpDigits[idx]) {
        setOtpAt(idx, "");
        return;
      }
      if (idx > 0) {
        setOtpAt(idx - 1, "");
        focusOtp(idx - 1);
      }
      return;
    }
    if (key === "ArrowLeft") {
      e.preventDefault();
      if (idx > 0) focusOtp(idx - 1);
      return;
    }
    if (key === "ArrowRight") {
      e.preventDefault();
      if (idx < OTP_LEN - 1) focusOtp(idx + 1);
      return;
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LEN).fill("");
    pasted.split("").forEach((ch, i) => (next[i] = ch));
    setOtpDigits(next);
    focusOtp(Math.min(pasted.length, OTP_LEN - 1));
  };

  const requestToken = async () => {
    setError("");
    setInfoMessage("");
    setSuccessMessage("");
    setOtpVerified(false);
    const trimmedEmail = email.trim();
    const emailMsg = validateEmail(trimmedEmail);
    if (emailMsg) {
      setEmailError(emailMsg);
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await API.post("/password/forgot", { email: trimmedEmail });
      const tok = res.data?.reset_token;
      if (tok) {
        setToken(tok);
        const digits = tok.replace(/\D/g, "").slice(0, OTP_LEN).split("");
        const filled = Array(OTP_LEN).fill("");
        digits.forEach((digit, idx) => (filled[idx] = digit));
        setOtpDigits(filled);
        setInfoMessage(`Reset token generated: ${tok}`);
      } else {
        setInfoMessage("Email matches and OTP sent successfully.");
      }
      const expiresIn = Number(res.data?.expires_in || 0);
      setOtpExpiry(Date.now() + (expiresIn > 0 ? expiresIn * 1000 : 15 * 60 * 1000));
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 422
          ? "This email is not registered. Please enter your account email."
          : err.response?.data?.message || "Unable to generate reset token.";
      setError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async (emailValue, tokenValue) => {
    try {
      const res = await API.post("/password/verify", {
        email: emailValue,
        token: tokenValue,
      });
      return {
        ok: true,
        expiresIn: Number(res.data?.expires_in || 0),
      };
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 422
          ? "Invalid or expired OTP. Please request a new token."
          : err.response?.data?.message || "Unable to validate the OTP.";
      setError(msg);
      return { ok: false, expiresIn: 0 };
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setInfoMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();
    const trimmedToken = otpValue.trim();

    const emailMsg = validateEmail(trimmedEmail);
    if (emailMsg) {
      setEmailError(emailMsg);
      return;
    }

    if (trimmedToken.length < OTP_LEN) {
      setError("Enter the full 6-digit OTP to verify.");
      return;
    }

    if (otpExpiry && Date.now() > otpExpiry) {
      setError("OTP expired. Please request a new token.");
      return;
    }

    setIsVerifyingOtp(true);
    const result = await verifyOtp(trimmedEmail, trimmedToken);
    setIsVerifyingOtp(false);

    if (!result.ok) {
      setOtpVerified(false);
      return;
    }

    setOtpVerified(true);
    setInfoMessage("Code verified.");
    if (result.expiresIn > 0) {
      setOtpExpiry(Date.now() + result.expiresIn * 1000);
    }
  };

  const handleReset = async () => {
    setError("");
    setInfoMessage("");
    setSuccessMessage("");
    if (!otpVerified) {
      setError("Please verify the OTP before resetting your password.");
      return;
    }
    const trimmedEmail = email.trim();
    const trimmedToken = otpValue.trim();
    if (otpExpiry && Date.now() > otpExpiry) {
      setError("OTP expired. Please request a new token.");
      return;
    }
    if (!trimmedEmail || !trimmedToken || !password) {
      setError("Email, token, and new password are required.");
      return;
    }
    const emailMsg = validateEmail(trimmedEmail);
    if (emailMsg) {
      setEmailError(emailMsg);
      return;
    }
    if (!validatePasswords(password, passwordConfirm)) {
      return;
    }
    setIsResetting(true);
    try {
      await API.post("/password/reset", {
        email: trimmedEmail,
        token: trimmedToken,
        password,
        password_confirmation: passwordConfirm,
      });
      const toastSeconds = 5;
      setSuccessMessage("Password reset successful. Redirecting shortly.");
      setRedirectSeconds(toastSeconds);
      setShouldRedirect(true);
      addToast("Password reset successful. You can now log in.", "success", toastSeconds * 1000);
    } catch (err) {
      const msg = err.response?.data?.message || "Reset failed. Check token/email.";
      setError(msg);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (!shouldRedirect) return;
    if (redirectSeconds <= 0) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setRedirectSeconds((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [redirectSeconds, shouldRedirect, navigate]);

  useEffect(() => {
    if (!otpExpiry) {
      setOtpRemaining("");
      return;
    }
    const update = () => {
      const diff = otpExpiry - Date.now();
      if (diff <= 0) {
        setOtpRemaining("Expired");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setOtpRemaining(`${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [otpExpiry]);

  useEffect(() => {
    setOtpVerified(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, otpValue]);

  useEffect(() => {
    if (!shouldRedirect || redirectSeconds <= 0) return;
    setSuccessMessage(
      `Password reset successful. Redirecting to login in ${redirectSeconds} second${redirectSeconds === 1 ? "" : "s"}.`
    );
  }, [redirectSeconds, shouldRedirect]);

  useEffect(() => {
    const presetEmail = searchParams.get("email");
    const presetToken = searchParams.get("token");
    if (presetEmail) setEmail(presetEmail);
    if (presetToken) {
      setToken(presetToken);
      const digits = presetToken.replace(/\D/g, "").slice(0, OTP_LEN).split("");
      const filled = Array(OTP_LEN).fill("");
      digits.forEach((d, i) => (filled[i] = d));
      setOtpDigits(filled);
      setInfoMessage("Email matches and OTP sent successfully. Use the provided token.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors">
      <div className="w-full max-w-md rounded-2xl p-8 shadow-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark transition-all">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm opacity-70 mt-1">
            Request an OTP and set a new password.
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-200">
            {successMessage}
          </div>
        )}
        {!successMessage && infoMessage && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-200">
            {infoMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold opacity-80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                setEmailError(validateEmail(value.trim()));
              }}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark"
              placeholder="example@gmail.com"
              autoComplete="email"
            />
            {emailError && <p className="text-[11px] text-red-500 mt-1">{emailError}</p>}
            <button
              type="button"
              onClick={requestToken}
              disabled={isSendingOtp}
              className={`mt-3 w-full py-2.5 rounded-xl text-white font-semibold text-sm transition active:scale-[0.99] ${
                isSendingOtp
                  ? "bg-primary-light/40 dark:bg-primary-dark/40 cursor-not-allowed"
                  : "bg-primary-light dark:bg-primary-dark hover:opacity-90"
              }`}
            >
              {isSendingOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>

          <div>
            <div className="flex items-end justify-between">
              <label className="text-xs font-semibold opacity-80">OTP</label>
              <span className="text-[11px] opacity-60">6 digits</span>
            </div>
          <div className="mt-2 flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onFocus={(e) => e.target.select()}
                  className="w-11 h-12 sm:w-12 sm:h-12 border border-border-light dark:border-border-dark rounded-xl text-center text-lg bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary-light/70 dark:focus:ring-primary-dark"
                  aria-label={`OTP digit ${idx + 1}`}
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
              />
            ))}
          </div>
          {otpRemaining && (
            <p className="text-[11px] opacity-60 text-center mt-2">
              OTP expires in {otpRemaining}
            </p>
          )}
        </div>

          <div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp || otpVerified}
              className={`mb-2 w-full py-2 rounded-xl text-sm font-semibold transition active:scale-[0.99] border ${
                otpVerified
                  ? "bg-green-500/10 text-green-700 dark:text-green-200 border-green-500/30 cursor-not-allowed"
                  : "bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark"
              }`}
            >
              {otpVerified ? "OTP Verified" : isVerifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>
            <label className="text-xs font-semibold opacity-80">New Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  validatePasswords(value, passwordConfirm);
                }}
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark pr-10"
                placeholder="Enter new password"
                disabled={!otpVerified}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 dark:text-slate-300"
                aria-label="Toggle password visibility"
              >
                {passwordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && <p className="text-[11px] text-red-500 mt-1">{passwordError}</p>}
            {!passwordError && (
              <p className="text-[11px] opacity-70 mt-1">
                Use 8+ characters with uppercase, lowercase, number, and symbol.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold opacity-80">Confirm Password</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                const value = e.target.value;
                setPasswordConfirm(value);
                validatePasswords(password, value);
              }}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-light/60 dark:focus:ring-primary-dark"
              placeholder="Confirm new password"
              autoComplete="new-password"
              disabled={!otpVerified}
            />
            {confirmError && <p className="text-[11px] text-red-500 mt-1">{confirmError}</p>}
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || !otpVerified}
            className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm transition active:scale-[0.99] ${
              isResetting || !otpVerified
                ? "bg-primary-light/40 dark:bg-primary-dark/40 cursor-not-allowed"
                : "bg-primary-light dark:bg-primary-dark hover:opacity-90"
            }`}
          >
            {isResetting ? "Resetting..." : "Reset Password"}
          </button>
        </div>

        <p className="text-center text-xs opacity-70 mt-5">
          Remembered it?{" "}
          <Link to="/login" className="text-primary-light dark:text-primary-dark hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
