import React from 'react';
import { Briefcase, Plus, CheckCircle, Flag, ChevronRight, ArrowLeft, Circle, Clock, Play, Eye, CheckCircle2 } from 'lucide-react';
import type { Project } from '../../types/project';
import type { MyTask, Milestone, TaskStatus } from '../../data/agents';
import { AGENTS } from '../../data/agents';

interface ProjectsPageProps {
    projects: Project[];
    tasks: MyTask[];
    milestones: Milestone[];
    onCreateProject: () => void;
    onOpenCreateTask: (prefilledProjectId?: string) => void;
    onSelectProject: (projectId: string) => void;
    onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
    selectedProjectId: string | null;
}

const STATUS_FLOW: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done'];
const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
    backlog: { label: 'Queued', color: '#71717a', icon: Circle },
    in_progress: { label: 'Active', color: '#f59e0b', icon: Play },
    review: { label: 'Review', color: '#8b5cf6', icon: Eye },
    done: { label: 'Done', color: '#10b981', icon: CheckCircle2 },
};

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
    projects, tasks, milestones, onCreateProject, onOpenCreateTask, onSelectProject, onUpdateTaskStatus, selectedProjectId
}) => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const getProjectTasks = (projectId: string) => tasks.filter(t => t.projectId === projectId);
    const getProjectMilestones = (projectId: string) => milestones.filter(m => m.projectId === projectId);
    const getProjectProgress = (projectId: string) => {
        const pt = getProjectTasks(projectId);
        if (pt.length === 0) return 0;
        return Math.round((pt.filter(t => t.completed).length / pt.length) * 100);
    };
    const getProjectCost = (projectId: string) => {
        return getProjectTasks(projectId).reduce((sum, t) => sum + (t.cost || 0), 0);
    };


    const cycleStatus = (taskId: string, current: TaskStatus) => {
        const idx = STATUS_FLOW.indexOf(current);
        const next = STATUS_FLOW[(idx + 1) % STATUS_FLOW.length];
        onUpdateTaskStatus(taskId, next);
    };

    // ── Project Detail View ──
    if (selectedProject) {
        const projTasks = getProjectTasks(selectedProject.id);
        const projMilestones = getProjectMilestones(selectedProject.id);
        const lead = AGENTS.find(a => a.id === selectedProject.leadAgentId);
        const progress = getProjectProgress(selectedProject.id);
        const cost = getProjectCost(selectedProject.id);
        const doneCount = projTasks.filter(t => t.completed).length;

        // Task queue: backlog tasks sorted by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const queuedTasks = projTasks.filter(t => t.status === 'backlog').sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        const activeTasks = projTasks.filter(t => t.status === 'in_progress');
        const reviewTasks = projTasks.filter(t => t.status === 'review');
        const doneTasks = projTasks.filter(t => t.status === 'done');

        return (
            <div className="space-y-4 mt-2">
                <button onClick={() => onSelectProject('')} className="flex items-center gap-2 text-xs text-muted-text hover:text-emerald-400 uppercase tracking-widest font-bold transition-colors">
                    <ArrowLeft size={16} /> Projects
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-main-text">{selectedProject.title}</h1>
                        <p className="text-secondary-text text-sm mt-1">{selectedProject.description}</p>
                    </div>
                    <button onClick={() => onOpenCreateTask(selectedProject.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <Plus size={14} /> New Task
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4">
                    {[
                        { label: 'Progress', value: `${progress}%`, color: 'text-emerald-400' },
                        { label: 'Tasks', value: `${doneCount}/${projTasks.length}`, color: 'text-blue-400' },
                        { label: 'Queued', value: `${queuedTasks.length}`, color: 'text-zinc-400' },
                        { label: 'Milestones', value: `${projMilestones.filter(m => m.progress === 100).length}/${projMilestones.length}`, color: 'text-violet-400' },
                        { label: 'Cost', value: `$${cost.toFixed(2)}`, color: 'text-amber-400' },
                    ].map(s => (
                        <div key={s.label} className="px-4 py-3 bg-card border border-card-border rounded-xl shadow-sm">
                            <span className="text-xs text-secondary-text uppercase tracking-widest font-bold block mb-1">{s.label}</span>
                            <span className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="bg-card border border-card-border rounded-xl p-4 shadow-sm">
                    <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden border border-divider">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Lead + Fleet */}
                {lead && (
                    <div className="flex items-center gap-3 px-5 py-3 bg-card border border-card-border rounded-xl shadow-sm">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: `${lead.color}20` }}>
                            <lead.icon size={16} color={lead.color} />
                        </div>
                        <span className="text-sm text-main-text font-bold">{lead.name}</span>
                        <span className="text-[10px] text-muted-text uppercase tracking-widest font-bold bg-black/5 px-2 py-1 rounded">Project Lead</span>
                        <span className="ml-auto text-xs text-dim-text font-mono tracking-tighter">{lead.model}</span>
                    </div>
                )}

                {/* Milestones */}
                {projMilestones.length > 0 && (
                    <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-card-border flex items-center gap-2 bg-black/5">
                            <Flag size={14} className="text-violet-400" />
                            <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">Milestones</span>
                        </div>
                        <div className="divide-y divide-divider">
                            {projMilestones.map(m => {
                                const agent = AGENTS.find(a => a.id === m.agentId);
                                return (
                                    <div key={m.id} className="px-5 py-4 hover:bg-black/5 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-main-text font-medium">{m.title}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded shadow-sm" style={{ color: agent?.color || 'var(--text-muted)', background: `${agent?.color || '#555'}15` }}>{agent?.name}</span>
                                                <span className="text-xs font-mono font-bold text-secondary-text">{m.progress}%</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden border border-divider">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${m.progress}%`, background: agent?.color || '#10b981' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Task Queue + Active + Review + Done */}
                {[
                    { title: 'Task Queue', tasks: queuedTasks, icon: Clock, iconColor: 'text-zinc-400' },
                    { title: 'In Progress', tasks: activeTasks, icon: Play, iconColor: 'text-amber-400' },
                    { title: 'In Review', tasks: reviewTasks, icon: Eye, iconColor: 'text-violet-400' },
                    { title: 'Completed', tasks: doneTasks, icon: CheckCircle, iconColor: 'text-emerald-400' },
                ].filter(g => g.tasks.length > 0).map(group => (
                    <div key={group.title} className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-card-border flex items-center gap-2 bg-black/5">
                            <group.icon size={14} className={group.iconColor} />
                            <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">{group.title}</span>
                            <span className="ml-auto text-xs font-mono font-bold text-muted-text bg-black/10 px-2 py-0.5 rounded">{group.tasks.length}</span>
                        </div>
                        <div className="divide-y divide-divider">
                            {group.tasks.map(task => {
                                const agent = AGENTS.find(a => a.id === task.assigneeId);
                                const sc = STATUS_CONFIG[task.status];
                                return (
                                    <div key={task.id} className="px-5 py-3 flex items-center gap-4 hover:bg-black/5 transition-colors group">
                                        <button onClick={() => cycleStatus(task.id, task.status)} className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-110 shadow-sm" style={{ background: `${sc.color}20`, color: sc.color }}>
                                            {sc.label}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-sm block truncate font-medium ${task.completed ? 'text-dim-text line-through' : 'text-main-text group-hover:text-white transition-colors'}`}>{task.title}</span>
                                            {task.description && <span className="text-xs text-muted-text block truncate mt-0.5">{task.description}</span>}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm ${task.priority === 'critical' ? 'bg-rose-500/15 text-rose-400' :
                                            task.priority === 'high' ? 'bg-amber-500/15 text-amber-400' :
                                                task.priority === 'medium' ? 'bg-blue-500/15 text-blue-400' : 'bg-black/20 text-secondary-text'
                                            }`}>{task.priority}</span>
                                        <span className="text-xs font-mono shrink-0 font-medium" style={{ color: agent?.color || 'var(--text-muted)' }}>{agent?.name || 'Unassigned'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ── Project List View ──
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-main-text">Projects</h1>
                    <p className="text-secondary-text font-mono text-xs uppercase tracking-widest mt-1">{projects.filter(p => p.status === 'active').length} active</p>
                </div>
                <button onClick={onCreateProject} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Plus size={14} /> New Project
                </button>
            </div>

            <div className="space-y-4">
                {projects.length === 0 ? (
                    <div className="p-12 bg-card border border-dashed border-card-border rounded-2xl text-center shadow-sm">
                        <Briefcase size={40} className="mx-auto text-dim-text mb-4" />
                        <h3 className="text-xl font-bold text-main-text mb-2">No projects yet</h3>
                        <p className="text-secondary-text text-sm">Create your first project to start organizing agent work.</p>
                    </div>
                ) : projects.map(project => {
                    const lead = AGENTS.find(a => a.id === project.leadAgentId);
                    const progress = getProjectProgress(project.id);
                    const pt = getProjectTasks(project.id);
                    const pm = getProjectMilestones(project.id);
                    const cost = getProjectCost(project.id);
                    const doneCount = pt.filter(t => t.completed).length;

                    return (
                        <div key={project.id} onClick={() => onSelectProject(project.id)} className="p-5 bg-card border border-card-border rounded-xl cursor-pointer hover:bg-black/5 hover:border-emerald-500/30 transition-all group shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 pr-6">
                                    <h3 className="text-lg font-bold text-main-text group-hover:text-emerald-500 transition-colors">{project.title}</h3>
                                    <p className="text-xs text-secondary-text mt-1 line-clamp-2">{project.description}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors shrink-0 mt-0.5">
                                    <ChevronRight size={16} className="text-muted-text group-hover:text-emerald-500 transition-colors" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-3 pt-3 border-t border-divider">
                                {lead && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded flex items-center justify-center shadow-sm" style={{ background: `${lead.color}20` }}>
                                            <lead.icon size={10} color={lead.color} />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold" style={{ color: lead.color }}>{lead.name}</span>
                                    </div>
                                )}
                                <span className="text-[10px] text-secondary-text font-mono font-bold px-2 py-0.5 rounded bg-black/5 shadow-sm">{doneCount}/{pt.length} tasks</span>
                                <span className="text-[10px] text-secondary-text font-mono font-bold px-2 py-0.5 rounded bg-black/5 shadow-sm">{pm.filter(m => m.progress === 100).length}/{pm.length} milestones</span>
                                <span className="text-[10px] text-amber-500 font-mono font-bold ml-auto px-2 py-0.5 rounded bg-amber-500/10 shadow-sm">${cost.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 bg-black/20 rounded-full overflow-hidden border border-divider">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-emerald-500 font-bold shrink-0">{progress}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};
