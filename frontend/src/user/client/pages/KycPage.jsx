// FINAL KYC PAGE (MERGED + ALL UPGRADES)
// - Always accessible (Profile -> KYC works even if approved)
// - Approved = locked but visible (NO redirect unless from Buy)
// - Drag & Drop upload + preview
// - JPG/JPEG/PNG only, max 5MB
// - Verified banner
// - Download PDF
// - View Details Modal
// - Light/Dark fully compatible

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../../api/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

const KycPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const redirectPolicyId = query.get("policy");

  const pdfRef = useRef(null);

  const [user, setUser] = useState(null);
  const [kycList, setKycList] = useState([]);
  const latestKyc = kycList?.[0] || null;
  const kycStatus = latestKyc?.status || "not_submitted";
  const isPending = kycStatus === "pending";
  const isApproved = kycStatus === "approved";
  // Lock edits if KYC is pending or approved
  const isLocked = isApproved || isPending;

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    dob: "",
    phone: "",
    address: "",
    email: "",
  });

  const [documentType, setDocumentType] = useState("citizenship");
  const [documentNumber, setDocumentNumber] = useState("");

  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);

  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [dragFront, setDragFront] = useState(false);
  const [dragBack, setDragBack] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const fallbackOrigin =
    currentOrigin && currentOrigin.includes("5173")
      ? currentOrigin.replace("5173", "8000")
      : currentOrigin;
  const apiBase = (
    import.meta?.env?.VITE_API_BASE_URL ||
    import.meta?.env?.VITE_BACKEND_URL ||
    fallbackOrigin ||
    ""
  ).replace(/\/$/, "");
  const buildUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleaned = path.replace(/^\/?storage\//, "");
    return `${apiBase || ""}/storage/${cleaned}`;
  };

  // Load user + KYC
  useEffect(() => {
    const load = async () => {
      const u = await API.get("/me");
      setUser(u.data);

      setProfile({
        full_name: u.data?.name || "",
        dob: u.data?.dob || "",
        phone: u.data?.phone || "",
        address: u.data?.address || "",
        email: u.data?.email || "",
      });

      const k = await API.get("/kyc/me");
      const list = k.data.data || [];
      setKycList(list);

      if (list.length) {
        const info = list[0];
        if (info.document_type) setDocumentType(info.document_type);
        if (info.document_number) setDocumentNumber(info.document_number);
        const frontUrl = buildUrl(info.front_path || info.front_image_url);
        const backUrl = buildUrl(info.back_path || info.back_image_url);
        if (frontUrl) setFrontPreview(frontUrl);
        if (backUrl) setBackPreview(backUrl);
      }
    };
    load();
  }, []);

  // Redirect only when approved and a policy redirect is present
  useEffect(() => {
    if (!redirectPolicyId) return;
    if (latestKyc?.status === "approved") {
      navigate(`/client/buy?policy=${redirectPolicyId}`, { replace: true });
    }
  }, [latestKyc?.status, redirectPolicyId, navigate]);

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border text-sm bg-card-light dark:bg-card-dark " +
    "text-text-light dark:text-text-dark border-border-light dark:border-border-dark " +
    "focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark outline-none transition disabled:opacity-60 disabled:cursor-not-allowed";

  // Validate file
  const validateFile = (file) => {
    if (!file) return false;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, JPEG, PNG formats allowed.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Max file size is 5MB.");
      return false;
    }
    return true;
  };

  // Input upload
  const handleFileInput = (e, type) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!validateFile(file)) return;

    if (type === "front") {
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
    } else {
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
    }
    setError("");
  };

  const clearFile = (type) => {
    if (isLocked) return;
    if (type === "front") {
      setFrontFile(null);
      setFrontPreview(null);
      const frontInput = document.getElementById("frontInput");
      if (frontInput) frontInput.value = "";
    } else {
      setBackFile(null);
      setBackPreview(null);
      const backInput = document.getElementById("backInput");
      if (backInput) backInput.value = "";
    }
  };

  // Drag-drop
  const handleDrop = (e, type) => {
    if (isLocked) return;
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!validateFile(file)) return;

    if (type === "front") {
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
      setDragFront(false);
    } else {
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
      setDragBack(false);
    }
    setError("");
  };

  // Upload Box UI
  const UploadBox = ({ label, preview, dragActive, setDragActive, onDrop, onClick }) => (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold">{label}</label>
        {preview && !isLocked && (
          <button
            type="button"
            onClick={() => clearFile(label.toLowerCase().includes("front") ? "front" : "back")}
            className="text-xs text-rose-600 hover:underline"
          >
            Delete
          </button>
        )}
      </div>

      <div
        onClick={() => !isLocked && onClick()}
        onDragEnter={(e) => {
          if (!isLocked) {
            e.preventDefault();
            setDragActive(true);
          }
        }}
        onDragLeave={(e) => {
          if (!isLocked) {
            e.preventDefault();
            setDragActive(false);
          }
        }}
        onDragOver={(e) => (!isLocked ? e.preventDefault() : null)}
        onDrop={(e) => !isLocked && onDrop(e)}
        className={`mt-2 relative flex flex-col items-center justify-center p-6 rounded-xl
        border-2 border-dashed transition-all
        bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark
        ${!isLocked ? "cursor-pointer hover:border-primary-light dark:hover:border-primary-dark" : "opacity-70 cursor-not-allowed"}
        ${dragActive ? "border-primary-light bg-hover-light" : ""}
      `}
      >
        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl">
            <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4m-9 3h10v5H7v-5z" />
            </svg>
            <p className="text-xs text-green-100">Document locked</p>
          </div>
        )}

        {!isLocked && (
          <>
            <svg
              className="w-10 h-10 mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8m0 0l-3 3m3-3l3 3m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm opacity-70">Click or Drag to Upload</p>
          </>
        )}
      </div>

      {preview && (
        <div className="mt-3 rounded-xl overflow-hidden shadow border border-border-light dark:border-border-dark relative">
          <img src={preview} className="w-full object-cover" />
        </div>
      )}
    </div>
  );

  // Submit KYC
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setError("");
    setMsg("");

    if (!frontPreview) return setError("Front document required.");
    if (documentType === "citizenship" && !backPreview)
      return setError("Back document required for citizenship.");
    if (!documentNumber.trim()) return setError("Document number is required.");

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("document_type", documentType);
      fd.append("document_number", documentNumber);
      if (frontFile) fd.append("front", frontFile);
      if (backFile) fd.append("back", backFile);
      fd.append("full_name", profile.full_name);
      fd.append("dob", profile.dob);
      fd.append("phone", profile.phone);
      fd.append("address", profile.address);

      const res = await API.post("/kyc/submit", fd);
      setMsg(res.data.message);
      // optimistic refresh
      const submitted = res.data?.data;
      if (submitted) {
        setKycList((prev) => [submitted, ...(prev || [])]);
      }
      setLoading(false);
    } catch (error) {
      setError("Submission failed.");
      setLoading(false);
    }
  };

  // Lazy-load PDF deps from CDN (avoid bundler resolution issues)
  const loadPdfLibs = async () => {
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import(/* @vite-ignore */ "https://esm.sh/jspdf@2.5.1"),
        import(/* @vite-ignore */ "https://esm.sh/html2canvas@1.4.1"),
      ]);
      return { jsPDF, html2canvas };
    } catch (cdnErr) {
      console.error("PDF libs unavailable", cdnErr);
      return null;
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    try {
      const libs = await loadPdfLibs();
      if (libs) {
        const { jsPDF, html2canvas } = libs;
        const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save("kyc-details.pdf");
        return;
      }

      // Fallback: open print dialog with KYC content
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>KYC Details</title></head><body>${pdfRef.current.innerHTML}</body></html>`
        );
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        return;
      }

      setError("Failed to generate PDF. Please try again.");
    } catch (err) {
      console.error(err);
      // Last-resort fallback to print dialog on error
      const printWindow = window.open("", "_blank");
      if (printWindow && pdfRef.current) {
        printWindow.document.write(
          `<html><head><title>KYC Details</title></head><body>${pdfRef.current.innerHTML}</body></html>`
        );
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        setError("Failed to generate PDF. Please try again.");
      }
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24">

      {/* VERIFIED BANNER */}
      {(isPending || isApproved) && (
        <div
          className={`mb-4 p-4 rounded-xl border flex items-center gap-3 ${
            isApproved
              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
          }`}
        >
          <svg
            className={`w-6 h-6 ${isApproved ? "text-green-600 dark:text-green-300" : "text-amber-600 dark:text-amber-300"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l2 2 4-4m-2-6a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
          <div>
            <p
              className={`text-sm font-semibold ${
                isApproved ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-100"
              }`}
            >
              {isApproved ? "KYC Verified & Locked" : "KYC Submitted - Pending Review"}
            </p>
            <p
              className={`text-xs ${
                isApproved
                  ? "text-green-700/80 dark:text-green-200/80"
                  : "text-amber-700/80 dark:text-amber-200/80"
              }`}
            >
              {isApproved
                ? "You can view details but cannot edit them."
                : "Your KYC was submitted and is awaiting approval."}
            </p>
          </div>
        </div>
      )}

      {/* PDF + MODAL OPTIONS */}
      {isLocked && (
        <div className="mb-4 flex gap-3">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 text-sm rounded-lg bg-primary-light text-white hover:opacity-90"
          >
            Download KYC PDF
          </button>

          <button
            onClick={() => setShowDetailsModal(true)}
            className="px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark hover:bg-hover-light dark:hover:bg-hover-dark"
          >
            View Submitted Details
          </button>
        </div>
      )}

      {/* ===================== MAIN FORM ===================== */}

      <div ref={pdfRef}>
        {/* HEADER */}
        <h1 className="text-3xl font-bold mb-6 text-text-light dark:text-text-dark">
          KYC Verification
        </h1>



        {/* STATUS */}
        <div className="p-5 rounded-xl shadow bg-card-light dark:bg-card-dark border mb-8 border-border-light dark:border-border-dark">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">KYC Status</h2>
            <span
              className={`px-3 py-1 text-xs rounded-full font-medium border
                ${
                  !latestKyc || latestKyc.status === "not_submitted"
                    ? "bg-hover-light dark:bg-hover-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark"
                    : latestKyc.status === "pending"
                    ? "bg-yellow-100 dark:bg-yellow-600 text-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700"
                    : latestKyc.status === "approved"
                    ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-100 border-green-300 dark:border-green-700"
                    : "bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-200 border-red-300 dark:border-red-800"
                }`}
            >
              {latestKyc?.status || "Not Submitted"}
            </span>
          </div>
        </div>
                {/* IMPORTANT NOTICE WHEN NOT SUBMITTED */}
        {(kycStatus === "not_submitted" || kycStatus === "rejected") && (
          <div className="rounded-md border-l-4 border-red-200 bg-white p-3 shadow-sm 
                          dark:border-red-200 dark:bg-red-900/30">
            <div className="flex items-start gap-2">
              <span className="text-red-700 dark:text-red-200 text-lg">⚠️</span>
              <p className="text-xs leading-relaxed text-red-800 dark:text-red-900">
                <strong>Important Notice:</strong> Please ensure all information provided is accurate. 
                Submitting false or incorrect details may result in claim rejection or loss of policy benefits.
              </p>
              <br></br>
            </div>
          </div>
          

        )}
        {/* FORM */}
        <form
        
          onSubmit={handleSubmit}
          className="p-6 rounded-xl shadow bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark space-y-8"
        >

          
          {/* USER INFO */}
          <div>
            <br></br>
            <h3 className="text-lg font-semibold mb-4">Your Information</h3>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold">Full Name</label>
                <input
                  className={inputClass}
                  value={profile.full_name}
                  disabled={isLocked}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Date of Birth</label>
                <input
                  type="date"
                  className={inputClass}
                  value={profile.dob}
                  disabled={isLocked}
                  onChange={(e) =>
                    setProfile({ ...profile, dob: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Phone</label>
                <input
                  className={inputClass}
                  value={profile.phone}
                  disabled={isLocked}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Address</label>
                <input
                  className={inputClass}
                  value={profile.address}
                  disabled={isLocked}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* DOCUMENT INFO */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Document Information</h3>

            <label className="text-xs font-semibold">Document Type</label>
            <select
              className={inputClass}
              value={documentType}
              disabled={isLocked}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="citizenship">Citizenship</option>
              <option value="license">Driving License</option>
              <option value="passport">Passport</option>
            </select>

            <div className="mt-4">
              <label className="text-xs font-semibold">Document Number</label>
              <input
                className={inputClass}
                value={documentNumber}
                disabled={isLocked}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
          </div>

          {/* DOCUMENT UPLOAD */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>

            {documentType === "citizenship" ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* FRONT UPLOAD */}
                <UploadBox
                  label="Front Side"
                  preview={frontPreview}
                  dragActive={dragFront}
                  setDragActive={setDragFront}
                  onDrop={(e) => handleDrop(e, "front")}
                  onClick={() => document.getElementById("frontInput")?.click()}
                />
                <input
                  id="frontInput"
                  type="file"
                  disabled={isLocked}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileInput(e, "front")}
                />

                {/* BACK UPLOAD */}
                <UploadBox
                  label="Back Side"
                  preview={backPreview}
                  dragActive={dragBack}
                  setDragActive={setDragBack}
                  onDrop={(e) => handleDrop(e, "back")}
                  onClick={() => document.getElementById("backInput")?.click()}
                />
                <input
                  id="backInput"
                  type="file"
                  disabled={isLocked}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileInput(e, "back")}
                />
              </div>
            ) : (
              <>
                <p className="text-sm opacity-75 mb-3">
                  Upload personal information page.
                </p>

                <UploadBox
                  label="Document Image"
                  preview={frontPreview}
                  dragActive={dragFront}
                  setDragActive={setDragFront}
                  onDrop={(e) => handleDrop(e, "front")}
                  onClick={() => document.getElementById("frontInput")?.click()}
                />
                <input
                  id="frontInput"
                  type="file"
                  disabled={isLocked}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileInput(e, "front")}
                />
              </>
            )}
          </div>

          {/* MESSAGES */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-sm">
              {error}
            </div>
          )}

          {msg && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-sm">
              {msg}
            </div>
          )}

          {/* SUBMIT IF NOT APPROVED */}
          {!isLocked && (
            <button
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold bg-primary-light hover:bg-primary-light/90"
            >
              {loading ? "Submitting…" : "Submit KYC"}
            </button>
          )}
        </form>
      </div>

      {/* DETAILS MODAL */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="max-w-lg w-full mx-4 bg-card-light dark:bg-card-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark p-6 relative">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-3 right-3 text-xl hover:opacity-70"
            >
              ×
            </button>

            <h3 className="text-lg font-semibold mb-4">Submitted Details</h3>

            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {profile.full_name || "—"}</p>
              <p><strong>DOB:</strong> {profile.dob || "—"}</p>
              <p><strong>Phone:</strong> {profile.phone || "—"}</p>
              <p><strong>Address:</strong> {profile.address || "—"}</p>
              <p><strong>Document Type:</strong> {documentType}</p>
              <p><strong>Document Number:</strong> {documentNumber || "—"}</p>
              <p><strong>Status:</strong> {latestKyc?.status || "Not Submitted"}</p>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold mb-1">Front Image</p>
                {frontPreview ? (
                  <img src={frontPreview} className="rounded-lg border border-border-light dark:border-border-dark" />
                ) : (
                  <div className="p-4 text-xs opacity-60 border rounded-lg">No front image</div>
                )}
              </div>

              {documentType === "citizenship" && (
                <div>
                  <p className="text-xs font-semibold mb-1">Back Image</p>
                  {backPreview ? (
                    <img src={backPreview} className="rounded-lg border border-border-light dark:border-border-dark" />
                  ) : (
                    <div className="p-4 text-xs opacity-60 border rounded-lg">No back image</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KycPage;
