import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/adminApi";
import { useAdminToast } from "../ui/AdminToast";

const AdminProfile = () => {
  const navigate = useNavigate();
  const { addToast } = useAdminToast();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/admin/profile");
        setAdmin(res.data || null);
        if (res.data) {
          sessionStorage.setItem("admin_user", JSON.stringify(res.data));
        }
      } catch (e) {
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.password || pwForm.password.length < 8) {
      return addToast({ type: "error", title: "Wait!", message: "Password must be at least 8 characters." });
    }
    if (pwForm.password !== pwForm.password_confirmation) {
      return addToast({ type: "error", title: "Wait!", message: "Passwords do not match." });
    }

    setPwSaving(true);
    try {
      await API.post("/admin/profile/change-password", {
        password: pwForm.password,
        password_confirmation: pwForm.password_confirmation,
      });
      addToast({ type: "success", title: "Updated", message: "Password changed successfully." });
      setPwForm({ password: "", password_confirmation: "" });
      setShowPwModal(false);
    } catch (err) {
      addToast({ type: "error", title: "Failed", message: err.response?.data?.message || "Internal server error" });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-light dark:text-muted-dark">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 dark:text-red-300">{error}</div>;
  }

  if (!admin) {
    return (
      <div className="text-muted-light dark:text-muted-dark">
        No profile data.
      </div>
    );
  }

  const avatar = admin.name ? admin.name.charAt(0).toUpperCase() : "A";

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200 flex items-center justify-center text-xl font-bold">
          {avatar}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Profile</h1>
          <p className="text-sm text-muted-light dark:text-muted-dark">
            Manage your admin account details
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Account Details</h2>
          <div className="space-y-3 pb-2">
            <div className="flex justify-between">
              <span className="text-muted-light dark:text-muted-dark">Name</span>
              <span className="font-semibold">{admin.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-light dark:text-muted-dark">Email</span>
              <span className="font-semibold">{admin.email || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-light dark:text-muted-dark">Role</span>
              <span className="font-semibold capitalize">{admin.role || "admin"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <button
              type="button"
              onClick={() => setShowPwModal(true)}
              className="w-full py-2 rounded-xl bg-primary-light text-white font-semibold hover:shadow-lg transition-all"
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-2 rounded-xl border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark text-sm font-semibold transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* POPUP MODAL */}
      {showPwModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !pwSaving && setShowPwModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-8 z-10">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Update Password</h2>
              <p className="text-sm opacity-70 mt-1">Please enter your new credentials</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">New Password</label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={pwForm.password || ""}
                  onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-3 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={pwForm.password_confirmation || ""}
                  onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  disabled={pwSaving}
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50"
                >
                  {pwSaving ? "Processing..." : "Secure Account"}
                </button>
                <button
                  type="button"
                  disabled={pwSaving}
                  onClick={() => setShowPwModal(false)}
                  className="w-full py-3 rounded-2xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all opacity-80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
