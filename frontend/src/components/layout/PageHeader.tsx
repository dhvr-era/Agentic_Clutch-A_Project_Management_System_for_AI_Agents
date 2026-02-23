import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle: string | React.ReactNode;
    actions?: React.ReactNode;
    compact?: boolean; // reduce bottom margin for dense layouts like Dashboard
}

/**
 * Shared page header — used on every page for uniform look.
 * Title: text-3xl bold, subtitle: text-xs mono uppercase muted.
 * Actions slot on the right (buttons etc).
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, compact }) => (
    <div className={`flex items-start justify-between ${compact ? 'mb-2' : 'mb-6'}`}>
        <div>
            <h1 className={`font-bold text-main-text tracking-tight ${compact ? 'text-2xl' : 'text-3xl'}`}>{title}</h1>
            <p className="text-secondary-text font-mono text-xs uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
);
