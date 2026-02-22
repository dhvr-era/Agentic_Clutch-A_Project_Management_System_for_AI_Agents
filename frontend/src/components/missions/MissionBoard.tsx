import React, { useState, useEffect, useCallback } from 'react';
import type { Mission, MissionStatus } from '../../types/mission';
import { MISSION_COLUMNS } from '../../types/mission';
import { AGENTS } from '../../data/agents';
import { ChevronRight, Pause, Play, Info } from 'lucide-react';

interface MissionBoardProps {
    missions: Mission[];
    onMoveMission: (missionId: string, newStatus: MissionStatus) => void;
}

const priorityColors: Record<string, string> = {
    critical: 'bg-rose-500/20 text-rose-400',
    high: 'bg-amber-500/20 text-amber-400',
    medium: 'bg-blue-500/20 text-blue-400',
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

export const MissionBoard: React.FC<MissionBoardProps> = ({ missions, onMoveMission }) => {
    const [autoPilot, setAutoPilot] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

    // Auto-advance: simulate agents progressing missions through the pipeline
    const advanceRandom = useCallback(() => {
        // Find missions that are NOT done and advance one randomly
        const advanceable = missions.filter(m => m.status !== 'done');
        if (advanceable.length === 0) return;

        const candidate = advanceable[Math.floor(Math.random() * advanceable.length)];
        const currentIdx = STATUS_FLOW.indexOf(candidate.status);
        if (currentIdx < STATUS_FLOW.length - 1) {
            onMoveMission(candidate.id, STATUS_FLOW[currentIdx + 1]);
        }
    }, [missions, onMoveMission]);

    useEffect(() => {
        if (!autoPilot) return;
        const interval = setInterval(advanceRandom, 6000 + Math.random() * 4000); // every 6-10s
        return () => clearInterval(interval);
    }, [autoPilot, advanceRandom]);

    // Manual advance: click to push a mission forward one step
    const handleAdvance = (missionId: string, currentStatus: MissionStatus) => {
        const idx = STATUS_FLOW.indexOf(currentStatus);
        if (idx < STATUS_FLOW.length - 1) {
            onMoveMission(missionId, STATUS_FLOW[idx + 1]);
        }
    };

    return (
        <div className="space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-main-text">Mission Control</h1>
                    <p className="text-secondary-text text-xs font-mono uppercase tracking-widest mt-1">Agent Pipeline • Live Monitoring</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowInfo(!showInfo)} className="w-8 h-8 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center text-muted-text hover:text-main-text transition-all" title="How this works">
                        <Info size={16} />
                    </button>
                    <button
                        onClick={() => setAutoPilot(!autoPilot)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${autoPilot
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                            : 'bg-black/5 text-muted-text border border-divider hover:text-main-text'
                            }`}
                    >
                        {autoPilot ? <Play size={12} /> : <Pause size={12} />}
                        {autoPilot ? 'Auto-pilot ON' : 'Auto-pilot OFF'}
                    </button>
                </div>
            </header>

            {/* Info panel */}
            {showInfo && (
                <div className="p-4 bg-card border border-card-border rounded-xl text-xs text-secondary-text leading-relaxed space-y-2">
                    <p className="text-main-text font-bold text-sm">How Mission Control Works</p>
                    <p>Missions flow <strong className="text-emerald-500">automatically</strong> through the pipeline as agents execute work. Each column represents a stage:</p>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                        {MISSION_COLUMNS.map(col => (
                            <div key={col.key} className="text-center p-2 bg-black/5 rounded-lg border border-divider">
                                <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5" style={{ background: col.color }} />
                                <span className="text-[10px] font-bold text-main-text uppercase block tracking-wider">{col.label}</span>
                                <span className="text-[10px] text-muted-text">{COLUMN_DESCRIPTIONS[col.key]}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-secondary-text mt-3 pt-2 border-t border-divider">You can click the <ChevronRight size={10} className="inline bg-black/10 rounded p-0.5 mx-0.5" /> arrow on any mission to manually advance it. Or leave <strong className="text-emerald-500">Auto-pilot</strong> on to simulate agent progression.</p>
                    <button onClick={() => setShowInfo(false)} className="text-[10px] text-muted-text hover:text-main-text uppercase tracking-widest font-bold mt-2">Dismiss</button>
                </div>
            )}

            <div className="grid grid-cols-5 gap-4 h-[calc(100vh-220px)] mt-4">
                {MISSION_COLUMNS.map(col => {
                    const colMissions = missions.filter(m => m.status === col.key);
                    return (
                        <div key={col.key} className="flex flex-col rounded-2xl bg-card border border-card-border overflow-hidden shadow-sm">
                            {/* Column Header */}
                            <div className="px-4 py-3 border-b border-card-border bg-black/5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                                        <span className="text-xs font-bold uppercase tracking-widest text-main-text">{col.label}</span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-text font-bold bg-black/10 px-2 py-0.5 rounded">{colMissions.length}</span>
                                </div>
                                <p className="text-[10px] text-muted-text leading-tight">{COLUMN_DESCRIPTIONS[col.key]}</p>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {colMissions.map(mission => {
                                    const assignee = mission.assigneeId ? AGENTS.find(a => a.id === mission.assigneeId) : null;
                                    const canAdvance = col.key !== 'done';
                                    return (
                                        <div
                                            key={mission.id}
                                            className="p-4 rounded-xl bg-black/5 border border-divider hover:bg-black/10 transition-all group shadow-sm"
                                        >
                                            <div className="flex items-start justify-between mb-2.5">
                                                <h4 className="text-sm font-semibold text-main-text leading-tight">{mission.title}</h4>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest shrink-0 ml-3 shadow-sm ${priorityColors[mission.priority]}`}>
                                                    {mission.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary-text leading-relaxed mb-4 line-clamp-3">{mission.description}</p>
                                            <div className="flex items-center justify-between pt-3 border-t border-divider">
                                                {assignee ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded flex items-center justify-center shadow-sm" style={{ background: `${assignee.color}20` }}>
                                                            <assignee.icon size={10} color={assignee.color} />
                                                        </div>
                                                        <span className="text-xs text-muted-text font-mono font-medium">{assignee.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-dim-text font-mono italic">Awaiting assignment</span>
                                                )}
                                                {canAdvance && (
                                                    <button
                                                        onClick={() => handleAdvance(mission.id, col.key)}
                                                        className="w-6 h-6 rounded-md bg-black/10 hover:bg-black/20 flex items-center justify-center text-muted-text hover:text-main-text transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-divider"
                                                        title={`Advance to ${STATUS_FLOW[STATUS_FLOW.indexOf(col.key) + 1]?.replace('_', ' ')}`}
                                                    >
                                                        <ChevronRight size={14} />
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
