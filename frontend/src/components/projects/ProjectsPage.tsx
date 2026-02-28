import React, { useState } from 'react';
import {
    Briefcase, Plus, CheckCircle, Flag, ChevronRight, ArrowLeft,
    Circle, Clock, Play, Eye, CheckCircle2, Target, LayoutGrid, Lightbulb, FlaskConical
} from 'lucide-react';
import type { Project } from '../../types/project';
import type { Mission, MissionStatus } from '../../types/mission';
import type { MyTask, Milestone, TaskStatus } from '../../data/agents';
import { AGENTS, TIER_COLORS } from '../../data/agents';
import { PageHeader } from '../layout/PageHeader';
import { MissionPipeline } from '../missions/MissionPipeline';

interface ProjectsPageProps {
    projects: Project[];
    tasks: MyTask[];
    milestones: Milestone[];
    missions?: Mission[];
    onCreateProject: () => void;
    onOpenCreateTask: (prefilledProjectId?: string) => void;
    onSelectProject: (projectId: string) => void;
    onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
    onMoveMission?: (missionId: string, status: MissionStatus) => void;
    selectedProjectId: string | null;
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

type DetailTab = 'overview' | 'missions';

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
    projects, tasks, milestones, missions = [], onCreateProject, onOpenCreateTask,
    onSelectProject, onUpdateTaskStatus, onMoveMission, selectedProjectId
}) => {
    const [detailTab, setDetailTab] = useState<DetailTab>('overview');

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const getProjectTasks = (id: string) => tasks.filter(t => t.projectId === id);
    const getProjectMilestones = (id: string) => milestones.filter(m => m.projectId === id);
    const getProjectMissions = (id: string) => missions.filter(m => m.projectId === id);
    const getProjectProgress = (id: string) => {
        const pt = getProjectTasks(id);
        return pt.length === 0 ? 0 : Math.round((pt.filter(t => t.completed).length / pt.length) * 100);
    };
    const getProjectCost = (id: string) =>
        getProjectTasks(id).reduce((sum, t) => sum + (t.cost || 0), 0);

    const cycleStatus = (taskId: string, current: TaskStatus) => {
        const idx = STATUS_FLOW.indexOf(current);
        onUpdateTaskStatus(taskId, STATUS_FLOW[(idx + 1) % STATUS_FLOW.length]);
    };

    // ── Project Detail View ──
    if (selectedProject) {
        const projTasks = getProjectTasks(selectedProject.id);
        const projMilestones = getProjectMilestones(selectedProject.id);
        const projMissions = getProjectMissions(selectedProject.id);
        const lead = AGENTS.find(a => a.id === selectedProject.leadAgentId);
        const progress = getProjectProgress(selectedProject.id);
        const cost = getProjectCost(selectedProject.id);
        const doneCount = projTasks.filter(t => t.completed).length;
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const queuedTasks = projTasks.filter(t => t.status === 'backlog').sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        const activeTasks = projTasks.filter(t => t.status === 'in_progress');
        const reviewTasks = projTasks.filter(t => t.status === 'review');
        const doneTasks = projTasks.filter(t => t.status === 'done');

        const missionsDone = projMissions.filter(m => m.status === 'done').length;
        const missionPct = projMissions.length > 0 ? Math.round((missionsDone / projMissions.length) * 100) : 0;

        const leadTierC = lead ? (lead.tier === 'Top' ? TIER_COLORS.lead : TIER_COLORS.workhorse) : null;

        return (
            <div className="space-y-4">
                {/* Back nav */}
                <div>
                    <button
                        onClick={() => { onSelectProject(''); setDetailTab('overview'); }}
                        className="flex items-center gap-2 text-xs text-muted-text hover:text-amber-400 uppercase tracking-widest font-bold transition-colors mb-3"
                    >
                        <ArrowLeft size={14} /> Projects
                    </button>
                    <PageHeader
                        title={selectedProject.title}
                        subtitle={selectedProject.description || 'Project details'}
                        actions={
                            <div className="flex items-center gap-2">
                                <button onClick={() => onOpenCreateTask(selectedProject.id)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                    <Plus size={13} /> New Task
                                </button>
                            </div>
                        }
                    />
                </div>

                {/* ── Detail Tab Bar ── */}
                <div className="flex border-b border-card-border gap-0">
                    <button
                        onClick={() => setDetailTab('overview')}
                        className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${detailTab === 'overview'
                                ? 'text-main-text border-amber-500'
                                : 'text-muted-text border-transparent hover:text-secondary-text'
                            }`}
                    >
                        <LayoutGrid size={13} /> Overview
                    </button>
                    <button
                        onClick={() => setDetailTab('missions')}
                        className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${detailTab === 'missions'
                                ? 'text-main-text border-indigo-500'
                                : 'text-muted-text border-transparent hover:text-secondary-text'
                            }`}
                    >
                        <Target size={13} className={detailTab === 'missions' ? 'text-indigo-400' : ''} />
                        Mission Control
                        <span className="text-[10px] font-mono opacity-60">{projMissions.length}</span>
                    </button>
                </div>

                {/* ── OVERVIEW TAB ── */}
                {detailTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Stats strip */}
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { label: 'Progress', value: `${progress}%`, color: 'text-amber-400' },
                                { label: 'Tasks', value: `${doneCount}/${projTasks.length}`, color: 'text-indigo-400' },
                                { label: 'Missions', value: `${missionsDone}/${projMissions.length}`, color: 'text-indigo-400' },
                                { label: 'Milestones', value: `${projMilestones.filter(m => m.progress === 100).length}/${projMilestones.length}`, color: 'text-indigo-400' },
                                { label: 'Cost', value: `$${cost.toFixed(2)}`, color: 'text-amber-400' },
                            ].map(s => (
                                <div key={s.label} className="px-4 py-3 bg-card border border-card-border rounded-xl">
                                    <span className="text-[10px] text-secondary-text uppercase tracking-widest font-bold block mb-1">{s.label}</span>
                                    <span className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Dual progress bars (tasks + missions) */}
                        <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Task progress</span>
                                    <span className="text-[10px] font-mono text-amber-400">{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-divider">
                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Mission pipeline</span>
                                    <span className="text-[10px] font-mono text-indigo-400">{missionPct}%</span>
                                </div>
                                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-divider">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${missionPct}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Lead agent */}
                        {lead && leadTierC && (
                            <div className="flex items-center gap-3 px-5 py-3 bg-card border border-card-border rounded-xl"
                                style={{ borderLeft: `4px solid ${leadTierC.primary}` }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: leadTierC.bg, border: `1px solid ${leadTierC.border}` }}>
                                    <lead.icon size={16} color={leadTierC.primary} />
                                </div>
                                <div>
                                    <span className="text-sm text-main-text font-bold block">{lead.name}</span>
                                    <span className="text-[10px] text-muted-text font-mono">{lead.role} • {lead.model}</span>
                                </div>
                                <span className="text-[10px] text-muted-text uppercase tracking-widest font-bold bg-black/5 px-2 py-1 rounded ml-1">
                                    Project Lead
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full ml-auto"
                                    style={{ background: lead.status === 'running' ? '#f59e0b' : lead.status === 'busy' ? '#6366f1' : '#71717a' }} />
                                <span className={`text-[10px] font-bold uppercase ${lead.status === 'running' ? 'text-amber-400' :
                                        lead.status === 'busy' ? 'text-indigo-400' : 'text-secondary-text'
                                    }`}>{lead.status}</span>
                            </div>
                        )}

                        {/* Milestones */}
                        {projMilestones.length > 0 && (
                            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                                <div className="px-5 py-2.5 border-b border-card-border flex items-center gap-2 bg-black/5">
                                    <Flag size={13} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">Milestones</span>
                                    <span className="ml-auto text-xs font-mono text-muted-text">
                                        {projMilestones.filter(m => m.progress === 100).length}/{projMilestones.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-divider">
                                    {projMilestones.map(m => {
                                        const agent = AGENTS.find(a => a.id === m.agentId);
                                        const aTierC = agent ? (agent.tier === 'Top' ? TIER_COLORS.lead : TIER_COLORS.workhorse) : null;
                                        return (
                                            <div key={m.id} className="px-5 py-3 hover:bg-black/5 transition-colors">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-main-text font-medium">{m.title}</span>
                                                    <div className="flex items-center gap-3">
                                                        {agent && aTierC && (
                                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                                                                style={{ color: aTierC.primary, background: aTierC.bg }}>
                                                                {agent.name}
                                                            </span>
                                                        )}
                                                        <span className="text-xs font-mono font-bold text-secondary-text">{m.progress}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden border border-divider">
                                                    <div className="h-full rounded-full transition-all"
                                                        style={{ width: `${m.progress}%`, background: agent?.color || '#f59e0b' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Task groups — Queued / In Progress / Review / Done */}
                        {[
                            { title: 'Task Queue', tasks: queuedTasks, icon: Clock, iconColor: 'text-zinc-400' },
                            { title: 'In Progress', tasks: activeTasks, icon: Play, iconColor: 'text-indigo-400' },
                            { title: 'In Review', tasks: reviewTasks, icon: Eye, iconColor: 'text-indigo-400' },
                            { title: 'Completed', tasks: doneTasks, icon: CheckCircle, iconColor: 'text-amber-400' },
                        ].filter(g => g.tasks.length > 0).map(group => (
                            <div key={group.title} className="bg-card border border-card-border rounded-xl overflow-hidden">
                                <div className="px-5 py-2.5 border-b border-card-border flex items-center gap-2 bg-black/5">
                                    <group.icon size={13} className={group.iconColor} />
                                    <span className="text-xs font-bold text-secondary-text uppercase tracking-widest">{group.title}</span>
                                    <span className="ml-auto text-xs font-mono font-bold text-muted-text bg-black/10 px-2 py-0.5 rounded">{group.tasks.length}</span>
                                </div>
                                <div className="divide-y divide-divider">
                                    {group.tasks.map(task => {
                                        const agent = AGENTS.find(a => a.id === task.assigneeId);
                                        const sc = STATUS_CONFIG[task.status];
                                        const aTierC = agent ? (agent.tier === 'Top' ? TIER_COLORS.lead : TIER_COLORS.workhorse) : null;
                                        return (
                                            <div key={task.id} className="px-5 py-3 flex items-center gap-4 hover:bg-black/5 transition-colors group">
                                                <button onClick={() => cycleStatus(task.id, task.status)}
                                                    className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-110"
                                                    style={{ background: `${sc.color}20`, color: sc.color }}>
                                                    {sc.label}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-sm block truncate font-medium ${task.completed ? 'text-dim-text line-through' : 'text-main-text'}`}>
                                                        {task.title}
                                                    </span>
                                                    {task.description && <span className="text-xs text-muted-text block truncate mt-0.5">{task.description}</span>}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${task.priority === 'critical' ? 'bg-amber-500/15 text-amber-400' :
                                                        task.priority === 'high' ? 'bg-indigo-500/15 text-indigo-400' :
                                                            task.priority === 'medium' ? 'bg-indigo-500/15 text-indigo-400' :
                                                                'bg-black/20 text-secondary-text'
                                                    }`}>{task.priority}</span>
                                                {agent && aTierC ? (
                                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0"
                                                        style={{ color: aTierC.primary, background: aTierC.bg }}>
                                                        {agent.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-mono text-muted-text shrink-0">Unassigned</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── MISSION CONTROL TAB ── */}
                {detailTab === 'missions' && (
                    <div style={{ height: 'calc(100vh - 280px)' }}>
                        {projMissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 bg-card border border-dashed border-card-border rounded-2xl opacity-50">
                                <Target size={36} className="mb-3 text-indigo-400" />
                                <p className="text-sm font-bold text-main-text uppercase tracking-wider">No missions in this project</p>
                                <p className="text-xs text-muted-text mt-1">Missions with this project assigned will appear here</p>
                            </div>
                        ) : (
                            <MissionPipeline
                                missions={missions}
                                projectId={selectedProject.id}
                                onMoveMission={onMoveMission ?? (() => { })}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ── Project List View ──
    return (
        <div className="space-y-6">
            <PageHeader
                title="Projects"
                subtitle={`${projects.filter(p => p.status === 'active').length} active projects`}
                actions={
                    <button onClick={onCreateProject} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <Plus size={13} /> New Project
                    </button>
                }
            />

            <div className="space-y-4">
                {projects.length === 0 ? (
                    <div className="p-12 bg-card border border-dashed border-card-border rounded-2xl text-center">
                        <Briefcase size={40} className="mx-auto text-dim-text mb-4" />
                        <h3 className="text-xl font-bold text-main-text mb-2">No projects yet</h3>
                        <p className="text-secondary-text text-sm">Create your first project to start organizing agent work.</p>
                    </div>
                ) : projects.map(project => {
                    const lead = AGENTS.find(a => a.id === project.leadAgentId);
                    const progress = getProjectProgress(project.id);
                    const pt = getProjectTasks(project.id);
                    const pm = getProjectMilestones(project.id);
                    const pm_done = pm.filter(m => m.progress === 100).length;
                    const cost = getProjectCost(project.id);
                    const projM = getProjectMissions(project.id);
                    const mDone = projM.filter(m => m.status === 'done').length;
                    const doneCount = pt.filter(t => t.completed).length;
                    const lTierC = lead ? (lead.tier === 'Top' ? TIER_COLORS.lead : TIER_COLORS.workhorse) : null;

                    return (
                        <div key={project.id}
                            onClick={() => { onSelectProject(project.id); setDetailTab('overview'); }}
                            className="p-5 bg-card border border-card-border rounded-xl cursor-pointer hover:bg-black/5 hover:border-amber-500/30 transition-all group"
                            style={{ borderLeft: lTierC ? `4px solid ${lTierC.primary}` : undefined }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 pr-4">
                                    <h3 className="text-lg font-bold text-main-text group-hover:text-amber-500 transition-colors">{project.title}</h3>
                                    <p className="text-xs text-secondary-text mt-0.5 line-clamp-1">{project.description}</p>
                                </div>
                                <ChevronRight size={16} className="text-muted-text group-hover:text-amber-500 transition-colors shrink-0 mt-1" />
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-3 mb-3 pt-2.5 border-t border-divider">
                                {lead && lTierC && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded flex items-center justify-center"
                                            style={{ background: lTierC.bg, border: `1px solid ${lTierC.border}` }}>
                                            <lead.icon size={10} color={lTierC.primary} />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold" style={{ color: lTierC.primary }}>{lead.name}</span>
                                    </div>
                                )}
                                <span className="text-[10px] text-secondary-text font-mono font-bold px-2 py-0.5 rounded bg-black/5">
                                    {doneCount}/{pt.length} tasks
                                </span>
                                <span className="text-[10px] text-secondary-text font-mono font-bold px-2 py-0.5 rounded bg-black/5">
                                    {pm_done}/{pm.length} milestones
                                </span>
                                {projM.length > 0 && (
                                    <span className="text-[10px] text-indigo-400 font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10">
                                        {mDone}/{projM.length} missions
                                    </span>
                                )}
                                <span className="text-[10px] text-amber-400 font-mono font-bold ml-auto px-2 py-0.5 rounded bg-amber-500/10">
                                    ${cost.toFixed(2)}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="flex items-center gap-3">
                                <div className="h-1.5 flex-1 bg-black/20 rounded-full overflow-hidden border border-divider">
                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-amber-500 font-bold shrink-0">{progress}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
