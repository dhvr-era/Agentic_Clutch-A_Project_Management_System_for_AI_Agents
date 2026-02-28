export type MissionStatus = 'planning' | 'inbox' | 'assigned' | 'in_progress' | 'testing' | 'review' | 'done';
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
  { key: 'planning', label: 'Planning', color: '#8b5cf6' },
  { key: 'inbox', label: 'Inbox', color: '#71717a' },
  { key: 'assigned', label: 'Assigned', color: '#6366f1' },
  { key: 'in_progress', label: 'In Progress', color: '#6366f1' },
  { key: 'testing', label: 'Testing', color: '#06b6d4' },
  { key: 'review', label: 'Review', color: '#6366f1' },
  { key: 'done', label: 'Done', color: '#f59e0b' },
];
