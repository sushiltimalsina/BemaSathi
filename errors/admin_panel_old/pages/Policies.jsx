import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import { Link } from "react-router-dom";
import TableControls from "../components/TableControls";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { downloadCsv } from "../utils/exportCsv";
import ConfirmModal from "../components/ConfirmModal";

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const { addToast } = useToast();
  const [confirmId, setConfirmId] = useState(null);

  const fetchPolicies = async () => {
    try {
      const res = await API.get("/admin/policies");
      setPolicies(res.data);
    } catch (error) {
      console.error("Error fetching policies:", error);
      addToast({ title: "Load failed", message: "Unable to fetch policies.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const deletePolicy = async (id) => {
    try {
      await API.delete(`/admin/policies/${id}`);
      setPolicies(policies.filter((p) => p.id !== id));
      addToast({ title: "Deleted", message: "Policy removed.", type: "success" });
    } catch (error) {
      console.error("Delete failed:", error);
      addToast({ title: "Delete failed", message: "Could not delete policy.", type: "error" });
    } finally {
      setConfirmId(null);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleExport = () => {
    if (!filtered.length) {
      addToast({ title: "Nothing to export", message: "No policies in the list.", type: "info" });
      return;
    }
    downloadCsv(
      "policies.csv",
      [
        { key: "id", label: "ID" },
        { key: "insurance_type", label: "Insurance Type" },
        { key: "company_name", label: "Company" },
        { key: "premium_amt", label: "Premium" },
        { key: "coverage_limit", label: "Coverage" },
        { key: "company_rating", label: "Rating" },
        { key: "agent_id", label: "Agent" },
      ],
      filtered
    );
  };

  const filtered = policies
    .filter((p) => {
      const haystack = [
        p.id,
        p.insurance_type,
        p.company_name,
        p.premium_amt,
        p.coverage_limit,
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

  if (loading) return <p>Loading policies...</p>;

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h2>Policies</h2>
            <div className="admin-header-actions">
              <TableControls
                search={search}
                onSearchChange={setSearch}
                sortKey={sort.key}
                sortDir={sort.dir}
                onSortChange={setSort}
                sortOptions={[
                  { key: "id", label: "ID" },
                  { key: "company_name", label: "Company" },
                  { key: "insurance_type", label: "Type" },
                  { key: "premium_amt", label: "Premium" },
                ]}
                placeholder="Search policies..."
              />
              <Link to="/admin/policies/add" className="btn btn-primary">
                + Add New Policy
              </Link>
              <button className="btn btn-secondary" onClick={handleExport}>
                Export CSV
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p>No policies found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Insurance Type</th>
                  <th>Company</th>
                  <th>Premium</th>
                  <th>Coverage</th>
                  <th>Rating</th>
                  <th>Agent</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((policy) => (
                  <tr key={policy.id}>
                    <td>{policy.id}</td>
                    <td>{policy.insurance_type}</td>
                    <td>{policy.company_name}</td>
                    <td>{policy.premium_amt}</td>
                    <td>{policy.coverage_limit}</td>
                    <td>{policy.company_rating ?? "-"}</td>
                    <td>{policy.agent_id ?? "-"}</td>

                    <td>
                      <Link
                        to={`/admin/policies/edit/${policy.id}`}
                        className="btn btn-sm btn-warning"
                      >
                        Edit
                      </Link>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setConfirmId(policy.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!confirmId}
        title="Delete policy?"
        message="This will permanently remove the policy."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && deletePolicy(confirmId)}
      />
    </div>
  );
};

export default Policies;
