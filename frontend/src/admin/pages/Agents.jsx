import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import { useNavigate } from "react-router-dom";
import TableControls from "../components/TableControls";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { downloadCsv } from "../utils/exportCsv";
import ConfirmModal from "../components/ConfirmModal";

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [confirmId, setConfirmId] = useState(null);

  const loadAgents = async () => {
    try {
      const response = await API.get("/admin/agents");
      setAgents(response.data);
    } catch (error) {
      console.error(error);
      addToast({ title: "Load failed", message: "Unable to fetch agents.", type: "error" });
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleExport = () => {
    if (!filtered.length) {
      addToast({ title: "Nothing to export", message: "No agents in the list.", type: "info" });
      return;
    }
    downloadCsv(
      "agents.csv",
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "company_name", label: "Company" },
      ],
      filtered
    );
  };

  const filtered = agents
    .filter((a) => {
      const haystack = [a.id, a.name, a.phone, a.email, a.company_name]
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

  const deleteAgent = async (id) => {
    try {
      await API.delete(`/admin/agents/${id}`);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      addToast({
        title: "Deleted",
        message: "Agent removed.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Delete failed",
        message: "Could not delete agent.",
        type: "error",
      });
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
            <h2>Agents</h2>
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
                  { key: "company_name", label: "Company" },
                ]}
                placeholder="Search agents..."
              />
              <button
                className="btn btn-primary"
                onClick={() => navigate("/admin/agents/add")}
              >
                + Add Agent
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
                <th>Phone</th>
                <th>Email</th>
                <th>Company</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.id}</td>
                  <td>{agent.name}</td>
                  <td>{agent.phone}</td>
                      <td>{agent.email}</td>
                      <td>{agent.company_name}</td>
                      <td>
                        <button
                          className="btn btn-small"
                          onClick={() => navigate(`/admin/agents/edit/${agent.id}`)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => setConfirmId(agent.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No agents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmId}
        title="Delete agent?"
        message="This will permanently remove the agent."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteAgent(confirmId)}
      />
    </div>
  );
};

export default Agents;
