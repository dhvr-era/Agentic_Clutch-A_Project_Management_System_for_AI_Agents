export interface Project {
    id: string;
    title: string;
    description: string;
    leadAgentId: string;
    status: 'active' | 'completed' | 'paused';
    createdAt: string;
    updatedAt: string;
}
