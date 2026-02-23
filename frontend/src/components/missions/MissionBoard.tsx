import React from 'react';
import type { Mission, MissionStatus } from '../../types/mission';
import { MissionPipeline } from './MissionPipeline';
import { PageHeader } from '../layout/PageHeader';

interface MissionBoardProps {
    missions: Mission[];
    onMoveMission: (missionId: string, newStatus: MissionStatus) => void;
}

export const MissionBoard: React.FC<MissionBoardProps> = ({ missions, onMoveMission }) => {
    return (
        <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 180px)' }}>
            <PageHeader
                title="Mission Control"
                subtitle="Agent Pipeline • Live Monitoring"
            />
            <MissionPipeline
                missions={missions}
                onMoveMission={onMoveMission}
            />
        </div>
    );
};
