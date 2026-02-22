import React, { useState } from 'react';
import { X, Server, ShieldCheck, MessagesSquare, BarChart, Database, Cpu, Brain, Radio, Wifi } from 'lucide-react';
import { AGENTS } from '../../data/agents';
import type { AgentConfig, AgentRole, AgentTier } from '../../types/agent';

const ICONS = [
    { id: 'server', icon: Server, label: 'Server' },
    { id: 'shield', icon: ShieldCheck, label: 'Shield' },
    { id: 'messages', icon: MessagesSquare, label: 'Chat' },
    { id: 'chart', icon: BarChart, label: 'Chart' },
    { id: 'database', icon: Database, label: 'Database' },
    { id: 'cpu', icon: Cpu, label: 'Cpu' },
    { id: 'brain', icon: Brain, label: 'Brain' },
    { id: 'radio', icon: Radio, label: 'Radio' },
    { id: 'wifi', icon: Wifi, label: 'Wifi' },
];

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#22d3ee', '#a78bfa', '#fb923c', '#34d399'];
const MODELS = ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'claude-3-haiku', 'gemini-1.5-pro', 'gemini-1.5-flash', 'deepseek-v3'];
const ROLES: AgentRole[] = ['Squad Lead', 'Engineer', 'Analyst', 'Executor', 'Monitor'];

interface CreateAgentModalProps {
    onClose: () => void;
    onCreate: (agent: Omit<AgentConfig, 'icon'> & { iconId: string }) => void;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<AgentRole>('Engineer');
    const [parentId, setParentId] = useState<string | null>(null);
    const [model, setModel] = useState('gpt-4o');
    const [color, setColor] = useState('#10b981');
    const [iconId, setIconId] = useState('server');

    const tier: AgentTier = parentId ? 'Workhorse' : 'Top';
    const squadLeads = AGENTS.filter(a => a.tier === 'Top');

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate({
            id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36),
            name: name.trim(),
            role,
            tier,
            parentId,
            color,
            status: 'idle',
            model,
            provider: 'OpenRouter',
            desc: `${model} • OPENCLAW`,
            iconId,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
            <div className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-main-text">Create Agent</h3>
                    <button onClick={onClose} className="p-2 text-muted-text hover:text-main-text hover:bg-black/10 transition-colors rounded-xl"><X size={20} /></button>
                </div>

                <div className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Agent Name *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Echo, Pulse, Nyx" autoFocus className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none focus:border-emerald-500/50 transition-all placeholder-dim-text" />
                    </div>

                    {/* Row: Role + Parent */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Role</label>
                            <select value={role} onChange={e => setRole(e.target.value as AgentRole)} className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none appearance-none cursor-pointer focus:border-emerald-500/50 transition-all">
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Reports To</label>
                            <select value={parentId || ''} onChange={e => setParentId(e.target.value || null)} className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none appearance-none cursor-pointer focus:border-emerald-500/50 transition-all">
                                <option value="">None (Squad Lead)</option>
                                {squadLeads.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Model */}
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Model</label>
                        <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-black/5 border border-divider rounded-xl p-3 text-sm text-main-text outline-none appearance-none cursor-pointer focus:border-emerald-500/50 transition-all">
                            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-lg transition-all shadow-sm ${color === c ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105 hover:ring-2 hover:ring-white/20 hover:ring-offset-1 hover:ring-offset-card'}`} style={{ background: c }} />
                            ))}
                        </div>
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block mb-2">Icon</label>
                        <div className="flex gap-2 flex-wrap">
                            {ICONS.map(ic => (
                                <button key={ic.id} onClick={() => setIconId(ic.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${iconId === ic.id ? 'bg-black/10 ring-2 ring-emerald-400' : 'bg-black/5 hover:bg-black/10 border border-divider hover:border-emerald-500/30'}`}>
                                    <ic.icon size={18} style={{ color: iconId === ic.id ? color : 'var(--text-muted)' }} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-8 p-4 bg-black/5 border border-divider rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `${color}20` }}>
                        {(() => { const ic = ICONS.find(i => i.id === iconId); return ic ? <ic.icon size={20} color={color} /> : null; })()}
                    </div>
                    <div>
                        <span className="text-base font-bold text-main-text block mb-1">{name || 'Agent Name'}</span>
                        <span className="text-xs text-muted-text font-mono uppercase tracking-widest">{role} • {tier} • {model}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                    <button onClick={onClose} className="flex-1 bg-black/5 border border-divider hover:bg-black/10 text-muted-text hover:text-main-text py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                    <button onClick={handleCreate} disabled={!name.trim()} className="flex-1 bg-emerald-500 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none">Create Agent</button>
                </div>
            </div>
        </div>
    );
};
