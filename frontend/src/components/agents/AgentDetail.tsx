import React from 'react';
import type { AgentConfig } from '../../types/agent';
import type { Goal, Milestone, MyTask } from '../../data/agents';
import { Target, Flag, Check, ListChecks, Plus } from 'lucide-react';

interface AgentDetailProps {
    agent: AgentConfig;
    goals: Goal[];
    milestones: Milestone[];
    tasks: MyTask[];
    peerAgents: AgentConfig[];
    onToggleTask: (taskId: string) => void;
    onReassignTask: (taskId: string, newAssigneeId: string) => void;
    onReturnToFleet: () => void;
    allMilestones: Milestone[];
    onCreateTask?: () => void;
}

export const AgentDetail: React.FC<AgentDetailProps> = ({
    agent, goals, milestones, tasks, peerAgents, onToggleTask, onReassignTask, onReturnToFleet, allMilestones, onCreateTask
}) => {
    return (
        <div style={{ animation: 'slideRackIn 0.3s forwards' }}>
            {/* Agent name — use agent colour which is always vivid, readable on both themes */}
            <h1 className="detail-header-title" style={{ color: agent.color }}>{agent.name}</h1>
            <p className="detail-header-subtitle">{agent.role} • {agent.model} • {agent.provider}</p>

            {/* Action buttons */}
            <div className="btn-group" style={{ marginTop: '0', marginBottom: '24px' }}>
                <button className="btn-local" style={{ background: agent.color, color: '#000', border: 'none' }}>Review Logs</button>
                <button className="btn-local" onClick={onReturnToFleet}>Return to Fleet</button>
            </div>

            {/* ── Primary Goals ── */}
            <div className="task-section-title">
                <Target size={14} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
                Primary Goals
            </div>
            {goals.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No high level goals defined.</p>
                : null}
            {goals.map(goal => (
                <div key={goal.id} className="goal-card">
                    <div className="goal-title">{goal.title}</div>
                    <div className="goal-desc">{goal.desc}</div>
                </div>
            ))}

            {/* ── Milestones ── */}
            <div className="task-section-title">
                <Flag size={14} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
                Milestones
            </div>
            {milestones.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sub-milestones assigned.</p>
                : null}
            {milestones.map(m => (
                <div key={m.id} className="milestone-card">
                    <div className="milestone-header">
                        <span style={{ color: m.progress === 100 ? agent.color : 'var(--text-main)' }}>{m.title}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{m.progress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${m.progress}%`, background: agent.color }} />
                    </div>
                </div>
            ))}

            {/* ── Actionable Tasks ── */}
            <div className="task-section-title">
                <ListChecks size={14} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
                Actionable Tasks
            </div>
            {tasks.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Agent is sitting idle. Assign tasks.</p>
                : null}
            {tasks.map(task => {
                const m = allMilestones.find(mi => mi.id === task.milestoneId);
                return (
                    <div key={task.id} className="task-card">
                        <div className="task-left">
                            <button className={`task-check ${task.completed ? 'completed' : ''}`} onClick={() => onToggleTask(task.id)}>
                                {task.completed && <Check size={12} color="white" strokeWidth={3} />}
                            </button>
                            <div>
                                <div className={`task-title ${task.completed ? 'completed' : ''}`}>{task.title}</div>
                                {m && <div className="task-meta">Milestone: {m.title}</div>}
                            </div>
                        </div>
                        <select
                            className="reassign-select"
                            value={task.assigneeId}
                            onChange={(e) => onReassignTask(task.id, e.target.value)}
                        >
                            {peerAgents.map(peer => (
                                <option key={peer.id} value={peer.id}>Assign: {peer.name}</option>
                            ))}
                        </select>
                    </div>
                );
            })}

            {/* Create task button */}
            <button
                onClick={onCreateTask}
                className="btn-local"
                style={{ width: '100%', marginTop: '16px', justifyContent: 'flex-start' }}
            >
                <Plus size={14} style={{ marginRight: '6px' }} /> Create new task
            </button>
        </div>
    );
};
