export type MissionStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done';
export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Mission {
    id: string;
    title: string;
    description: string;
    status: MissionStatus;
    assigneeId: string | null;
    priority: MissionPriority;
    projectId?: string;
    createdAt: string;
    updatedAt: string;
}

export const MISSION_COLUMNS: { key: MissionStatus; label: string; color: string }[] = [
    { key: 'inbox', label: 'Inbox', color: '#71717a' },
    { key: 'assigned', label: 'Assigned', color: '#3b82f6' },
    { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { key: 'review', label: 'Review', color: '#8b5cf6' },
    { key: 'done', label: 'Done', color: '#10b981' },
];
