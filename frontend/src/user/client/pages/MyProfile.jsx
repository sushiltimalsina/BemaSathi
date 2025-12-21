import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";

const CONDITIONS = ["diabetes", "heart", "hypertension", "asthma"];

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [kycStatus, setKycStatus] = useState("not_submitted");

  const token = localStorage.getItem("client_token");
  const navigate = useNavigate();

  const isLocked = kycStatus === "approved";

  // Reset messages on mount
  useEffect(() => {
    setError("");
    setSuccess("");
  }, []);

  // Load user + KYC
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/me");
        const data = res.data || {};

        const normalized = {
          ...data,
          pre_existing_conditions: Array.isArray(data.pre_existing_conditions)
            ? data.pre_existing_conditions
            : [],
          is_smoker: !!data.is_smoker,
        };

        setUser(normalized);
        setOriginalUser(normalized);

        const k = await API.get("/kyc/me");
        const list = k.data?.data || [];
        const status = list.length ? list[0].status : "not_submitted";
        setKycStatus(status);
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);


  const inputEnabled =
    "w-full mt-1 px-3 py-2 rounded-lg text-sm border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark";

  const inputDisabled =
    "w-full mt-1 px-3 py-2 rounded-lg text-sm bg-gray-200/90 dark:bg-slate-700/70 text-gray-500 dark:text-gray-300 opacity-80 cursor-not-allowed";

  const badgeColor =
    kycStatus === "approved"
      ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200"
      : kycStatus === "pending"
      ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
      : kycStatus === "rejected"
      ? "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
      : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300";


  if (loading)
    return <div className="text-center pt-20">Loading profile...</div>;

  if (!user)
    return (
      <div className="text-center pt-20 text-red-500">User not found</div>
    );

  const startEditing = () => {
    if (isLocked) return;
    setError("");
    setSuccess("");
    setOriginalUser(user); // snapshot before editing
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError("");
    setSuccess("");
    if (originalUser) {
      setUser(originalUser);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setError("");
    setSuccess("");

    try {
      await API.put(
        "/update-profile",
        {
          name: user.name,
          phone: user.phone,
          address: user.address,
          dob: user.dob,
          is_smoker: user.is_smoker ? 1 : 0,
          budget_range: user.budget_range,
          coverage_type: user.coverage_type,
          pre_existing_conditions: user.pre_existing_conditions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("force_recalculate", "1");
      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch {
      setError("Failed to update profile.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-text-light dark:text-text-dark">
      <h1 className="text-3xl font-bold mb-6 text-primary-light dark:text-primary-dark">
        My Profile
      </h1>

      {/* KYC STATUS CARD (FIXED FOR LIGHT/DARK) */}
      <div
        className="
          bg-card-light dark:bg-card-dark
          border border-border-light dark:border-border-dark
          rounded-xl p-4 mb-4
          cursor-pointer
          hover:bg-hover-light dark:hover:bg-hover-dark
          transition-all duration-200
          shadow-sm dark:shadow-[0_0_12px_rgba(0,0,0,0.6)]
          flex justify-between items-center
          text-text-light dark:text-text-dark
        "
        onClick={() => navigate("/client/kyc")}
      >
        <div>
          <div className="font-semibold text-sm">KYC Status</div>
          <div className="capitalize opacity-70 text-xs">{kycStatus}</div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
        >
          {kycStatus === "not_submitted"
            ? "Not Submitted"
            : kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
        </span>
      </div>

      {/* VIEW MODE */}
      {!editing && (
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 space-y-4 shadow text-text-light dark:text-text-dark">
          <ProfileRow label="Full Name" value={user.name} />
          <ProfileRow label="Phone" value={user.phone} />
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="Address" value={user.address} />
          <ProfileRow label="Date of Birth" value={user.dob} />
          <ProfileRow label="Budget Range" value={user.budget_range} />
          <ProfileRow label="Coverage Type" value={user.coverage_type} />
          <ProfileRow label="Smoker" value={user.is_smoker ? "Yes" : "No"} />
          <ProfileRow
            label="Pre-existing Conditions"
            value={
              user.pre_existing_conditions?.length
                ? user.pre_existing_conditions.join(", ")
                : "None"
            }
          />

          {!isLocked && (
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-primary-light text-white rounded-lg text-sm hover:opacity-90"
            >
              Edit Profile
            </button>
          )}

          {isLocked && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200 text-sm">
              Your KYC is approved. Profile is locked and cannot be edited.
            </div>
          )}

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
        </div>
      )}

      {/* EDIT MODE */}
      {editing && !isLocked && (
        <form
          onSubmit={handleUpdate}
          className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6 space-y-5 shadow mt-5 text-text-light dark:text-text-dark"
        >
          <InputRow
            label="Full Name"
            field="name"
            user={user}
            setUser={setUser}
            inputClass={inputEnabled}
          />
          <InputRow
            label="Phone"
            field="phone"
            user={user}
            setUser={setUser}
            inputClass={inputEnabled}
          />
          <InputRow
            label="Address"
            field="address"
            user={user}
            setUser={setUser}
            inputClass={inputEnabled}
          />

          {/* DOB LOCKED */}
          <div>
            <label className="text-xs opacity-80">Date of Birth</label>
            <input type="date" disabled value={user.dob || ""} className={inputDisabled} />
          </div>

          <SelectRow
            label="Budget Range"
            field="budget_range"
            user={user}
            setUser={setUser}
            options={["<10000", "10000-20000", "20000-30000", ">30000"]}
          />

          <SelectRow
            label="Coverage Type"
            field="coverage_type"
            user={user}
            setUser={setUser}
            options={["individual", "family"]}
          />

          {/* SMOKER */}
          <div>
            <label className="text-xs opacity-80">Smoking Habit</label>
            <select
              value={user.is_smoker ? "1" : "0"}
              onChange={(e) =>
                setUser({ ...user, is_smoker: e.target.value === "1" })
              }
              className={inputEnabled}
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>

          {/* PRE-EXISTING CONDITIONS (CUSTOM CHECKBOX UI) */}
          <div>
            <label className="text-xs opacity-80">Pre-existing Conditions</label>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {CONDITIONS.map((cond) => {
                const isChecked =
                  user.pre_existing_conditions &&
                  user.pre_existing_conditions.includes(cond);

                const toggleCond = () => {
                  setUser((prev) => {
                    const exists =
                      prev.pre_existing_conditions &&
                      prev.pre_existing_conditions.includes(cond);
                    return {
                      ...prev,
                      pre_existing_conditions: exists
                        ? prev.pre_existing_conditions.filter((x) => x !== cond)
                        : [...(prev.pre_existing_conditions || []), cond],
                    };
                  });
                };

                return (
                  <div
                    key={cond}
                    onClick={toggleCond}
                    className="
                      flex items-center gap-3 p-2 rounded-lg cursor-pointer
                      bg-hover-light dark:bg-hover-dark
                      hover:bg-blue-50 dark:hover:bg-slate-700
                      transition
                    "
                  >
                    {/* Fake checkbox */}
                    <div
                      className={`
                        w-4 h-4 rounded border 
                        flex items-center justify-center
                        ${
                          isChecked
                            ? "border-blue-600 dark:border-blue-400"
                            : "border-border-light dark:border-border-dark"
                        }
                      `}
                    >
                      {isChecked && (
                        <div className="w-2 h-2 rounded-sm bg-blue-600 dark:bg-blue-400" />
                      )}
                    </div>

                    <span className="capitalize text-sm">{cond}</span>

                    {/* Hidden real checkbox just for semantics (not relied on visually) */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="hidden"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* DISCLAIMER */}
          <div className="rounded-md border-l-4 border-red-600 bg-white p-3 shadow-sm 
                dark:border-red-400 dark:bg-red-900/30">
  <div className="flex items-start gap-2">
    <span className="text-red-700 dark:text-red-200 text-lg">⚠️</span>
    <p className="text-xs leading-relaxed text-red-800 dark:text-red-100">
      <strong>Important Notice:</strong> Please ensure all information provided is accurate. 
      Submitting false or incorrect details may result in claim rejection or loss of policy benefits.
    </p>
  </div>
</div>


          {/* BUTTONS */}
          <div className="flex gap-3 pt-3">
            <button className="px-4 py-2 text-sm bg-primary-light text-white rounded-lg hover:opacity-90">
              Save Changes
            </button>

            <button
              type="button"
              onClick={cancelEditing}
              className="px-4 py-2 text-sm bg-gray-300 dark:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
        </form>
      )}

    </div>
  );
};

// SIMPLE SUBCOMPONENTS
const ProfileRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="opacity-70">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const InputRow = ({ label, field, user, setUser, inputClass }) => (
  <div>
    <label className="text-xs opacity-80">{label}</label>
    <input
      className={inputClass}
      value={user[field] || ""}
      onChange={(e) => setUser({ ...user, [field]: e.target.value })}
    />
  </div>
);

const SelectRow = ({ label, field, options, user, setUser }) => (
  <div>
    <label className="text-xs opacity-80">{label}</label>
    <select
      value={user[field] || ""}
      onChange={(e) => setUser({ ...user, [field]: e.target.value })}
      className="
        w-full mt-1 px-3 py-2 rounded-lg text-sm
        border border-border-light dark:border-border-dark
        bg-card-light dark:bg-card-dark
        text-text-light dark:text-text-dark
      "
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default MyProfile;
