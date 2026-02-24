import type { AgentConfig } from '../types/agent';
import type { Mission } from '../types/mission';
import type { ActivityEvent } from '../types/activity';
import type { Project } from '../types/project';

// ── Tier Colour System (amber = Squad Lead, indigo = Workhorse) ──
export const TIER_COLORS = {
    lead: {
        primary: '#f59e0b', // amber-500
        secondary: '#d97706', // amber-600
        tertiary: '#fbbf24', // amber-400
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.25)',
    },
    workhorse: {
        primary: '#6366f1', // indigo-500
        secondary: '#6366f1',
        tertiary: '#6366f1',
        bg: 'rgba(59,130,246,0.12)',
        border: 'rgba(59,130,246,0.25)',
    },
};

export const AGENTS_INITIAL: AgentConfig[] = [];

// Mutable reference kept in sync by App.tsx
export const AGENTS: AgentConfig[] = [];

// ── Task Types ──
export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskComment {
    id: string;
    agentId: string;
    text: string;
    timestamp: string;
}

export type MyTask = {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string;
    projectId?: string;
    milestoneId?: string;
    deliverable?: string;
    comments: TaskComment[];
    cost?: number;
    createdAt: string;
    completed: boolean;
};

export type Milestone = { id: string; title: string; progress: number; agentId: string; projectId?: string };
export type Goal = { id: string; title: string; desc: string; agentId: string };

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_MILESTONES: Milestone[] = [];
export const INITIAL_TASKS: MyTask[] = [];
export const INITIAL_MISSIONS: Mission[] = [];
export const INITIAL_ACTIVITY: ActivityEvent[] = [];

export interface LogEntry {
    id: string;
    agentId: string;
    projectId?: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: 'task' | 'system' | 'delegation' | 'heartbeat' | 'milestone';
    message: string;
    timestamp: string;
}

export const INITIAL_LOGS: LogEntry[] = [];

// ── Helpers ──
export const getChildren = (parentId: string | null) => AGENTS.filter(a => a.parentId === parentId);
export const getTopLevelAgents = () => getChildren(null);
export const getAgentById = (id: string) => AGENTS.find(a => a.id === id);
