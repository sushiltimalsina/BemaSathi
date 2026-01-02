import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const ClientProfile = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("client_token");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);

  // FETCH PROFILE
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await API.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        localStorage.setItem("client_user", JSON.stringify(res.data));

        try {
          const kycRes = await API.get("/kyc/me");
          const kycData = kycRes.data?.data;
          const latestKyc = Array.isArray(kycData) ? kycData[0] : kycData;
          setKycStatus(latestKyc?.status || "not_submitted");
        } catch (err) {
          console.error("KYC status fetch failed", err);
          setKycStatus("unknown");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-300">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Failed to load profile.
      </div>
    );
  }

  const avatar = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark px-6 py-10 transition-colors">
      <div className="max-w-3xl mx-auto">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 opacity-70 hover:opacity-100 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>

        {/* PAGE TITLE */}
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {/* MAIN CARD */}
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow rounded-2xl p-8">
          
          {/* AVATAR + NAME */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-primary-light/20 dark:bg-primary-dark/20 
              text-primary-light dark:text-primary-dark 
              flex items-center justify-center text-3xl font-bold">
              {avatar}
            </div>

            <div>
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-sm opacity-70">BeemaSathi Member</p>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="grid sm:grid-cols-2 gap-5 text-sm">

            <ProfileRow label="Full Name" value={user.name} />
            <ProfileRow label="Phone" value={user.phone} />
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Address" value={user.address || "Not provided"} />
            <ProfileRow label="Date of Birth" value={user.dob || "Not provided"} />
            <ProfileRow label="Smoking Habit" value={user.is_smoker ? "Yes" : "No"} />
            <ProfileRow label="Coverage Type" value={user.coverage_type || "Not provided"} />
            <ProfileRow
              label="Family Members Covered"
              value={user.coverage_type === "family" ? user.family_members || "-" : "N/A"}
            />
            <ProfileRow label="Budget Range" value={user.budget_range || "Not provided"} />

            <div className="sm:col-span-2">
              <ProfileRow
                label="Pre-existing Condition"
                value={user.pre_existing_condition || "None"}
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark">
              <div className="flex flex-col">
                <span className="text-xs opacity-60">KYC Status</span>
                <span className="font-medium mt-1 capitalize">
                  {kycStatus === "pending"
                    ? "Pending"
                    : kycStatus === "approved"
                    ? "Approved"
                    : kycStatus === "rejected"
                    ? "Rejected"
                    : "Not Submitted"}
                </span>
              </div>
              {kycStatus === "approved" ? null : (
                <button
                  onClick={() => navigate("/client/kyc")}
                  className="px-3 py-2 text-xs font-semibold rounded border border-primary-light text-primary-light dark:border-primary-dark dark:text-primary-dark hover:bg-primary-light/10"
                >
                  Submit / Update KYC
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

const ProfileRow = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs opacity-60">{label}</span>
    <span className="font-medium mt-1">{value}</span>
  </div>
);

export default ClientProfile;
