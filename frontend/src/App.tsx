import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Globe, ShieldCheck, Server, ShieldCheck as Shield2, MessagesSquare, BarChart, Database, Cpu, Brain, Radio, Wifi } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardData } from './types';
import type { Mission, MissionStatus } from './types/mission';
import type { ActivityEvent } from './types/activity';
import type { Project } from './types/project';
import type { AgentConfig, AgentRole } from './types/agent';
import {
  INITIAL_TASKS, INITIAL_GOALS, INITIAL_MILESTONES, INITIAL_MISSIONS, INITIAL_ACTIVITY, INITIAL_LOGS, INITIAL_PROJECTS,
  AGENTS,
} from './data/agents';
import type { MyTask, Milestone, Goal, LogEntry, TaskStatus } from './data/agents';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { SpecularHighlight } from './components/layout/SpecularHighlight';
import { TopBar } from './components/layout/TopBar';

// Agents
import { AgentRack } from './components/agents/AgentRack';
import { AgentDetail } from './components/agents/AgentDetail';
import { AgentFleetView } from './components/agents/AgentFleetView';

// Pages
import { DashboardPage } from './components/dashboard/DashboardPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { SourcesPage } from './components/sources/SourcesPage';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { OperationsPage } from './components/operations/OperationsPage';

// New Features
import { MissionBoard } from './components/missions/MissionBoard';

// Shared Modals
import { CreateTaskModal } from './components/shared/CreateTaskModal';
import { CreateAgentModal } from './components/shared/CreateAgentModal';
import { CreateProjectModal } from './components/shared/CreateProjectModal';

// Icon map for agent creation
const ICON_MAP: Record<string, LucideIcon> = {
  server: Server, shield: Shield2, messages: MessagesSquare, chart: BarChart,
  database: Database, cpu: Cpu, brain: Brain, radio: Radio, wifi: Wifi,
};

export default function App() {
  // ── Navigation ──
  const [activeTab, setActiveTab] = useState('dashboard');

  // ── Dashboard Data ──
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ── Modal State ──
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const [viewingFindings, setViewingFindings] = useState<{ sourceId: string; name: string } | null>(null);
  const [findings, setFindings] = useState<any[]>([]);

  // ── Agent State ──
  const [path, setPath] = useState<string[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [mockStats, setMockStats] = useState({ tasks: 12, uptime: 99.8, latency: 1.2, cost: 0.04 });
  const [tasks, setTasks] = useState<MyTask[]>(INITIAL_TASKS);
  const [milestones] = useState<Milestone[]>(INITIAL_MILESTONES);
  const [goals] = useState<Goal[]>(INITIAL_GOALS);

  // ── Project State ──
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // ── Mission State (Kanban) ──
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);

  // ── Activity State ──
  const [activity, setActivity] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);

  // ── Logs State ──
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);

  // ── Create Task Modal ──
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskPrefill, setCreateTaskPrefill] = useState<{ agentId?: string; projectId?: string }>({});

  // ── Create Agent Modal ──
  const [showCreateAgent, setShowCreateAgent] = useState(false);

  // ── Create Project Modal ──
  const [showCreateProject, setShowCreateProject] = useState(false);

  // ── Theme State ──
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keep global AGENTS in sync
  useEffect(() => {
    AGENTS.length = 0;
    AGENTS.push(...agents);
  }, [agents]);

  // ── Load agents from DB on mount ──
  useEffect(() => {
    const ROLE_MAP: Record<string, AgentRole> = {
      'genie': 'Squad Lead',
      'scraper-bot-01': 'Executor',
      'analyst-bot-01': 'Analyst',
      'security-bot-01': 'Monitor',
    };
    const ICON_LOOKUP: Record<string, any> = {
      'genie': Brain,
      'scraper-bot-01': Database,
      'analyst-bot-01': BarChart,
      'security-bot-01': Shield2,
    };
    const VALID_STATUSES = ['running', 'idle', 'busy', 'standby', 'offline', 'error'];

    fetch('/api/agents')
      .then(r => r.ok ? r.json() : [])
      .then((dbAgents: any[]) => {
        if (!Array.isArray(dbAgents) || dbAgents.length === 0) return;
        const converted: AgentConfig[] = dbAgents.map(a => ({
          id: String(a.id),
          parentId: a.parent_id ? String(a.parent_id) : null,
          name: a.name,
          role: ROLE_MAP[a.openclaw_id] || (a.tier === 'Green' ? 'Squad Lead' : 'Analyst'),
          tier: (a.tier === 'Green' ? 'Top' : 'Workhorse') as 'Top' | 'Workhorse',
          color: a.tier === 'Green' ? '#f59e0b' : '#6366f1',
          status: (VALID_STATUSES.includes(a.status) ? a.status : 'idle') as any,
          provider: 'OpenClaw',
          icon: ICON_LOOKUP[a.openclaw_id] || Server,
        }));
        setAgents(converted);
        const firstLead = converted.find(a => a.parentId === null);
        if (firstLead) setPath([firstLead.id]);
      })
      .catch(() => {});
  }, []);

  // ── Data Fetching ──
  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        setData(await response.json());
      } else {
        setData({ usage_summary: { daily_cost: 4.5, total_tokens: 154000, monthly_cost: 135 }, active_tasks: [], agents: [], recent_logs: [], sources: [] } as DashboardData);
      }
    } catch {
      setData({ usage_summary: { daily_cost: 4.5, total_tokens: 154000, monthly_cost: 135 }, active_tasks: [], agents: [], recent_logs: [], sources: [] } as DashboardData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const mockInterval = setInterval(() => {
      setMockStats(prev => ({ ...prev, latency: 1.0 + (Math.random() * 0.4), cost: prev.cost + 0.001 }));
    }, 3000);
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => { clearInterval(interval); clearInterval(mockInterval); window.removeEventListener('mousemove', handleMouseMove); };
  }, []);

  // ── Agent Helpers ──
  const topLevelAgents = agents.filter(a => a.parentId === null);
  const workhorseAgents = path[0] ? agents.filter(a => a.parentId === path[0]) : [];
  const activeWorkhorseId = path[1];
  const isDepth1Pushed = Boolean(activeWorkhorseId);
  const activeTopAgent = agents.find(a => a.id === path[0]);
  const activeAgent = agents.find(a => a.id === activeWorkhorseId);

  const handleSelectTop = (id: string) => { if (path[0] !== id) setPath([id]); };
  const handleSelectMid = (id: string) => setPath([path[0], id]);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed, status: t.completed ? 'backlog' : 'done' as TaskStatus } : t));
  };

  const reassignTask = (taskId: string, newAssigneeId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigneeId: newAssigneeId } : t));
  };

  // ── Task Handlers ──
  const handleCreateTask = (taskData: Omit<MyTask, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: MyTask = {
      ...taskData,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString(),
      completed: taskData.status === 'done',
    };
    setTasks(prev => [newTask, ...prev]);

    // Fire activity event
    const agent = agents.find(a => a.id === taskData.assigneeId);
    setActivity(prev => [{
      id: `act-${Date.now()}`,
      type: 'delegation' as const,
      agentId: taskData.assigneeId,
      projectId: taskData.projectId,
      message: `Task "${taskData.title}" assigned to ${agent?.name || 'Unknown'}`,
      timestamp: new Date().toISOString(),
    }, ...prev]);

    // Fire log
    setLogs(prev => [{
      id: `log-${Date.now()}`,
      agentId: taskData.assigneeId,
      projectId: taskData.projectId,
      level: 'info',
      category: 'task',
      message: `New task created: "${taskData.title}" [${taskData.priority}]`,
      timestamp: new Date().toISOString(),
    }, ...prev]);
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, completed: status === 'done' } : t));

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const agent = agents.find(a => a.id === task.assigneeId);
      if (status === 'done') {
        setActivity(prev => [{
          id: `act-${Date.now()}`,
          type: 'completion' as const,
          agentId: task.assigneeId,
          projectId: task.projectId,
          message: `${agent?.name || 'Agent'} completed "${task.title}"`,
          timestamp: new Date().toISOString(),
        }, ...prev]);
      }
      setLogs(prev => [{
        id: `log-${Date.now()}`,
        agentId: task.assigneeId,
        projectId: task.projectId,
        level: 'info',
        category: 'task',
        message: `Task "${task.title}" status → ${status}`,
        timestamp: new Date().toISOString(),
      }, ...prev]);
    }
  };

  // ── Project Handlers ──
  const handleCreateProject = (projData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects(prev => [newProject, ...prev]);
    setActivity(prev => [{
      id: `act-${Date.now()}`,
      type: 'milestone' as const,
      agentId: projData.leadAgentId,
      projectId: newProject.id,
      message: `New project created: "${projData.title}"`,
      timestamp: new Date().toISOString(),
    }, ...prev]);
  };

  // ── Agent Handlers ──
  const handleCreateAgent = (agentData: Omit<AgentConfig, 'icon'> & { iconId: string }) => {
    const { iconId, ...rest } = agentData;
    const newAgent: AgentConfig = {
      ...rest,
      icon: ICON_MAP[iconId] || Server,
    };
    setAgents(prev => [...prev, newAgent]);
    setActivity(prev => [{
      id: `act-${Date.now()}`,
      type: 'milestone' as const,
      agentId: newAgent.id,
      message: `New agent "${newAgent.name}" created (${newAgent.role})`,
      timestamp: new Date().toISOString(),
    }, ...prev]);
    setLogs(prev => [{
      id: `log-${Date.now()}`,
      agentId: newAgent.id,
      level: 'info',
      category: 'system',
      message: `Agent "${newAgent.name}" registered — ${newAgent.model} via ${newAgent.provider}`,
      timestamp: new Date().toISOString(),
    }, ...prev]);
  };

  // ── Open Create Task from anywhere ──
  const openCreateTask = (prefilledProjectId?: string, prefilledAgentId?: string) => {
    setCreateTaskPrefill({ projectId: prefilledProjectId, agentId: prefilledAgentId });
    setShowCreateTask(true);
  };

  // ── Mission Helpers ──
  const moveMission = (missionId: string, newStatus: MissionStatus) => {
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: newStatus, updatedAt: new Date().toISOString() } : m));
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      setActivity(prev => [{
        id: `act-${Date.now()}`, type: 'status_change', agentId: mission.assigneeId || 'nexus',
        projectId: mission.projectId,
        message: `Mission "${mission.title}" moved to ${newStatus.replace('_', ' ')}`,
        timestamp: new Date().toISOString(),
      }, ...prev]);
    }
  };

  // ── Source Helpers ──
  const handleAddSource = async () => {
    if (!sourceName || !sourceUrl) return;
    try {
      await fetch('/api/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: sourceName, url: sourceUrl }) });
      setSourceName(''); setSourceUrl(''); setIsAddingSource(false); fetchData();
    } catch (error) { console.error('Failed to add source:', error); }
  };

  const handleSyncSource = async (sourceId: string, sourceName: string) => {
    setSyncingSource(sourceId);
    try {
      const response = await fetch(`/api/sources/${sourceId}/sync`, { method: 'POST' });
      const result = await response.json();
      if (result.findings) { setFindings(result.findings); setViewingFindings({ sourceId, name: sourceName }); }
      fetchData();
    } catch (error) { console.error('Failed to sync source:', error); }
    finally { setSyncingSource(null); }
  };

  // ── Loading ──
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-emerald-500 animate-spin" size={32} />
          <span className="text-[var(--text-muted)] font-mono text-xs tracking-widest uppercase">Syncing Agentic Clutch...</span>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
      <SpecularHighlight mousePos={mousePos} />
      <Sidebar
        activeTab={activeTab === 'operations_tasks' || activeTab === 'operations_activity' || activeTab === 'operations_logs' ? 'operations' : activeTab}
        onTabChange={(tab) => {
          if (tab === 'operations') setActiveTab('operations_tasks');
          else setActiveTab(tab);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Right column: TopBar + page content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar activeTab={activeTab} onTabChange={(tab: string) => {
          if (tab === 'operations') setActiveTab('operations_tasks');
          else setActiveTab(tab);
        }} />

        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="max-w-[1300px] mx-auto w-full px-8 py-10 min-h-full flex flex-col">
            {/* Agents Tab — Custom Rack Layout */}
            {activeTab === 'agents' ? (
              <div className="flex-1 racks-container relative z-40 overflow-hidden flex bg-card border border-card-border rounded-3xl p-6 shadow-sm">
                <AgentRack agents={topLevelAgents} title="Squad Leads" activeId={path[0]} isPushed={path.length > 0} onSelect={handleSelectTop} onCreateAgent={() => setShowCreateAgent(true)} />
                {path[0] && workhorseAgents.length > 0 && (
                  <AgentRack agents={workhorseAgents} title="Workhorses" activeId={path[1]} isPushed={isDepth1Pushed} onSelect={handleSelectMid} />
                )}
                <div className="detail-view">
                  {!activeWorkhorseId && activeTopAgent ? (
                    <AgentFleetView topAgent={activeTopAgent} workhorseAgents={workhorseAgents} mockStats={mockStats} tasks={tasks} onSelectWorkhorse={handleSelectMid} />
                  ) : activeAgent ? (
                    <AgentDetail
                      agent={activeAgent}
                      goals={goals.filter(g => g.agentId === activeWorkhorseId)}
                      milestones={milestones.filter(m => m.agentId === activeWorkhorseId)}
                      tasks={tasks.filter(t => t.assigneeId === activeWorkhorseId)}
                      peerAgents={workhorseAgents}
                      onToggleTask={toggleTask}
                      onReassignTask={reassignTask}
                      onReturnToFleet={() => setPath([path[0]])}
                      allMilestones={milestones}
                      onCreateTask={() => openCreateTask(undefined, activeWorkhorseId)}
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + (activeTab === 'projects' ? `-${selectedProjectId || 'list'}` : '')}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full flex-1"
                >
                  {activeTab === 'dashboard' && (
                    <DashboardPage
                      data={data}
                      missions={missions}
                      activity={activity}
                      tasks={tasks}
                      logs={logs}
                      projects={projects}
                      onNavigate={setActiveTab}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                      onCreateTask={() => openCreateTask()}
                      onCreateAgent={() => setShowCreateAgent(true)}
                      onCreateProject={() => setShowCreateProject(true)}
                    />
                  )}
                  {activeTab === 'projects' && (
                    <ProjectsPage
                      projects={projects}
                      tasks={tasks}
                      milestones={milestones}
                      missions={missions}
                      onCreateProject={() => setShowCreateProject(true)}
                      onOpenCreateTask={(projId) => openCreateTask(projId)}
                      onSelectProject={setSelectedProjectId}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                      onMoveMission={moveMission}
                      selectedProjectId={selectedProjectId}
                    />
                  )}
                  {activeTab === 'missions' && <MissionBoard missions={missions} onMoveMission={moveMission} />}
                  {(activeTab === 'operations' || activeTab === 'operations_tasks') && (
                    <OperationsPage
                      initialTab="tasks"
                      tasks={tasks}
                      activity={activity}
                      logs={logs}
                      projects={projects}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                      onCreateTask={() => openCreateTask()}
                    />
                  )}
                  {activeTab === 'operations_activity' && (
                    <OperationsPage
                      initialTab="activity"
                      tasks={tasks}
                      activity={activity}
                      logs={logs}
                      projects={projects}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                      onCreateTask={() => openCreateTask()}
                    />
                  )}
                  {activeTab === 'operations_logs' && (
                    <OperationsPage
                      initialTab="logs"
                      tasks={tasks}
                      activity={activity}
                      logs={logs}
                      projects={projects}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                      onCreateTask={() => openCreateTask()}
                    />
                  )}
                  {activeTab === 'analytics' && <AnalyticsPage data={data} />}
                  {activeTab === 'sources' && (
                    <SourcesPage
                      data={data}
                      syncingSource={syncingSource}
                      onAddSource={() => setIsAddingSource(true)}
                      onSyncSource={handleSyncSource}
                      onViewFindings={(id, name) => setViewingFindings({ sourceId: id, name })}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* ── Create Task Modal ── */}
      {showCreateTask && (
        <CreateTaskModal
          projects={projects}
          milestones={milestones}
          prefilledAgentId={createTaskPrefill.agentId}
          prefilledProjectId={createTaskPrefill.projectId}
          onClose={() => setShowCreateTask(false)}
          onCreate={handleCreateTask}
        />
      )}

      {/* ── Create Agent Modal ── */}
      {showCreateAgent && (
        <CreateAgentModal
          onClose={() => setShowCreateAgent(false)}
          onCreate={handleCreateAgent}
        />
      )}

      {/* ── Create Project Modal ── */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreate={handleCreateProject}
        />
      )}

      {/* ── Source Modals ── */}
      <AnimatePresence>
        {isAddingSource && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="liquid-glass rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400"><Globe size={20} /></div>
                <div><h3 className="text-xl font-bold text-white">Connect Environment</h3><p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Live Data Stream</p></div>
              </div>
              <div className="space-y-4 mb-8">
                <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Environment Name</label><input type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. Production OpenClaw" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 transition-all" /></div>
                <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Endpoint URL</label><input type="text" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://api.example.com" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 transition-all" /></div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsAddingSource(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-400 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                <button onClick={handleAddSource} className="flex-1 bg-emerald-500 text-black py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all">Connect</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingFindings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="liquid-glass rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400"><ShieldCheck size={20} /></div>
                  <div><h3 className="text-xl font-bold text-white">Security Findings</h3><p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">{viewingFindings.name}</p></div>
                </div>
                <button onClick={() => setViewingFindings(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {findings.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 font-mono text-xs uppercase tracking-widest">No findings detected</div>
                ) : (
                  findings.map((finding: any) => (
                    <div key={finding.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-bold text-zinc-200">{finding.title}</h4>
                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${finding.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                          finding.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                            finding.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                          }`}>{finding.severity}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{finding.description}</p>
                      <div className="text-[9px] text-zinc-600 font-mono uppercase">Detected: {new Date(finding.timestamp).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
