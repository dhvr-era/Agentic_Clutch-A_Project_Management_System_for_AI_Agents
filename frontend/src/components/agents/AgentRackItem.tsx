import React from 'react';
import type { AgentConfig } from '../../types/agent';

interface AgentRackItemProps {
    agent: AgentConfig;
    isActive: boolean;
    onClick: () => void;
}

export const AgentRackItem: React.FC<AgentRackItemProps> = ({ agent, isActive, onClick }) => {
    const Icon = agent.icon;

    return (
        <div
            className={`rack-item ${isActive ? 'active' : ''}`}
            onClick={onClick}
            title={`${agent.name} — ${agent.role}`}
            style={isActive ? {
                borderColor: `${agent.color}40`,
                boxShadow: `inset 0 0 20px ${agent.color}15`
            } : {}}
        >
            <div className="item-icon">
                <Icon size={18} color={agent.color} />
            </div>
        </div>
    );
};
