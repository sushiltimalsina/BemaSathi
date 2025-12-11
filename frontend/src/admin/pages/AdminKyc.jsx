import React, { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { fetchKycList, updateKycStatus } from "../utils/adminApi";

const AdminKyc = () => {
  const [kycData, setKycData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [preview, setPreview] = useState({
    show: false,
    url: "",
    title: "",
  });

  const apiBase = "http://localhost:8000";

  // ============================
  // FIXED URL BUILDER
  // ============================
  const buildUrl = (path) => {
    if (!path) return "";
    path = path.replace(/.*storage[\\/]/, "");
    path = path.replace(/^public\//, "");
    path = path.replace(/\\/g, "/");
    return `${apiBase}/storage/${path}`;
  };

  // ============================
  // Fetch KYC data
  // ============================
  const loadKyc = async () => {
    try {
      const res = await fetchKycList();
      setKycData(res.data?.data || []);
    } catch (err) {
      console.log("KYC Load Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKyc();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateKycStatus(id, { status });
      loadKyc();
    } catch (err) {
      console.log(err);
    }
  };

  const openPreview = (url, title) =>
    setPreview({ show: true, url, title });

  const closePreview = () =>
    setPreview({ show: false, url: "", title: "" });

  // ============================
  // Stats
  // ============================
  const stats = useMemo(() => {
    const total = kycData.length;
    const pending = kycData.filter((k) => k.status === "pending").length;
    const approved = kycData.filter((k) => k.status === "approved").length;
    const rejected = kycData.filter((k) => k.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [kycData]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-text-light dark:text-text-dark">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminNavbar />

        <main className="p-6 lg:p-8 space-y-6">
          {/* HEADER / TITLE */}
          <div
            className="
              rounded-3xl px-6 py-5
              bg-gradient-to-r from-blue-500/90 via-indigo-500/80 to-purple-500/80
              shadow-xl
              text-white
              flex flex-col md:flex-row md:items-center md:justify-between
              gap-3
            "
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                KYC Verification
              </h1>
              <p className="text-sm md:text-base opacity-90 mt-1">
                Review and approve client KYC documents with a clear, modern dashboard.
              </p>
            </div>
            <div className="flex gap-3 text-xs md:text-sm">
              <HeaderPill label="Total" value={stats.total} />
              <HeaderPill label="Pending" value={stats.pending} tone="yellow" />
              <HeaderPill label="Approved" value={stats.approved} tone="green" />
              <HeaderPill label="Rejected" value={stats.rejected} tone="red" />
            </div>
          </div>

          {/* STATS CARDS (GLASS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total KYC" value={stats.total} />
            <StatCard title="Pending" value={stats.pending} color="yellow" />
            <StatCard title="Approved" value={stats.approved} color="green" />
            <StatCard title="Rejected" value={stats.rejected} color="red" />
          </div>

          {/* TABLE SECTION */}
          {loading ? (
            <div className="text-sm text-text-light dark:text-text-dark">
              Loading...
            </div>
          ) : (
            <div
              className="
                rounded-3xl
                bg-white/80 dark:bg-slate-900/80
                border border-border-light/70 dark:border-border-dark
                shadow-xl
                backdrop-blur-xl
                overflow-hidden
              "
            >
              {/* Table wrapper for scroll */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur">
                    <tr>
                      <Th>User</Th>
                      <Th>Document</Th>
                      <Th>Preview</Th>
                      <Th>Status</Th>
                      <Th>Action</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {kycData.map((doc) => (
                      <tr
                        key={doc.id}
                        className="
                          border-t border-border-light/60 dark:border-border-dark/60
                          hover:bg-slate-50/90 dark:hover:bg-slate-800/70
                          transition-colors
                        "
                      >
                        {/* USER */}
                        <Td>
                          <div className="font-semibold text-text-light dark:text-text-dark">
                            {doc.full_name}
                          </div>
                          <div className="text-xs opacity-60">{doc.phone}</div>
                        </Td>

                        {/* DOCUMENT */}
                        <Td>
                          <div className="font-semibold capitalize">
                            {doc.document_type}
                          </div>
                          <div className="text-xs opacity-60">
                            {doc.document_number}
                          </div>
                        </Td>

                        {/* PREVIEW IMAGES */}
                        <Td>
                          <div className="flex gap-3">
                            <PreviewImage
                              path={doc.front_path}
                              title="Front Image"
                              buildUrl={buildUrl}
                              openPreview={openPreview}
                            />
                            <PreviewImage
                              path={doc.back_path}
                              title="Back Image"
                              buildUrl={buildUrl}
                              openPreview={openPreview}
                            />
                          </div>
                        </Td>

                        {/* STATUS */}
                        <Td>
                          <StatusBadge status={doc.status} />
                        </Td>

                        {/* ACTION */}
                        <Td>
                          {doc.status === "pending" ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="
                                  px-3 py-1.5 rounded-full text-xs font-semibold
                                  bg-emerald-500 hover:bg-emerald-600
                                  text-white shadow-sm
                                "
                                onClick={() => updateStatus(doc.id, "approved")}
                              >
                                Approve
                              </button>
                              <button
                                className="
                                  px-3 py-1.5 rounded-full text-xs font-semibold
                                  bg-rose-500 hover:bg-rose-600
                                  text-white shadow-sm
                                "
                                onClick={() => updateStatus(doc.id, "rejected")}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs opacity-60">
                              Finalized
                            </span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* IMAGE PREVIEW MODAL */}
          {preview.show && (
            <div
              className="
                fixed inset-0 bg-black/70 backdrop-blur-sm
                flex justify-center items-center z-50
              "
              onClick={closePreview}
            >
              <div
                className="
                  bg-card-light dark:bg-card-dark p-5 rounded-2xl
                  border border-border-light dark:border-border-dark
                  max-w-[90vw] max-h-[90vh] shadow-2xl
                "
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold text-lg mb-3 text-text-light dark:text-text-dark">
                  {preview.title}
                </h3>

                <img
                  src={preview.url}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl border border-border-light/60 dark:border-border-dark/60"
                />

                <button
                  onClick={closePreview}
                  className="
                    mt-4 px-4 py-2 rounded-lg text-sm font-semibold
                    bg-primary-light dark:bg-primary-dark
                    text-white hover:brightness-110
                  "
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

/* ------------------------------------------
   SMALL COMPONENTS 
------------------------------------------ */

// Header pill in gradient card
const HeaderPill = ({ label, value, tone }) => {
  const toneClass =
    tone === "green"
      ? "bg-emerald-500/20 text-emerald-50 border-emerald-300/60"
      : tone === "yellow"
      ? "bg-amber-400/20 text-amber-50 border-amber-200/70"
      : tone === "red"
      ? "bg-rose-500/20 text-rose-50 border-rose-300/60"
      : "bg-white/15 text-white border-white/40";

  return (
    <div
      className={`
        px-3 py-1.5 rounded-full border text-xs font-semibold
        flex items-center gap-1 ${toneClass}
      `}
    >
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
};

// Table head cell
const Th = ({ children }) => (
  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-200">
    {children}
  </th>
);

// Table body cell
const Td = ({ children }) => (
  <td className="px-4 py-3 align-top text-sm text-text-light dark:text-text-dark">
    {children}
  </td>
);

// Preview thumbnail
const PreviewImage = ({ path, title, buildUrl, openPreview }) =>
  path ? (
    <img
      src={buildUrl(path)}
      className="
        w-14 h-14 rounded-xl object-cover
        border border-border-light dark:border-border-dark
        cursor-pointer hover:opacity-85 shadow-sm
      "
      onClick={() => openPreview(buildUrl(path), title)}
    />
  ) : (
    <span className="text-xs opacity-60">No {title.split(" ")[0]}</span>
  );

// Status badge
const StatusBadge = ({ status }) => {
  const base =
    "px-3 py-1 rounded-full text-xs font-semibold capitalize inline-flex items-center";

  const colors = {
    approved:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200",
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
    rejected:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200",
  };

  return <span className={`${base} ${colors[status]}`}>{status}</span>;
};

// Stats card (glass)
const StatCard = ({ title, value, color }) => {
  const colorClass =
    color === "green"
      ? "text-emerald-600 dark:text-emerald-300"
      : color === "yellow"
      ? "text-amber-600 dark:text-amber-300"
      : color === "red"
      ? "text-rose-600 dark:text-rose-300"
      : "text-primary-light dark:text-primary-dark";

  return (
    <div
      className="
        relative p-4 rounded-2xl
        bg-white/80 dark:bg-slate-900/80
        border border-border-light/70 dark:border-border-dark
        shadow-lg backdrop-blur-xl
        overflow-hidden
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-slate-200/10 dark:from-white/5 dark:via-transparent dark:to-slate-900/40 pointer-events-none" />
      <div className="relative">
        <p className="text-xs uppercase opacity-70">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
      </div>
    </div>
  );
};

export default AdminKyc;
