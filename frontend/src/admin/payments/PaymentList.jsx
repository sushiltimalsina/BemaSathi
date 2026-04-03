import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/adminApi";
import {
    BanknotesIcon,
    CheckCircleIcon,
    XCircleIcon,
    FunnelIcon,
    PrinterIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useAdminToast } from "../ui/AdminToast";
import { useAdminConfirm } from "../ui/AdminConfirm";

const PaymentList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const { addToast } = useAdminToast();
    const confirm = useAdminConfirm();

    const fmt = (n) =>
        Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

    const load = async () => {
        try {
            const res = await API.get("/admin/payments");
            setItems(res.data || []);
        } catch (e) {
            console.error(e);
            setError("Unable to load payments.");
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        return items.filter((p) => {
            const normalizedStatus = (p.status || "").toLowerCase();
            const isSuccess = normalizedStatus === "success" || normalizedStatus === "paid" || normalizedStatus === "completed";
            const matchStatus = status === "all" || (status === "success" && isSuccess) || (status === "failed" && !isSuccess);
            const q = search.toLowerCase();
            return matchStatus && (
                p.transaction_id?.toLowerCase().includes(q) ||
                p.user?.name?.toLowerCase().includes(q) ||
                p.user?.email?.toLowerCase().includes(q) ||
                p.buy_request?.policy?.policy_name?.toLowerCase().includes(q)
            );
        });
    }, [items, status, search]);

    const handleDownload = async (type, buyRequestId) => {
        if (!buyRequestId) return;
        const endpoint = type === 'policy' ? 'policy-document' : 'payment-receipt';
        addToast({ type: "info", title: "Preparing", message: "Generating PDF..." });
        try {
            const response = await API.get(`/admin/buy-requests/${buyRequestId}/${endpoint}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${buyRequestId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            addToast({ type: "error", title: "Error", message: "Download failed." });
        }
    };

    const statusBadge = (p) => {
        if (p.is_verified) return <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">VERIFIED</span>;
        const s = (p.status || "").toLowerCase();
        if (s === "success" || s === "paid") return <span className="text-blue-500 font-bold text-[10px]">PAID</span>;
        return <span className="text-red-500 font-bold text-[10px]">FAILED</span>;
    };

    if (loading) return <div className="p-10 text-center opacity-50">Loading...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold">Payments</h1>
                    <p className="text-xs opacity-60">Manage all transactions</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="text-xs px-3 py-1.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none w-48"
                    />
                    <select
                        value={status} onChange={(e) => setStatus(e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none"
                    >
                        <option value="all">All</option>
                        <option value="success">Paid</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="border dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50 shadow-sm">
                <table className="w-full text-[11px] table-fixed">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-bold border-b dark:border-slate-800">
                        <tr>
                            <th className="px-3 py-3 text-left w-1/4">Customer / Policy</th>
                            <th className="px-2 py-3 text-left w-[12%]">Txn ID</th>
                            <th className="px-2 py-3 text-left w-[10%]">Amount</th>
                            <th className="px-2 py-3 text-center w-[8%]">Type</th>
                            <th className="px-2 py-3 text-center w-[8%]">Status</th>
                            <th className="px-2 py-3 text-center w-[12%]">Policy</th>
                            <th className="px-2 py-3 text-center w-[12%]">Receipt</th>
                            <th className="px-2 py-3 text-right w-[10%]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {filtered.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-3 py-3 overflow-hidden">
                                    <div className="font-bold truncate text-slate-900 dark:text-slate-100">{p.user?.name}</div>
                                    <div className="opacity-50 truncate text-[10px]">{p.buy_request?.policy?.policy_name}</div>
                                </td>
                                <td className="px-2 py-3 font-mono opacity-60 truncate">{p.transaction_id || "-"}</td>
                                <td className="px-2 py-3 font-bold truncate">रु.{fmt(p.amount)}</td>
                                <td className="px-2 py-3 text-center">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                        p.payment_type === "renewal" 
                                            ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" 
                                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    }`}>
                                        {p.payment_type || "NEW"}
                                    </span>
                                </td>
                                <td className="px-2 py-3 text-center">{statusBadge(p)}</td>
                                
                                <td className="px-2 py-3 text-center">
                                    {p.is_verified && p.buy_request_id ? (
                                        <button 
                                            onClick={() => handleDownload('policy', p.buy_request_id)}
                                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-500/20"
                                            title="Download Policy"
                                        >
                                            <DocumentTextIcon className="w-4 h-4 mx-auto" />
                                        </button>
                                    ) : <span className="opacity-20">-</span>}
                                </td>

                                <td className="px-2 py-3 text-center">
                                    {p.is_verified && p.buy_request_id ? (
                                        <button 
                                            onClick={() => handleDownload('receipt', p.buy_request_id)}
                                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20"
                                            title="Download Receipt"
                                        >
                                            <PrinterIcon className="w-4 h-4 mx-auto" />
                                        </button>
                                    ) : <span className="opacity-20">-</span>}
                                </td>

                                <td className="px-2 py-3 text-right">
                                    {!p.is_verified && (
                                        <button
                                            onClick={() => confirm("Verify this payment?").then(ok => ok && API.post(`/admin/payments/${p.id}/verify`).then(load))}
                                            className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                                        >
                                            Verify
                                        </button>
                                    ) || <span className="text-slate-400">✓</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentList;
