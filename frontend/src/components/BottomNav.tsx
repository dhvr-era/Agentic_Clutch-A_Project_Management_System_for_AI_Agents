import React from 'react';
import { LayoutDashboard, Users, ClipboardList, Terminal, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'agents', icon: Users, label: 'Agents' },
    { id: 'tasks', icon: ClipboardList, label: 'Tasks' },
    { id: 'logs', icon: Terminal, label: 'Logs' },
    { id: 'analytics', icon: BarChart3, label: 'LLM' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 px-2 py-2 pb-safe z-50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${activeTab === tab.id ? 'text-emerald-400 bg-emerald-400/10 shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
          >
            <tab.icon size={22} />
            <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
