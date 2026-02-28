import React from 'react';
import { Plus, Circle, Play, Eye, CheckCircle2, Lightbulb, FlaskConical } from 'lucide-react';
import type { MyTask, TaskStatus } from '../../data/agents';
import { AGENTS } from '../../data/agents';

interface TasksPageProps {
    data: any;
    tasks: MyTask[];
    onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
    onCreateTask: () => void;
}

const STATUS_FLOW: TaskStatus[] = ['planning', 'backlog', 'in_progress', 'testing', 'review', 'done'];
const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
    planning: { label: 'Planning', color: '#8b5cf6', icon: Lightbulb },
    backlog: { label: 'Queued', color: '#71717a', icon: Circle },
    in_progress: { label: 'Active', color: '#6366f1', icon: Play },
    testing: { label: 'Testing', color: '#06b6d4', icon: FlaskConical },
    review: { label: 'Review', color: '#6366f1', icon: Eye },
    done: { label: 'Done', color: '#f59e0b', icon: CheckCircle2 },
};

export const TasksPage: React.FC<TasksPageProps> = ({ tasks, onUpdateTaskStatus, onCreateTask }) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...tasks].sort((a, b) => {
        const statusOrder: Record<TaskStatus, number> = { in_progress: 0, testing: 1, review: 2, planning: 3, backlog: 4, done: 5 };
        if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const cycleStatus = (taskId: string, current: TaskStatus) => {
        const idx = STATUS_FLOW.indexOf(current);
        onUpdateTaskStatus(taskId, STATUS_FLOW[(idx + 1) % STATUS_FLOW.length]);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">All Tasks</h1>
                    <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">{tasks.length} tasks • {tasks.filter(t => t.completed).length} done</p>
                </div>
                <button onClick={onCreateTask} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Plus size={12} /> New Task
                </button>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                {/* Header row */}
                <div className="px-4 py-2 border-b border-white/5 grid grid-cols-[80px_1fr_80px_80px_80px] gap-3 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Status</span>
                    <span>Task</span>
                    <span>Priority</span>
                    <span>Agent</span>
                    <span className="text-right">Cost</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                    {sorted.map(task => {
                        const agent = AGENTS.find(a => a.id === task.assigneeId);
                        const sc = STATUS_CONFIG[task.status];
                        const progress = task.progress ?? 0;
                        const isActive = task.status === 'in_progress';
                        return (
                            <div key={task.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                                <div className="grid grid-cols-[80px_1fr_80px_80px_80px] gap-3 items-center">
                                    <button onClick={() => cycleStatus(task.id, task.status)} className="px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all hover:opacity-80 text-center" style={{ background: `${sc.color}15`, color: sc.color }}>
                                        {sc.label}
                                    </button>
                                    <div className="min-w-0">
                                        <span className={`text-[11px] block truncate ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{task.title}</span>
                                        {task.statusMessage
                                            ? <span className="text-[9px] text-indigo-400 block truncate">{task.statusMessage}</span>
                                            : task.description && <span className="text-[9px] text-zinc-600 block truncate">{task.description}</span>
                                        }
                                    </div>
                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded text-center ${task.priority === 'critical' ? 'bg-amber-500/15 text-amber-400' :
                                            task.priority === 'high' ? 'bg-indigo-500/15 text-indigo-400' :
                                                task.priority === 'medium' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-zinc-500/15 text-zinc-500'
                                        }`}>{task.priority}</span>
                                    <span className="text-[9px] font-mono truncate" style={{ color: agent?.color }}>{agent?.name}</span>
                                    <span className="text-[9px] font-mono text-zinc-500 text-right">{task.cost ? `$${task.cost.toFixed(2)}` : '—'}</span>
                                </div>
                                {(isActive || progress > 0) && (
                                    <div className="mt-1.5 ml-[92px] mr-0 flex items-center gap-2">
                                        <div className="flex-1 h-[3px] bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${progress}%`,
                                                    background: progress === 100 ? '#f59e0b' : '#6366f1',
                                                    boxShadow: isActive ? `0 0 6px ${progress === 100 ? '#f59e0b' : '#6366f1'}` : 'none',
                                                }}
                                            />
                                        </div>
                                        <span className="text-[8px] font-mono text-zinc-500 w-6 text-right">{progress}%</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
