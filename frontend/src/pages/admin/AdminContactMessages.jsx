import React, { useState, useEffect } from "react";
import { 
  Search, Filter, Eye, Trash2, Mail, CheckCircle, Clock, 
  Download, Archive, ChevronLeft, ChevronRight, RefreshCw, X, MessageSquare, Reply
} from "lucide-react";
import { api, showToast } from "../../services/api";

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Modal State
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/contact-messages?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${statusFilter}`);
      if (res?.success) {
        setMessages(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1, limit: 10 });
      }
    } catch (err) {
      showToast(err?.message || "Failed to load contact messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/admin/contact-messages/${id}/status`, { status: newStatus }, { method: "PATCH" });
      if (res?.success) {
        showToast(`Message marked as ${newStatus}`);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, status: newStatus } : msg))
        );
        if (selectedMessage?.id === id) {
          setSelectedMessage((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      showToast(err?.message || "Failed to update message status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    setUpdatingId(id);
    try {
      const res = await api.delete(`/admin/contact-messages/${id}`);
      if (res?.success) {
        showToast("Message moved to deleted history.");
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      showToast(err?.message || "Failed to delete message");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem("access_token");
    const exportUrl = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/contact-messages/export-csv?search=${encodeURIComponent(search)}&status=${statusFilter}`;
    
    // Trigger download via temporary link or fetch with bearer token
    fetch(exportUrl, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contact_messages_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("Contact messages CSV exported successfully.");
      })
      .catch(() => showToast("Failed to export CSV."));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">NEW</span>;
      case "read":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30">READ</span>;
      case "replied":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-500/15 text-green-600 border border-green-500/30">REPLIED</span>;
      case "archived":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-500/15 text-gray-600 border border-gray-500/30">ARCHIVED</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-200 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-text">Contact Messages</h1>
          <p className="text-xs text-brand-text-muted mt-1">Manage customer inquiries, feedback, and support tickets.</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 bg-brand-card hover:bg-brand-secondary border border-brand-border text-brand-text text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Download size={14} className="text-brand-primary" /> Export CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-card border border-brand-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-secondary border border-brand-border pl-10 pr-4 py-2.5 rounded-xl text-xs text-brand-text outline-none focus:border-brand-primary"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-primary hover:bg-brand-accent text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={14} className="text-brand-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-brand-secondary border border-brand-border px-3 py-2.5 rounded-xl text-xs text-brand-text outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={fetchMessages}
            className="p-2.5 bg-brand-secondary border border-brand-border rounded-xl hover:text-brand-primary text-brand-text-muted transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-brand-text-muted flex flex-col items-center gap-2">
            <RefreshCw className="animate-spin text-brand-primary" size={20} />
            Loading contact messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-xs text-brand-text-muted">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-40 text-brand-text-muted" />
            No contact messages found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-secondary border-b border-brand-border text-brand-text-muted uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-brand-secondary/40 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(msg.status)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-text">{msg.name}</span>
                        <a href={`mailto:${msg.email}`} className="text-[11px] text-brand-text-muted hover:text-brand-primary transition-colors">
                          {msg.email}
                        </a>
                        <span className="text-[10px] text-brand-text-muted">{msg.phone}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <span className="font-semibold text-brand-text block truncate">{msg.subject}</span>
                      <span className="text-[11px] text-brand-text-muted block truncate">{msg.message}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-brand-text-muted text-[11px]">
                      {new Date(msg.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Modal Trigger */}
                        <button
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (msg.status === "new") {
                              handleStatusChange(msg.id, "read");
                            }
                          }}
                          className="p-2 hover:bg-brand-secondary text-brand-primary rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Status Toggle Button */}
                        {msg.status !== "replied" && (
                          <button
                            onClick={() => handleStatusChange(msg.id, "replied")}
                            disabled={updatingId === msg.id}
                            className="p-2 hover:bg-green-500/10 text-green-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Mark as Replied"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}

                        {/* Archive Button */}
                        {msg.status !== "archived" && (
                          <button
                            onClick={() => handleStatusChange(msg.id, "archived")}
                            disabled={updatingId === msg.id}
                            className="p-2 hover:bg-gray-500/10 text-gray-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Archive Message"
                          >
                            <Archive size={15} />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(msg.id)}
                          disabled={updatingId === msg.id}
                          className="p-2 hover:bg-red-500/10 text-brand-error rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Message"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="bg-brand-secondary/40 border-t border-brand-border px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-brand-text-muted">
              Showing page <span className="font-bold text-brand-text">{pagination.page}</span> of{" "}
              <span className="font-bold text-brand-text">{pagination.totalPages}</span> ({pagination.total} total)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-brand-border text-brand-text bg-brand-card hover:bg-brand-secondary disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-brand-border text-brand-text bg-brand-card hover:bg-brand-secondary disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">Contact Ticket</span>
                <h2 className="font-serif font-bold text-lg text-brand-text mt-0.5">{selectedMessage.subject}</h2>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-brand-secondary rounded-xl text-brand-text-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-2 gap-4 bg-brand-secondary p-4 rounded-2xl border border-brand-border text-xs">
              <div>
                <span className="text-brand-text-muted block text-[10px] uppercase font-bold">Customer Name</span>
                <span className="font-semibold text-brand-text">{selectedMessage.name}</span>
              </div>
              <div>
                <span className="text-brand-text-muted block text-[10px] uppercase font-bold">Status</span>
                <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
              </div>
              <div>
                <span className="text-brand-text-muted block text-[10px] uppercase font-bold">Email</span>
                <a href={`mailto:${selectedMessage.email}`} className="text-brand-primary font-medium hover:underline">
                  {selectedMessage.email}
                </a>
              </div>
              <div>
                <span className="text-brand-text-muted block text-[10px] uppercase font-bold">Phone Number</span>
                <a href={`tel:${selectedMessage.phone}`} className="text-brand-text font-medium hover:underline">
                  {selectedMessage.phone}
                </a>
              </div>
              <div>
                <span className="text-brand-text-muted block text-[10px] uppercase font-bold">Submitted Date</span>
                <span className="text-brand-text">
                  {new Date(selectedMessage.created_at).toLocaleString("en-IN")}
                </span>
              </div>
              {selectedMessage.ip_address && (
                <div>
                  <span className="text-brand-text-muted block text-[10px] uppercase font-bold">IP Address</span>
                  <span className="text-brand-text font-mono text-[11px]">{selectedMessage.ip_address}</span>
                </div>
              )}
            </div>

            {/* Full Message Body */}
            <div>
              <span className="text-xs font-bold text-brand-text block mb-2">Message Body:</span>
              <div className="bg-brand-secondary/60 border border-brand-border p-4 rounded-2xl text-xs text-brand-text leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-brand-border">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                className="w-full sm:w-auto bg-brand-primary hover:bg-brand-accent text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow cursor-pointer"
              >
                <Reply size={14} /> Reply via Email
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={selectedMessage.status}
                  onChange={(e) => handleStatusChange(selectedMessage.id, e.target.value)}
                  className="bg-brand-secondary border border-brand-border px-3 py-2.5 rounded-xl text-xs text-brand-text outline-none cursor-pointer"
                >
                  <option value="new">Mark New</option>
                  <option value="read">Mark Read</option>
                  <option value="replied">Mark Replied</option>
                  <option value="archived">Archive</option>
                </select>

                <button
                  onClick={() => setSelectedMessage(null)}
                  className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-brand-card cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
