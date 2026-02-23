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
    in_progress: { label: 'Active', color: '#6366f1', icon: Play },
    review: { label: 'Review', color: '#6366f1', icon: Eye },
    done: { label: 'Done', color: '#f59e0b', icon: CheckCircle2 },
};

const levelColors: Record<string, string> = {
    info: 'text-amber-500',
    warn: 'text-indigo-500',
    error: 'text-amber-500',
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
        <div className="bg-card border border-card-border rounded-xl overflow-hidden flex flex-col" style={{ height: 260 }}>
            {/* Tab Selector */}
            <div className="flex border-b border-card-border bg-black/5 shrink-0">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'text-main-text border-b-2 border-amber-500 bg-black/5' : 'text-muted-text hover:text-secondary-text'}`}
                >
                    <ClipboardList size={13} className={activeTab === 'tasks' ? 'text-amber-400' : ''} />
                    Tasks <span className="text-[10px] opacity-70 font-mono ml-1">{pendingTasks.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'text-main-text border-b-2 border-indigo-500 bg-black/5' : 'text-muted-text hover:text-secondary-text'}`}
                >
                    <Activity size={13} className={activeTab === 'activity' ? 'text-indigo-400' : ''} />
                    Activity <span className="text-[10px] opacity-70 font-mono ml-1">{activity.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'text-main-text border-b-2 border-zinc-400 bg-black/5' : 'text-muted-text hover:text-secondary-text'}`}
                >
                    <Terminal size={13} className={activeTab === 'logs' ? 'text-zinc-400' : ''} />
                    Logs <span className="text-[10px] opacity-70 font-mono ml-1">{logs.length}</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* ── Tasks ── */}
                {activeTab === 'tasks' && (
                    <div className="divide-y divide-card-border">
                        {pendingTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                                <ClipboardList size={24} className="mb-2" />
                                <span className="text-sm uppercase font-mono tracking-tighter text-muted-text">Queue Empty</span>
                            </div>
                        ) : pendingTasks.slice(0, 10).map(task => {
                            const agent = AGENTS.find(a => a.id === task.assigneeId);
                            const sc = STATUS_CONFIG[task.status];
                            return (
                                <div key={task.id} className="px-4 py-3 flex items-center gap-3 hover:bg-black/5 group transition-colors">
                                    <button
                                        onClick={() => cycleStatus(task.id, task.status)}
                                        className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                                        style={{ background: sc.color }}
                                        title={`Current: ${sc.label}. Click to cycle.`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-main-text block truncate leading-tight">{task.title}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/10 text-secondary-text">{task.priority}</span>
                                            {agent && <span className="text-xs font-mono" style={{ color: agent.color }}>{agent.name}</span>}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-text font-mono opacity-0 group-hover:opacity-100 transition-opacity">{sc.label}</span>
                                </div>
                            );
                        })}
                        {pendingTasks.length > 0 && (
                            <button onClick={() => onNavigate?.('tasks')} className="w-full py-3 text-xs text-muted-text hover:text-main-text font-bold uppercase transition-colors">
                                View all tasks
                            </button>
                        )}
                    </div>
                )}

                {/* ── Activity ── */}
                {activeTab === 'activity' && (
                    <div className="divide-y divide-card-border">
                        {activity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                                <Activity size={24} className="mb-2" />
                                <span className="text-sm uppercase font-mono tracking-tighter text-muted-text">No Activity</span>
                            </div>
                        ) : activity.slice(0, 10).map(event => {
                            const agent = AGENTS.find(a => a.id === event.agentId);
                            const elapsed = Math.floor((Date.now() - new Date(event.timestamp).getTime()) / 1000);
                            const timeAgo = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m`;
                            return (
                                <div key={event.id} className="px-4 py-3 flex items-start gap-3 hover:bg-black/5 transition-colors">
                                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: agent?.color || 'var(--text-muted)' }} />
                                    <div className="flex-1 min-w-0">
                                        {/* Bigger message text */}
                                        <p className="text-sm font-medium text-main-text leading-snug">{event.message}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {agent && <span className="text-xs font-semibold font-mono uppercase" style={{ color: agent.color }}>{agent.name}</span>}
                                            <span className="text-xs text-muted-text font-mono">• {timeAgo} ago</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {activity.length > 0 && (
                            <button onClick={() => onNavigate?.('activity')} className="w-full py-3 text-xs text-muted-text hover:text-main-text font-bold uppercase transition-colors">
                                View full activity
                            </button>
                        )}
                    </div>
                )}

                {/* ── Logs ── */}
                {activeTab === 'logs' && (
                    <div className="divide-y divide-card-border font-mono">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 opacity-40">
                                <Terminal size={24} className="mb-2" />
                                <span className="text-sm uppercase font-mono tracking-tighter text-muted-text">No Logs</span>
                            </div>
                        ) : logs.slice(0, 15).map(log => (
                            <div key={log.id} className="px-4 py-2.5 flex items-baseline gap-3 hover:bg-black/5 transition-colors">
                                {/* Time — readable */}
                                <span className="text-xs text-muted-text shrink-0 w-[54px]">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {/* Level badge — bigger & bolder */}
                                <span className={`text-xs font-bold uppercase shrink-0 w-[32px] ${levelColors[log.level] || 'text-muted-text'}`}>
                                    {log.level.slice(0, 3).toUpperCase()}
                                </span>
                                {/* Message — same size as everywhere else */}
                                <span className="text-sm text-main-text leading-snug flex-1">{log.message}</span>
                            </div>
                        ))}
                        {logs.length > 0 && (
                            <button onClick={() => onNavigate?.('logs')} className="w-full py-3 text-xs text-muted-text hover:text-main-text font-bold uppercase transition-colors">
                                Open log terminal
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-black/5 border-t border-card-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs text-secondary-text uppercase font-bold tracking-widest">Live Sync</span>
                </div>
                <div className="text-xs text-muted-text font-mono">
                    Updated {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};
