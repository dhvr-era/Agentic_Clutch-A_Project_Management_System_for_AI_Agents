import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, AlertTriangle, CheckCircle, XCircle, Info, Shield, FileText } from 'lucide-react';

type FileType = 'intel' | 'security' | 'scrape' | 'unknown';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  data: any;
}

const detectFileType = (filename: string): FileType => {
  if (filename.startsWith('intel-')) return 'intel';
  if (filename.startsWith('sec-')) return 'security';
  if (filename.startsWith('scrape-')) return 'scrape';
  return 'unknown';
};

const getSeverityColor = (severity: string) => {
  const map: Record<string, string> = {
    critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    medium: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    pass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warn: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    fail: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  return map[severity?.toLowerCase()] || 'bg-slate-500/20 text-slate-400';
};

const getStatusIcon = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'pass' || s === 'done') return <CheckCircle size={16} className="text-emerald-400" />;
  if (s === 'warn') return <AlertTriangle size={16} className="text-amber-400" />;
  if (s === 'fail' || s === 'error') return <XCircle size={16} className="text-rose-400" />;
  return <Info size={16} className="text-indigo-400" />;
};

// Intel View - HackerNews Stories
const IntelView: React.FC<{ data: any }> = ({ data }) => {
  const stories = data?.stories || data?.data?.stories || Array.isArray(data) ? data : [data];
  
  if (!Array.isArray(stories) || stories.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        <Info size={48} className="mx-auto mb-4 opacity-30" />
        <p>No stories found in this file</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--text-muted)]">{stories.length} stories</span>
      </div>
      {stories.map((story: any, idx: number) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <a 
                href={story.url || story.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--text-main)] font-medium hover:text-amber-400 transition-colors flex items-center gap-2"
              >
                {story.title || 'Untitled'}
                <ExternalLink size={14} className="opacity-50" />
              </a>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">↑ {story.score || story.points || 0}</span>
                <span className="flex items-center gap-1">💬 {story.comments || story.descendants || 0}</span>
                {story.time && (
                  <span>{new Date(story.time * 1000).toLocaleString()}</span>
                )}
              </div>
            </div>
            {story.source && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {story.source}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Security View - Check Cards
const SecurityView: React.FC<{ data: any }> = ({ data }) => {
  const checks = data?.checks || data?.results || data?.findings || 
                 (Array.isArray(data) ? data : data?.data ? [data.data] : []);
  
  if (!Array.isArray(checks) || checks.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        <Shield size={48} className="mx-auto mb-4 opacity-30" />
        <p>No security checks found</p>
      </div>
    );
  }

  const summary = {
    pass: checks.filter((c: any) => c.status?.toLowerCase() === 'pass').length,
    warn: checks.filter((c: any) => c.status?.toLowerCase() === 'warn').length,
    fail: checks.filter((c: any) => c.status?.toLowerCase() === 'fail').length,
    total: checks.length,
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-slate-800/30">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-400 font-bold">{summary.pass} Pass</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-sm text-amber-400 font-bold">{summary.warn} Warn</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle size={16} className="text-rose-400" />
          <span className="text-sm text-rose-400 font-bold">{summary.fail} Fail</span>
        </div>
        <span className="ml-auto text-sm text-[var(--text-muted)]">{summary.total} total</span>
      </div>

      {checks.map((check: any, idx: number) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getStatusIcon(check.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium text-[var(--text-main)]">
                  {check.check_name || check.name || check.title || `Check ${idx + 1}`}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColor(check.status || check.severity)}`}>
                  {check.status || check.severity || 'info'}
                </span>
                {check.severity && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColor(check.severity)}`}>
                    {check.severity}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {check.details || check.message || check.description || 'No details'}
              </p>
              {check.timestamp && (
                <p className="text-xs text-[var(--text-muted)] mt-2 font-mono">
                  {new Date(check.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Scrape View - Error List/Table
const ScrapeView: React.FC<{ data: any }> = ({ data }) => {
  const raw = data?.data ?? data;
  const results: any[] = Array.isArray(raw) ? raw : [];
  const errors: string[] = data?.errors ?? [];

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Errors</p>
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-rose-300 flex items-start gap-2"><XCircle size={14} className="mt-0.5 shrink-0" />{e}</p>
          ))}
        </div>
      )}
      {results.length === 0 && errors.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>No results in this file</p>
        </div>
      )}
      {results.map((item: any, idx: number) => (
        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
          className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-sm">
          <div className="flex items-center gap-3 mb-1">
            {getStatusIcon(item.status)}
            <span className="font-medium text-[var(--text-main)]">{item.title || item.url || item.id || `Item ${idx + 1}`}</span>
          </div>
          {item.url && item.title && <p className="text-xs text-[var(--text-muted)] truncate ml-7">{item.url}</p>}
          {item.error && <p className="text-xs text-rose-400 mt-1 ml-7">{item.error}</p>}
        </motion.div>
      ))}
    </div>
  );
};

// Unknown / fallback — key-value table
const UnknownView: React.FC<{ data: any }> = ({ data }) => {
  const entries = Object.entries(typeof data === 'object' && data !== null ? data : { value: data });
  return (
    <div className="max-h-[60vh] overflow-y-auto pr-2">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-700/30">
              <td className="py-2 pr-4 text-[var(--text-muted)] font-mono text-xs w-1/3 align-top">{k}</td>
              <td className="py-2 text-[var(--text-main)] break-all">
                {Array.isArray(v)
                  ? <span className="text-xs text-amber-400">[{v.length} items]</span>
                  : typeof v === 'object' && v !== null
                  ? <span className="text-xs text-indigo-400">{'{'}{Object.keys(v).length} keys{'}'}</span>
                  : String(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main ViewModal ─────────────────────────────────────────────────────────────
export const ViewModal: React.FC<ViewModalProps> = ({ isOpen, onClose, filename, data }) => {
  const fileType = detectFileType(filename);

  // For security files, normalise checks from dict → array
  const normalised = (() => {
    if (fileType === 'security' && data?.checks && !Array.isArray(data.checks)) {
      return { ...data, checks: Object.entries(data.checks).map(([name, val]: [string, any]) => ({ check_name: name, ...val })) };
    }
    if (fileType === 'intel' && data?.data) {
      return { ...data, stories: data.data };
    }
    return data;
  })();

  const typeLabel: Record<FileType, string> = { intel: 'Intel', security: 'Security', scrape: 'Scrape', unknown: 'File' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-3xl bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">{filename}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 uppercase tracking-widest font-mono">{typeLabel[fileType]} view</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {fileType === 'intel'    && <IntelView    data={normalised} />}
              {fileType === 'security' && <SecurityView data={normalised} />}
              {fileType === 'scrape'   && <ScrapeView   data={normalised} />}
              {fileType === 'unknown'  && <UnknownView  data={normalised} />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};