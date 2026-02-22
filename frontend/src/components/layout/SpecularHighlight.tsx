import React from 'react';

interface SpecularHighlightProps {
    mousePos: { x: number; y: number };
}

export const SpecularHighlight: React.FC<SpecularHighlightProps> = ({ mousePos }) => (
    <div
        className="specular-highlight opacity-30 blur-3xl"
        style={{ left: mousePos.x - 75, top: mousePos.y - 75, transition: 'left 0.1s ease-out, top 0.1s ease-out' }}
    />
);
