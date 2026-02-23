import React, { useState, useEffect, useCallback } from 'react';
import type { Mission, MissionStatus } from '../../types/mission';
import { MISSION_COLUMNS } from '../../types/mission';
import { AGENTS, TIER_COLORS } from '../../data/agents';
import { ChevronRight, Pause, Play, Info, Target } from 'lucide-react';

interface MissionPipelineProps {
    missions: Mission[];
    onMoveMission: (missionId: string, newStatus: MissionStatus) => void;
    /** If set, filters missions to only this project */
    projectId?: string;
}

const priorityColors: Record<string, string> = {
    critical: 'bg-amber-500/20 text-amber-400',
    high: 'bg-indigo-500/20 text-indigo-400',
    medium: 'bg-indigo-500/20 text-indigo-400',
    low: 'bg-zinc-500/20 text-zinc-400',
};

const STATUS_FLOW: MissionStatus[] = ['inbox', 'assigned', 'in_progress', 'review', 'done'];

const COLUMN_DESCRIPTIONS: Record<MissionStatus, string> = {
    inbox: 'New missions waiting for agent assignment',
    assigned: 'Agent assigned, queued for execution',
    in_progress: 'Agent is actively working',
    review: 'Agent finished — awaiting your review',
    done: 'Completed and approved',
};

export const MissionPipeline: React.FC<MissionPipelineProps> = ({
    missions, onMoveMission, projectId
}) => {
    const [autoPilot, setAutoPilot] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

    // Filter to project scope if provided
    const scopedMissions = projectId
        ? missions.filter(m => m.projectId === projectId)
        : missions;

    const advanceRandom = useCallback(() => {
        const advanceable = scopedMissions.filter(m => m.status !== 'done');
        if (advanceable.length === 0) return;
        const candidate = advanceable[Math.floor(Math.random() * advanceable.length)];
        const currentIdx = STATUS_FLOW.indexOf(candidate.status);
        if (currentIdx < STATUS_FLOW.length - 1) {
            onMoveMission(candidate.id, STATUS_FLOW[currentIdx + 1]);
        }
    }, [scopedMissions, onMoveMission]);

    useEffect(() => {
        if (!autoPilot) return;
        const interval = setInterval(advanceRandom, 6000 + Math.random() * 4000);
        return () => clearInterval(interval);
    }, [autoPilot, advanceRandom]);

    const handleAdvance = (missionId: string, currentStatus: MissionStatus) => {
        const idx = STATUS_FLOW.indexOf(currentStatus);
        if (idx < STATUS_FLOW.length - 1) {
            onMoveMission(missionId, STATUS_FLOW[idx + 1]);
        }
    };

    const totalMissions = scopedMissions.length;
    const doneCount = scopedMissions.filter(m => m.status === 'done').length;
    const pct = totalMissions > 0 ? Math.round((doneCount / totalMissions) * 100) : 0;

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* ── Control Bar ── */}
            <div className="flex items-center gap-3">
                {/* Pipeline progress */}
                <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-card border border-card-border rounded-xl">
                    <Target size={13} className="text-indigo-400 shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">
                                Pipeline Progress
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-400">{doneCount}/{totalMissions} done</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                    <span className="text-sm font-bold font-mono text-amber-400 shrink-0 w-10 text-right">{pct}%</span>
                </div>

                {/* Info button */}
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="w-9 h-9 rounded-xl bg-card border border-card-border hover:bg-black/10 flex items-center justify-center text-muted-text hover:text-main-text transition-all"
                    title="How this works"
                >
                    <Info size={15} />
                </button>

                {/* Auto-pilot toggle */}
                <button
                    onClick={() => setAutoPilot(!autoPilot)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${autoPilot
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm'
                        : 'bg-card text-muted-text border-card-border hover:text-main-text'
                        }`}
                >
                    {autoPilot ? <Play size={11} /> : <Pause size={11} />}
                    {autoPilot ? 'Auto ON' : 'Auto OFF'}
                </button>
            </div>

            {/* Info panel */}
            {showInfo && (
                <div className="p-4 bg-card border border-card-border rounded-xl text-xs text-secondary-text leading-relaxed space-y-2">
                    <p className="text-main-text font-bold text-sm">How Mission Control Works</p>
                    <p>Missions flow <strong className="text-amber-500">automatically</strong> through the pipeline as agents execute work. Each column represents a stage in the agent pipeline.</p>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                        {MISSION_COLUMNS.map(col => (
                            <div key={col.key} className="text-center p-2 bg-black/5 rounded-lg border border-divider">
                                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: col.color }} />
                                <span className="text-[10px] font-bold text-main-text uppercase block tracking-wider">{col.label}</span>
                                <span className="text-[10px] text-muted-text">{COLUMN_DESCRIPTIONS[col.key]}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setShowInfo(false)} className="text-[10px] text-muted-text hover:text-main-text uppercase tracking-widest font-bold mt-1">Dismiss</button>
                </div>
            )}

            {/* ── Kanban Columns ── */}
            <div className="grid grid-cols-5 gap-3 flex-1 min-h-0">
                {MISSION_COLUMNS.map(col => {
                    const colMissions = scopedMissions.filter(m => m.status === col.key);
                    return (
                        <div key={col.key} className="flex flex-col rounded-2xl bg-card border border-card-border overflow-hidden shadow-sm min-h-0">
                            {/* Column Header */}
                            <div className="px-3 py-2.5 border-b border-card-border bg-black/5 shrink-0"
                                style={{ borderTop: `3px solid ${col.color}` }}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-main-text">{col.label}</span>
                                    <span className="text-[10px] font-mono text-muted-text font-bold bg-black/10 px-1.5 py-0.5 rounded">{colMissions.length}</span>
                                </div>
                                <p className="text-[9px] text-muted-text leading-tight">{COLUMN_DESCRIPTIONS[col.key]}</p>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                                {colMissions.length === 0 ? (
                                    <div className="flex items-center justify-center h-12 opacity-20">
                                        <span className="text-[10px] font-mono uppercase text-muted-text">Empty</span>
                                    </div>
                                ) : colMissions.map(mission => {
                                    const assignee = mission.assigneeId ? AGENTS.find(a => a.id === mission.assigneeId) : null;
                                    const isLead = assignee?.tier === 'Top';
                                    const tierC = isLead ? TIER_COLORS.lead : TIER_COLORS.workhorse;
                                    const canAdvance = col.key !== 'done';
                                    return (
                                        <div key={mission.id}
                                            className="p-3 rounded-xl bg-black/5 border border-divider hover:bg-black/10 transition-all group shadow-sm"
                                            style={{ borderLeft: assignee ? `3px solid ${assignee.color}` : undefined }}>
                                            {/* Title + priority */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="text-xs font-semibold text-main-text leading-tight">{mission.title}</h4>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${priorityColors[mission.priority]}`}>
                                                    {mission.priority.slice(0, 3)}
                                                </span>
                                            </div>
                                            {/* Description */}
                                            <p className="text-[10px] text-secondary-text leading-relaxed mb-2.5 line-clamp-2">{mission.description}</p>
                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-2 border-t border-divider">
                                                {assignee ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-4 h-4 rounded flex items-center justify-center"
                                                            style={{ background: tierC.bg, border: `1px solid ${tierC.border}` }}>
                                                            <assignee.icon size={8} color={tierC.primary} />
                                                        </div>
                                                        <span className="text-[10px] font-mono font-bold" style={{ color: assignee.color }}>{assignee.name}</span>
                                                        {isLead && (
                                                            <span className="text-[8px] px-1 py-0.5 rounded-full font-black uppercase"
                                                                style={{ background: TIER_COLORS.lead.bg, color: TIER_COLORS.lead.primary }}>
                                                                Lead
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-dim-text font-mono italic">Unassigned</span>
                                                )}
                                                {canAdvance && (
                                                    <button
                                                        onClick={() => handleAdvance(mission.id, col.key)}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-muted-text hover:text-main-text bg-black/10 hover:bg-black/20 transition-all opacity-0 group-hover:opacity-100 border border-divider"
                                                        title={`Advance to ${STATUS_FLOW[STATUS_FLOW.indexOf(col.key) + 1]?.replace('_', ' ')}`}
                                                    >
                                                        <ChevronRight size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
