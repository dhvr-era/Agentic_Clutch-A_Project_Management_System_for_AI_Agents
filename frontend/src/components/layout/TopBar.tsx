import { LayoutDashboard, Users, Briefcase, Target, Activity, BarChart, Globe, UserCircle2, Square, Pause, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopBarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const PAGE_META: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>, label: string }> = {
    dashboard: { icon: LayoutDashboard, label: 'Dashboard' },
    agents: { icon: Users, label: 'Agents' },
    projects: { icon: Briefcase, label: 'Projects' },
    missions: { icon: Target, label: 'Missions' },
    operations: { icon: Activity, label: 'Fleet Ops' },
    operations_tasks: { icon: Activity, label: 'Fleet Ops' },
    operations_activity: { icon: Activity, label: 'Fleet Ops' },
    operations_logs: { icon: Activity, label: 'Fleet Ops' },
    analytics: { icon: BarChart, label: 'Analytics' },
    sources: { icon: Globe, label: 'Sources' },
    tasks: { icon: Activity, label: 'Tasks' },
    activity: { icon: Activity, label: 'Activity' },
    logs: { icon: Activity, label: 'Logs' },
};

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onTabChange }) => {
    const page = PAGE_META[activeTab] ?? PAGE_META['dashboard'];
    const PageIcon = page.icon;

    const [mode, setMode] = useState<'run' | 'paused' | 'killed'>('run');
    const [acting, setActing] = useState(false);

    useEffect(() => {
        const poll = () => fetch('/api/system/state').then(r => r.json()).then(d => setMode(d.mode)).catch(() => {});
        poll();
        const id = setInterval(poll, 5000);
        return () => clearInterval(id);
    }, []);

    const setSystemMode = async (next: 'run' | 'paused' | 'killed') => {
        setActing(true);
        try {
            await fetch('/api/system/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: next }) });
            setMode(next);
        } finally { setActing(false); }
    };

    const modeColor = mode === 'run' ? 'text-emerald-400' : mode === 'paused' ? 'text-amber-400' : 'text-rose-400';
    const modeDot   = mode === 'run' ? 'bg-emerald-400' : mode === 'paused' ? 'bg-amber-400' : 'bg-rose-500';

    return (
        <header
            className="h-14 shrink-0 flex items-center justify-between px-4 border-b z-50 relative"
            style={{
                backgroundColor: 'var(--sidebar-bg)',
                borderColor: 'var(--glass-border)',
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Left — Clutch brand + active page icon */}
            <div className="flex items-center gap-3">
                {/* Elegant Minimal Wordmark */}
                <button
                    onClick={() => onTabChange('dashboard')}
                    className="flex items-center group"
                    title="Go to Dashboard"
                >
                    <span className="text-xl font-black tracking-tighter uppercase drop-shadow-sm">
                        <span className="text-amber-500">Clu</span>
                        <span className="text-[#faf9f5]">tch</span>
                    </span>
                </button>

                {/* Divider */}
                <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--glass-border)' }} />

                {/* Active page indicator */}
                <div className="flex items-center gap-2 text-muted-text">
                    <PageIcon size={16} className="text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary-text">{page.label}</span>
                </div>
            </div>

            {/* Centre — System controls */}
            <div className="flex items-center gap-2">
                {/* Status indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/20 border border-white/5">
                    <span className={`w-1.5 h-1.5 rounded-full ${modeDot} ${mode === 'run' ? 'animate-pulse' : ''}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${modeColor}`}>{mode}</span>
                </div>

                {mode !== 'paused' && mode !== 'killed' && (
                    <button onClick={() => setSystemMode('paused')} disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                        title="Pause — stop dispatching new tasks">
                        <Pause size={11} />Pause
                    </button>
                )}

                {mode === 'paused' && (
                    <button onClick={() => setSystemMode('run')} disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                        title="Resume operations">
                        <Play size={11} />Resume
                    </button>
                )}

                {mode !== 'killed' && (
                    <button onClick={() => setSystemMode('killed')} disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                        title="Kill — halt all agent activity immediately">
                        <Square size={11} />Kill
                    </button>
                )}

                {mode === 'killed' && (
                    <button onClick={() => setSystemMode('run')} disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 animate-pulse"
                        title="Resume from kill">
                        <Play size={11} />Resume
                    </button>
                )}
            </div>

            {/* Right — User / profile button */}
            <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 transition-all group"
                title="Profile"
            >
                <span className="text-xs font-mono text-muted-text group-hover:text-main-text transition-colors hidden sm:block">
                    Admin
                </span>
                <div className="w-8 h-8 rounded-xl bg-black/10 border flex items-center justify-center group-hover:border-amber-500/30 transition-all"
                    style={{ borderColor: 'var(--glass-border)' }}>
                    <UserCircle2 size={18} className="text-secondary-text group-hover:text-amber-400 transition-colors" />
                </div>
            </button>
        </header>
    );
};
