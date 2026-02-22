export type AgentStatus = 'idle' | 'busy' | 'offline' | 'error';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export type AgentTier = 'top' | 'mid' | 'low';

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: AgentStatus;
  tier: AgentTier;
  parent_id?: string;
  provider: string;
  created_at: string;
  last_active: string;
}

export interface Task {
  id: string;
  agent_id: string;
  description: string;
  status: TaskStatus;
  result?: string;
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: string;
  agent_id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface TokenUsage {
  agent_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  timestamp: string;
}

export interface AgentStats {
  agent_id: string;
  total_tasks: number;
  success_rate: number;
  avg_latency: number;
  total_cost: number;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  last_sync: string;
}

export interface DashboardData {
  agents: Agent[];
  active_tasks: Task[];
  recent_logs: LogEntry[];
  sources: Source[];
  usage_summary: {
    daily_cost: number;
    monthly_cost: number;
    total_tokens: number;
  };
}
