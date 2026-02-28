import { useState } from 'react';
import { LayoutDashboard, Users, Briefcase, Target, Activity, BarChart, Globe, Sun, Moon, Menu, FileDown, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  pendingApprovals?: number;
}

const MAIN_TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'agents', icon: Users, label: 'Agents' },
  { id: 'projects', icon: Briefcase, label: 'Projects' },
  { id: 'missions', icon: Target, label: 'Missions' },
  { id: 'operations', icon: Activity, label: 'Fleet Ops' },
  { id: 'outbox', icon: FileDown, label: 'Outbox' },
  { id: 'approvals', icon: ShieldCheck, label: 'Approvals' },
  { id: 'analytics', icon: BarChart, label: 'Analytics' },
];

const BOTTOM_TAB = { id: 'sources', icon: Globe, label: 'Sources' };

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, theme, onToggleTheme, pendingApprovals = 0 }) => {
  const [expanded, setExpanded] = useState(false);

  const navBtn = (active: boolean) => `flex items-center gap-3 rounded-2xl transition-all duration-200 ${
    expanded ? 'w-full px-3 py-3' : 'w-14 h-14 justify-center'
  } ${
    active
      ? 'bg-amber-500/15 text-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.12)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5'
  }`;

  return (
    <div
      className="h-full flex flex-col z-50 shrink-0 border-r overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        width: expanded ? '200px' : '64px',
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--glass-border)',
      }}
    >
      {/* Burger Toggle */}
      <div className="flex items-center justify-center shrink-0" style={{ height: '56px' }}>
        <button
          onClick={() => setExpanded(prev => !prev)}
          title={expanded ? 'Collapse' : 'Expand'}
          className="w-14 h-14 flex items-center justify-center rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 transition-all duration-200"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Divider */}
      <div className="w-full px-3" style={{ height: '1px', backgroundColor: 'var(--glass-border)' }} />

      {/* Main Nav Tabs */}
      <div className={`flex flex-col gap-1 flex-1 pt-2 ${expanded ? 'items-stretch px-2' : 'items-center'}`}>
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={!expanded ? tab.label : undefined}
            className={navBtn(activeTab === tab.id)}
          >
            <div className="relative shrink-0">
              <tab.icon size={22} />
              {tab.id === 'approvals' && pendingApprovals > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {pendingApprovals}
                </span>
              )}
            </div>
            {expanded && (
              <span className="text-sm font-semibold whitespace-nowrap overflow-hidden">
                {tab.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div className={`flex flex-col gap-1 mt-2 ${expanded ? 'items-stretch px-2' : 'items-center'}`}>
        {/* Sources */}
        <button
          onClick={() => onTabChange(BOTTOM_TAB.id)}
          title={!expanded ? BOTTOM_TAB.label : undefined}
          className={navBtn(activeTab === BOTTOM_TAB.id)}
        >
          <Globe size={22} />
          {expanded && (
            <span className="text-sm font-semibold whitespace-nowrap overflow-hidden">
              {BOTTOM_TAB.label}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-full px-3 my-1" style={{ height: '1px', backgroundColor: 'var(--glass-border)' }} />

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={!expanded ? `Switch to ${theme === 'light' ? 'dark' : 'light'} mode` : undefined}
          className={`flex items-center gap-3 rounded-2xl transition-all duration-200 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 ${
            expanded ? 'w-full px-3 py-3' : 'w-14 h-14 justify-center'
          }`}
        >
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          {expanded && (
            <span className="text-sm font-semibold whitespace-nowrap overflow-hidden">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
