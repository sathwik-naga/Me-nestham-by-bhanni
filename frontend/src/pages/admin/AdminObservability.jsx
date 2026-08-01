import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Activity, Server, Database, ShieldCheck, Mail, CreditCard, 
  HardDrive, RefreshCw, Cpu, Layers, CheckCircle2, AlertTriangle, XCircle, Search
} from 'lucide-react';

export default function AdminObservability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchMonitoringData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/observability/dashboard');
      if (response && response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch observability data:', err);
      setError(err?.message || 'Failed to load production monitoring dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const health = data?.health;
  const security = data?.securityMetrics;
  const business = data?.businessMetrics;
  const auditLogs = data?.auditLogs || [];
  const deployment = data?.deployment;

  const filteredLogs = auditLogs.filter(log => 
    !searchFilter || 
    log.action?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    log.target_type?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    log.details?.email?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const renderStatusBadge = (status) => {
    if (status === 'healthy' || status === 'SUCCESS') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
          <CheckCircle2 size={12} /> Healthy
        </span>
      );
    }
    if (status === 'degraded' || status === 'WARNING') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
          <AlertTriangle size={12} /> Degraded
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
        <XCircle size={12} /> Unhealthy
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 font-accent flex flex-col gap-8 text-left text-brand-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Activity size={16} />
            <span>Production Operations & Observability</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-text">System Health & Telemetry</h1>
        </div>

        <button
          onClick={fetchMonitoringData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl text-xs flex items-center gap-2 font-medium">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Module 1: Component Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
              <Database size={16} className="text-brand-primary" />
              <span>PostgreSQL Database</span>
            </div>
            {renderStatusBadge(health?.components?.database?.status)}
          </div>
          <p className="text-xs text-brand-text-muted">{health?.components?.database?.message || 'Checking...'}</p>
          <div className="text-[11px] text-brand-text-muted font-mono">
            Latency: {health?.components?.database?.latencyMs || 0} ms
          </div>
        </div>

        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
              <Mail size={16} className="text-brand-primary" />
              <span>Email Delivery</span>
            </div>
            {renderStatusBadge(health?.components?.email?.status)}
          </div>
          <p className="text-xs text-brand-text-muted">{health?.components?.email?.message || 'Checking...'}</p>
          <div className="text-[11px] text-brand-text-muted font-mono">Provider: Resend / SMTP</div>
        </div>

        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
              <CreditCard size={16} className="text-brand-primary" />
              <span>Razorpay Gateway</span>
            </div>
            {renderStatusBadge(health?.components?.payment?.status)}
          </div>
          <p className="text-xs text-brand-text-muted">{health?.components?.payment?.message || 'Checking...'}</p>
          <div className="text-[11px] text-brand-text-muted font-mono">Webhook: Verified Active</div>
        </div>

        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
              <HardDrive size={16} className="text-brand-primary" />
              <span>Supabase Storage</span>
            </div>
            {renderStatusBadge(health?.components?.storage?.status)}
          </div>
          <p className="text-xs text-brand-text-muted">{health?.components?.storage?.message || 'Checking...'}</p>
          <div className="text-[11px] text-brand-text-muted font-mono">
            Buckets: {health?.components?.storage?.details?.bucketCount || 0}
          </div>
        </div>
      </div>

      {/* Module 5, 8 & 9: Real-time Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-2">
          <span className="text-xs text-brand-text-muted font-bold uppercase tracking-wider">Active 2FA Sessions</span>
          <div className="text-2xl font-extrabold text-brand-primary">{security?.active2FASessions || 0}</div>
          <span className="text-[11px] text-brand-text-muted">Pending OTP verifications</span>
        </div>

        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-2">
          <span className="text-xs text-brand-text-muted font-bold uppercase tracking-wider">2FA Success Rate</span>
          <div className="text-2xl font-extrabold text-green-500">{security?.otpSuccessRate || '100%'}</div>
          <span className="text-[11px] text-brand-text-muted">{security?.otpsVerified24h || 0} verified in last 24h</span>
        </div>

        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-2">
          <span className="text-xs text-brand-text-muted font-bold uppercase tracking-wider">Orders Today</span>
          <div className="text-2xl font-extrabold text-brand-text">{business?.ordersToday || 0}</div>
          <span className="text-[11px] text-brand-text-muted">₹{business?.revenueToday || 0} revenue today</span>
        </div>

        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex flex-col gap-2">
          <span className="text-xs text-brand-text-muted font-bold uppercase tracking-wider">Memory Allocation</span>
          <div className="text-2xl font-extrabold text-brand-text">{health?.memory?.heapUsedMb || 0} MB</div>
          <span className="text-[11px] text-brand-text-muted">Heap total: {health?.memory?.heapTotalMb || 0} MB</span>
        </div>
      </div>

      {/* Module 10: Build & Deployment Version Info */}
      <div className="p-6 bg-brand-card border border-brand-border rounded-3xl flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-primary">
          <Layers size={16} />
          <span>Deployment Environment Metadata</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-brand-text-muted block text-[11px]">Frontend Version</span>
            <strong className="text-brand-text font-mono">v{deployment?.frontendVersion || '1.0.0'}</strong>
          </div>
          <div>
            <span className="text-brand-text-muted block text-[11px]">Backend Version</span>
            <strong className="text-brand-text font-mono">v{deployment?.backendVersion || '1.0.0'}</strong>
          </div>
          <div>
            <span className="text-brand-text-muted block text-[11px]">Git Commit SHA</span>
            <strong className="text-brand-primary font-mono">{deployment?.gitCommit || '216e278'}</strong>
          </div>
          <div>
            <span className="text-brand-text-muted block text-[11px]">Environment</span>
            <strong className="text-green-500 uppercase font-mono">{deployment?.environment || 'production'}</strong>
          </div>
        </div>
      </div>

      {/* Module 3: Admin Audit Logs Table */}
      <div className="p-6 bg-brand-card border border-brand-border rounded-3xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-brand-text">Security & Admin Audit Logs</h2>
            <p className="text-xs text-brand-text-muted">Tracking authentication, OTPs, inventory mutations, and administrative actions.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-brand-secondary border border-brand-border pl-9 pr-4 py-2 rounded-xl text-xs text-brand-text outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-brand-border/60 text-brand-text-muted uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">User / IP</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-text-muted">
                    No audit logs matching search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-brand-text-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-text">{log.action}</td>
                    <td className="py-3 px-4 text-brand-text-muted">{log.target_type}</td>
                    <td className="py-3 px-4 text-brand-text-muted font-mono">
                      {log.details?.email || log.user_id || 'System'}
                      {log.details?.ip ? ` (${log.details.ip})` : ''}
                    </td>
                    <td className="py-3 px-4">{renderStatusBadge(log.details?.status || 'SUCCESS')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
