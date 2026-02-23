import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AGENTS } from '../../data/agents';
import type { MyTask, TaskPriority, Milestone } from '../../data/agents';
import type { Project } from '../../types/project';

interface CreateTaskModalProps {
    projects: Project[];
    milestones: Milestone[];
    prefilledAgentId?: string;
    prefilledProjectId?: string;
    onClose: () => void;
    onCreate: (task: Omit<MyTask, 'id' | 'createdAt' | 'completed'>) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    projects, milestones, prefilledAgentId, prefilledProjectId, onClose, onCreate
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState(prefilledAgentId || AGENTS[0]?.id || '');
    const [projectId, setProjectId] = useState(prefilledProjectId || '');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [milestoneId, setMilestoneId] = useState('');

    const filteredMilestones = projectId
        ? milestones.filter(m => m.projectId === projectId)
        : milestones;

    const handleCreate = () => {
        if (!title.trim()) return;
        onCreate({
            title: title.trim(),
            description: description.trim() || undefined,
            status: 'backlog',
            priority,
            assigneeId,
            projectId: projectId || undefined,
            milestoneId: milestoneId || undefined,
            comments: [],
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
            <div className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-main-text">Create Task</h3>
                    <button onClick={onClose} className="p-2 text-muted-text hover:text-main-text transition-colors hover:bg-black/10 rounded-xl"><X size={20} /></button>
                </div>

                <div className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Task Title *</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Research competitor pricing pages" autoFocus className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none focus:border-amber-500/50 transition-all placeholder-dim-text" />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details, context, expected output..." rows={3} className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none focus:border-amber-500/50 transition-all resize-none placeholder-dim-text" />
                    </div>

                    {/* Row: Agent + Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Assign Agent</label>
                            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none appearance-none cursor-pointer focus:border-amber-500/50 transition-all">
                                {AGENTS.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Priority</label>
                            <div className="flex gap-1">
                                {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(p => (
                                    <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${priority === p
                                        ? p === 'critical' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                                            : p === 'high' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                                                : p === 'medium' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                                                    : 'bg-black/20 text-secondary-text border border-divider shadow-sm'
                                        : 'bg-black/5 text-muted-text border border-transparent hover:bg-black/10 hover:text-main-text'
                                        }`}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row: Project + Milestone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Project</label>
                            <select value={projectId} onChange={e => { setProjectId(e.target.value); setMilestoneId(''); }} className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none appearance-none cursor-pointer focus:border-amber-500/50 transition-all">
                                <option value="">No project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Milestone</label>
                            <select value={milestoneId} onChange={e => setMilestoneId(e.target.value)} className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none appearance-none cursor-pointer focus:border-amber-500/50 transition-all">
                                <option value="">No milestone</option>
                                {filteredMilestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                    <button onClick={onClose} className="flex-1 bg-black/5 border border-divider hover:bg-black/10 text-muted-text hover:text-main-text py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                    <button onClick={handleCreate} disabled={!title.trim()} className="flex-1 bg-amber-500 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:shadow-none">Create Task</button>
                </div>
            </div>
        </div>
    );
};
