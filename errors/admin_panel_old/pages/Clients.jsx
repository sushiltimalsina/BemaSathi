import React, { useEffect, useState } from "react";
import { adminApi as API } from "../utils/adminApi";
import TableControls from "../components/TableControls";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../context/ToastContext";
import { downloadCsv } from "../utils/exportCsv";
import ConfirmModal from "../components/ConfirmModal";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [buyRequests, setBuyRequests] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const [confirmId, setConfirmId] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const parsePolicyIds = (val) =>
    String(val || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const buildPolicyMap = (policyList) => {
    const map = {};
    (policyList || []).forEach((p) => {
      if (!p.id) return;
      map[String(p.id)] = {
        policy_name: p.policy_name,
        company_name: p.company_name,
      };
    });
    return map;
  };

  const summarizePolicies = (idList, policyMap) => {
    const uniqueIds = Array.from(new Set(idList));
    const names = [];
    const companies = [];

    uniqueIds.forEach((id) => {
      const meta = policyMap[String(id)];
      if (meta?.policy_name) names.push(meta.policy_name);
      if (meta?.company_name) companies.push(meta.company_name);
    });

    return {
      policy_name: names.length ? names.join(", ") : null,
      company_name: companies.length ? companies.join(", ") : null,
    };
  };

  const mergeClientsWithCompletedPolicies = (clientList, brList, policyMap) => {
    const completed = (brList || []).filter(
      (br) => br.status && br.status.toLowerCase() === "completed"
    );

    if (!completed.length) return clientList;

    return clientList.map((c) => {
      const matches = completed.filter(
        (br) =>
          (br.email &&
            c.email &&
            br.email.toLowerCase() === c.email.toLowerCase()) ||
          (br.phone && c.phone && String(br.phone) === String(c.phone))
      );

      if (!matches.length) return c;

      const existingIds = new Set(parsePolicyIds(c.policy_id));
      matches.forEach((m) => {
        if (m.policy_id) existingIds.add(String(m.policy_id));
      });

      const meta = summarizePolicies(Array.from(existingIds), policyMap);

      return {
        ...c,
        policy_id: Array.from(existingIds).join(", "),
        policy_provided: true,
        policy_name: meta.policy_name || c.policy_name,
        company_name: meta.company_name || c.company_name,
      };
    });
  };

  const loadClients = async () => {
    try {
      const [clientsRes, brRes, policiesRes] = await Promise.all([
        API.get("/admin/clients"),
        API.get("/admin/buy-requests"),
        API.get("/admin/policies"),
      ]);

      const policyMap = buildPolicyMap(policiesRes.data || []);

      const merged = mergeClientsWithCompletedPolicies(
        clientsRes.data || [],
        brRes.data || [],
        policyMap
      );

      setClients(merged);
      setBuyRequests(brRes.data || []);
      setPolicies(policiesRes.data || []);
    } catch (error) {
      console.error(error);
      addToast({ title: "Load failed", message: "Unable to fetch clients.", type: "error" });
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = clients
    .filter((c) => {
      const haystack = [
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.policy_id,
        c.policy_name,
        c.company_name,
        c.policy_provided ? "provided" : "not provided",
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
      addToast({ title: "Nothing to export", message: "No clients in the list.", type: "info" });
      return;
    }
    downloadCsv(
      "clients.csv",
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" },
        { key: "policy_id", label: "Policy ID" },
        { key: "policy_name", label: "Policy Name" },
        { key: "company_name", label: "Company" },
        { key: "policy_provided", label: "Policy Provided" },
      ],
      filtered.map((c) => ({
        ...c,
        policy_provided: c.policy_provided ? "Yes" : "No",
      }))
    );
  };

  const deleteClient = async (id) => {
    try {
      await API.delete(`/admin/clients/${id}`);
      setClients((prev) => prev.filter((c) => c.id !== id));
      addToast({ title: "Deleted", message: "Client removed.", type: "success" });
    } catch (error) {
      console.error(error);
      addToast({ title: "Delete failed", message: "Could not delete client.", type: "error" });
    } finally {
      setConfirmId(null);
    }
  };

  const resetPassword = (client) => {
    const newPwd = window.prompt(`Enter new password for ${client.name}:`);
    if (!newPwd) return;

    API.put(`/admin/clients/${client.id}`, { ...client, password: newPwd })
      .then(() => {
        addToast({
          title: "Password reset",
          message: "Password updated successfully.",
          type: "success",
        });
      })
      .catch((error) => {
        console.error(error);
        const msg =
          error.response?.data?.message ||
          "Unable to reset password.";
        addToast({
          title: "Reset failed",
          message: msg,
          type: "error",
        });
      });
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <div className="admin-header">
            <h2>Clients</h2>
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
                placeholder="Search clients..."
              />
              <button
                className="btn btn-primary"
                onClick={() => navigate("/admin/clients/add")}
              >
                + Add Client
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
                <th>Policy ID</th>
                <th>Policy Name</th>
                <th>Company</th>
                <th>Provided?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.address}</td>
                  <td>{c.policy_id ?? "-"}</td>
                  <td>{c.policy_name ?? "-"}</td>
                  <td>{c.company_name ?? "-"}</td>
                  <td>{c.policy_provided ? "Yes" : "No"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        className="btn btn-small"
                        onClick={() => navigate(`/admin/clients/edit/${c.id}`)}
                        title="Edit client"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small"
                        onClick={() => resetPassword(c)}
                        title="Reset password"
                      >
                        Reset Password
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => setConfirmId(c.id)}
                        title="Delete client"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmId}
        title="Delete client?"
        message="This will permanently remove the client."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteClient(confirmId)}
      />
    </div>
  );
};

export default Clients;
