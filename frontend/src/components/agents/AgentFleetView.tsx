import React from 'react';
import type { AgentConfig } from '../../types/agent';

interface AgentFleetViewProps {
    topAgent: AgentConfig;
    workhorseAgents: AgentConfig[];
    mockStats: { tasks: number; uptime: number; latency: number; cost: number };
    tasks: { assigneeId: string; completed: boolean }[];
    onSelectWorkhorse: (id: string) => void;
}

export const AgentFleetView: React.FC<AgentFleetViewProps> = ({
    topAgent, workhorseAgents, mockStats, tasks, onSelectWorkhorse
}) => {
    return (
        <>
            <h1 className="detail-header-title">{topAgent.name} Fleet</h1>
            <p className="detail-header-subtitle">{topAgent.role} • Autonomous Agent Cluster</p>

            {workhorseAgents.map(agent => {
                const agentTasksAll = tasks.filter(t => t.assigneeId === agent.id);
                const agentDone = agentTasksAll.filter(t => t.completed).length;
                return (
                    <div className="info-card" key={agent.id} style={{ borderLeft: `3px solid ${agent.color}` }}>
                        <div className="info-card-header">
                            <div className="info-card-title" style={{ color: agent.color }}>
                                {agent.name}
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px', fontWeight: 400 }}>{agent.role}</span>
                            </div>
                            <span className="badge" style={{
                                background: agent.status === 'idle' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                color: agent.status === 'idle' ? '#10b981' : '#f59e0b',
                                border: `1px solid ${agent.status === 'idle' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                            }}>
                                {agent.status}
                            </span>
                        </div>
                        <div className="info-card-desc">{agent.desc}</div>

                        <div className="stats-grid">
                            <div className="stat-cell">
                                <span className="stat-label">Tasks</span>
                                <span className="stat-value">{agentDone} / {agentTasksAll.length}</span>
                            </div>
                            <div className="stat-cell">
                                <span className="stat-label">Uptime</span>
                                <span className="stat-value">{mockStats.uptime}%</span>
                            </div>
                            <div className="stat-cell">
                                <span className="stat-label">Latency</span>
                                <span className="stat-value">{mockStats.latency.toFixed(1)}s</span>
                            </div>
                            <div className="stat-cell">
                                <span className="stat-label">Cost</span>
                                <span className="stat-value">${mockStats.cost.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="btn-group">
                            <button className="btn-local" onClick={() => onSelectWorkhorse(agent.id)}>Manage Tasks & Milestones</button>
                        </div>
                    </div>
                );
            })}
        </>
    );
};
