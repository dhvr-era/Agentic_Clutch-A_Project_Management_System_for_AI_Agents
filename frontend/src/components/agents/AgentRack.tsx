import React from 'react';
import { Plus } from 'lucide-react';
import type { AgentConfig } from '../../types/agent';
import { AgentRackItem } from './AgentRackItem';

interface AgentRackProps {
    agents: AgentConfig[];
    title: string;
    activeId?: string;
    isPushed: boolean;
    onSelect: (id: string) => void;
    onCreateAgent?: () => void;
}

export const AgentRack: React.FC<AgentRackProps> = ({ agents, title, activeId, isPushed, onSelect, onCreateAgent }) => {
    return (
        <div className={`rack ${isPushed ? 'pushed' : ''}`}>
            <h2 className="rack-title">{title}</h2>
            {agents.map(agent => (
                <AgentRackItem
                    key={agent.id}
                    agent={agent}
                    isActive={activeId === agent.id}
                    onClick={() => onSelect(agent.id)}
                />
            ))}
            {onCreateAgent && (
                <button onClick={onCreateAgent} className="w-12 h-12 rounded-2xl border border-dashed flex items-center justify-center hover:text-amber-400 hover:border-amber-500/30 transition-all mt-2" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }} title="Create Agent">
                    <Plus size={18} />
                </button>
            )}
        </div>
    );
};
