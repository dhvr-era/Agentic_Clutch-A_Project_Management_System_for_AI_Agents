import React from 'react';
import { ChevronRight, ChevronLeft, Zap } from 'lucide-react';

export interface FeedEvent {
    id: string;
    type: 'status_change' | 'activity' | 'deliverable' | 'system';
    missionTitle?: string;
    message: string;
    timestamp: string;
}

interface MissionEventFeedProps {
    events: FeedEvent[];
    isMinimized: boolean;
    onToggle: () => void;
}

const EVENT_ICONS: Record<FeedEvent['type'], string> = {
    status_change: '🔄',
    activity: '📋',
    deliverable: '📎',
    system: '⚙️',
};

const EVENT_COLORS: Record<FeedEvent['type'], string> = {
    status_change: 'text-indigo-400 border-indigo-500/40',
    activity: 'text-amber-400 border-amber-500/40',
    deliverable: 'text-emerald-400 border-emerald-500/40',
    system: 'text-muted-text border-transparent',
};

function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
}

export const MissionEventFeed: React.FC<MissionEventFeedProps> = ({ events, isMinimized, onToggle }) => {
    return (
        <div
            className={`bg-card border-l border-card-border flex flex-col transition-all duration-300 ease-in-out shrink-0 ${isMinimized ? 'w-10' : 'w-64'}`}
            style={{ height: '100%' }}
        >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-card-border flex items-center gap-2 shrink-0">
                <button
                    onClick={onToggle}
                    className="w-5 h-5 rounded flex items-center justify-center text-muted-text hover:text-main-text transition-colors"
                    aria-label={isMinimized ? 'Expand feed' : 'Collapse feed'}
                >
                    {isMinimized ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                </button>
                {!isMinimized && (
                    <>
                        <Zap size={12} className="text-amber-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-main-text">Live Feed</span>
                        <span className="ml-auto text-[10px] font-mono bg-black/10 px-1.5 py-0.5 rounded text-muted-text">{events.length}</span>
                    </>
                )}
            </div>

            {/* Event list */}
            {!isMinimized && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-24 opacity-40">
                            <Zap size={16} className="text-muted-text mb-2" />
                            <span className="text-[9px] font-mono uppercase text-muted-text">No events yet</span>
                        </div>
                    ) : events.map(ev => (
                        <div
                            key={ev.id}
                            className={`p-2 rounded-lg border-l-2 bg-black/5 ${EVENT_COLORS[ev.type]}`}
                        >
                            <div className="flex items-start gap-1.5">
                                <span className="text-xs shrink-0 mt-0.5">{EVENT_ICONS[ev.type]}</span>
                                <div className="flex-1 min-w-0">
                                    {ev.missionTitle && (
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-text truncate mb-0.5">
                                            {ev.missionTitle}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-secondary-text leading-snug">{ev.message}</p>
                                    <p className="text-[9px] text-dim-text mt-0.5 font-mono">{timeAgo(ev.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Minimized: rotated label */}
            {isMinimized && (
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-text"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        Live Feed
                    </span>
                </div>
            )}
        </div>
    );
};
