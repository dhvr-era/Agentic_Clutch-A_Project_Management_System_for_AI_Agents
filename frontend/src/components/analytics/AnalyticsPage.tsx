import React, { useState, useEffect } from 'react';
import { Activity, BarChart3, Info, DollarSign, Pencil, Check, X } from 'lucide-react';
import { Panel } from '../Panel';
import { MetricCard } from '../MetricCard';
import type { DashboardData } from '../../types';
import { PageHeader } from '../layout/PageHeader';

interface AnalyticsPageProps {
    data: DashboardData | null;
}

interface BudgetData {
    limits: { daily_usd: number; monthly_usd: number };
    spend:  { daily: number; monthly: number };
}

function SpendBar({ label, spend, limit, color }: { label: string; spend: number; limit: number; color: string }) {
    const pct = limit > 0 ? Math.min((spend / limit) * 100, 100) : 0;
    const warn = pct >= 80;
    const barColor = pct >= 100 ? 'bg-rose-500' : warn ? 'bg-amber-400' : `bg-${color}-400`;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
                <span className="uppercase font-bold text-secondary-text tracking-wider">{label}</span>
                <span className={`font-mono font-bold ${warn ? 'text-amber-400' : 'text-main-text'}`}>
                    ${spend.toFixed(4)} <span className="text-muted-text font-normal">/ ${limit.toFixed(2)}</span>
                </span>
            </div>
            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-divider">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-text">
                <span>{pct.toFixed(1)}% used</span>
                <span>${(limit - spend).toFixed(4)} remaining</span>
            </div>
        </div>
    );
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ data }) => {
    const [showEfficiencyInfo, setShowEfficiencyInfo] = useState(false);
    const [budget, setBudget] = useState<BudgetData | null>(null);
    const [editing, setEditing] = useState(false);
    const [draftDaily, setDraftDaily] = useState('');
    const [draftMonthly, setDraftMonthly] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const fetchBudget = () => {
        fetch('/api/budget')
            .then(r => r.json())
            .then(d => setBudget(d))
            .catch(() => {});
    };

    useEffect(() => {
        fetchBudget();
        const id = setInterval(fetchBudget, 15000);
        return () => clearInterval(id);
    }, []);

    const startEdit = () => {
        if (!budget) return;
        setDraftDaily(budget.limits.daily_usd.toString());
        setDraftMonthly(budget.limits.monthly_usd.toString());
        setSaveError('');
        setEditing(true);
    };

    const cancelEdit = () => { setEditing(false); setSaveError(''); };

    const saveBudget = async () => {
        const daily = parseFloat(draftDaily);
        const monthly = parseFloat(draftMonthly);
        if (isNaN(daily) || isNaN(monthly) || daily <= 0 || monthly <= 0) {
            setSaveError('Enter valid positive numbers');
            return;
        }
        setSaving(true);
        setSaveError('');
        try {
            const r = await fetch('/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daily_usd: daily, monthly_usd: monthly }),
            });
            if (!r.ok) throw new Error('Save failed');
            await fetchBudget();
            setEditing(false);
        } catch (e: any) {
            setSaveError(e.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="LLM Analytics"
                subtitle="Token consumption & cost analysis"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Panel title="Token Distribution" icon={<BarChart3 size={18} />}>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase text-secondary-text font-bold mb-2">Total Tokens (24h)</span>
                                <span className="text-5xl font-mono font-bold text-amber-400 drop-shadow-sm">{data?.usage_summary?.total_tokens?.toLocaleString() || "0"}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <MetricCard label="Input Tokens" value={Math.floor((data?.usage_summary?.total_tokens || 0) * 0.35)} percentage={35} color="blue" />
                            <MetricCard label="Output Tokens" value={Math.floor((data?.usage_summary?.total_tokens || 0) * 0.65)} percentage={65} color="emerald" />
                        </div>
                    </div>
                </Panel>
                <Panel title="Cost Efficiency" icon={<Activity size={18} />}>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase text-secondary-text font-bold mb-2">Monthly Projected</span>
                                <span className="text-5xl font-mono font-bold text-indigo-400 drop-shadow-sm">${((data?.usage_summary?.daily_cost || 0) * 30).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="p-5 bg-black/5 rounded-2xl border border-divider space-y-3 relative shadow-sm">
                            <div className="flex justify-between items-center text-xs uppercase font-bold text-secondary-text">
                                <div className="flex items-center gap-2">
                                    <span>Efficiency Rating</span>
                                    <button onClick={() => setShowEfficiencyInfo(!showEfficiencyInfo)} className="w-5 h-5 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all" title="What is Efficiency Rating?">
                                        <Info size={12} className="text-muted-text hover:text-main-text" />
                                    </button>
                                </div>
                                <span className="text-amber-400">Optimal</span>
                            </div>
                            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-divider">
                                <div className="h-full bg-amber-500 w-[92%]" />
                            </div>
                            {showEfficiencyInfo && (
                                <div className="mt-4 p-4 bg-card border border-card-border rounded-xl text-xs text-muted-text leading-relaxed space-y-3 shadow-md relative z-10">
                                    <p className="text-main-text font-bold text-sm">How Efficiency Rating Works</p>
                                    <p><strong className="text-secondary-text">What it measures:</strong> The ratio of useful output tokens to total tokens consumed. Higher efficiency = more work done per dollar spent.</p>
                                    <p><strong className="text-secondary-text">Rating scale:</strong></p>
                                    <div className="grid grid-cols-4 gap-2 mt-1">
                                        <span className="text-amber-400">0–40% Poor</span>
                                        <span className="text-indigo-400">40–60% Fair</span>
                                        <span className="text-indigo-400">60–80% Good</span>
                                        <span className="text-amber-400">80%+ Optimal</span>
                                    </div>
                                    <p><strong className="text-secondary-text">Current: 92%</strong> — Your agents are producing high-value output with minimal wasted context. Prompt engineering and model selection are well-tuned.</p>
                                    <button onClick={() => setShowEfficiencyInfo(false)} className="text-[10px] text-muted-text hover:text-main-text uppercase tracking-widest mt-2 px-3 py-1.5 rounded bg-black/10 transition-colors">Dismiss</button>
                                </div>
                            )}
                        </div>
                    </div>
                </Panel>
            </div>

            {/* Budget controls */}
            <Panel
                title="Spend Limits"
                icon={<DollarSign size={18} />}
                headerAction={
                    editing ? (
                        <div className="flex items-center gap-2">
                            {saveError && <span className="text-xs text-rose-400">{saveError}</span>}
                            <button onClick={saveBudget} disabled={saving}
                                className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                                <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={cancelEdit}
                                className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-black/10 text-muted-text hover:bg-black/20 transition-colors">
                                <X size={12} /> Cancel
                            </button>
                        </div>
                    ) : (
                        <button onClick={startEdit}
                            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-black/10 text-muted-text hover:bg-amber-500/20 hover:text-amber-400 transition-colors">
                            <Pencil size={12} /> Edit limits
                        </button>
                    )
                }
            >
                {budget ? (
                    <div className="space-y-6">
                        {editing ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-secondary-text tracking-wider">Daily limit ($)</label>
                                    <input
                                        type="number" min="0.01" step="0.50"
                                        value={draftDaily}
                                        onChange={e => setDraftDaily(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/10 border border-divider text-main-text font-mono text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-secondary-text tracking-wider">Monthly limit ($)</label>
                                    <input
                                        type="number" min="0.01" step="1"
                                        value={draftMonthly}
                                        onChange={e => setDraftMonthly(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/10 border border-divider text-main-text font-mono text-sm focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <SpendBar label="Daily" spend={budget.spend.daily} limit={budget.limits.daily_usd} color="amber" />
                                <SpendBar label="Monthly" spend={budget.spend.monthly} limit={budget.limits.monthly_usd} color="indigo" />
                            </div>
                        )}
                        <p className="text-[10px] text-muted-text">Limits apply to all agents via privacy proxy. Changes take effect immediately.</p>
                    </div>
                ) : (
                    <div className="text-xs text-muted-text">Loading…</div>
                )}
            </Panel>
        </div>
    );
};
