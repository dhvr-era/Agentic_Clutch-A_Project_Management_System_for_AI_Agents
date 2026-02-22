export type ActivityType = 'delegation' | 'completion' | 'heartbeat' | 'error' | 'milestone' | 'status_change';

export interface ActivityEvent {
    id: string;
    type: ActivityType;
    agentId: string;
    targetAgentId?: string;
    projectId?: string;
    message: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
