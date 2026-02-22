import React, { useState, useMemo } from 'react';
import {
    ClipboardList, Activity, Terminal, Filter, ArrowUpDown, Plus,
    Search, X, Circle, Play, Eye, CheckCircle2, Flag, Trophy,
    ArrowRight, Clock
} from 'lucide-react';
import type { MyTask, TaskStatus, LogEntry } from '../../data/agents';
import type { ActivityEvent } from '../../types/activity';
import type { Project } from '../../types/project';
import { AGENTS } from '../../data/agents';

interface OperationsPageProps {
    tasks: MyTask[];
    activity: ActivityEvent[];
    logs: LogEntry[];
    projects: Project[];
    onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
    onCreateTask: () => void;
    initialTab?: 'tasks' | 'activity' | 'logs';
}

const STATUS_FLOW: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done'];
const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
    backlog: { label: 'Queued', color: '#71717a', icon: Circle },
    in_progress: { label: 'Active', color: '#f59e0b', icon: Play },
    review: { label: 'Review', color: '#8b5cf6', icon: Eye },
    done: { label: 'Done', color: '#10b981', icon: CheckCircle2 },
};

const LEVELS = ['all', 'info', 'warn', 'error', 'debug'] as const;
const CATEGORIES = ['all', 'task', 'system', 'delegation', 'heartbeat', 'milestone'] as const;

const levelColors: Record<string, string> = {
    info: 'text-emerald-500',
    warn: 'text-amber-500',
    error: 'text-rose-500',
    debug: 'text-zinc-500',
};

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    completion: { icon: CheckCircle2, color: '#10b981', label: 'Completed' },
    delegation: { icon: ArrowRight, color: '#3b82f6', label: 'Delegated' },
    milestone: { icon: Flag, color: '#8b5cf6', label: 'Milestone' },
    status_change: { icon: Activity, color: '#f59e0b', label: 'Status' },
};

export const OperationsPage: React.FC<OperationsPageProps> = ({
    tasks, activity, logs, projects, onUpdateTaskStatus, onCreateTask, initialTab = 'tasks'
}) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'activity' | 'logs'>(initialTab);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [agentFilter, setAgentFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all'); // Tasks only
    const [priorityFilter, setPriorityFilter] = useState('all'); // Tasks only
    const [levelFilter, setLevelFilter] = useState('all'); // Logs only
    const [categoryFilter, setCategoryFilter] = useState('all'); // Logs/Activity
    const [sortDir, setSortDir] = useState<'newest' | 'oldest'>('newest');

    // ── Tasks Logic ──
    const filteredTasks = useMemo(() => {
        let result = [...tasks];
        if (agentFilter !== 'all') result = result.filter(t => t.assigneeId === agentFilter);
        if (projectFilter !== 'all') result = result.filter(t => t.projectId === projectFilter);
        if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
        if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
        if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));

        const statusOrder: Record<TaskStatus, number> = { in_progress: 0, review: 1, backlog: 2, done: 3 };
        const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

        result.sort((a, b) => {
            if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        return sortDir === 'newest' ? result : result.reverse();
    }, [tasks, agentFilter, projectFilter, statusFilter, priorityFilter, searchQuery, sortDir]);

    // ── Activity Logic ──
    const filteredActivity = useMemo(() => {
        let result = [...activity];
        if (agentFilter !== 'all') result = result.filter(a => a.agentId === agentFilter);
        if (projectFilter !== 'all') result = result.filter(a => a.projectId === projectFilter);
        if (searchQuery) result = result.filter(a => a.message.toLowerCase().includes(searchQuery.toLowerCase()));

        result.sort((a, b) => {
            const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            return sortDir === 'newest' ? diff : -diff;
        });
        return result;
    }, [activity, agentFilter, projectFilter, searchQuery, sortDir]);

    const successEvents = filteredActivity.filter(e => ['completion', 'milestone', 'delegation'].includes(e.type));

    // ── Logs Logic ──
    const filteredLogs = useMemo(() => {
        let result = [...logs];
        if (agentFilter !== 'all') result = result.filter(l => l.agentId === agentFilter);
        if (projectFilter !== 'all') result = result.filter(l => l.projectId === projectFilter);
        if (levelFilter !== 'all') result = result.filter(l => l.level === levelFilter);
        if (categoryFilter !== 'all') result = result.filter(l => l.category === categoryFilter);
        if (searchQuery) result = result.filter(l => l.message.toLowerCase().includes(searchQuery.toLowerCase()));

        result.sort((a, b) => {
            const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            return sortDir === 'newest' ? diff : -diff;
        });
        return result;
    }, [logs, agentFilter, projectFilter, levelFilter, categoryFilter, searchQuery, sortDir]);

    const clearFilters = () => {
        setAgentFilter('all');
        setProjectFilter('all');
        setStatusFilter('all');
        setPriorityFilter('all');
        setLevelFilter('all');
        setCategoryFilter('all');
        setSearchQuery('');
    };

    const cycleStatus = (taskId: string, current: TaskStatus) => {
        const idx = STATUS_FLOW.indexOf(current);
        onUpdateTaskStatus(taskId, STATUS_FLOW[(idx + 1) % STATUS_FLOW.length]);
    };

    return (
        <div className="space-y-4">
            {/* Unified Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-main-text flex items-center gap-3">
                        Operating System
                        <span className="text-xs font-mono text-muted-text uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded">Fleet Hub</span>
                    </h1>
                    <p className="text-secondary-text font-mono text-xs uppercase tracking-widest mt-2">
                        {activeTab === 'tasks' && `${filteredTasks.length} tasks synced • ${tasks.filter(t => t.completed).length} finalized • ${projects.length} cross-project stream`}
                        {activeTab === 'activity' && `${successEvents.length} events caught • ${successEvents.filter(e => e.type === 'completion').length} wins • ${projects.length} nodes active`}
                        {activeTab === 'logs' && `${filteredLogs.length} matching logs • Raw telemetry stream • ${projects.length} context shards`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'tasks' && (
                        <button onClick={onCreateTask} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <Plus size={14} /> New Task
                        </button>
                    )}
                    <button onClick={() => setSortDir(s => s === 'newest' ? 'oldest' : 'newest')} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-card-border rounded-xl text-xs text-muted-text hover:bg-white/10 hover:text-main-text transition-all">
                        <ArrowUpDown size={14} /> {sortDir === 'newest' ? 'Newest First' : 'Oldest First'}
                    </button>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex p-1 bg-card border border-card-border rounded-2xl w-fit mt-2">
                {[
                    { id: 'tasks', label: 'Tasks', icon: ClipboardList, color: 'text-emerald-400' },
                    { id: 'activity', label: 'Activity', icon: Activity, color: 'text-blue-400' },
                    { id: 'logs', label: 'Logs', icon: Terminal, color: 'text-zinc-400' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-black/10 text-main-text shadow-sm' : 'text-muted-text hover:text-main-text hover:bg-black/5'}`}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? tab.color : 'text-dim-text'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Global Controls Bar */}
            <div className="flex items-center gap-3 flex-wrap bg-card p-3 rounded-xl border border-card-border mt-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/5 rounded-lg border border-divider flex-1 min-w-[200px]">
                    <Search size={16} className="text-muted-text" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="bg-transparent border-none outline-none text-sm text-main-text w-full placeholder-dim-text font-mono"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-secondary-text" />

                    {/* Agent Filter (Global) */}
                    <select
                        value={agentFilter}
                        onChange={e => setAgentFilter(e.target.value)}
                        className="bg-black/5 border border-divider rounded-lg px-3 py-2 text-xs text-main-text outline-none hover:bg-black/10 transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">All Agents</option>
                        {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    {/* Project Filter (Global) */}
                    <select
                        value={projectFilter}
                        onChange={e => setProjectFilter(e.target.value)}
                        className="bg-black/5 border border-divider rounded-lg px-3 py-2 text-xs text-main-text outline-none hover:bg-black/10 transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>

                    {/* Task Specific Filters */}
                    {activeTab === 'tasks' && (
                        <>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="bg-black/5 border border-divider rounded-lg px-3 py-2 text-xs text-main-text outline-none hover:bg-black/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Any Status</option>
                                {STATUS_FLOW.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                            </select>
                            <select
                                value={priorityFilter}
                                onChange={e => setPriorityFilter(e.target.value as any)}
                                className="bg-black/5 border border-divider rounded-lg px-3 py-2 text-xs text-main-text outline-none hover:bg-black/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Any Priority</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </>
                    )}

                    {/* Logs Specific Filters */}
                    {activeTab === 'logs' && (
                        <>
                            <select
                                value={levelFilter}
                                onChange={e => setLevelFilter(e.target.value)}
                                className="bg-black/5 border border-divider rounded-lg px-3 py-2 text-xs text-main-text outline-none hover:bg-black/10 transition-all appearance-none cursor-pointer"
                            >
                                {LEVELS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                            </select>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="bg-black/5 border border-divider rounded-lg px-3 py-2 text-xs text-main-text outline-none hover:bg-black/10 transition-all appearance-none cursor-pointer"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </>
                    )}

                    {(searchQuery || agentFilter !== 'all' || projectFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || (activeTab === 'logs' && (levelFilter !== 'all' || categoryFilter !== 'all'))) && (
                        <button onClick={clearFilters} className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors" title="Clear All Filters">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden min-h-[500px] flex flex-col mt-4">
                {activeTab === 'tasks' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-6 py-3 border-b border-card-border grid grid-cols-[100px_1fr_100px_120px_120px_100px] gap-4 text-[10px] font-bold text-muted-text uppercase tracking-widest bg-black/5">
                            <span>Status</span>
                            <span>Task Description</span>
                            <span className="text-center">Priority</span>
                            <span>Project</span>
                            <span>Assigned Agent</span>
                            <span className="text-right">Est. Cost</span>
                        </div>
                        <div className="divide-y divide-white/[0.03]">
                            {filteredTasks.length === 0 ? (
                                <div className="py-24 text-center opacity-40 flex flex-col items-center">
                                    <ClipboardList size={40} className="mb-4" />
                                    <p className="text-sm text-secondary-text uppercase tracking-[0.3em]">No tasks found</p>
                                </div>
                            ) : (
                                filteredTasks.map(task => {
                                    const agent = AGENTS.find(a => a.id === task.assigneeId);
                                    const project = projects.find(p => p.id === task.projectId);
                                    const sc = STATUS_CONFIG[task.status];
                                    return (
                                        <div key={task.id} className="px-6 py-4 grid grid-cols-[100px_1fr_100px_120px_120px_100px] gap-4 items-center hover:bg-black/5 transition-colors group border-b border-divider last:border-b-0">
                                            <button
                                                onClick={() => cycleStatus(task.id, task.status)}
                                                className="px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 text-center shadow-sm"
                                                style={{ background: `${sc.color}20`, color: sc.color }}
                                            >
                                                {sc.label}
                                            </button>
                                            <div className="min-w-0">
                                                <span className={`text-sm font-medium block truncate ${task.completed ? 'text-dim-text line-through' : 'text-main-text'}`}>{task.title}</span>
                                                {task.description && <span className="text-xs text-muted-text block truncate mt-1">{task.description}</span>}
                                            </div>
                                            <div className="flex justify-center">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm ${task.priority === 'critical' ? 'bg-rose-500/15 text-rose-400' :
                                                    task.priority === 'high' ? 'bg-amber-500/15 text-amber-400' :
                                                        task.priority === 'medium' ? 'bg-blue-500/15 text-blue-400' : 'bg-black/20 text-secondary-text'
                                                    }`}>{task.priority}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-dim-text" />
                                                <span className="text-xs text-muted-text truncate" title={project?.title}>{project?.title || 'General'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {agent && (
                                                    <div className="w-5 h-5 rounded flex items-center justify-center shadow-sm" style={{ background: `${agent.color}20` }}>
                                                        <agent.icon size={10} color={agent.color} />
                                                    </div>
                                                )}
                                                <span className="text-xs font-mono font-medium" style={{ color: agent?.color || 'var(--text-muted)' }}>{agent?.name || 'Unassigned'}</span>
                                            </div>
                                            <span className="text-xs font-mono text-muted-text text-right">{task.cost ? `$${task.cost.toFixed(2)}` : '—'}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-6 grid grid-cols-2 gap-4 border-b border-card-border bg-black/5">
                            <div className="flex items-center gap-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 shadow-sm">
                                <Trophy className="text-emerald-400" size={24} />
                                <div>
                                    <p className="text-sm font-bold text-main-text uppercase tracking-wider">Operational Wins</p>
                                    <p className="text-xs text-muted-text font-mono mt-1">{successEvents.filter(e => e.type === 'completion').length} successful task closures</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 shadow-sm">
                                <Flag className="text-blue-400" size={24} />
                                <div>
                                    <p className="text-sm font-bold text-main-text uppercase tracking-wider">Active Milestones</p>
                                    <p className="text-xs text-muted-text font-mono mt-1">{successEvents.filter(e => e.type === 'milestone').length} critical path breakthroughs</p>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-divider">
                            {filteredActivity.length === 0 ? (
                                <div className="py-24 text-center opacity-40 flex flex-col items-center">
                                    <Activity size={40} className="mb-4" />
                                    <p className="text-sm text-secondary-text uppercase tracking-[0.3em]">No activity recorded</p>
                                </div>
                            ) : (
                                filteredActivity.map(event => {
                                    const config = typeConfig[event.type] || typeConfig.status_change;
                                    const Icon = config.icon;
                                    const agent = AGENTS.find(a => a.id === event.agentId);
                                    const project = projects.find(p => p.id === event.projectId);
                                    const elapsed = Math.floor((Date.now() - new Date(event.timestamp).getTime()) / 1000);
                                    const timeAgo = elapsed < 60 ? `${elapsed}s ago` : elapsed < 3600 ? `${Math.floor(elapsed / 60)}m ago` : `${Math.floor(elapsed / 3600)}h ago`;

                                    return (
                                        <div key={event.id} className="flex items-start gap-4 px-6 py-5 hover:bg-black/5 transition-colors relative group">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm" style={{ background: `${config.color}20` }}>
                                                <Icon size={18} color={config.color} />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    {project && (
                                                        <span className="text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded bg-black/10 text-secondary-text shadow-sm border border-divider">
                                                            {project.title}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-text">
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-main-text leading-relaxed">{event.message}</p>
                                                <div className="flex items-center gap-3 mt-2.5 opacity-80">
                                                    {agent && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded flex items-center justify-center shadow-sm" style={{ background: `${agent.color}20` }}>
                                                                <agent.icon size={10} color={agent.color} />
                                                            </div>
                                                            <span className="text-xs font-mono font-bold" style={{ color: agent.color }}>{agent.name}</span>
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] text-dim-text font-mono uppercase tracking-widest">• {timeAgo}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs">
                        <div className="px-6 py-3 border-b border-card-border grid grid-cols-[100px_80px_100px_120px_100px_1fr] gap-4 text-[10px] font-bold text-muted-text uppercase tracking-widest bg-black/5">
                            <span>Time</span>
                            <span>Level</span>
                            <span>Agent</span>
                            <span>Project</span>
                            <span>Cat</span>
                            <span>Message</span>
                        </div>
                        <div className="divide-y divide-divider">
                            {filteredLogs.length === 0 ? (
                                <div className="py-24 text-center opacity-40 flex flex-col items-center">
                                    <Terminal size={40} className="mb-4" />
                                    <p className="text-sm text-secondary-text uppercase tracking-[0.3em]">No telemetry data</p>
                                </div>
                            ) : (
                                filteredLogs.map(log => {
                                    const agent = AGENTS.find(a => a.id === log.agentId);
                                    const project = projects.find(p => p.id === log.projectId);
                                    return (
                                        <div key={log.id} className="px-6 py-3 grid grid-cols-[100px_80px_100px_120px_100px_1fr] gap-4 items-center hover:bg-black/5 transition-colors border-l-2 border-transparent hover:border-emerald-500/30 group">
                                            <span className="text-muted-text tabular-nums text-xs">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            <span className={`font-bold uppercase tracking-wider text-[10px] ${levelColors[log.level]}`}>{log.level.slice(0, 4)}</span>
                                            <span className="text-xs uppercase font-bold truncate" style={{ color: agent?.color || 'var(--text-muted)' }}>{agent?.name || 'SYS'}</span>
                                            <span className="text-[10px] text-muted-text uppercase truncate mt-0.5" title={project?.title}>{project?.title || 'System'}</span>
                                            <span className="text-[10px] text-secondary-text uppercase tracking-tighter truncate">{log.category}</span>
                                            <span className="text-secondary-text leading-relaxed truncate group-hover:text-main-text transition-colors text-sm">{log.message}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Page Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-card border border-card-border rounded-2xl mt-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-bold text-main-text uppercase tracking-widest">Live Channel Optimized</span>
                    </div>
                    <div className="text-xs text-muted-text font-mono tracking-tighter">
                        SYNC_LATENCY: 1.2ms • DATA_POINTS: {activeTab === 'tasks' ? tasks.length : activeTab === 'activity' ? activity.length : logs.length}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-text font-mono">
                    <Clock size={12} />
                    REFRESHED: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};
