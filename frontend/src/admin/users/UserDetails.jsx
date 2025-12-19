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
    if (kyc?.status === "approved" && status === "rejected") {
      return;
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
    } catch (e) {
      addToast({ type: "error", title: "Update failed", message: "Failed to update KYC." });
    }
  };

  const formatType = (type) => {
    switch (type) {
      case "citizenship":
        return "Citizenship (Front + Back)";
      case "driving_license":
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
              </div>

              {/* DOCUMENT PREVIEW SECTION */}
              <div>
                <h4 className="font-semibold mb-2">Uploaded Documents</h4>

                {/* CITIZENSHIP (FRONT + BACK) */}
                {kyc.document_type === "citizenship" && (
                  <div className="grid grid-cols-2 gap-4">
                    {kyc.front_image && (
                      <DocumentThumb
                        label="Front Side"
                        src={kyc.front_image}
                        onClick={() => setFullImage(kyc.front_image)}
                      />
                    )}
                    {kyc.back_image && (
                      <DocumentThumb
                        label="Back Side"
                        src={kyc.back_image}
                        onClick={() => setFullImage(kyc.back_image)}
                      />
                    )}
                  </div>
                )}

                {/* DRIVING LICENSE / PASSPORT (ONE IMAGE ONLY) */}
                {(kyc.document_type === "driving_license" ||
                  kyc.document_type === "passport") && (
                  <div className="grid grid-cols-1 gap-4">
                    {kyc.main_image ? (
                      <DocumentThumb
                        label="Main Page"
                        src={kyc.main_image}
                        onClick={() => setFullImage(kyc.main_image)}
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
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => updateKyc("approved")}
                  disabled={kyc?.status === "approved"}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Approve
                </button>

                <button
                  onClick={() => updateKyc("rejected")}
                  disabled={kyc?.status === "approved"}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
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
