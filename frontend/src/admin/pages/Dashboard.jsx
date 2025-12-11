import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminStats } from "../utils/adminApi";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminCard from "../components/AdminCard";

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totals: { policies: 0, agents: 0, inquiries: 0, buyRequests: 0 },
        conversionRate: 0,
        dailyBuyRequests: [],
        paymentsByStatus: {},
        topAgents: []
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getAdminStats();
                setStats(res.data);
            } catch {
                console.log("Failed to load admin stats");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <p>Loading dashboard...</p>;

    const maxDaily = Math.max(...(stats.dailyBuyRequests?.map((d) => d.total) || [0]), 1);

    return (
        <div className="admin-layout">
            <AdminNavbar />
            <div className="admin-main">
                <AdminSidebar />

                <div className="admin-content">
                    <h2>Admin Dashboard</h2>

                    <div className="admin-grid">
                        <AdminCard
                            title="Policies"
                            value={stats?.totals?.policies || 0}
                            onClick={() => navigate("/admin/policies")}
                        />
                        <AdminCard
                            title="Agents"
                            value={stats?.totals?.agents || 0}
                            onClick={() => navigate("/admin/agents")}
                        />
                        <AdminCard
                            title="Inquiries"
                            value={stats?.totals?.inquiries || 0}
                            onClick={() => navigate("/admin/inquiries")}
                        />
                        <AdminCard
                            title="Buy Requests"
                            value={stats?.totals?.buyRequests || 0}
                            onClick={() => navigate("/admin/buy-requests")}
                        />
                        <AdminCard
                            title="Conversion Rate"
                            value={`${stats.conversionRate || 0}%`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <section className="bg-white rounded-lg shadow p-4">
                            <h3 className="text-lg font-semibold mb-3">Buy Requests (Last 30 Days)</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {(stats.dailyBuyRequests || []).map((d) => (
                                    <div key={d.day} className="flex items-center gap-3">
                                        <span className="text-xs w-24 text-gray-600">{d.day}</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded">
                                            <div
                                                className="h-2 bg-blue-500 rounded"
                                                style={{ width: `${(d.total / maxDaily) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold">{d.total}</span>
                                    </div>
                                ))}
                                {(!stats.dailyBuyRequests || stats.dailyBuyRequests.length === 0) && (
                                    <p className="text-sm text-gray-500">No activity yet.</p>
                                )}
                            </div>
                        </section>

                        <section className="bg-white rounded-lg shadow p-4">
                            <h3 className="text-lg font-semibold mb-3">Payments by Status</h3>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(stats.paymentsByStatus || {}).map(([status, total]) => (
                                    <div
                                        key={status}
                                        className="px-3 py-2 rounded-lg border border-gray-200 shadow-sm"
                                    >
                                        <p className="text-xs uppercase text-gray-500">{status}</p>
                                        <p className="text-lg font-semibold">{total}</p>
                                    </div>
                                ))}
                                {(!stats.paymentsByStatus || Object.keys(stats.paymentsByStatus).length === 0) && (
                                    <p className="text-sm text-gray-500">No payments yet.</p>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold mt-6 mb-3">Top Agents (Completed Leads)</h3>
                            <div className="space-y-2">
                                {(stats.topAgents || []).map((agent) => (
                                    <div
                                        key={agent.id}
                                        className="flex justify-between items-center p-2 rounded border border-gray-200"
                                    >
                                        <div>
                                            <p className="font-semibold">{agent.name}</p>
                                            <p className="text-xs text-gray-500">{agent.email}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p>Completed: {agent.completed_leads_count || 0}</p>
                                            <p className="text-gray-500">Active: {agent.active_leads_count || 0}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!stats.topAgents || stats.topAgents.length === 0) && (
                                    <p className="text-sm text-gray-500">No agent data yet.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
