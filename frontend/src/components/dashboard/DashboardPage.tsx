import React, { useState } from 'react';
import { Activity, Zap, Layers, Users, CheckCircle2, Target, Briefcase, ArrowRight, ClipboardList, Plus, ChevronDown } from 'lucide-react';
import type { DashboardData } from '../../types';
import type { Mission } from '../../types/mission';
import type { ActivityEvent } from '../../types/activity';
import type { LogEntry, MyTask, TaskStatus } from '../../data/agents';
import type { Project } from '../../types/project';
import { AGENTS } from '../../data/agents';
import { OperationsPanel } from './OperationsPanel';

interface DashboardPageProps {
    data: DashboardData | null;
    missions: Mission[];
    activity: ActivityEvent[];
    tasks: MyTask[];
    logs: LogEntry[];
    projects?: Project[];
    onNavigate?: (tab: string) => void;
    onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => void;
    onCreateTask?: () => void;
    onCreateAgent?: () => void;
    onCreateProject?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
    data, missions, activity, tasks, logs, projects = [], onNavigate, onUpdateTaskStatus,
    onCreateTask, onCreateAgent, onCreateProject
}) => {
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    const runningMissions = missions.filter(m => m.status === 'in_progress');
    const reviewMissions = missions.filter(m => m.status === 'review');
    const inboxCount = missions.filter(m => m.status === 'inbox').length;
    const doneCount = missions.filter(m => m.status === 'done').length;
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);

    // Helper: find project name for a task/mission
    const getProjectName = (taskOrMission: { assigneeId?: string; projectId?: string }) => {
        if ('projectId' in taskOrMission && taskOrMission.projectId) {
            const proj = projects.find(p => p.id === taskOrMission.projectId);
            return proj?.title;
        }
        return undefined;
    };

    return (
        <div className="space-y-4">
            {/* Header — tight */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-main-text">Agentic Clutch</h1>
                    <p className="text-secondary-text font-mono text-xs uppercase tracking-widest">Control Plane • Operational</p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className="relative">
                        <button
                            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] group"
                        >
                            <Plus size={12} className={showCreateDropdown ? 'rotate-45 transition-transform' : 'transition-transform'} />
                            Create
                            <ChevronDown size={10} className={`opacity-50 transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showCreateDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowCreateDropdown(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => { onCreateTask?.(); setShowCreateDropdown(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20">
                                            <ClipboardList size={12} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-wider">New Task</p>
                                            <p className="text-xs text-zinc-400 font-mono">Assign to agent</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { onCreateProject?.(); setShowCreateDropdown(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 border-t border-white/5 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20">
                                            <Briefcase size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-wider">New Project</p>
                                            <p className="text-xs text-zinc-400 font-mono">Organize work</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { onCreateAgent?.(); setShowCreateDropdown(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 border-t border-white/5 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20">
                                            <Users size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-wider">New Agent</p>
                                            <p className="text-xs text-zinc-400 font-mono">Expand fleet</p>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Live Pulse</span>
                    </div>
                </div>
            </div>

            {/* KPI Strip — 4 metrics inline */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Daily Cost', value: `$${data?.usage_summary?.daily_cost?.toFixed(2) || '0.00'}`, color: 'text-emerald-400', icon: Zap },
                    { label: 'Active', value: `${runningMissions.length + pendingTasks.length}`, color: 'text-blue-400', icon: Activity },
                    { label: 'Tokens', value: `${((data?.usage_summary?.total_tokens || 0) / 1000).toFixed(0)}k`, color: 'text-cyan-400', icon: Layers },
                    { label: 'Completed', value: `${doneCount + completedTasks.length}`, color: 'text-emerald-400', icon: CheckCircle2 },
                ].map(kpi => (
                    <div key={kpi.label} className="px-4 py-3 bg-card border border-card-border rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <kpi.icon size={14} className="text-secondary-text" />
                            <span className="text-xs text-secondary-text uppercase tracking-widest font-bold">{kpi.label}</span>
                        </div>
                        <span className={`text-3xl font-mono font-bold ${kpi.color}`}>{kpi.value}</span>
                    </div>
                ))}
            </div>

            {/* Active Projects — MOVED UP to be prominent */}
            {projects.length > 0 && (
                <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-card-border flex items-center gap-2">
                        <Briefcase size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">Active Projects</span>
                        <span className="ml-auto text-xs font-mono text-muted-text">{projects.filter(p => p.status === 'active').length}</span>
                    </div>
                    <div className="divide-y divide-card-border">
                        {projects.filter(p => p.status === 'active').map(proj => {
                            const lead = AGENTS.find(a => a.id === proj.leadAgentId);
                            const pt = tasks.filter(t => t.projectId === proj.id);
                            const done = pt.filter(t => t.completed).length;
                            const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
                            return (
                                <div key={proj.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => onNavigate?.('projects')}>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-main-text block truncate">{proj.title}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {lead && <span className="text-xs font-mono" style={{ color: lead.color }}>{lead.name}</span>}
                                            <span className="text-xs text-muted-text">{done}/{pt.length} tasks</span>
                                        </div>
                                    </div>
                                    <div className="w-24 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-emerald-400">{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Operational Area: In Progress Missions + The Consolidated Ops Panel */}
            <div className="grid grid-cols-2 gap-3">
                {/* In Progress Missions */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden h-[320px] flex flex-col">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-amber-400" />
                            <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">In Progress</span>
                        </div>
                        <span className="text-xs font-mono text-muted-text">{runningMissions.length}</span>
                    </div>
                    <div className="divide-y divide-white/5 overflow-y-auto flex-1 custom-scrollbar">
                        {runningMissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 opacity-30">
                                <Target size={24} className="mb-2" />
                                <span className="text-sm uppercase font-mono text-muted-text tracking-tighter">No active missions</span>
                            </div>
                        ) : runningMissions.map(m => {
                            const agent = m.assigneeId ? AGENTS.find(a => a.id === m.assigneeId) : null;
                            const relatedTask = tasks.find(t => t.assigneeId === m.assigneeId && t.projectId);
                            const projectName = relatedTask ? getProjectName(relatedTask) : undefined;
                            return (
                                <div key={m.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.01] transition-colors">
                                    {agent && (
                                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: `${agent.color}15` }}>
                                            <agent.icon size={10} color={agent.color} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-main-text truncate leading-tight">{m.title}</p>
                                        <p className="text-xs text-muted-text font-mono mt-0.5">
                                            {agent?.name || 'Unassigned'}
                                            {projectName && <span className="text-cyan-500/80 font-semibold"> • {projectName}</span>}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${m.priority === 'critical' ? 'bg-rose-500/15 text-rose-400' :
                                        m.priority === 'high' ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-500/15 text-secondary-text'
                                        }`}>{m.priority.slice(0, 3)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* The Consolidated Ops Panel (Tasks / Activity / Logs) */}
                <OperationsPanel
                    tasks={tasks}
                    activity={activity}
                    logs={logs}
                    onUpdateTaskStatus={onUpdateTaskStatus}
                    onNavigate={onNavigate}
                />
            </div>

            {/* Secondary Controls: Review Queue + Agent Status */}
            <div className="grid grid-cols-2 gap-3">
                {/* Review Queue */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-white/[0.01]">
                        <ArrowRight size={14} className="text-violet-400" />
                        <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">In Review</span>
                        <span className="ml-auto text-xs font-mono text-muted-text">{reviewMissions.length}</span>
                    </div>
                    <div className="divide-y divide-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                        {reviewMissions.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-muted-text font-mono uppercase">Queue empty</div>
                        ) : reviewMissions.map(m => {
                            const agent = m.assigneeId ? AGENTS.find(a => a.id === m.assigneeId) : null;
                            return (
                                <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-violet-500/80 shrink-0" />
                                    <span className="text-sm font-medium text-main-text flex-1 truncate">{m.title}</span>
                                    <span className="text-xs font-mono shrink-0" style={{ color: agent?.color || 'var(--text-muted)' }}>{agent?.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Agent Status */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-white/[0.01]">
                        <Users size={14} className="text-emerald-400" />
                        <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">Agent Pulse</span>
                        <span className="ml-auto text-xs font-mono text-muted-text">{AGENTS.length} active</span>
                    </div>
                    <div className="divide-y divide-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                        {AGENTS.slice(0, 10).map(agent => {
                            return (
                                <div key={agent.id} className="px-4 py-3 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ background: agent.status === 'running' ? '#10b981' : agent.status === 'busy' ? '#f59e0b' : '#3f3f46' }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-main-text block leading-tight">{agent.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold uppercase ${agent.status === 'running' ? 'text-emerald-400' :
                                            agent.status === 'busy' ? 'text-amber-400' : 'text-secondary-text'
                                            }`}>{agent.status}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>


            {/* Bottom: Mission Pipeline Summary */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-xs font-bold text-secondary-text uppercase tracking-widest mr-3">Pipeline</span>
                {[
                    { label: 'Inbox', count: inboxCount, color: '#71717a' },
                    { label: 'Active', count: runningMissions.length, color: '#f59e0b' },
                    { label: 'Review', count: reviewMissions.length, color: '#8b5cf6' },
                    { label: 'Done', count: doneCount, color: '#10b981' },
                ].map((stage, i) => (
                    <React.Fragment key={stage.label}>
                        {i > 0 && <ArrowRight size={12} className="text-muted-text" />}
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                            <span className="text-sm font-medium text-main-text">{stage.label}</span>
                            <span className="text-sm font-mono font-bold text-secondary-text ml-1">{stage.count}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
