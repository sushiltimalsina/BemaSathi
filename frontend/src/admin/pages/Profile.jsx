import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/adminApi";

const AdminProfile = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
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

      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl shadow p-6 space-y-3">
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
        <div className="flex justify-between">
          <span className="text-muted-light dark:text-muted-dark">Joined</span>
          <span className="font-semibold">
            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "-"}
          </span>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-hover-light dark:hover:bg-hover-dark text-sm font-semibold"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
