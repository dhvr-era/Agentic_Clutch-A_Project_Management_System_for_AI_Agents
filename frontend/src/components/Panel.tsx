// v2.0
import React from 'react';
import { motion } from 'motion/react';

interface PanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ title, icon, children, headerAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass rounded-3xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-divider bg-black/5 flex items-center gap-3">
        <div className="text-secondary-text">{icon}</div>
        <h2 className="text-xs font-bold text-secondary-text uppercase tracking-[0.2em]">{title}</h2>
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};
