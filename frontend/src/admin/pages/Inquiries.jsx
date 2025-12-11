import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import TableControls from "../components/TableControls";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { downloadCsv } from "../utils/exportCsv";
import ConfirmModal from "../components/ConfirmModal";

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const { addToast } = useToast();
  const [confirmId, setConfirmId] = useState(null);

  const loadInquiries = async () => {
    try {
      const response = await API.get("/admin/inquiries");
      setInquiries(response.data);
    } catch (error) {
      console.error(error);
      addToast({ title: "Load failed", message: "Unable to fetch inquiries.", type: "error" });
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const safePolicy = (inq) => inq.policy || {};

  const filtered = inquiries
    .filter((inq) => {
      const policy = safePolicy(inq);
      const haystack = [
        inq.id,
        inq.name,
        inq.phone,
        inq.email,
        inq.message,
        inq.policy_id,
        policy.insurance_type,
        policy.company_name,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      if (av > bv) return dir;
      if (av < bv) return -dir;
      return 0;
    });

  const deleteInquiry = async (id) => {
    try {
      await API.delete(`/admin/inquiries/${id}`);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      addToast({ title: "Deleted", message: "Inquiry removed.", type: "success" });
    } catch (error) {
      console.error(error);
      addToast({ title: "Delete failed", message: "Could not delete inquiry.", type: "error" });
    } finally {
      setConfirmId(null);
    }
  };

  const handleExport = () => {
    if (!filtered.length) {
      addToast({ title: "Nothing to export", message: "No inquiries in the list.", type: "info" });
      return;
    }
    downloadCsv(
      "inquiries.csv",
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "message", label: "Message" },
        { key: "policy_id", label: "Policy ID" },
        { key: "policy_type", label: "Policy Type" },
        { key: "company", label: "Company" },
        { key: "premium", label: "Premium" },
        { key: "created_at", label: "Date" },
      ],
      filtered.map((inq) => {
        const policy = safePolicy(inq);
        return {
          ...inq,
          policy_type: policy.insurance_type ?? "",
          company: policy.company_name ?? "",
          premium: policy.premium_amt ?? "",
        };
      })
    );
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h2>User Inquiries Agent Details</h2>
            <div className="admin-header-actions">
              <TableControls
                search={search}
                onSearchChange={setSearch}
                sortKey={sort.key}
                sortDir={sort.dir}
                onSortChange={setSort}
                sortOptions={[
                  { key: "id", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "policy_id", label: "Policy" },
                ]}
                placeholder="Search inquiries..."
              />
              <button className="btn btn-secondary" onClick={handleExport}>
                Export CSV
              </button>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Message</th>
                <th>Policy ID</th>
                <th>Policy Type</th>
                <th>Company</th>
                <th>Premium</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((inq) => {
                const policy = safePolicy(inq);
                return (
                  <tr key={inq.id}>
                    <td>{inq.id}</td>
                    <td>{inq.name}</td>
                    <td>{inq.phone}</td>
                    <td>{inq.email}</td>
                    <td>{inq.message}</td>
                    <td>{inq.policy_id ?? "-"}</td>
                    <td>{policy.insurance_type ?? "-"}</td>
                    <td>{policy.company_name ?? "-"}</td>
                    <td>{policy.premium_amt ?? "-"}</td>
                    <td>{new Date(inq.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmId(inq.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>
                    No inquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmId}
        title="Delete inquiry?"
        message="This will permanently remove the inquiry."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteInquiry(confirmId)}
      />
    </div>
  );
};

export default Inquiries;
