import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { 
  Mail, Search, RefreshCw, AlertTriangle, CheckCircle, 
  Clock, Copy, ExternalLink, ChevronLeft, ChevronRight, Eye, X, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [template, setTemplate] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const [metrics, setMetrics] = useState({ total: 0, sent: 0, failed: 0, queued: 0, successRate: "100%", topTemplate: "OrderConfirmationEmail" });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [res, metricsRes] = await Promise.all([
        api.get("/emails/logs", {
          params: {
            page,
            limit,
            search: search || undefined,
            status: status || undefined,
            template: template || undefined
          }
        }),
        api.get("/emails/metrics").catch(() => null)
      ]);

      if (res.status === "success") {
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
      if (metricsRes?.status === "success" && metricsRes?.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error("Failed to load email logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, status, template]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleRetry = async (id) => {
    try {
      setActionLoading(true);
      await api.post(`/emails/retry/${id}`);
      alert("Email retry enqueued successfully.");
      fetchLogs();
      if (selectedLog && selectedLog.id === id) {
        setSelectedLog(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to trigger retry.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyMessageId = (msgId) => {
    if (!msgId) return;
    navigator.clipboard.writeText(msgId);
    alert("Provider Message ID copied to clipboard.");
  };

  return (
    <div className="flex flex-col gap-6 font-accent text-left text-xs text-brand-text">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-2xl text-brand-text">System Email Logs</h1>
          <p className="text-xs text-brand-text-muted">
            Track and monitor outgoing Resend notifications, failed logs, and retry jobs.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="border border-brand-border p-2.5 rounded-xl hover:bg-brand-secondary hover:text-brand-primary transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-card border border-brand-border border-l-4 border-l-brand-primary p-4 rounded-2xl shadow-sm">
          <span className="text-brand-text-muted font-medium text-[11px] block">Total Emails</span>
          <span className="font-serif font-extrabold text-xl text-brand-text block mt-1">{metrics.total}</span>
        </div>
        <div className="bg-brand-card border border-brand-border border-l-4 border-l-emerald-500 p-4 rounded-2xl shadow-sm">
          <span className="text-brand-text-muted font-medium text-[11px] block">Delivery Success Rate</span>
          <span className="font-serif font-extrabold text-xl text-emerald-600 block mt-1">{metrics.successRate}</span>
        </div>
        <div className="bg-brand-card border border-brand-border border-l-4 border-l-amber-500 p-4 rounded-2xl shadow-sm">
          <span className="text-brand-text-muted font-medium text-[11px] block">Queued / Processing</span>
          <span className="font-serif font-extrabold text-xl text-amber-600 block mt-1">{metrics.queued}</span>
        </div>
        <div className="bg-brand-card border border-brand-border border-l-4 border-l-brand-error p-4 rounded-2xl shadow-sm">
          <span className="text-brand-text-muted font-medium text-[11px] block">Failed Attempts</span>
          <span className="font-serif font-extrabold text-xl text-brand-error block mt-1">{metrics.failed}</span>
        </div>
      </div>

      {/* Filter panel */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-end bg-brand-card border border-brand-border p-4 rounded-3xl shadow-sm">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <span className="font-semibold text-brand-text-muted">Search Recipient / Subject</span>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-brand-text-muted" size={14} />
            <input
              type="text"
              placeholder="e.g. customer@example.com"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-brand-secondary border border-brand-border pl-10 pr-4 py-2 rounded-xl outline-none w-full text-brand-text"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <span className="font-semibold text-brand-text-muted">Status</span>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none text-brand-text"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent Successfully</option>
            <option value="pending">Pending Delivery</option>
            <option value="failed">Failed Delivery</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <span className="font-semibold text-brand-text-muted">Template</span>
          <select
            value={template}
            onChange={(e) => { setTemplate(e.target.value); setPage(1); }}
            className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none text-brand-text"
          >
            <option value="">All Templates</option>
            <option value="welcome">Welcome Email</option>
            <option value="order_confirmation">Order Confirmation</option>
            <option value="payment_success">Payment Success</option>
            <option value="shipment_created">Shipment Created</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="order_shipped">Order Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="password_reset">Password Reset</option>
            <option value="admin_new_order">Admin New Order</option>
            <option value="admin_low_stock">Admin Low Stock</option>
            <option value="admin_payment_failed">Admin Payment Failed</option>
            <option value="admin_shipment_cancelled">Admin Shipment Cancelled</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-brand-primary hover:bg-brand-accent text-white px-6 py-2.5 rounded-xl shadow-md font-semibold cursor-pointer"
        >
          Apply Filters
        </button>
      </form>

      {/* Logs Table */}
      <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-secondary  border-b border-brand-border font-serif font-bold text-brand-text">
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Template</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Retries</th>
                <th className="px-6 py-4">Sent Time</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 font-semibold text-brand-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-brand-primary w-6 h-6" />
                      Loading email logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-brand-text-muted font-semibold">
                    No email log matches found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                    <td className="px-6 py-3 font-semibold text-brand-text">{log.recipient}</td>
                    <td className="px-6 py-3 max-w-[200px] truncate">{log.subject}</td>
                    <td className="px-6 py-3 font-mono text-[10px] capitalize">{log.template.replace(/_/g, " ")}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "sent" ? "bg-green-50 text-brand-success border border-brand-success/20" :
                        log.status === "failed" ? "bg-red-50 text-brand-error border border-brand-error/20" :
                        "bg-amber-50 text-amber-600 border border-amber-600/20"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono">{log.retryCount || log.retry_count}</td>
                    <td className="px-6 py-3">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-brand-secondary text-brand-accent rounded-lg border flex items-center gap-1 font-semibold"
                      >
                        <Eye size={12} /> View
                      </button>
                      {log.status === "failed" && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={actionLoading}
                          className="p-1.5 hover:bg-brand-secondary text-brand-primary border border-brand-primary/20 rounded-lg flex items-center gap-1 font-semibold disabled:opacity-50"
                        >
                          <RefreshCw size={12} /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center border-t border-brand-border p-4">
            <span className="text-[10px] text-brand-text-muted font-semibold">
              Showing {logs.length} of {total} logs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border rounded-xl hover:bg-brand-secondary disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-4 py-2 border rounded-xl font-mono text-[10px] font-bold">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border rounded-xl hover:bg-brand-secondary disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card w-full max-w-xl border border-brand-border rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif font-bold text-lg text-brand-text flex items-center gap-1.5">
                  <Mail className="text-brand-primary" size={18} /> Email Log Entry
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 hover:bg-brand-secondary rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed">
                <div>
                  <span className="font-bold text-brand-text-muted block">Recipient</span>
                  <span className="font-bold text-brand-text text-xs">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="font-bold text-brand-text-muted block">Subject</span>
                  <span className="font-semibold text-brand-text text-xs">{selectedLog.subject}</span>
                </div>
                <div>
                  <span className="font-bold text-brand-text-muted block">Template Type</span>
                  <span className="font-mono uppercase">{selectedLog.template.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="font-bold text-brand-text-muted block">Provider / Message ID</span>
                  <span className="font-mono flex items-center gap-1.5">
                    {selectedLog.provider} : {selectedLog.providerMessageId || selectedLog.provider_message_id || "None"}
                    {selectedLog.provider_message_id && (
                      <button
                        onClick={() => handleCopyMessageId(selectedLog.provider_message_id)}
                        className="text-brand-primary hover:underline flex items-center gap-0.5"
                      >
                        <Copy size={10} />
                      </button>
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-brand-text-muted block">Retries Count</span>
                  <span className="font-mono font-bold text-brand-text">{selectedLog.retryCount || selectedLog.retry_count}</span>
                </div>
                <div>
                  <span className="font-bold text-brand-text-muted block">Sent Time</span>
                  <span>{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>

                {/* Error Log block */}
                {selectedLog.error && (
                  <div className="col-span-2 bg-brand-error/10 border border-brand-error/25 p-3.5 rounded-2xl flex items-start gap-2 text-brand-error">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">Error Exception Logs</span>
                      <p className="font-mono whitespace-pre-wrap">{selectedLog.error}</p>
                    </div>
                  </div>
                )}

                {/* Metadata block */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="col-span-2 bg-brand-secondary/40 border border-brand-border p-3.5 rounded-2xl">
                    <span className="font-bold text-brand-text block mb-1">Metadata Properties</span>
                    <pre className="font-mono text-[9px] bg-brand-card p-2 rounded border max-h-24 overflow-y-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="border border-brand-border px-4 py-2 rounded-xl font-semibold hover:bg-brand-secondary"
                >
                  Close View
                </button>
                {selectedLog.status === "failed" && (
                  <button
                    onClick={() => handleRetry(selectedLog.id)}
                    disabled={actionLoading}
                    className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2 rounded-xl shadow-md font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Retry Delivery
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
