import { LayoutDashboard, Users, Briefcase, Target, Activity, BarChart, Globe, Sun, Moon } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const TABS = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'agents', icon: Users, label: 'Agents' },
    { id: 'projects', icon: Briefcase, label: 'Projects' },
    { id: 'missions', icon: Target, label: 'Missions' },
    { id: 'operations', icon: Activity, label: 'Fleet Ops' },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'sources', icon: Globe, label: 'Sources' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, theme, onToggleTheme }) => {
    return (
        <div className="w-14 h-full flex flex-col items-center py-4 gap-1 z-50 shrink-0 border-r"
            style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--glass-border)' }}>
            {/* Logo */}
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <span className="text-emerald-400 text-xs font-black">C</span>
            </div>

            {/* Tabs */}
            <div className="flex flex-col items-center gap-1 flex-1">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        title={tab.label}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeTab === tab.id
                            ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5'
                            }`}
                    >
                        <tab.icon size={20} />
                    </button>
                ))}
            </div>

            {/* Theme Toggle */}
            <button
                onClick={onToggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 transition-all mt-auto"
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        </div>
    );
};
