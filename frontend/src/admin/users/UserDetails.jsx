import React, { useEffect, useState } from "react";
import API from "../utils/adminApi";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";
import { useAdminConfirm } from "../ui/AdminConfirm";

const UserDetails = ({ user, onClose }) => {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const fallbackOrigin =
    currentOrigin && currentOrigin.includes("5173")
      ? currentOrigin.replace("5173", "8000")
      : currentOrigin;
  const backendBase = (() => {
    const apiUrl = import.meta?.env?.VITE_API_BASE_URL;
    if (apiUrl && /^https?:\/\//i.test(apiUrl)) {
      return apiUrl.replace(/\/$/, "");
    }
    const backendUrl = import.meta?.env?.VITE_BACKEND_URL;
    if (backendUrl) return backendUrl.replace(/\/$/, "");
    return (fallbackOrigin || "").replace(/\/$/, "");
  })();

  const normalizeImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http")) {
      return value;
    }
    if (value.startsWith("/storage/")) {
      return `${backendBase}${value}`;
    }
    return `${backendBase}/storage/${value.replace(/^\/?storage\//, "")}`;
  };

  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullImage, setFullImage] = useState("");
  const { addToast } = useAdminToast();
  const confirm = useAdminConfirm();

  useEffect(() => {
    loadKyc();
  }, []);

  const loadKyc = async () => {
    try {
      const res = await API.get(`/admin/users/${user.id}/kyc`);
      setKyc(res.data || null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updateKyc = async (status) => {
    if (kyc?.status !== "pending") {
      addToast({
        type: "warning",
        title: "KYC finalized",
        message: "User must resubmit KYC before it can be updated.",
      });
      return;
    }
    if (status === "approved") {
      const confirmed = await confirm(
        "Approve this KYC? This action cannot be undone.",
        { title: "Approve KYC", confirmText: "Approve" }
      );
      if (!confirmed) return;
    }
    if (status === "rejected") {
      const confirmed = await confirm(
        "Reject this KYC? The user will need to resubmit.",
        { title: "Reject KYC", confirmText: "Reject" }
      );
      if (!confirmed) return;
    }
    try {
      await API.post(`/admin/users/${user.id}/kyc-update`, { status });
      setKyc((prev) => ({ ...prev, status }));
      addToast({
        type: "success",
        title: status === "approved" ? "KYC Approved" : "KYC Rejected",
        message: `KYC status set to ${status}.`,
      });
    } catch (e) {
      addToast({ type: "error", title: "Update failed", message: "Failed to update KYC." });
    }
  };

  const formatType = (type) => {
    switch (type) {
      case "citizenship":
        return "Citizenship (Front + Back)";
      case "license":
        return "Driving License";
      case "passport":
        return "Passport";
      default:
        return "Unknown";
    }
  };

  return (
    <>
      {/* SIDE PANEL */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
        <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-xl p-6 overflow-y-auto border-l border-slate-300 dark:border-slate-700">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">User Details</h2>
            <button onClick={onClose}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* BASIC USER INFO */}
          <div className="space-y-2 mb-6">
            <p><span className="font-semibold">Name:</span> {user.name}</p>
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Phone:</span> {user.phone}</p>
            <p><span className="font-semibold">Joined:</span> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>

          <hr className="border-slate-300 dark:border-slate-700 mb-6" />

          {/* KYC SECTION */}
          <h3 className="font-semibold mb-3">KYC Information</h3>

          {loading ? (
            <p>Loading KYC...</p>
          ) : !kyc ? (
            <p className="opacity-70">No KYC record found.</p>
          ) : (
            <div className="space-y-6">

              {/* BASIC KYC FIELDS */}
              <p><span className="font-semibold">Document Type:</span> {formatType(kyc.document_type)}</p>

              <p><span className="font-semibold">Document Number:</span> {kyc.document_number}</p>

              <p><span className="font-semibold">DOB:</span> {kyc.dob}</p>

              <p><span className="font-semibold">Address:</span> {kyc.address}</p>
              {Array.isArray(kyc.family_members) && kyc.family_members.length > 0 && (
                <div>
                  <p><span className="font-semibold">Family Members:</span></p>
                  <div className="mt-2 space-y-2 text-xs opacity-80">
                    {kyc.family_members.map((m, idx) => (
                      <div key={idx}>
                        {idx + 1}. {m?.name || "-"} ({m?.relation || "-"}) — {m?.dob || "-"}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATUS */}
              <div className="flex items-center gap-2">
                <span className="font-semibold">KYC Status:</span>
                {kyc.status === "approved" ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : kyc.status === "pending" ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm capitalize">
                  {kyc.status}
                </span>
              </div>

              {/* DOCUMENT PREVIEW SECTION */}
              <div>
                <h4 className="font-semibold mb-2">Uploaded Documents</h4>

                {/* CITIZENSHIP (FRONT + BACK) */}
                {kyc.document_type === "citizenship" && (
                  <div className="grid grid-cols-2 gap-4">
                    {(kyc.front_image || kyc.front_path) && (
                      <DocumentThumb
                        label="Front Side"
                        src={normalizeImageUrl(kyc.front_image || kyc.front_path)}
                        onClick={() =>
                          setFullImage(normalizeImageUrl(kyc.front_image || kyc.front_path))
                        }
                      />
                    )}
                    {(kyc.back_image || kyc.back_path) && (
                      <DocumentThumb
                        label="Back Side"
                        src={normalizeImageUrl(kyc.back_image || kyc.back_path)}
                        onClick={() =>
                          setFullImage(normalizeImageUrl(kyc.back_image || kyc.back_path))
                        }
                      />
                    )}
                  </div>
                )}

                {/* DRIVING LICENSE / PASSPORT (ONE IMAGE ONLY) */}
                {(kyc.document_type === "license" ||
                  kyc.document_type === "passport") && (
                  <div className="grid grid-cols-1 gap-4">
                    {kyc.main_image || kyc.front_path ? (
                      <DocumentThumb
                        label="Main Page"
                        src={normalizeImageUrl(kyc.main_image || kyc.front_path)}
                        onClick={() =>
                          setFullImage(normalizeImageUrl(kyc.main_image || kyc.front_path))
                        }
                      />
                    ) : (
                      <p className="opacity-60 text-sm">
                        No document image uploaded.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* APPROVE / REJECT BUTTONS */}
              {kyc?.status === "pending" && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => updateKyc("approved")}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateKyc("rejected")}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      {fullImage && (
        <FullImageModal src={fullImage} onClose={() => setFullImage("")} />
      )}
    </>
  );
};

/* DOCUMENT THUMBNAIL COMPONENT */
const DocumentThumb = ({ label, src, onClick }) => (
  <div className="relative group cursor-pointer">
    <img
      src={src}
      alt={label}
      className="w-full h-32 object-cover rounded-lg border border-slate-300 dark:border-slate-700"
      onClick={onClick}
    />

    <button
      className="absolute bottom-2 right-2 bg-black/60 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
      onClick={onClick}
    >
      <ArrowsPointingOutIcon className="w-4 h-4" />
    </button>

    <span className="text-xs opacity-70 mt-1 block">{label}</span>
  </div>
);

/* FULLSCREEN IMAGE MODAL */
const FullImageModal = ({ src, onClose }) => (
  <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center">
    <button
      className="absolute top-4 right-4 bg-white dark:bg-slate-900 p-2 rounded-full shadow"
      onClick={onClose}
    >
      <XMarkIcon className="w-6 h-6" />
    </button>

    <img
      src={src}
      className="max-h-[80%] max-w-[90%] rounded-xl shadow-2xl"
      alt="Document"
    />
  </div>
);

export default UserDetails;
