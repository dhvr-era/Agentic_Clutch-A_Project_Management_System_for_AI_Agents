import React, { useState } from 'react';
import { Briefcase, X } from 'lucide-react';
import { AGENTS } from '../../data/agents';
import type { Project } from '../../types/project';

interface CreateProjectModalProps {
    onClose: () => void;
    onCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreate }) => {
    const [newProject, setNewProject] = useState({ title: '', description: '', leadAgentId: '', status: 'active' as const });

    const handleCreate = () => {
        if (!newProject.title || !newProject.leadAgentId) return;
        onCreate(newProject);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
            <div className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-sm">
                            <Briefcase size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-main-text">Create Project</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-xl text-muted-text hover:text-main-text transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Project Name *</label>
                        <input
                            type="text"
                            value={newProject.title}
                            onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Website Conversion Optimization"
                            autoFocus
                            className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none focus:border-emerald-500/50 transition-all placeholder-dim-text"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Description</label>
                        <textarea
                            value={newProject.description}
                            onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                            placeholder="What should this project accomplish?"
                            rows={3}
                            className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none focus:border-emerald-500/50 transition-all resize-none placeholder-dim-text"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Project Lead *</label>
                        <select
                            value={newProject.leadAgentId}
                            onChange={e => setNewProject(p => ({ ...p, leadAgentId: e.target.value }))}
                            className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none appearance-none cursor-pointer focus:border-emerald-500/50 transition-all"
                        >
                            <option value="">Select Squad Lead...</option>
                            {AGENTS.filter(a => a.tier === 'Top').map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 bg-black/5 border border-divider hover:bg-black/10 text-muted-text hover:text-main-text py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                    <button
                        onClick={handleCreate}
                        disabled={!newProject.title || !newProject.leadAgentId}
                        className="flex-1 bg-emerald-500 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
};
