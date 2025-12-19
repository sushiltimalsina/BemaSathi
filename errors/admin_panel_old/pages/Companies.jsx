import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import TableControls from "../components/TableControls";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { downloadCsv } from "../utils/exportCsv";
import ConfirmModal from "../components/ConfirmModal";
import { useNavigate } from "react-router-dom";

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [policyCompanies, setPolicyCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const [confirmId, setConfirmId] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadCompanies = async () => {
    try {
      const res = await API.get("/admin/companies");
      setCompanies(res.data);
    } catch (error) {
      console.error(error);
      addToast({ title: "Load failed", message: "Unable to fetch companies.", type: "error" });
    }

    // Fallback: derive company names from existing policies if companies table is empty/incomplete
    try {
      const policyRes = await API.get("/admin/policies");
      const grouped = new Map();

      (policyRes.data || []).forEach((p) => {
        if (!p.company_name) return;
        const key = p.company_name.toLowerCase();
        const entry = grouped.get(key) || {
          name: p.company_name,
          policyIds: [],
          agent_id: null,
        };
        entry.policyIds.push(p.id);
        grouped.set(key, entry);
      });

      const derived = Array.from(grouped.values()).map((g) => ({
        id: g.policyIds[0] ?? `policy-${g.name.toLowerCase()}`,
        name: g.name,
        email: "",
        phone: "",
        address: "",
        description: `Derived from ${g.policyIds.length} polic${g.policyIds.length > 1 ? "ies" : "y"}`,
        agent_id: g.agent_id,
        derived: true,
        policyIds: g.policyIds,
      }));

      setPolicyCompanies(derived);
    } catch (error) {
      console.error("Policy fallback load failed:", error);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Merge persisted companies with any derived-from-policy entries (avoid duplicates by name)
  const mergedCompanies = [
    ...companies,
    ...policyCompanies.filter(
      (pc) => !companies.some((c) => c.name?.toLowerCase() === pc.name?.toLowerCase())
    ),
  ];

  const filtered = mergedCompanies
    .filter((c) => {
      const haystack = [
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.description,
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

  const handleExport = () => {
    if (!filtered.length) {
      addToast({ title: "Nothing to export", message: "No companies in the list.", type: "info" });
      return;
    }
    downloadCsv(
      "companies.csv",
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" },
        { key: "description", label: "Description" },
        { key: "agent_id", label: "Agent ID" },
      ],
      filtered
    );
  };

  const deleteCompany = async (id) => {
    try {
      await API.delete(`/admin/companies/${id}`);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      addToast({ title: "Deleted", message: "Company removed.", type: "success" });
    } catch (error) {
      console.error(error);
      addToast({ title: "Delete failed", message: "Could not delete company.", type: "error" });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h2>Companies</h2>
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
                ]}
                placeholder="Search companies..."
              />
              <button
                className="btn btn-primary"
                onClick={() => navigate("/admin/companies/add")}
              >
                + Add Company
              </button>
              <button className="btn btn-secondary" onClick={handleExport}>
                Export CSV
              </button>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Description</th>
                <th>Agent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.id ?? (c.policyIds ? c.policyIds.join(", ") : "")}</td>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.address}</td>
                <td>{c.description}</td>
                <td>{c.agent_id ?? "-"}</td>
                <td>
                  <button
                    className="btn btn-small"
                    disabled={c.derived}
                    onClick={() => navigate(`/admin/companies/edit/${c.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    disabled={c.derived}
                    onClick={() => setConfirmId(c.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmId}
        title="Delete company?"
        message="This will permanently remove the company."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteCompany(confirmId)}
      />
    </div>
  );
};

export default Companies;
