import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";

const CONDITIONS = ["diabetes", "heart", "hypertension", "asthma"];
const RELATIONS = [
  "Spouse",
  "Son",
  "Daughter",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
];

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [allowDobEdit, setAllowDobEdit] = useState(false);
  const [familyDetails, setFamilyDetails] = useState([]);

  const token = localStorage.getItem("client_token");
  const navigate = useNavigate();

  // Reset messages on mount
  useEffect(() => {
    setError("");
    setSuccess("");
  }, []);

  const syncFamilyDetails = (count, existing = [], selfProfile = null) => {
    const total = Math.max(0, Number(count || 0));
    const next = Array.from({ length: total }).map((_, idx) => {
      const prev = existing[idx] || {};
      if (idx === 0 && selfProfile) {
        return {
          name: selfProfile.name || "",
          relation: "Self",
          dob: selfProfile.dob || "",
        };
      }
      return {
        name: prev.name || "",
        relation: prev.relation || "",
        dob: prev.dob || "",
      };
    });
    setFamilyDetails(next);
  };

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
          family_members: data.family_members ?? 1,
          family_member_details: Array.isArray(data.family_member_details)
            ? data.family_member_details
            : [],
        };

        setUser(normalized);
        setOriginalUser(normalized);

        if (normalized.coverage_type === "family") {
          syncFamilyDetails(
            normalized.family_members,
            normalized.family_member_details,
            { name: normalized.name, dob: normalized.dob }
          );
        } else {
          setFamilyDetails([]);
        }

        const k = await API.get("/kyc/me");
        const list = k.data?.data || [];
        const latest = list.length ? list[0] : null;
        const status = latest?.status || "not_submitted";
        setKycStatus(status);
        setAllowDobEdit(
          status === "not_submitted" ||
            status === "rejected" ||
            (status === "approved" && Boolean(latest?.allow_edit))
        );
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

  useEffect(() => {
    if (!user) return;
    if (user.coverage_type === "family") {
      const count = Math.max(2, Number(user.family_members || 2));
      if (count !== user.family_members) {
        setUser((prev) => ({ ...prev, family_members: count }));
      }
      syncFamilyDetails(count, familyDetails, { name: user.name, dob: user.dob });
    } else {
      if (user.family_members !== 1) {
        setUser((prev) => ({ ...prev, family_members: 1 }));
      }
      setFamilyDetails([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.coverage_type, user?.family_members, user?.name, user?.dob]);

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

    setError("");
    setSuccess("");

    try {
      const payload = {
        name: user.name,
        phone: user.phone,
        address: user.address,
        is_smoker: user.is_smoker ? 1 : 0,
        budget_range: user.budget_range,
        coverage_type: user.coverage_type,
        family_members:
          user.coverage_type === "family"
            ? Number(user.family_members || 2)
            : 1,
        pre_existing_conditions: user.pre_existing_conditions,
        family_member_details:
          user.coverage_type === "family" ? familyDetails : [],
      };
      if (allowDobEdit) {
        payload.dob = user.dob;
      }

      if (user.coverage_type === "family") {
        if (!payload.family_members || payload.family_members < 2) {
          setError("Family coverage must include at least 2 members.");
          return;
        }
        if (familyDetails.length !== payload.family_members) {
          setError("Please provide details for all family members.");
          return;
        }
        const invalid = familyDetails.some(
          (m) => !m.name?.trim() || !m.relation?.trim() || !m.dob
        );
        if (invalid) {
          setError("Please fill name, relation, and DOB for all family members.");
          return;
        }
      }

      const res = await API.put(
        "/update-profile",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const nextUser = res.data?.user || user;
      setUser(nextUser);
      setOriginalUser(nextUser);
      if (nextUser.coverage_type === "family") {
        syncFamilyDetails(
          nextUser.family_members,
          nextUser.family_member_details || familyDetails,
          { name: nextUser.name, dob: nextUser.dob }
        );
      } else {
        setFamilyDetails([]);
      }
      localStorage.setItem("profile_updated_at", Date.now().toString());
      window.dispatchEvent(
        new CustomEvent("profile:updated", { detail: { user: nextUser } })
      );
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
          <ProfileRow
            label="Family Members Covered"
            value={user.coverage_type === "family" ? user.family_members : "N/A"}
          />
          <ProfileRow label="Smoker" value={user.is_smoker ? "Yes" : "No"} />
          <ProfileRow
            label="Pre-existing Conditions"
            value={
              user.pre_existing_conditions?.length
                ? user.pre_existing_conditions.join(", ")
                : "None"
            }
          />

          <button
            onClick={startEditing}
            className="px-4 py-2 bg-primary-light text-white rounded-lg text-sm hover:opacity-90"
          >
            Edit Profile
          </button>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
        </div>
      )}

      {/* EDIT MODE */}
      {editing && (
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
            <input
              type="date"
              value={user.dob || ""}
              className={inputEnabled}
              disabled={!allowDobEdit}
              onChange={(e) => setUser({ ...user, dob: e.target.value })}
            />
            <p className="text-[11px] opacity-70 mt-1">
              {allowDobEdit
                ? "DOB edit is available when KYC is not submitted, rejected, or update access is granted."
                : "Date of birth is locked after registration. To update request KYC update from support."}
            </p>
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

          {user.coverage_type === "family" && (
            <>
              <InputRow
                label="Family Members Covered"
                field="family_members"
                user={user}
                setUser={setUser}
                inputClass={inputEnabled}
                type="number"
                min="2"
                max="20"
              />

              <div>
                <label className="text-xs opacity-80">Family Member Details</label>
                <p className="text-[11px] opacity-70 mt-1">
                  Add name, relation, and DOB for each covered member.
                </p>

                <div className="space-y-3 mt-3">
                  {familyDetails.map((member, idx) => {
                    const isSelf = idx === 0;
                    return (
                      <div
                        key={idx}
                        className="grid md:grid-cols-3 gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark"
                      >
                        <div>
                          <label className="text-[11px] opacity-80">Full Name</label>
                          <input
                            className={inputEnabled}
                            value={isSelf ? user.name : member.name}
                            disabled={isSelf}
                            onChange={(e) => {
                              const next = [...familyDetails];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setFamilyDetails(next);
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-[11px] opacity-80">Relation</label>
                          <select
                            className={inputEnabled}
                            value={isSelf ? "Self" : member.relation}
                            disabled={isSelf}
                            onChange={(e) => {
                              const next = [...familyDetails];
                              next[idx] = { ...next[idx], relation: e.target.value };
                              setFamilyDetails(next);
                            }}
                          >
                            {isSelf ? (
                              <option value="Self">Self</option>
                            ) : (
                              <>
                                <option value="">Select relation</option>
                                {RELATIONS.map((rel) => (
                                  <option key={rel} value={rel}>
                                    {rel}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] opacity-80">Date of Birth</label>
                          <input
                            type="date"
                            className={inputEnabled}
                            value={isSelf ? user.dob || "" : member.dob || ""}
                            disabled={isSelf}
                            onChange={(e) => {
                              const next = [...familyDetails];
                              next[idx] = { ...next[idx], dob: e.target.value };
                              setFamilyDetails(next);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

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
            {user.coverage_type === "family" && (
              <p className="text-[11px] opacity-70 mt-1">
                Choose "Yes" if any covered family member smokes.
              </p>
            )}
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
            {user.coverage_type === "family" && (
              <p className="text-[11px] opacity-70 mt-2">
                Select conditions if any covered family member has them.
              </p>
            )}
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

const InputRow = ({ label, field, user, setUser, inputClass, ...props }) => (
  <div>
    <label className="text-xs opacity-80">{label}</label>
    <input
      {...props}
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
