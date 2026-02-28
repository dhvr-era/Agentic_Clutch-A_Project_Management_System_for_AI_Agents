import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Eye, FileJson, RefreshCw, AlertCircle, FileX } from 'lucide-react';
import { ViewModal } from './ViewModal';

interface OutboxFile {
  filename: string;
  size_bytes: number;
  modified_at: string;
}

export const OutboxPage: React.FC = () => {
  const [files, setFiles] = useState<OutboxFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{ filename: string; data: any } | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/outbox');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data);
    } catch {
      setError('Could not load bot output files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (filename: string) => {
    setDownloading(filename);
    try {
      const res = await fetch(`/api/outbox/download?filename=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      alert('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleView = async (filename: string) => {
    try {
      const res = await fetch(`/api/outbox/download?filename=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error('View failed');
      const data = await res.json();
      setViewingFile({ filename, data });
    } catch {
      alert('Failed to load file contents');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-3">
          <Download className="text-amber-500" size={28} />
          Bot Output Files
        </h1>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-[var(--text-main)] transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex-1 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <RefreshCw className="text-amber-500 animate-spin" size={32} />
            <span className="text-[var(--text-muted)]">Loading files...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-red-400">
            <AlertCircle size={48} />
            <p>{error}</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-[var(--text-muted)]">
            <FileX size={48} />
            <p>No output files available</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map((file, index) => (
              <motion.div
                key={file.filename}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <FileJson className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--text-main)]">{file.filename}</h3>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-1">
                      <span>{formatSize(file.size_bytes)}</span>
                      <span>•</span>
                      <span>{new Date(file.modified_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(file.filename)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/30 transition-all"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownload(file.filename)}
                    disabled={downloading === file.filename}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 transition-all disabled:opacity-50"
                  >
                    {downloading === file.filename ? (
                      <><RefreshCw size={16} className="animate-spin" /><span>Downloading...</span></>
                    ) : (
                      <><Download size={16} /><span>Download</span></>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ViewModal
        isOpen={viewingFile !== null}
        onClose={() => setViewingFile(null)}
        filename={viewingFile?.filename || ''}
        data={viewingFile?.data}
      />
    </div>
  );
};
