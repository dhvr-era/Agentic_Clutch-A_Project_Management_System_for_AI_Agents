import { useState, useEffect } from 'react';
import { Cpu, Zap, AlertCircle, CheckCircle2, RefreshCw, Send } from 'lucide-react';

interface OCStatus {
    ok: boolean;
    gateway: 'up' | 'down';
    model: string;
    session_count: number;
    sessions: any[];
    timestamp: string;
    error?: string;
}

export function OpenClawStatus() {
    const [status, setStatus] = useState<OCStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [dispatching, setDispatching] = useState(false);
    const [dispatchResult, setDispatchResult] = useState<string | null>(null);

    const poll = async () => {
        try {
            const res = await fetch('/api/openclaw/status');
            setStatus(await res.json());
        } catch {
            setStatus({ ok: false, gateway: 'down', model: 'unknown', session_count: 0, sessions: [], timestamp: new Date().toISOString(), error: 'fetch failed' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        poll();
        const interval = setInterval(poll, 30000);
        return () => clearInterval(interval);
    }, []);

    const testDispatch = async () => {
        setDispatching(true);
        setDispatchResult(null);
        try {
            const res = await fetch('/api/openclaw/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '[Clutch ping] Integration test — reply OK', channel: 'telegram' }),
            });
            const data = await res.json();
            setDispatchResult(data.ok ? 'Dispatched OK' : `Error: ${data.error}`);
        } catch (e: any) {
            setDispatchResult(`Error: ${e.message}`);
        } finally {
            setDispatching(false);
            setTimeout(() => setDispatchResult(null), 5000);
        }
    };

    const isUp = status?.ok && status?.gateway === 'up';
    const sessionCount = status?.session_count ?? status?.sessions?.length ?? 0;
    const modelShort = status?.model?.split('/').pop() ?? '—';

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-amber-400" />
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">OpenClaw Engine</span>
                </div>
                <button onClick={poll} disabled={loading} className="text-white/30 hover:text-white/70 transition-colors">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
                {/* Gateway */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Gateway</span>
                    <div className="flex items-center gap-1.5">
                        {isUp
                            ? <CheckCircle2 size={13} className="text-emerald-400" />
                            : <AlertCircle size={13} className="text-red-400" />}
                        <span className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {loading ? '…' : isUp ? 'Live' : 'Down'}
                        </span>
                    </div>
                </div>

                {/* Model */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Model</span>
                    <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-amber-400" />
                        <span className="text-xs font-medium text-white/80 truncate">{loading ? '…' : modelShort}</span>
                    </div>
                </div>

                {/* Sessions */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Sessions</span>
                    <span className="text-xs font-medium text-white/80">{loading ? '…' : sessionCount}</span>
                </div>
            </div>

            {/* Dispatch test */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                    onClick={testDispatch}
                    disabled={dispatching || !isUp}
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={10} />
                    {dispatching ? 'Sending…' : 'Ping Genie'}
                </button>
                {dispatchResult && (
                    <span className={`text-[11px] ${dispatchResult.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {dispatchResult}
                    </span>
                )}
                {status?.timestamp && !loading && (
                    <span className="text-[10px] text-white/20 ml-auto">
                        {new Date(status.timestamp).toLocaleTimeString()}
                    </span>
                )}
            </div>
        </div>
    );
}
