import { Server, ShieldCheck, MessagesSquare, BarChart, Database, Cpu, Brain, Radio, Wifi } from 'lucide-react';
import type { AgentConfig } from '../types/agent';
import type { Mission } from '../types/mission';
import type { ActivityEvent } from '../types/activity';
import type { Project } from '../types/project';

// ── Tier Colour System (orange = Squad Lead, blue = Workhorse) ──
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
        secondary: '#6366f1', // indigo-500
        tertiary: '#6366f1', // indigo-500
        bg: 'rgba(59,130,246,0.12)',
        border: 'rgba(59,130,246,0.25)',
    },
};

// ── Agent Configuration: 3 Squad Leads + 3 Workhorses each ──
export const AGENTS_INITIAL: AgentConfig[] = [
    // ── Squad Lead 1: Alpha (amber-500) ──
    { id: 'alpha', parentId: null, name: 'Alpha', role: 'Squad Lead', tier: 'Top', color: '#f59e0b', status: 'running', model: 'gpt-4o', provider: 'OpenRouter', icon: Server },
    { id: 'beta', parentId: 'alpha', name: 'Beta', role: 'Engineer', tier: 'Workhorse', color: '#6366f1', status: 'busy', desc: 'gemini-1.5-flash • OPENCLAW', model: 'gemini-1.5-flash', provider: 'OpenRouter', icon: MessagesSquare },
    { id: 'pico', parentId: 'alpha', name: 'Pico', role: 'Analyst', tier: 'Workhorse', color: '#818cf8', status: 'running', desc: 'gpt-4o • OPENCLAW', model: 'gpt-4o', provider: 'OpenRouter', icon: BarChart },
    { id: 'nova', parentId: 'alpha', name: 'Nova', role: 'Monitor', tier: 'Workhorse', color: '#818cf8', status: 'idle', desc: 'claude-3-haiku • OPENCLAW', model: 'claude-3-haiku', provider: 'OpenRouter', icon: Radio },

    // ── Squad Lead 2: Gamma (amber-600) ──
    { id: 'gamma', parentId: null, name: 'Gamma', role: 'Squad Lead', tier: 'Top', color: '#d97706', status: 'running', model: 'claude-3.5-sonnet', provider: 'OpenRouter', icon: ShieldCheck },
    { id: 'red', parentId: 'gamma', name: 'Red', role: 'Executor', tier: 'Workhorse', color: '#4f46e5', status: 'running', desc: 'claude-3-haiku • OPENCLAW', model: 'claude-3-haiku', provider: 'OpenRouter', icon: Database },
    { id: 'kilo', parentId: 'gamma', name: 'Kilo', role: 'Engineer', tier: 'Workhorse', color: '#6366f1', status: 'busy', desc: 'gpt-4o-mini • OPENCLAW', model: 'gpt-4o-mini', provider: 'OpenRouter', icon: Cpu },
    { id: 'zen', parentId: 'gamma', name: 'Zen', role: 'Analyst', tier: 'Workhorse', color: '#93c5fd', status: 'idle', desc: 'gemini-1.5-pro • OPENCLAW', model: 'gemini-1.5-pro', provider: 'OpenRouter', icon: Brain },

    // ── Squad Lead 3: Sigma (amber-400) ──
    { id: 'sigma', parentId: null, name: 'Sigma', role: 'Squad Lead', tier: 'Top', color: '#fbbf24', status: 'idle', model: 'deepseek-v3', provider: 'OpenRouter', icon: Wifi },
    { id: 'flux', parentId: 'sigma', name: 'Flux', role: 'Engineer', tier: 'Workhorse', color: '#6366f1', status: 'running', desc: 'deepseek-v3 • OPENCLAW', model: 'deepseek-v3', provider: 'OpenRouter', icon: Cpu },
    { id: 'arc', parentId: 'sigma', name: 'Arc', role: 'Executor', tier: 'Workhorse', color: '#4f46e5', status: 'busy', desc: 'gpt-4o • OPENCLAW', model: 'gpt-4o', provider: 'OpenRouter', icon: Database },
    { id: 'vex', parentId: 'sigma', name: 'Vex', role: 'Monitor', tier: 'Workhorse', color: '#818cf8', status: 'idle', desc: 'claude-3.5-sonnet • OPENCLAW', model: 'claude-3.5-sonnet', provider: 'OpenRouter', icon: Radio },
];

// Re-export a mutable reference for the old import (AGENTS)
export const AGENTS = [...AGENTS_INITIAL];

// ── Task Types (expanded) ──
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
    completed: boolean; // derived from status === 'done'
};

export type Milestone = { id: string; title: string; progress: number; agentId: string; projectId?: string };
export type Goal = { id: string; title: string; desc: string; agentId: string };

// ── Seed Projects ──
const now = Date.now();
export const INITIAL_PROJECTS: Project[] = [
    { id: 'proj-1', title: 'Website Conversion Optimization', description: 'Improve landing page conversion from 0.1% to 2% through UX, copy, and SEO improvements.', leadAgentId: 'alpha', status: 'active', createdAt: new Date(now - 86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'proj-2', title: 'Security Compliance Audit', description: 'Full 4Context audit of all agent API calls and data access patterns.', leadAgentId: 'gamma', status: 'active', createdAt: new Date(now - 172800000).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'proj-3', title: 'API Gateway Migration', description: 'Migrate legacy REST endpoints to new rate-limited gateway infrastructure.', leadAgentId: 'sigma', status: 'active', createdAt: new Date(now - 259200000).toISOString(), updatedAt: new Date().toISOString() },
];

// ── Seed Goals ──
export const INITIAL_GOALS: Goal[] = [
    { id: 'g1', title: 'Automate Customer Retention Pipeline', desc: 'Manage all inbound requests and follow-ups within 5m latency.', agentId: 'beta' },
    { id: 'g2', title: 'Market Arbitrage Analysis', desc: 'Scan and flag real-time discrepancies across markets.', agentId: 'pico' },
    { id: 'g3', title: 'Infrastructure Uptime Monitoring', desc: 'Maintain 99.9% uptime across all production services.', agentId: 'nova' },
    { id: 'g4', title: 'Security Compliance Audit', desc: 'Audit all 4Context logs and flag compliance gaps.', agentId: 'red' },
    { id: 'g5', title: 'CI/CD Pipeline Optimization', desc: 'Reduce build times below 90s across all pipelines.', agentId: 'kilo' },
    { id: 'g6', title: 'Cost Anomaly Detection', desc: 'Flag any token spend exceeding 2x daily average.', agentId: 'zen' },
    { id: 'g7', title: 'API Gateway Migration', desc: 'Migrate legacy REST endpoints to new gateway.', agentId: 'flux' },
    { id: 'g8', title: 'Data Backfill ETL', desc: 'Backfill 3 years of transaction data for analytics.', agentId: 'arc' },
    { id: 'g9', title: 'Alerting Rule Refresh', desc: 'Update all PagerDuty rules to match new thresholds.', agentId: 'vex' },
];

// ── Seed Milestones ──
export const INITIAL_MILESTONES: Milestone[] = [
    { id: 'm1', title: 'Phase 1: Knowledge Base Sync', progress: 100, agentId: 'beta', projectId: 'proj-1' },
    { id: 'm2', title: 'Phase 2: Live Ticket Routing', progress: 40, agentId: 'beta', projectId: 'proj-1' },
    { id: 'm3', title: 'Q3 Historical Data Ingest', progress: 85, agentId: 'pico', projectId: 'proj-1' },
    { id: 'm4', title: 'Latency Baseline Established', progress: 100, agentId: 'nova' },
    { id: 'm5', title: '4Context Log Export', progress: 60, agentId: 'red', projectId: 'proj-2' },
    { id: 'm6', title: 'Docker Build Cache Tuning', progress: 75, agentId: 'kilo', projectId: 'proj-2' },
    { id: 'm7', title: 'Token Budget Model v2', progress: 30, agentId: 'zen' },
    { id: 'm8', title: 'Gateway Schema Mapping', progress: 90, agentId: 'flux', projectId: 'proj-3' },
    { id: 'm9', title: 'Backfill Batch 1 (2021)', progress: 100, agentId: 'arc', projectId: 'proj-3' },
    { id: 'm10', title: 'PagerDuty API Integration', progress: 50, agentId: 'vex', projectId: 'proj-3' },
];

// ── Seed Tasks (expanded with status, priority, projectId, comments) ──
export const INITIAL_TASKS: MyTask[] = [
    // Project 1: Website Conversion Optimization (Alpha fleet)
    { id: 't1', title: 'Parse Zendesk API documentation', description: 'Read and index the full Zendesk REST API docs for integration.', status: 'done', priority: 'high', assigneeId: 'beta', projectId: 'proj-1', milestoneId: 'm1', comments: [{ id: 'c1', agentId: 'beta', text: 'Indexed 47 endpoints, ready for integration.', timestamp: new Date(now - 300000).toISOString() }], cost: 0.12, createdAt: new Date(now - 500000).toISOString(), completed: true },
    { id: 't2', title: 'Monitor incoming tier-1 support tags', description: 'Watch for new tier-1 tickets and route to appropriate handler.', status: 'in_progress', priority: 'high', assigneeId: 'beta', projectId: 'proj-1', milestoneId: 'm2', comments: [], cost: 0.08, createdAt: new Date(now - 400000).toISOString(), completed: false },
    { id: 't3', title: 'Draft reply templates using Gemini', status: 'backlog', priority: 'medium', assigneeId: 'beta', projectId: 'proj-1', milestoneId: 'm2', comments: [], createdAt: new Date(now - 350000).toISOString(), completed: false },
    { id: 't4', title: 'Fetch 10-year SPY market data', status: 'done', priority: 'medium', assigneeId: 'pico', projectId: 'proj-1', milestoneId: 'm3', comments: [{ id: 'c2', agentId: 'pico', text: 'Downloaded 2,518 daily candles. Data validated.', timestamp: new Date(now - 280000).toISOString() }], cost: 0.24, createdAt: new Date(now - 450000).toISOString(), completed: true },
    { id: 't5', title: 'Deploy alert webhook', status: 'backlog', priority: 'low', assigneeId: 'pico', projectId: 'proj-1', comments: [], createdAt: new Date(now - 300000).toISOString(), completed: false },
    { id: 't6', title: 'Set up latency probes on prod endpoints', status: 'done', priority: 'critical', assigneeId: 'nova', comments: [{ id: 'c3', agentId: 'nova', text: '4 probes active. Avg latency: 142ms.', timestamp: new Date(now - 200000).toISOString() }], cost: 0.03, createdAt: new Date(now - 380000).toISOString(), completed: true },
    { id: 't7', title: 'Configure Prometheus scrape targets', status: 'backlog', priority: 'medium', assigneeId: 'nova', comments: [], createdAt: new Date(now - 250000).toISOString(), completed: false },

    // Project 2: Security Compliance Audit (Gamma fleet)
    { id: 't8', title: 'Export 4Context audit logs (7d window)', status: 'in_progress', priority: 'high', assigneeId: 'red', projectId: 'proj-2', milestoneId: 'm5', comments: [], cost: 0.15, createdAt: new Date(now - 360000).toISOString(), completed: false },
    { id: 't9', title: 'Flag non-compliant API calls', status: 'backlog', priority: 'critical', assigneeId: 'red', projectId: 'proj-2', comments: [], createdAt: new Date(now - 320000).toISOString(), completed: false },
    { id: 't10', title: 'Optimize Docker layer caching', status: 'done', priority: 'high', assigneeId: 'kilo', projectId: 'proj-2', milestoneId: 'm6', comments: [{ id: 'c4', agentId: 'kilo', text: 'Cache hit ratio: 42% → 78%. Build time: 4m → 1.5m.', timestamp: new Date(now - 220000).toISOString() }], cost: 0.06, createdAt: new Date(now - 340000).toISOString(), completed: true },
    { id: 't11', title: 'Parallelize test suite execution', status: 'in_progress', priority: 'medium', assigneeId: 'kilo', projectId: 'proj-2', comments: [], cost: 0.04, createdAt: new Date(now - 280000).toISOString(), completed: false },
    { id: 't12', title: 'Build token spend forecasting model', status: 'backlog', priority: 'medium', assigneeId: 'zen', comments: [], createdAt: new Date(now - 260000).toISOString(), completed: false },
    { id: 't13', title: 'Analyze per-agent cost distribution', status: 'backlog', priority: 'low', assigneeId: 'zen', comments: [], createdAt: new Date(now - 240000).toISOString(), completed: false },

    // Project 3: API Gateway Migration (Sigma fleet)
    { id: 't14', title: 'Map legacy REST schemas to OpenAPI', status: 'done', priority: 'high', assigneeId: 'flux', projectId: 'proj-3', milestoneId: 'm8', comments: [{ id: 'c5', agentId: 'flux', text: '47 endpoints converted to OpenAPI 3.1 spec.', timestamp: new Date(now - 180000).toISOString() }], cost: 0.18, createdAt: new Date(now - 320000).toISOString(), completed: true },
    { id: 't15', title: 'Configure rate limiting rules', status: 'in_progress', priority: 'high', assigneeId: 'flux', projectId: 'proj-3', comments: [], cost: 0.09, createdAt: new Date(now - 260000).toISOString(), completed: false },
    { id: 't16', title: 'Run ETL batch for 2021 data', status: 'done', priority: 'medium', assigneeId: 'arc', projectId: 'proj-3', milestoneId: 'm9', comments: [{ id: 'c6', agentId: 'arc', text: '1.2M rows processed. Integrity checksums verified.', timestamp: new Date(now - 150000).toISOString() }], cost: 0.31, createdAt: new Date(now - 300000).toISOString(), completed: true },
    { id: 't17', title: 'Validate data integrity checksums', status: 'in_progress', priority: 'medium', assigneeId: 'arc', projectId: 'proj-3', comments: [], cost: 0.05, createdAt: new Date(now - 200000).toISOString(), completed: false },
    { id: 't18', title: 'Sync PagerDuty escalation policies', status: 'backlog', priority: 'high', assigneeId: 'vex', projectId: 'proj-3', milestoneId: 'm10', comments: [], createdAt: new Date(now - 180000).toISOString(), completed: false },
    { id: 't19', title: 'Test alert routing with mock incidents', status: 'backlog', priority: 'medium', assigneeId: 'vex', projectId: 'proj-3', comments: [], createdAt: new Date(now - 160000).toISOString(), completed: false },
];

// ── Missions (Kanban) ──
export const INITIAL_MISSIONS: Mission[] = [
    { id: 'mis-1', projectId: 'proj-1', title: 'Onboard Zendesk Integration', description: 'Connect Zendesk API and sync knowledge base.', status: 'in_progress', assigneeId: 'beta', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-2', projectId: 'proj-1', title: 'Deploy Market Scanner', description: 'Set up real-time market data feed for Pico.', status: 'assigned', assigneeId: 'pico', priority: 'critical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-3', projectId: 'proj-2', title: 'Audit 4Context Logs', description: 'Review all 4Context transparency logs (7d).', status: 'inbox', assigneeId: null, priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-4', projectId: 'proj-1', title: 'Fine-tune Prompt Templates', description: 'Optimize prompts for customer interactions.', status: 'review', assigneeId: 'beta', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-5', projectId: 'proj-1', title: 'Historical Data ETL Pipeline', description: 'Complete ETL for 10-year SPY data.', status: 'done', assigneeId: 'pico', priority: 'low', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-6', projectId: 'proj-2', title: 'CI/CD Build Optimization', description: 'Reduce Docker build to sub-90s.', status: 'in_progress', assigneeId: 'kilo', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-7', projectId: 'proj-3', title: 'Gateway Migration Phase 1', description: 'Migrate auth endpoints to new gateway.', status: 'in_progress', assigneeId: 'flux', priority: 'critical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-8', projectId: 'proj-2', title: 'Token Budget Forecasting', description: 'Build v2 cost prediction model.', status: 'assigned', assigneeId: 'zen', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-9', projectId: 'proj-3', title: 'Backfill 2022 Transactions', description: 'ETL batch 2 for transaction history.', status: 'inbox', assigneeId: null, priority: 'low', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-10', projectId: 'proj-3', title: 'Alerting Rules Overhaul', description: 'Refresh PagerDuty configs to new SLOs.', status: 'assigned', assigneeId: 'vex', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-11', projectId: 'proj-2', title: 'Security Scan Compliance', description: 'Run full compliance scan via Red.', status: 'review', assigneeId: 'red', priority: 'critical', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mis-12', projectId: 'proj-1', title: 'Uptime Dashboard', description: 'Build Grafana dashboard for Nova probes.', status: 'done', assigneeId: 'nova', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ── Activity Events ──
export const INITIAL_ACTIVITY: ActivityEvent[] = [
    { id: 'act-1', type: 'completion', agentId: 'beta', projectId: 'proj-1', message: 'Beta completed "Parse Zendesk API documentation"', timestamp: new Date(now - 30000).toISOString() },
    { id: 'act-2', type: 'milestone', agentId: 'beta', projectId: 'proj-1', message: 'Beta completed milestone "Phase 1: Knowledge Base Sync" (100%)', timestamp: new Date(now - 60000).toISOString() },
    { id: 'act-3', type: 'completion', agentId: 'pico', projectId: 'proj-1', message: 'Pico completed "Fetch 10-year SPY market data"', timestamp: new Date(now - 90000).toISOString() },
    { id: 'act-4', type: 'delegation', agentId: 'alpha', targetAgentId: 'beta', projectId: 'proj-1', message: 'Alpha delegated "Onboard Zendesk Integration" to Beta', timestamp: new Date(now - 120000).toISOString() },
    { id: 'act-5', type: 'completion', agentId: 'nova', message: 'Nova completed "Set up latency probes on prod endpoints"', timestamp: new Date(now - 150000).toISOString() },
    { id: 'act-6', type: 'milestone', agentId: 'nova', message: 'Nova completed milestone "Latency Baseline Established" (100%)', timestamp: new Date(now - 180000).toISOString() },
    { id: 'act-7', type: 'completion', agentId: 'kilo', projectId: 'proj-2', message: 'Kilo completed "Optimize Docker layer caching"', timestamp: new Date(now - 210000).toISOString() },
    { id: 'act-8', type: 'delegation', agentId: 'gamma', targetAgentId: 'red', projectId: 'proj-2', message: 'Gamma delegated "Audit 4Context Logs" to Red', timestamp: new Date(now - 240000).toISOString() },
    { id: 'act-9', type: 'completion', agentId: 'flux', projectId: 'proj-3', message: 'Flux completed "Map legacy REST schemas to OpenAPI"', timestamp: new Date(now - 270000).toISOString() },
    { id: 'act-10', type: 'milestone', agentId: 'flux', projectId: 'proj-3', message: 'Flux reached 90% on "Gateway Schema Mapping"', timestamp: new Date(now - 300000).toISOString() },
    { id: 'act-11', type: 'completion', agentId: 'arc', projectId: 'proj-3', message: 'Arc completed "Run ETL batch for 2021 data"', timestamp: new Date(now - 330000).toISOString() },
    { id: 'act-12', type: 'milestone', agentId: 'arc', projectId: 'proj-3', message: 'Arc completed milestone "Backfill Batch 1 (2021)" (100%)', timestamp: new Date(now - 360000).toISOString() },
    { id: 'act-13', type: 'delegation', agentId: 'sigma', targetAgentId: 'vex', projectId: 'proj-3', message: 'Sigma delegated "Alerting Rules Overhaul" to Vex', timestamp: new Date(now - 390000).toISOString() },
];

// ── Log Entries ──
export interface LogEntry {
    id: string;
    agentId: string;
    projectId?: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: 'task' | 'system' | 'delegation' | 'heartbeat' | 'milestone';
    message: string;
    timestamp: string;
}

export const INITIAL_LOGS: LogEntry[] = [
    { id: 'log-1', agentId: 'beta', projectId: 'proj-1', level: 'info', category: 'task', message: 'Started parsing Zendesk API documentation', timestamp: new Date(now - 400000).toISOString() },
    { id: 'log-2', agentId: 'beta', projectId: 'proj-1', level: 'info', category: 'task', message: 'Completed parsing Zendesk API documentation', timestamp: new Date(now - 350000).toISOString() },
    { id: 'log-3', agentId: 'beta', projectId: 'proj-1', level: 'info', category: 'milestone', message: 'Milestone "Phase 1: Knowledge Base Sync" reached 100%', timestamp: new Date(now - 340000).toISOString() },
    { id: 'log-4', agentId: 'alpha', projectId: 'proj-1', level: 'info', category: 'delegation', message: 'Delegated "Onboard Zendesk Integration" to Beta', timestamp: new Date(now - 330000).toISOString() },
    { id: 'log-5', agentId: 'pico', projectId: 'proj-1', level: 'info', category: 'task', message: 'Started fetching 10-year SPY market data', timestamp: new Date(now - 320000).toISOString() },
    { id: 'log-6', agentId: 'pico', projectId: 'proj-1', level: 'warn', category: 'system', message: 'Rate limit warning from market data API (429)', timestamp: new Date(now - 310000).toISOString() },
    { id: 'log-7', agentId: 'pico', projectId: 'proj-1', level: 'info', category: 'task', message: 'Completed fetching 10-year SPY market data', timestamp: new Date(now - 300000).toISOString() },
    { id: 'log-8', agentId: 'nova', level: 'info', category: 'heartbeat', message: 'Heartbeat check — all probes responding', timestamp: new Date(now - 290000).toISOString() },
    { id: 'log-9', agentId: 'nova', level: 'info', category: 'task', message: 'Completed latency probe setup on 4 endpoints', timestamp: new Date(now - 280000).toISOString() },
    { id: 'log-10', agentId: 'red', projectId: 'proj-2', level: 'info', category: 'task', message: 'Started 4Context log export (7d window)', timestamp: new Date(now - 270000).toISOString() },
    { id: 'log-11', agentId: 'red', projectId: 'proj-2', level: 'error', category: 'system', message: 'Connection timeout to 4Context API — retrying (attempt 2/3)', timestamp: new Date(now - 260000).toISOString() },
    { id: 'log-12', agentId: 'red', projectId: 'proj-2', level: 'info', category: 'system', message: 'Reconnected to 4Context API successfully', timestamp: new Date(now - 255000).toISOString() },
    { id: 'log-13', agentId: 'kilo', projectId: 'proj-2', level: 'info', category: 'task', message: 'Started Docker layer cache optimization', timestamp: new Date(now - 250000).toISOString() },
    { id: 'log-14', agentId: 'kilo', projectId: 'proj-2', level: 'debug', category: 'system', message: 'Cache hit ratio improved from 42% to 78%', timestamp: new Date(now - 240000).toISOString() },
    { id: 'log-15', agentId: 'kilo', projectId: 'proj-2', level: 'info', category: 'task', message: 'Completed Docker layer cache optimization', timestamp: new Date(now - 230000).toISOString() },
    { id: 'log-16', agentId: 'gamma', projectId: 'proj-2', level: 'info', category: 'delegation', message: 'Delegated "Security Compliance Audit" to Red', timestamp: new Date(now - 220000).toISOString() },
    { id: 'log-17', agentId: 'zen', level: 'info', category: 'task', message: 'Started building token spend forecast model v2', timestamp: new Date(now - 210000).toISOString() },
    { id: 'log-18', agentId: 'zen', level: 'warn', category: 'system', message: 'Insufficient training data for accurate 30d projection', timestamp: new Date(now - 200000).toISOString() },
    { id: 'log-19', agentId: 'flux', projectId: 'proj-3', level: 'info', category: 'task', message: 'Started mapping legacy REST schemas to OpenAPI', timestamp: new Date(now - 190000).toISOString() },
    { id: 'log-20', agentId: 'flux', projectId: 'proj-3', level: 'info', category: 'task', message: 'Completed schema mapping — 47 endpoints converted', timestamp: new Date(now - 180000).toISOString() },
    { id: 'log-21', agentId: 'flux', projectId: 'proj-3', level: 'info', category: 'milestone', message: 'Milestone "Gateway Schema Mapping" reached 90%', timestamp: new Date(now - 170000).toISOString() },
    { id: 'log-22', agentId: 'arc', projectId: 'proj-3', level: 'info', category: 'task', message: 'Started ETL batch for 2021 transaction data', timestamp: new Date(now - 160000).toISOString() },
    { id: 'log-23', agentId: 'arc', projectId: 'proj-3', level: 'info', category: 'task', message: 'Processed 1.2M rows — integrity verified', timestamp: new Date(now - 150000).toISOString() },
    { id: 'log-24', agentId: 'arc', projectId: 'proj-3', level: 'info', category: 'milestone', message: 'Milestone "Backfill Batch 1 (2021)" reached 100%', timestamp: new Date(now - 140000).toISOString() },
    { id: 'log-25', agentId: 'sigma', projectId: 'proj-3', level: 'info', category: 'delegation', message: 'Delegated "Alerting Rules Overhaul" to Vex', timestamp: new Date(now - 130000).toISOString() },
    { id: 'log-26', agentId: 'vex', projectId: 'proj-3', level: 'info', category: 'task', message: 'Started syncing PagerDuty escalation policies', timestamp: new Date(now - 120000).toISOString() },
    { id: 'log-27', agentId: 'vex', projectId: 'proj-3', level: 'warn', category: 'system', message: 'PagerDuty API deprecated v1 endpoint warning', timestamp: new Date(now - 110000).toISOString() },
    { id: 'log-28', agentId: 'beta', projectId: 'proj-1', level: 'info', category: 'task', message: 'Started monitoring incoming tier-1 support tags', timestamp: new Date(now - 100000).toISOString() },
    { id: 'log-29', agentId: 'beta', projectId: 'proj-1', level: 'info', category: 'heartbeat', message: 'Heartbeat — 14 tickets processed in last 5m', timestamp: new Date(now - 90000).toISOString() },
    { id: 'log-30', agentId: 'pico', projectId: 'proj-1', level: 'info', category: 'task', message: 'Started deploying alert webhook', timestamp: new Date(now - 80000).toISOString() },
    { id: 'log-31', agentId: 'red', projectId: 'proj-2', level: 'error', category: 'task', message: 'Failed to parse 4Context log entry — malformed JSON at line 4,821', timestamp: new Date(now - 70000).toISOString() },
    { id: 'log-32', agentId: 'red', projectId: 'proj-2', level: 'info', category: 'task', message: 'Skipped malformed entry, continuing export', timestamp: new Date(now - 65000).toISOString() },
    { id: 'log-33', agentId: 'kilo', projectId: 'proj-2', level: 'info', category: 'task', message: 'Started parallelizing test suite execution', timestamp: new Date(now - 60000).toISOString() },
    { id: 'log-34', agentId: 'nova', level: 'info', category: 'heartbeat', message: 'Heartbeat — all 4 probes responding (avg 142ms)', timestamp: new Date(now - 50000).toISOString() },
    { id: 'log-35', agentId: 'flux', projectId: 'proj-3', level: 'info', category: 'task', message: 'Started configuring rate limiting rules', timestamp: new Date(now - 40000).toISOString() },
    { id: 'log-36', agentId: 'arc', projectId: 'proj-3', level: 'info', category: 'task', message: 'Started validating data integrity checksums', timestamp: new Date(now - 30000).toISOString() },
    { id: 'log-37', agentId: 'zen', level: 'debug', category: 'system', message: 'Model training epoch 12/50 — loss: 0.0034', timestamp: new Date(now - 20000).toISOString() },
    { id: 'log-38', agentId: 'vex', projectId: 'proj-3', level: 'info', category: 'task', message: 'Started testing alert routing with mock incidents', timestamp: new Date(now - 10000).toISOString() },
];

// ── Helpers ──
export const getChildren = (parentId: string | null) => AGENTS.filter(a => a.parentId === parentId);
export const getTopLevelAgents = () => getChildren(null);
export const getAgentById = (id: string) => AGENTS.find(a => a.id === id);
