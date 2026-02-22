import React from 'react';
import type { ActivityEvent } from '../../types/activity';
import { AGENTS } from '../../data/agents';
import { CheckCircle, ArrowRight, Flag, Trophy } from 'lucide-react';

interface ActivityFeedProps {
    events: ActivityEvent[];
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    completion: { icon: CheckCircle, color: '#10b981', label: 'Completed' },
    delegation: { icon: ArrowRight, color: '#3b82f6', label: 'Delegated' },
    milestone: { icon: Flag, color: '#8b5cf6', label: 'Milestone' },
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => {
    // Only show successes: completions, milestones, delegations
    const successEvents = events.filter(e => ['completion', 'milestone', 'delegation'].includes(e.type));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
                    <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Completions • Milestones • Delegations</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
                        <Trophy size={10} className="text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{successEvents.filter(e => e.type === 'completion').length} wins</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 rounded-full">
                        <Flag size={10} className="text-violet-400" />
                        <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">{successEvents.filter(e => e.type === 'milestone').length} milestones</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl max-h-[calc(100vh-160px)] overflow-y-auto">
                {successEvents.length === 0 ? (
                    <div className="px-4 py-12 text-center text-zinc-600 font-mono text-[10px] uppercase tracking-widest">No activity yet</div>
                ) : (
                    successEvents.map(event => {
                        const config = typeConfig[event.type] || typeConfig.completion;
                        const Icon = config.icon;
                        const agent = AGENTS.find(a => a.id === event.agentId);
                        const targetAgent = event.targetAgentId ? AGENTS.find(a => a.id === event.targetAgentId) : null;
                        const elapsed = Math.floor((Date.now() - new Date(event.timestamp).getTime()) / 1000);
                        const timeAgo = elapsed < 60 ? `${elapsed}s ago` : elapsed < 3600 ? `${Math.floor(elapsed / 60)}m ago` : `${Math.floor(elapsed / 3600)}h ago`;

                        return (
                            <div key={event.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${config.color}15` }}>
                                    <Icon size={13} color={config.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] text-zinc-300 leading-snug">{event.message}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        {agent && (
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded flex items-center justify-center" style={{ background: `${agent.color}20` }}>
                                                    <agent.icon size={7} color={agent.color} />
                                                </div>
                                                <span className="text-[9px] font-mono" style={{ color: agent.color }}>{agent.name}</span>
                                            </div>
                                        )}
                                        {targetAgent && (
                                            <>
                                                <ArrowRight size={8} className="text-zinc-600" />
                                                <div className="flex items-center gap-1">
                                                    <div className="w-3 h-3 rounded flex items-center justify-center" style={{ background: `${targetAgent.color}20` }}>
                                                        <targetAgent.icon size={7} color={targetAgent.color} />
                                                    </div>
                                                    <span className="text-[9px] font-mono" style={{ color: targetAgent.color }}>{targetAgent.name}</span>
                                                </div>
                                            </>
                                        )}
                                        <span className="text-[9px] text-zinc-600 font-mono ml-auto">{timeAgo}</span>
                                    </div>
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0" style={{ background: `${config.color}15`, color: config.color }}>
                                    {config.label}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
