import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const UserDetails = ({ user, onClose }) => {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      await API.post(`/admin/users/${user.id}/kyc-update`, { status });
      setKyc((prev) => ({ ...prev, status }));
    } catch (e) {
      alert("Unable to update KYC.");
    }
  };

  useEffect(() => {
    loadKyc();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-xl p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">User Details</h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* BASIC INFO */}
        <div className="space-y-2">
          <p><span className="font-semibold">Name:</span> {user.name}</p>
          <p><span className="font-semibold">Email:</span> {user.email}</p>
          <p><span className="font-semibold">Phone:</span> {user.phone}</p>
          <p><span className="font-semibold">Joined:</span> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>

        <hr className="my-6 border-slate-300 dark:border-slate-700" />

        {/* KYC SECTION */}
        <h3 className="font-semibold mb-3">KYC Information</h3>

        {loading ? (
          <p>Loading KYC...</p>
        ) : !kyc ? (
          <p className="opacity-70">No KYC record found.</p>
        ) : (
          <div className="space-y-4">
            <p><span className="font-semibold">DOB:</span> {kyc.dob}</p>
            <p><span className="font-semibold">Address:</span> {kyc.address}</p>
            <p><span className="font-semibold">PAN:</span> {kyc.pan_number}</p>

            <div className="mt-3">
              <span className="font-semibold">KYC Status:</span>{" "}
              {kyc.status === "approved" ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600 inline-block" />
              ) : kyc.status === "pending" ? (
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 inline-block" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-600 inline-block" />
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => updateKyc("approved")}
                className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Approve
              </button>

              <button
                onClick={() => updateKyc("rejected")}
                className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
