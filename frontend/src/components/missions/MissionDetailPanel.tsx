import React, { useState, useEffect, useCallback } from 'react';
import type { Mission, MissionStatus } from '../../types/mission';
import { AGENTS } from '../../data/agents';
import { X, Clock, Paperclip, FileText, Zap, Plus, Trash2, Save, ChevronRight } from 'lucide-react';

interface ActivityEntry {
    id: number;
    task_id: number;
    action: string;
    actor: string;
    created_at: string;
}

interface Deliverable {
    id: number;
    task_id: number;
    type: string;
    label: string;
    url: string | null;
    created_at: string;
}

interface Session {
    key: string;
    model?: string;
    status?: string;
    sessionId?: string;
}

const STATUS_FLOW: MissionStatus[] = ['planning', 'inbox', 'assigned', 'in_progress', 'testing', 'review', 'done'];

const STATUS_COLORS: Record<MissionStatus, string> = {
    planning: 'bg-violet-500/20 text-violet-400',
    inbox: 'bg-zinc-500/20 text-zinc-400',
    assigned: 'bg-indigo-500/20 text-indigo-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    testing: 'bg-cyan-500/20 text-cyan-400',
    review: 'bg-amber-500/20 text-amber-400',
    done: 'bg-emerald-500/20 text-emerald-400',
};

function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

interface MissionDetailPanelProps {
    mission: Mission;
    onClose: () => void;
    onMoveMission: (id: string, status: MissionStatus) => void;
}

type TabId = 'overview' | 'activity' | 'deliverables' | 'planning' | 'sessions';

export const MissionDetailPanel: React.FC<MissionDetailPanelProps> = ({ mission, onClose, onMoveMission }) => {
    const isDbMission = !mission.id.startsWith('m-');
    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <FileText size={11} /> },
        { id: 'activity', label: 'Activity', icon: <Clock size={11} /> },
        { id: 'deliverables', label: 'Deliverables', icon: <Paperclip size={11} /> },
        ...(mission.status === 'planning' ? [{ id: 'planning' as TabId, label: 'Planning', icon: <FileText size={11} /> }] : []),
        { id: 'sessions', label: 'Sessions', icon: <Zap size={11} /> },
    ];

    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [activity, setActivity] = useState<ActivityEntry[]>([]);
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [planNotes, setPlanNotes] = useState('');
    const [savedNotes, setSavedNotes] = useState('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newType, setNewType] = useState('url');
    const [savingNotes, setSavingNotes] = useState(false);

    const fetchActivity = useCallback(async () => {
        if (!isDbMission) return;
        try {
            const res = await fetch(`/api/missions/${mission.id}/activity`);
            if (res.ok) setActivity(await res.json());
        } catch { /* ignore */ }
    }, [mission.id, isDbMission]);

    const fetchDeliverables = useCallback(async () => {
        if (!isDbMission) return;
        try {
            const res = await fetch(`/api/missions/${mission.id}/deliverables`);
            if (res.ok) setDeliverables(await res.json());
        } catch { /* ignore */ }
    }, [mission.id, isDbMission]);

    const fetchNotes = useCallback(async () => {
        if (!isDbMission) return;
        try {
            const res = await fetch(`/api/missions/${mission.id}/notes`);
            if (res.ok) {
                const note = await res.json();
                if (note) { setPlanNotes(note.content); setSavedNotes(note.content); }
            }
        } catch { /* ignore */ }
    }, [mission.id, isDbMission]);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch('/api/openclaw/status');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchActivity();
        fetchDeliverables();
        fetchNotes();
        fetchSessions();
    }, [fetchActivity, fetchDeliverables, fetchNotes, fetchSessions]);

    const handleAddDeliverable = async () => {
        if (!newLabel.trim() || !isDbMission) return;
        try {
            const res = await fetch(`/api/missions/${mission.id}/deliverables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: newType, label: newLabel.trim(), url: newUrl.trim() || null }),
            });
            if (res.ok) {
                setNewLabel(''); setNewUrl('');
                fetchDeliverables();
            }
        } catch { /* ignore */ }
    };

    const handleDeleteDeliverable = async (id: number) => {
        try {
            await fetch(`/api/missions/deliverables/${id}`, { method: 'DELETE' });
            setDeliverables(prev => prev.filter(d => d.id !== id));
        } catch { /* ignore */ }
    };

    const handleSaveNotes = async () => {
        if (!isDbMission) return;
        setSavingNotes(true);
        try {
            const res = await fetch(`/api/missions/${mission.id}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: planNotes }),
            });
            if (res.ok) setSavedNotes(planNotes);
        } catch { /* ignore */ }
        setSavingNotes(false);
    };

    const currentIdx = STATUS_FLOW.indexOf(mission.status);
    const assignee = mission.assigneeId ? AGENTS.find(a => a.id === mission.assigneeId) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-md h-full bg-card border-l border-card-border flex flex-col pointer-events-auto shadow-2xl">
                {/* Header */}
                <div className="px-5 py-4 border-b border-card-border shrink-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-main-text leading-snug">{mission.title}</h2>
                            <p className="text-[10px] text-muted-text font-mono mt-0.5">Mission #{mission.id}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center text-muted-text hover:text-main-text transition-all shrink-0"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* Status + quick advance */}
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_COLORS[mission.status]}`}>
                            {mission.status.replace('_', ' ')}
                        </span>
                        {currentIdx < STATUS_FLOW.length - 1 && (
                            <button
                                onClick={() => onMoveMission(mission.id, STATUS_FLOW[currentIdx + 1])}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all"
                            >
                                Advance <ChevronRight size={9} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 border-b border-card-border px-3 pt-2 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all -mb-px ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-muted-text hover:text-secondary-text'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    {/* ── Overview ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-text mb-1">Description</p>
                                <p className="text-xs text-secondary-text leading-relaxed">{mission.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-black/5 border border-divider">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-text mb-1">Priority</p>
                                    <p className="text-xs font-bold capitalize text-main-text">{mission.priority}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-black/5 border border-divider">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-text mb-1">Assignee</p>
                                    <p className="text-xs font-bold text-main-text" style={{ color: assignee?.color }}>
                                        {assignee?.name || 'Unassigned'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-black/5 border border-divider">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-text mb-1">Created</p>
                                    <p className="text-xs text-main-text">{timeAgo(mission.createdAt)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-black/5 border border-divider">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-text mb-1">Updated</p>
                                    <p className="text-xs text-main-text">{timeAgo(mission.updatedAt)}</p>
                                </div>
                            </div>
                            {/* Pipeline progress bar */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-text mb-2">Pipeline Stage</p>
                                <div className="flex items-center gap-1">
                                    {STATUS_FLOW.map((s, i) => (
                                        <div key={s}
                                            className={`flex-1 h-1.5 rounded-full transition-all ${i <= currentIdx ? 'bg-indigo-500' : 'bg-black/10'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-[9px] text-muted-text font-mono mt-1">{currentIdx + 1} / {STATUS_FLOW.length} stages</p>
                            </div>
                        </div>
                    )}

                    {/* ── Activity ── */}
                    {activeTab === 'activity' && (
                        <div className="space-y-2">
                            {!isDbMission && (
                                <p className="text-[10px] text-muted-text italic">Activity tracking available for DB missions only.</p>
                            )}
                            {activity.length === 0 && isDbMission && (
                                <p className="text-[10px] text-muted-text italic">No activity yet.</p>
                            )}
                            {activity.map(entry => (
                                <div key={entry.id} className="flex gap-3 p-2.5 rounded-xl bg-black/5 border border-divider">
                                    <div className="w-1 bg-indigo-500/40 rounded-full shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-main-text leading-snug">{entry.action}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-muted-text font-mono">{entry.actor}</span>
                                            <span className="text-[9px] text-dim-text font-mono">{timeAgo(entry.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Deliverables ── */}
                    {activeTab === 'deliverables' && (
                        <div className="space-y-3">
                            {isDbMission && (
                                <div className="p-3 rounded-xl bg-black/5 border border-divider space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-text">Add Deliverable</p>
                                    <select
                                        value={newType}
                                        onChange={e => setNewType(e.target.value)}
                                        className="w-full bg-black/10 border border-divider rounded-lg px-2 py-1.5 text-xs text-main-text outline-none"
                                    >
                                        <option value="url">URL</option>
                                        <option value="file">File</option>
                                        <option value="report">Report</option>
                                        <option value="artifact">Artifact</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Label (e.g. Final Report)"
                                        value={newLabel}
                                        onChange={e => setNewLabel(e.target.value)}
                                        className="w-full bg-black/10 border border-divider rounded-lg px-2 py-1.5 text-xs text-main-text placeholder-muted-text outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="URL or path (optional)"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        className="w-full bg-black/10 border border-divider rounded-lg px-2 py-1.5 text-xs text-main-text placeholder-muted-text outline-none"
                                    />
                                    <button
                                        onClick={handleAddDeliverable}
                                        disabled={!newLabel.trim()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/30 transition-all disabled:opacity-40"
                                    >
                                        <Plus size={10} /> Add
                                    </button>
                                </div>
                            )}
                            {deliverables.length === 0 && (
                                <p className="text-[10px] text-muted-text italic">No deliverables yet.</p>
                            )}
                            {deliverables.map(d => (
                                <div key={d.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-black/5 border border-divider group">
                                    <Paperclip size={11} className="text-muted-text shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-main-text truncate">{d.label}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-muted-text uppercase font-mono">{d.type}</span>
                                            {d.url && (
                                                <a
                                                    href={d.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[9px] text-indigo-400 hover:underline truncate max-w-[120px]"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {d.url}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDeliverable(d.id)}
                                        className="w-5 h-5 rounded flex items-center justify-center text-muted-text hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Planning ── */}
                    {activeTab === 'planning' && (
                        <div className="space-y-3">
                            <p className="text-[10px] text-muted-text leading-relaxed">
                                Planning notes for this mission. Document scope, approach, and requirements before execution.
                            </p>
                            <textarea
                                value={planNotes}
                                onChange={e => setPlanNotes(e.target.value)}
                                placeholder="Document your plan here…"
                                rows={12}
                                className="w-full bg-black/5 border border-divider rounded-xl p-3 text-xs text-main-text placeholder-muted-text outline-none resize-none font-mono leading-relaxed focus:border-indigo-500/40 transition-all"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={savingNotes || planNotes === savedNotes}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/30 transition-all disabled:opacity-40"
                                >
                                    <Save size={10} />
                                    {savingNotes ? 'Saving…' : planNotes === savedNotes ? 'Saved' : 'Save Notes'}
                                </button>
                                {planNotes !== savedNotes && (
                                    <span className="text-[9px] text-amber-400 font-mono">Unsaved changes</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Sessions (Sub-agent tracker) ── */}
                    {activeTab === 'sessions' && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-muted-text leading-relaxed">
                                Active OpenClaw sessions. Sub-agents spawned for this mission appear here.
                            </p>
                            {sessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 opacity-40">
                                    <Zap size={20} className="text-muted-text mb-2" />
                                    <p className="text-[10px] font-mono uppercase text-muted-text">No active sessions</p>
                                </div>
                            ) : sessions.map((s, i) => (
                                <div key={i} className="p-2.5 rounded-xl bg-black/5 border border-divider">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono text-indigo-400 truncate">{s.key}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                            {s.status || 'active'}
                                        </span>
                                    </div>
                                    {s.model && <p className="text-[9px] text-muted-text font-mono">Model: {s.model}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
