import type { LucideIcon } from 'lucide-react';

export type AgentStatus = 'running' | 'idle' | 'busy' | 'standby' | 'offline' | 'error';
export type AgentTier = 'Top' | 'Workhorse';
export type AgentRole = 'Squad Lead' | 'Engineer' | 'Analyst' | 'Executor' | 'Monitor';

export interface AgentConfig {
    id: string;
    parentId: string | null;
    name: string;
    role: AgentRole;
    tier: AgentTier;
    color: string;
    status: AgentStatus;
    desc?: string;
    model?: string;
    provider?: string;
    icon: LucideIcon;
}

export interface AgentHeartbeat {
    agentId: string;
    lastSeen: string;
    status: AgentStatus;
}
