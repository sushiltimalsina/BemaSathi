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

const UserDetails = ({ user, onClose, onKycEditAllowed, onKycStatusUpdated }) => {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const deriveApiOrigin = (origin) => {
    if (!origin) return "";
    try {
      const url = new URL(origin);
      if (!url.host.includes("beemasathi.")) return origin;
      const parts = url.host.split(".");
      if (parts.length > 2) {
        parts[0] = "api";
        url.host = parts.join(".");
      }
      return url.origin;
    } catch {
      return origin;
    }
  };
  const fallbackOrigin =
    currentOrigin && currentOrigin.includes("5173")
      ? currentOrigin.replace("5173", "8000")
      : deriveApiOrigin(currentOrigin);
  const backendBase = (() => {
    const apiUrl = import.meta?.env?.VITE_API_BASE_URL;
    if (apiUrl && /^https?:\/\//i.test(apiUrl)) {
      return apiUrl.replace(/\/$/, "").replace(/\/api$/, "");
    }
    const backendUrl = import.meta?.env?.VITE_BACKEND_URL;
    if (backendUrl) return backendUrl.replace(/\/$/, "");
    return (fallbackOrigin || "").replace(/\/$/, "");
  })();

  const normalizeImageUrl = (value, previewVersion) => {
    if (!value) return "";
    if (value.startsWith("http")) {
      return previewVersion ? `${value}?v=${encodeURIComponent(previewVersion)}` : value;
    }
    if (value.startsWith("/storage/")) {
      const baseUrl = `${backendBase}${value}`;
      return previewVersion ? `${baseUrl}?v=${encodeURIComponent(previewVersion)}` : baseUrl;
    }
    const baseUrl = `${backendBase}/storage/${value.replace(/^\/?storage\//, "")}`;
    return previewVersion ? `${baseUrl}?v=${encodeURIComponent(previewVersion)}` : baseUrl;
  };

  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullImage, setFullImage] = useState("");
  const { addToast } = useAdminToast();
  const confirm = useAdminConfirm();
  const [remarksModal, setRemarksModal] = useState({ open: false, value: "" });
  const [pendingAction, setPendingAction] = useState(null);

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
    let remarks;
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
      setPendingAction(status);
      setRemarksModal({ open: true, value: "" });
      return;
    }
    const nextRemarks = remarks?.trim() || null;
    const previous = kyc;
    setKyc((prev) => ({
      ...prev,
      status,
      remarks: nextRemarks,
      allow_edit: false,
      has_kyc_update_request: false,
    }));
    if (onKycStatusUpdated) {
      onKycStatusUpdated(user.id, status, nextRemarks);
    }
    addToast({
      type: status === "approved" ? "success" : "error",
      title: status === "approved" ? "KYC Approved" : "KYC Rejected",
      message: `KYC status set to ${status}.`,
    });
    try {
      await API.post(`/admin/users/${user.id}/kyc-update`, {
        status,
        remarks: nextRemarks,
      });
    } catch (e) {
      setKyc(previous);
      if (onKycStatusUpdated) {
        onKycStatusUpdated(user.id, previous?.status, previous?.remarks || null);
      }
      addToast({ type: "error", title: "Update failed", message: "Failed to update KYC." });
    }
  };

  const allowKycEdit = async () => {
    const confirmed = await confirm(
      "Allow this user to update KYC details? They will need to resubmit for approval.",
      { title: "Allow KYC Update", confirmText: "Allow" }
    );
    if (!confirmed) return;
    try {
      const res = await API.post(`/admin/users/${user.id}/kyc-allow-edit`);
      setKyc((prev) => ({ ...prev, ...(res.data?.kyc || {}), allow_edit: true }));
      addToast({
        type: "success",
        title: "Edit access granted",
        message: "User can now update and resubmit KYC.",
      });
      if (onKycEditAllowed) {
        onKycEditAllowed(user.id);
      }
    } catch (e) {
      addToast({ type: "error", title: "Update failed", message: "Failed to allow KYC edit." });
    }
  };

  const submitRemarks = async () => {
    const trimmed = remarksModal.value.trim();
    if (!trimmed) {
      addToast({
        type: "warning",
        title: "Remarks required",
        message: "Please provide remarks to reject KYC.",
      });
      return;
    }
    const previous = kyc;
    setKyc((prev) => ({
      ...prev,
      status: pendingAction,
      remarks: trimmed,
      allow_edit: false,
      has_kyc_update_request: false,
    }));
    if (onKycStatusUpdated) {
      onKycStatusUpdated(user.id, pendingAction, trimmed);
    }
    addToast({
      type: "error",
      title: "KYC Rejected",
      message: "KYC status set to rejected.",
    });
    setRemarksModal({ open: false, value: "" });
    setPendingAction(null);
    try {
      await API.post(`/admin/users/${user.id}/kyc-update`, {
        status: pendingAction,
        remarks: trimmed,
      });
    } catch (e) {
      setKyc(previous);
      if (onKycStatusUpdated) {
        onKycStatusUpdated(user.id, previous?.status, previous?.remarks || null);
      }
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

  const previewVersion = kyc?.updated_at || kyc?.verified_at || kyc?.created_at || "";

  return (
    <>
      {/* SIDE PANEL */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
        <div className="w-full max-w-md h-full bg-card-light dark:bg-card-dark shadow-xl p-6 overflow-y-auto border-l border-border-light dark:border-border-dark">

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

          <hr className="border-border-light dark:border-border-dark mb-6" />

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
                        {idx + 1}. {m?.name || "-"} ({m?.relation || "-"}) - {m?.dob || "-"}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATUS */}
              <div className="flex items-center gap-2">
                <span className="font-semibold">KYC Status:</span>
                {kyc.status === "approved" ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : kyc.status === "pending" ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm capitalize">
                  {kyc.status}
                </span>
              </div>

              {/* DOCUMENT PREVIEW SECTION */}
              <div>
                <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                {/** Use updated_at as a cache-buster for newly uploaded files */}
                {/** This prevents stale previews after resubmission */}

                {/* CITIZENSHIP (FRONT + BACK) */}
                {kyc.document_type === "citizenship" && (
                  <div className="grid grid-cols-2 gap-4">
                    {(kyc.front_image || kyc.front_path) && (
                      <DocumentThumb
                        label="Front Side"
                        src={normalizeImageUrl(kyc.front_image || kyc.front_path, previewVersion)}
                        onClick={() =>
                          setFullImage(
                            normalizeImageUrl(kyc.front_image || kyc.front_path, previewVersion)
                          )
                        }
                      />
                    )}
                    {(kyc.back_image || kyc.back_path) && (
                      <DocumentThumb
                        label="Back Side"
                        src={normalizeImageUrl(kyc.back_image || kyc.back_path, previewVersion)}
                        onClick={() =>
                          setFullImage(
                            normalizeImageUrl(kyc.back_image || kyc.back_path, previewVersion)
                          )
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
                        src={normalizeImageUrl(kyc.main_image || kyc.front_path, previewVersion)}
                        onClick={() =>
                          setFullImage(
                            normalizeImageUrl(kyc.main_image || kyc.front_path, previewVersion)
                          )
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
              {kyc?.status === "approved" && !kyc?.allow_edit && kyc?.has_kyc_update_request && (
                <div className="mt-4">
                  <button
                    onClick={allowKycEdit}
                    className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Allow KYC Update
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

      {remarksModal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="max-w-md w-full mx-4 bg-card-light dark:bg-card-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark p-5 relative">
            <h3 className="text-lg font-semibold mb-2">Rejection Remarks</h3>
            <p className="text-xs opacity-70 mb-3">
              Provide a clear reason so the user can fix and resubmit.
            </p>
            <textarea
              value={remarksModal.value}
              onChange={(e) =>
                setRemarksModal((prev) => ({ ...prev, value: e.target.value }))
              }
              rows={4}
              className="w-full px-3 py-2 rounded-lg border bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark text-sm"
              placeholder="Enter rejection remarks..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRemarksModal({ open: false, value: "" });
                  setPendingAction(null);
                }}
                className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark text-sm hover:bg-hover-light dark:hover:bg-hover-dark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRemarks}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Reject KYC
              </button>
            </div>
          </div>
        </div>
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
      className="w-full h-32 object-cover rounded-lg border border-border-light dark:border-border-dark"
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
      className="absolute top-4 right-4 bg-card-light dark:bg-card-dark p-2 rounded-full shadow"
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


