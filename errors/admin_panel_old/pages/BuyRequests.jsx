import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import TableControls from "../components/TableControls";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { downloadCsv } from "../utils/exportCsv";
import ConfirmModal from "../components/ConfirmModal";

// Allowed statuses from backend
const STATUS_OPTIONS = [
  "pending",
  "processing",
  "assigned",
  "completed",
  "rejected",
];

const BuyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const { addToast } = useToast();
  const [confirmId, setConfirmId] = useState(null);
  const [edits, setEdits] = useState({});

  const syncClientPolicy = async (req, status) => {
    if (status !== "completed" || !req.policy_id) return;

    try {
      const clientsRes = await API.get("/admin/clients");
      const clients = clientsRes.data || [];

      const match =
        clients.find(
          (c) =>
            c.email &&
            req.email &&
            c.email.toLowerCase() === req.email.toLowerCase()
        ) ||
        clients.find(
          (c) => c.phone && req.phone && String(c.phone) === String(req.phone)
        );

      if (!match) return;

      const existingIds = match.policy_id
        ? String(match.policy_id)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const policyIdStr = String(req.policy_id);
      if (!existingIds.includes(policyIdStr)) {
        existingIds.push(policyIdStr);
      }

      await API.put(`/admin/clients/${match.id}`, {
        policy_id: existingIds.join(", "),
        policy_provided: true,
      });
    } catch (error) {
      console.error("Sync client policy failed:", error);
    }
  };

  const loadBuyRequests = async () => {
    try {
      const res = await API.get("/admin/buy-requests");

      const list = Array.isArray(res.data) ? res.data : [];
      setRequests(list);

      // Setup editable states
      const initial = {};
      list.forEach((r) => {
        initial[r.id] = { status: r.status || "pending" };
      });

      setEdits(initial);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Load failed",
        message: "Unable to fetch buy requests.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    loadBuyRequests();
  }, []);

  const safePolicy = (req) => req.policy || {};

  const filtered = requests
    .filter((req) => {
      const policy = safePolicy(req);
      const haystack = [
        req.id,
        req.name,
        req.phone,
        req.email,
        req.policy_id,
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

  const updateRequest = async (id) => {
    const newStatus = edits[id]?.status;

    try {
      const res = await API.put(`/admin/buy-requests/${id}`, {
        status: newStatus,
      });

      const updated =
        (res.data && (res.data.buyRequest || res.data.data || res.data)) ||
        requests.find((r) => r.id === id);

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, status: newStatus } : r))
      );

      await syncClientPolicy(updated || {}, newStatus);

      addToast({
        title: "Updated",
        message: "Buy request updated successfully.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Update failed",
        message: "Could not update request.",
        type: "error",
      });
    }
  };

  const deleteRequest = async (id) => {
    try {
      await API.delete(`/admin/buy-requests/${id}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      addToast({
        title: "Deleted",
        message: "Buy request removed.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Delete failed",
        message: "Could not delete request.",
        type: "error",
      });
    } finally {
      setConfirmId(null);
    }
  };

  const handleExport = () => {
    if (!filtered.length) {
      addToast({
        title: "Nothing to export",
        message: "No buy requests to export.",
        type: "info",
      });
      return;
    }

    downloadCsv(
      "buy-requests.csv",
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "policy_id", label: "Policy ID" },
        { key: "policy_type", label: "Insurance Type" },
        { key: "company", label: "Company" },
        { key: "status", label: "Status" },
        { key: "created_at", label: "Created At" },
      ],
      filtered.map((r) => {
        const policy = safePolicy(r);
        return {
          ...r,
          policy_type: policy.insurance_type || "",
          company: policy.company_name || "",
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
            <h2>Buy Requests</h2>
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
                placeholder="Search buy requests..."
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
                <th>Policy ID</th>
                <th>Type</th>
                <th>Company</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((req) => {
                const policy = safePolicy(req);
                const createdLabel = req.created_at
                  ? new Date(req.created_at).toLocaleString()
                  : "-";

                return (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.name}</td>
                    <td>{req.phone}</td>
                    <td>{req.email || "-"}</td>
                    <td>{req.policy_id}</td>
                    <td>{policy.insurance_type || "-"}</td>
                    <td>{policy.company_name || "-"}</td>

                    {/* STATUS SELECT */}
                    <td>
                      <select
                        value={edits[req.id]?.status}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [req.id]: { status: e.target.value },
                          }))
                        }
                        className="table-select"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{createdLabel}</td>

                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn btn-small"
                          onClick={() => updateRequest(req.id)}
                        >
                          Save
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmId(req.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center">
                    No buy requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmId}
        title="Delete buy request?"
        message="This action cannot be undone."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteRequest(confirmId)}
      />
    </div>
  );
};

export default BuyRequests;
