import React from 'react';
import { Globe, Link, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import type { DashboardData } from '../../types';
import { PageHeader } from '../layout/PageHeader';

interface SourcesPageProps {
    data: DashboardData | null;
    syncingSource: string | null;
    onAddSource: () => void;
    onSyncSource: (sourceId: string, sourceName: string) => void;
    onViewFindings: (sourceId: string, sourceName: string) => void;
}

export const SourcesPage: React.FC<SourcesPageProps> = ({ data, syncingSource, onAddSource, onSyncSource, onViewFindings }) => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Live Environments"
                subtitle="External Data Connectors"
                actions={
                    <button
                        onClick={onAddSource}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    >
                        <Plus size={14} /> Add Source
                    </button>
                }
            />

            <div className="grid grid-cols-1 gap-6">
                {(!data?.sources || data.sources.length === 0) ? (
                    <div className="p-12 bg-card border border-dashed border-card-border rounded-[2rem] text-center shadow-sm">
                        <Globe size={48} className="mx-auto text-dim-text mb-4" />
                        <h3 className="text-xl font-bold text-main-text mb-2">No active connections</h3>
                        <p className="text-secondary-text text-sm max-w-sm mx-auto">Connect to a live environment (OpenClaw, 4Context) to monitor findings in real-time.</p>
                    </div>
                ) : (
                    data.sources.map((source) => (
                        <div key={source.id} className="p-8 bg-card border border-card-border rounded-[2rem] group relative shadow-md">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${source.status === 'online' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-black/10 text-muted-text border border-divider'}`}>
                                        <Globe size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-main-text mb-1">{source.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-secondary-text font-mono">
                                            <Link size={14} />
                                            <span>{source.url}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${source.status === 'online' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                        {source.status}
                                    </div>
                                    <span className="text-xs text-muted-text uppercase font-mono tracking-tighter">Last Sync: {new Date(source.last_sync).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-5 mb-8">
                                <div className="p-5 bg-black/5 rounded-2xl border border-divider shadow-sm">
                                    <span className="text-xs text-secondary-text uppercase block mb-1 font-bold tracking-widest">Findings</span>
                                    <span className="text-2xl font-mono font-bold text-main-text">24</span>
                                </div>
                                <div className="p-5 bg-black/5 rounded-2xl border border-divider shadow-sm">
                                    <span className="text-xs text-secondary-text uppercase block mb-1 font-bold tracking-widest">Latency</span>
                                    <span className="text-2xl font-mono font-bold text-main-text">142ms</span>
                                </div>
                                <div className="p-5 bg-black/5 rounded-2xl border border-divider shadow-sm">
                                    <span className="text-xs text-secondary-text uppercase block mb-1 font-bold tracking-widest">Uptime</span>
                                    <span className="text-2xl font-mono font-bold text-main-text">99.9%</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => onSyncSource(source.id, source.name)}
                                    disabled={syncingSource === source.id}
                                    className="flex-1 bg-black/5 border border-divider hover:bg-black/10 text-main-text py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    <RefreshCw size={18} className={syncingSource === source.id ? 'animate-spin' : ''} />
                                    {syncingSource === source.id ? 'Syncing...' : 'Force Sync'}
                                </button>
                                <button
                                    onClick={() => onViewFindings(source.id, source.name)}
                                    className="flex-1 bg-black/5 border border-divider hover:bg-black/10 text-main-text py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <ShieldCheck size={18} />
                                    View Findings
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
