import React, { useState, useEffect } from 'react';
import type { Mission, MissionStatus } from '../../types/mission';
import { MissionPipeline } from './MissionPipeline';
import { MissionEventFeed, type FeedEvent } from './MissionEventFeed';
import { MissionDetailPanel } from './MissionDetailPanel';
import { PageHeader } from '../layout/PageHeader';

interface MissionBoardProps {
    missions: Mission[];
    onMoveMission: (missionId: string, newStatus: MissionStatus) => void;
    onCreateMission?: () => void;
}

export const MissionBoard: React.FC<MissionBoardProps> = ({ missions, onMoveMission, onCreateMission }) => {
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [feedMinimized, setFeedMinimized] = useState(false);
    const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);

    // Keep selected mission in sync when missions list changes (e.g. auto-pilot moves it)
    useEffect(() => {
        if (selectedMission) {
            const updated = missions.find(m => m.id === selectedMission.id);
            if (updated) setSelectedMission(updated);
        }
    }, [missions]); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for WS events and push to feed
    useEffect(() => {
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${wsProto}//${window.location.host}`);

        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                let feedEvent: FeedEvent | null = null;

                if (msg.event === 'mission_status_changed') {
                    const task = msg.data?.task;
                    feedEvent = {
                        id: `${Date.now()}-${Math.random()}`,
                        type: 'status_change',
                        missionTitle: task?.description?.slice(0, 40) || 'Mission',
                        message: `Status → ${msg.data?.status}`,
                        timestamp: new Date().toISOString(),
                    };
                } else if (msg.event === 'mission_activity') {
                    feedEvent = {
                        id: `${Date.now()}-${Math.random()}`,
                        type: 'activity',
                        message: msg.data?.entry?.action || 'Activity recorded',
                        timestamp: new Date().toISOString(),
                    };
                } else if (msg.event === 'mission_deliverable_added') {
                    feedEvent = {
                        id: `${Date.now()}-${Math.random()}`,
                        type: 'deliverable',
                        message: `Deliverable: ${msg.data?.deliverable?.label || 'added'}`,
                        timestamp: new Date().toISOString(),
                    };
                } else if (msg.event === 'new_task') {
                    feedEvent = {
                        id: `${Date.now()}-${Math.random()}`,
                        type: 'system',
                        message: `New mission: ${msg.data?.description?.slice(0, 50) || 'created'}`,
                        timestamp: new Date().toISOString(),
                    };
                }

                if (feedEvent) {
                    setFeedEvents(prev => [feedEvent!, ...prev].slice(0, 100));
                }
            } catch { /* ignore malformed */ }
        };

        return () => ws.close();
    }, []);

    // Also track local moveMission calls via a wrapped handler
    const handleMoveMission = (missionId: string, newStatus: MissionStatus) => {
        const mission = missions.find(m => m.id === missionId);
        onMoveMission(missionId, newStatus);
        if (mission) {
            const ev: FeedEvent = {
                id: `${Date.now()}-${Math.random()}`,
                type: 'status_change',
                missionTitle: mission.title.slice(0, 40),
                message: `→ ${newStatus.replace('_', ' ')}`,
                timestamp: new Date().toISOString(),
            };
            setFeedEvents(prev => [ev, ...prev].slice(0, 100));
        }
    };

    return (
        <div className="flex h-full gap-0 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
            {/* Main kanban area */}
            <div className="flex flex-col flex-1 min-w-0 gap-4 overflow-hidden pr-3">
                <PageHeader
                    title="Mission Control"
                    subtitle="Agent Pipeline • Live Monitoring"
                />
                <MissionPipeline
                    missions={missions}
                    onMoveMission={handleMoveMission}
                    onSelectMission={setSelectedMission}
                    onCreateMission={onCreateMission}
                />
            </div>

            {/* Live Event Feed sidebar */}
            <MissionEventFeed
                events={feedEvents}
                isMinimized={feedMinimized}
                onToggle={() => setFeedMinimized(v => !v)}
            />

            {/* Mission Detail Panel (overlay) */}
            {selectedMission && (
                <MissionDetailPanel
                    mission={selectedMission}
                    onClose={() => setSelectedMission(null)}
                    onMoveMission={(id, status) => {
                        handleMoveMission(id, status);
                        // Update selected mission locally
                        setSelectedMission(prev => prev ? { ...prev, status, updatedAt: new Date().toISOString() } : null);
                    }}
                />
            )}
        </div>
    );
};
