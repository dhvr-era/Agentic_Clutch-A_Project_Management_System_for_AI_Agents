import React, { useState } from 'react';
import { ClipboardList, Activity, Terminal, Circle, Play, Eye, CheckCircle2 } from 'lucide-react';
import type { MyTask, TaskStatus, LogEntry } from '../../data/agents';
import type { ActivityEvent } from '../../types/activity';
import { AGENTS } from '../../data/agents';

interface OperationsPanelProps {
    tasks: MyTask[];
    activity: ActivityEvent[];
    logs: LogEntry[];
    onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => void;
    onNavigate?: (tab: string) => void;
}

const STATUS_FLOW: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done'];
const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
    backlog: { label: 'Queued', color: '#71717a', icon: Circle },
    in_progress: { label: 'Active', color: '#f59e0b', icon: Play },
    review: { label: 'Review', color: '#8b5cf6', icon: Eye },
    done: { label: 'Done', color: '#10b981', icon: CheckCircle2 },
};

const levelColors: Record<string, string> = {
    info: 'text-emerald-500',
    warn: 'text-amber-500',
    error: 'text-rose-500',
    debug: 'text-zinc-500',
};

export const OperationsPanel: React.FC<OperationsPanelProps> = ({ tasks, activity, logs, onUpdateTaskStatus, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'activity' | 'logs'>('tasks');

    const pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => {
        const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const cycleStatus = (taskId: string, current: TaskStatus) => {
        if (!onUpdateTaskStatus) return;
        const idx = STATUS_FLOW.indexOf(current);
        onUpdateTaskStatus(taskId, STATUS_FLOW[(idx + 1) % STATUS_FLOW.length]);
    };

    return (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col h-[320px]">
            {/* Tab Selector */}
            <div className="flex border-b border-card-border bg-black/10">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'text-main-text border-b-2 border-emerald-500 bg-white/5' : 'text-muted-text hover:text-secondary-text'}`}
                >
                    <ClipboardList size={14} className={activeTab === 'tasks' ? 'text-emerald-400' : ''} />
                    Tasks <span className="text-[10px] opacity-70 font-mono ml-1">{pendingTasks.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'text-main-text border-b-2 border-blue-500 bg-white/5' : 'text-muted-text hover:text-secondary-text'}`}
                >
                    <Activity size={14} className={activeTab === 'activity' ? 'text-blue-400' : ''} />
                    Activity <span className="text-[10px] opacity-70 font-mono ml-1">{activity.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'text-main-text border-b-2 border-zinc-400 bg-white/5' : 'text-muted-text hover:text-secondary-text'}`}
                >
                    <Terminal size={14} className={activeTab === 'logs' ? 'text-zinc-300' : ''} />
                    Logs <span className="text-[10px] opacity-70 font-mono ml-1">{logs.length}</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'tasks' && (
                    <div className="divide-y divide-white/[0.03]">
                        {pendingTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                                <ClipboardList size={24} className="mb-2" />
                                <span className="text-sm uppercase font-mono tracking-tighter text-muted-text">Queue Empty</span>
                            </div>
                        ) : (
                            pendingTasks.slice(0, 10).map((task) => {
                                const agent = AGENTS.find(a => a.id === task.assigneeId);
                                const sc = STATUS_CONFIG[task.status];
                                return (
                                    <div key={task.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] group transition-colors">
                                        <button
                                            onClick={() => cycleStatus(task.id, task.status)}
                                            className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                                            style={{ background: sc.color }}
                                            title={`Current: ${sc.label}. Click to cycle.`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-main-text block truncate leading-tight">{task.title}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm bg-black/20 text-secondary-text">{task.priority}</span>
                                                {agent && <span className="text-xs font-mono" style={{ color: agent.color }}>{agent.name}</span>}
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-text font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                            {sc.label}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        {pendingTasks.length > 0 && (
                            <button
                                onClick={() => onNavigate?.('tasks')}
                                className="w-full py-3 text-xs text-muted-text hover:text-main-text font-bold uppercase transition-colors"
                            >
                                View all tasks
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="divide-y divide-white/[0.03]">
                        {activity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                                <Activity size={24} className="mb-2" />
                                <span className="text-sm uppercase font-mono tracking-tighter text-muted-text">No Activity</span>
                            </div>
                        ) : (
                            activity.slice(0, 10).map(event => {
                                const agent = AGENTS.find(a => a.id === event.agentId);
                                const elapsed = Math.floor((Date.now() - new Date(event.timestamp).getTime()) / 1000);
                                const timeAgo = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m`;
                                return (
                                    <div key={event.id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.01] transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: agent?.color || '#555' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-main-text leading-snug">{event.message}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {agent && <span className="text-[10px] font-mono text-secondary-text uppercase">{agent.name}</span>}
                                                <span className="text-[10px] text-muted-text font-mono">• {timeAgo} ago</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {activity.length > 0 && (
                            <button
                                onClick={() => onNavigate?.('activity')}
                                className="w-full py-3 text-xs text-muted-text hover:text-main-text font-bold uppercase transition-colors"
                            >
                                View full activity
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="divide-y divide-white/[0.03] font-mono">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                                <Terminal size={24} className="mb-2" />
                                <span className="text-sm uppercase font-mono tracking-tighter text-muted-text">No Logs</span>
                            </div>
                        ) : (
                            logs.slice(0, 15).map(log => {
                                return (
                                    <div key={log.id} className="px-4 py-2 flex items-start gap-3 hover:bg-white/[0.01] transition-colors">
                                        <span className="text-[10px] text-muted-text shrink-0 w-[50px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className={`text-[10px] font-bold uppercase shrink-0 w-[35px] ${levelColors[log.level] || 'text-muted-text'}`}>{log.level.slice(0, 3)}</span>
                                        <span className="text-xs text-secondary-text leading-tight truncate flex-1">{log.message}</span>
                                    </div>
                                );
                            })
                        )}
                        {logs.length > 0 && (
                            <button
                                onClick={() => onNavigate?.('logs')}
                                className="w-full py-3 text-xs text-muted-text hover:text-main-text font-bold uppercase transition-colors"
                            >
                                Open log terminal
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Panel Footer */}
            <div className="px-4 py-2 bg-black/10 border-t border-card-border flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                        <span className="text-[10px] text-secondary-text uppercase font-bold">Live Sync</span>
                    </div>
                </div>
                <div className="text-[10px] text-muted-text font-mono">
                    Updated {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};
