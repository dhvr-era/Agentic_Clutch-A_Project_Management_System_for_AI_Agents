import React, { useState, useMemo } from 'react';
import {
    Activity, Zap, Layers, Users, CheckCircle2, Target, Briefcase,
    ArrowRight, ClipboardList, Plus, ChevronDown,
    InboxIcon, Clock, GitBranch, Loader2, Check, ArrowRightCircle, AlertCircle
} from 'lucide-react';
import type { DashboardData } from '../../types';
import type { Mission, MissionStatus } from '../../types/mission';
import type { ActivityEvent } from '../../types/activity';
import type { LogEntry, MyTask, TaskStatus } from '../../data/agents';
import type { Project } from '../../types/project';
import { AGENTS, TIER_COLORS } from '../../data/agents';
import { OperationsPanel } from './OperationsPanel';
import { PageHeader } from '../layout/PageHeader';

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

// Mission status config for the toggle strip
const MISSION_STATUSES: { id: MissionStatus; label: string; color: string; icon: React.ElementType }[] = [
    { id: 'inbox', label: 'Inbox', color: '#71717a', icon: InboxIcon },
    { id: 'assigned', label: 'Assigned', color: '#6366f1', icon: GitBranch },
    { id: 'in_progress', label: 'In Progress', color: '#6366f1', icon: Loader2 },
    { id: 'review', label: 'In Review', color: '#6366f1', icon: AlertCircle },
    { id: 'done', label: 'Done', color: '#f59e0b', icon: Check },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
    data, missions, activity, tasks, logs, projects = [], onNavigate, onUpdateTaskStatus,
    onCreateTask, onCreateAgent, onCreateProject
}) => {
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    // Mission status toggle — default to "review"
    const [missionStatus, setMissionStatus] = useState<MissionStatus>('review');
    // Agent Pulse project filter
    const [agentProjectFilter, setAgentProjectFilter] = useState<string>('all');

    // Derived mission counts per status
    const missionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        MISSION_STATUSES.forEach(s => { counts[s.id] = missions.filter(m => m.status === s.id).length; });
        return counts;
    }, [missions]);

    const filteredMissions = useMemo(() => missions.filter(m => m.status === missionStatus), [missions, missionStatus]);

    // All scalar arrays — memoized to avoid re-filtering on every render
    const runningMissions = useMemo(() => missions.filter(m => m.status === 'in_progress'), [missions]);
    const doneCount = useMemo(() => missions.filter(m => m.status === 'done').length, [missions]);
    const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
    const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);

    const getProjectName = (item: { projectId?: string }) =>
        item.projectId ? projects.find(p => p.id === item.projectId)?.title : undefined;

    // Rich agent data — memoized
    const agentRows = useMemo(() => {
        const actRev = [...activity].reverse();
        return AGENTS.map(agent => {
            const agentTasks = tasks.filter(t =>
                t.assigneeId === agent.id &&
                (agentProjectFilter === 'all' || t.projectId === agentProjectFilter)
            );
            const currentTask = agentTasks.find(t => t.status === 'in_progress');
            const nextQueued = agentTasks.find(t => t.status === 'backlog');
            const lastEvent = actRev.find(e => e.agentId === agent.id);
            const lastEventAge = lastEvent
                ? Math.floor((Date.now() - new Date(lastEvent.timestamp).getTime()) / 1000)
                : null;
            const ageStr = lastEventAge === null ? '—'
                : lastEventAge < 60 ? `${lastEventAge}s ago`
                    : lastEventAge < 3600 ? `${Math.floor(lastEventAge / 60)}m ago`
                        : `${Math.floor(lastEventAge / 3600)}h ago`;
            const delEvent = actRev.find(e => e.agentId === agent.id && e.type === 'delegation');
            const delegateTarget = delEvent?.targetAgentId ? AGENTS.find(a => a.id === delEvent.targetAgentId) : null;
            const isLead = agent.tier === 'Top';
            const tierC = isLead ? TIER_COLORS.lead : TIER_COLORS.workhorse;
            return { agent, currentTask, nextQueued, ageStr, delegateTarget, lastEvent, isLead, tierC };
        });
    }, [tasks, activity, agentProjectFilter]);

    const selectedStatus = MISSION_STATUSES.find(s => s.id === missionStatus)!;

    return (
        <div className="space-y-3">
            {/* ── Header ── */}
            <PageHeader
                compact
                title="Clutch"
                subtitle="Control Plane • Operational"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            >
                                <Plus size={12} className={showCreateDropdown ? 'rotate-45 transition-transform' : 'transition-transform'} />
                                Create
                                <ChevronDown size={10} className={`opacity-50 transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showCreateDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCreateDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                        <button onClick={() => { onCreateTask?.(); setShowCreateDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group">
                                            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20"><ClipboardList size={12} /></div>
                                            <div><p className="text-sm font-bold text-white uppercase tracking-wider">New Task</p><p className="text-xs text-zinc-400 font-mono">Assign to agent</p></div>
                                        </button>
                                        <button onClick={() => { onCreateProject?.(); setShowCreateDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 border-t border-white/5 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20"><Briefcase size={14} /></div>
                                            <div><p className="text-sm font-bold text-white uppercase tracking-wider">New Project</p><p className="text-xs text-zinc-400 font-mono">Organize work</p></div>
                                        </button>
                                        <button onClick={() => { onCreateAgent?.(); setShowCreateDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 border-t border-white/5 transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20"><Users size={14} /></div>
                                            <div><p className="text-sm font-bold text-white uppercase tracking-wider">New Agent</p><p className="text-xs text-zinc-400 font-mono">Expand fleet</p></div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Live</span>
                        </div>
                    </div>
                }
            />

            {/* ── KPI Strip ── */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'Daily Cost', value: `$${data?.usage_summary?.daily_cost?.toFixed(2) || '0.00'}`, color: 'text-amber-400', icon: Zap },
                    { label: 'Active', value: `${runningMissions.length + pendingTasks.length}`, color: 'text-indigo-400', icon: Activity },
                    { label: 'Tokens', value: `${((data?.usage_summary?.total_tokens || 0) / 1000).toFixed(0)}k`, color: 'text-indigo-400', icon: Layers },
                    { label: 'Completed', value: `${doneCount + completedTasks.length}`, color: 'text-amber-400', icon: CheckCircle2 },
                ].map(kpi => (
                    <div key={kpi.label} className="px-3 py-2 bg-card border border-card-border rounded-xl">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <kpi.icon size={11} className="text-secondary-text" />
                            <span className="text-[10px] text-secondary-text uppercase tracking-widest font-bold">{kpi.label}</span>
                        </div>
                        <span className={`text-2xl font-mono font-bold ${kpi.color}`}>{kpi.value}</span>
                    </div>
                ))}
            </div>

            {/* ── Pipeline Bar ── */}
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-card-border rounded-xl">
                <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mr-2">Pipeline</span>
                {MISSION_STATUSES.map((stage, i) => (
                    <React.Fragment key={stage.id}>
                        {i > 0 && <ArrowRight size={10} className="text-muted-text" />}
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                            <span className="text-xs text-main-text">{stage.label}</span>
                            <span className="text-xs font-mono font-bold text-secondary-text">{missionCounts[stage.id]}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* ── Row 2: Mission Status Panel + Active Projects ── */}
            <div className="grid grid-cols-2 gap-3">
                {/* Mission Status — toggleable */}
                <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col" style={{ height: 210 }}>
                    {/* Status Toggle Tabs */}
                    <div className="flex border-b border-card-border bg-black/5 shrink-0 overflow-x-auto">
                        {MISSION_STATUSES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setMissionStatus(s.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${missionStatus === s.id
                                    ? 'text-main-text bg-black/5'
                                    : 'text-muted-text hover:text-secondary-text border-transparent'
                                    }`}
                                style={{ borderBottomColor: missionStatus === s.id ? s.color : 'transparent' }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                                {s.label}
                                <span className="opacity-60 font-mono">{missionCounts[s.id]}</span>
                            </button>
                        ))}
                    </div>

                    {/* Mission List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-card-border">
                        {filteredMissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-8 opacity-30">
                                <Target size={22} className="mb-2" />
                                <span className="text-sm font-mono uppercase text-muted-text">No missions in {selectedStatus.label}</span>
                            </div>
                        ) : filteredMissions.map(m => {
                            const agent = m.assigneeId ? AGENTS.find(a => a.id === m.assigneeId) : null;
                            const projName = getProjectName(m as any);
                            return (
                                <div key={m.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-black/5 transition-colors">
                                    {agent ? (
                                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: `${agent.color}20` }}>
                                            <agent.icon size={10} color={agent.color} />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-md bg-black/10 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-main-text truncate">{m.title}</p>
                                        <p className="text-xs text-muted-text font-mono">
                                            {agent?.name || 'Unassigned'}
                                            {projName && <span className="text-indigo-500/80"> • {projName}</span>}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${m.priority === 'critical' ? 'bg-amber-500/15 text-amber-400' :
                                        m.priority === 'high' ? 'bg-indigo-500/15 text-indigo-400' :
                                            'bg-black/10 text-secondary-text'
                                        }`}>{m.priority.slice(0, 3)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Active Projects */}
                <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col" style={{ height: 210 }}>
                    <div className="px-4 py-2 border-b border-card-border flex items-center gap-2 shrink-0">
                        <Briefcase size={13} className="text-indigo-400" />
                        <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">Active Projects</span>
                        <span className="ml-auto text-xs font-mono text-muted-text">{projects.filter(p => p.status === 'active').length}</span>
                    </div>
                    <div className="divide-y divide-card-border overflow-y-auto custom-scrollbar flex-1">
                        {projects.filter(p => p.status === 'active').length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-muted-text font-mono uppercase opacity-50">No active projects</div>
                        ) : projects.filter(p => p.status === 'active').map(proj => {
                            const lead = AGENTS.find(a => a.id === proj.leadAgentId);
                            const pt = tasks.filter(t => t.projectId === proj.id);
                            const done = pt.filter(t => t.completed).length;
                            const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
                            return (
                                <div key={proj.id} className="px-4 py-3 flex items-center gap-3 hover:bg-black/5 transition-colors cursor-pointer" onClick={() => onNavigate?.('projects')}>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-main-text block truncate">{proj.title}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {lead && <span className="text-xs font-mono font-semibold" style={{ color: lead.color }}>{lead.name}</span>}
                                            <span className="text-xs text-muted-text">{done}/{pt.length} tasks</span>
                                        </div>
                                    </div>
                                    <div className="w-20 flex items-center gap-2 shrink-0">
                                        <div className="h-1.5 flex-1 bg-black/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-amber-400">{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Row 3: Ops Panel (3/5) + Agent Pulse (2/5) ── */}
            <div className="grid gap-3" style={{ gridTemplateColumns: '3fr 2fr' }}>
                {/* Tasks / Activity / Logs */}
                <OperationsPanel
                    tasks={tasks}
                    activity={activity}
                    logs={logs}
                    onUpdateTaskStatus={onUpdateTaskStatus}
                    onNavigate={onNavigate}
                />

                {/* ── Rich Agent Pulse ── */}
                <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col" style={{ height: 260 }}>
                    {/* Header with project filter */}
                    <div className="px-4 py-2 border-b border-card-border flex items-center gap-2 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">Agent Pulse</span>
                        <div className="ml-auto">
                            <select
                                className="text-xs text-muted-text bg-transparent border border-card-border rounded-lg px-2 py-1 outline-none cursor-pointer"
                                value={agentProjectFilter}
                                onChange={e => setAgentProjectFilter(e.target.value)}
                            >
                                <option value="all">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Agent rows */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-card-border">
                        {agentRows.map(({ agent, currentTask, nextQueued, ageStr, delegateTarget, isLead, tierC }) => (
                            <div key={agent.id} className="px-3 py-2 hover:bg-black/5 transition-colors"
                                style={{ borderLeft: `3px solid ${isLead ? tierC.primary : 'transparent'}` }}>
                                {/* Agent header */}
                                <div className="flex items-center gap-2 mb-1">
                                    {/* Live status dot */}
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                                        background: agent.status === 'running' ? '#f59e0b' :
                                            agent.status === 'busy' ? '#6366f1' : '#71717a'
                                    }} />
                                    {/* Tier-coloured icon */}
                                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                        style={{ background: tierC.bg, border: `1px solid ${tierC.border}` }}>
                                        <agent.icon size={10} color={tierC.primary} />
                                    </div>
                                    <span className="text-sm font-bold text-main-text">{agent.name}</span>
                                    {/* Tier pill */}
                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                        style={{ background: tierC.bg, color: tierC.primary, border: `1px solid ${tierC.border}` }}>
                                        {isLead ? 'Lead' : agent.role}
                                    </span>
                                    {/* Status */}
                                    <span className={`ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${agent.status === 'running' ? 'bg-amber-500/15 text-amber-400' :
                                        agent.status === 'busy' ? 'bg-indigo-500/15 text-indigo-400' :
                                            'bg-black/10 text-secondary-text'
                                        }`}>{agent.status}</span>
                                </div>

                                {/* Status line */}
                                <div className="pl-7 space-y-0.5">
                                    {currentTask ? (
                                        <div className="flex items-center gap-1.5">
                                            <Loader2 size={9} style={{ color: tierC.primary }} className="shrink-0" />
                                            <span className="text-xs text-main-text truncate">{currentTask.title}</span>
                                        </div>
                                    ) : nextQueued ? (
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={9} style={{ color: tierC.primary }} className="shrink-0" />
                                            <span className="text-xs text-secondary-text truncate">Next: {nextQueued.title}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={9} className="text-muted-text shrink-0" />
                                            <span className="text-xs text-muted-text">Idle • {ageStr}</span>
                                        </div>
                                    )}
                                    {delegateTarget && (
                                        <div className="flex items-center gap-1.5">
                                            <ArrowRightCircle size={9} className="text-muted-text shrink-0" />
                                            <span className="text-xs text-muted-text">→ <span className="font-semibold" style={{ color: delegateTarget.color }}>{delegateTarget.name}</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer — last event time */}
                    <div className="px-4 py-1.5 border-t border-card-border bg-black/5 shrink-0">
                        <span className="text-[10px] text-muted-text font-mono">Updated {new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
