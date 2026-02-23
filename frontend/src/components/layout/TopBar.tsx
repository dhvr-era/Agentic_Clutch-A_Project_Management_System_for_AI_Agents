import { LayoutDashboard, Users, Briefcase, Target, Activity, BarChart, Globe, UserCircle2 } from 'lucide-react';

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
