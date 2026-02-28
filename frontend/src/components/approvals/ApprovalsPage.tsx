// [DEV-BOT: 2026-02-28] Approvals tab — human gate for dev pipeline plan approvals
import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, RefreshCw, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Approval {
  id: number;
  task_id: number | null;
  milestone: string | null;
  plan_summary: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  decided_at?: string | null;
  decided_by?: string | null;
}

const statusColors: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
};

const iconFor = (status: string) => {
  if (status === 'approved') return <CheckCircle size={14} />;
  if (status === 'rejected') return <XCircle size={14} />;
  return <Clock size={14} />;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [acting, setActing] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/approvals');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Approval[] = await res.json();
      data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime();
      });
      setApprovals(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: number, status: 'approved' | 'rejected') => {
    setActing(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
      setExpanded(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="text-amber-500" size={28} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Approvals</h1>
            <p className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest">
              {pendingCount} pending · {approvals.length} total
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] transition-all text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-[var(--text-muted)]">
          <RefreshCw size={20} className="animate-spin text-amber-500" />
          <span className="text-xs font-mono uppercase tracking-widest">Loading approvals...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && approvals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--text-muted)]">
          <FileText size={40} />
          <p className="text-sm">No approvals yet</p>
          <p className="text-xs font-mono">Approval requests appear here when agents need review</p>
        </div>
      )}

      {/* List */}
      {!loading && approvals.map(a => (
        <div
          key={a.id}
          className="rounded-2xl border overflow-hidden transition-all"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)' }}
        >
          {/* Row */}
          <button
            className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
          >
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${statusColors[a.status] || statusColors.pending}`}>
              {iconFor(a.status)}
              {a.status}
            </span>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--text-main)]">
                {a.milestone
                  ? a.milestone.charAt(0).toUpperCase() + a.milestone.slice(1) + ' Plan'
                  : 'Plan Review'}
                {a.task_id != null && (
                  <span className="ml-2 text-[10px] font-mono text-[var(--text-muted)]">
                    task #{a.task_id}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{fmt(a.requested_at)}</div>
            </div>

            {expanded === a.id
              ? <ChevronUp size={16} className="text-[var(--text-muted)] shrink-0" />
              : <ChevronDown size={16} className="text-[var(--text-muted)] shrink-0" />}
          </button>

          {/* Expanded */}
          {expanded === a.id && (
            <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="mt-4">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                  Plan Summary
                </div>
                <pre className="text-xs text-[var(--text-main)] whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-xl bg-black/20 border border-white/5 max-h-64 overflow-y-auto">
                  {a.plan_summary || '(no summary provided)'}
                </pre>
              </div>

              {a.decided_at && (
                <div className="text-[11px] text-[var(--text-muted)]">
                  Decided {fmt(a.decided_at)}{a.decided_by ? ` · ${a.decided_by}` : ''}
                </div>
              )}

              {a.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => decide(a.id, 'approved')}
                    disabled={acting === a.id}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {acting === a.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => decide(a.id, 'rejected')}
                    disabled={acting === a.id}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest border border-rose-500/30 transition-all disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    {acting === a.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
