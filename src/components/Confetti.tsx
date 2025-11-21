import React, { useMemo } from 'react';

interface ConfettiProps {
    show: boolean;
}

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    delay: number;
}

const Confetti: React.FC<ConfettiProps> = ({ show }) => {
    const pieces = useMemo<ConfettiPiece[]>(() => {
        if (!show) return [];

        return Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: -10,
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
            color: ['#2196f3', '#9c27b0', '#ff9800', '#4caf50', '#f44336'][Math.floor(Math.random() * 5)],
            delay: Math.random() * 0.5,
        }));
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute w-2 h-2 rounded-sm animate-confetti-fall"
                    style={{
                        left: `${piece.x}%`,
                        top: `${piece.y}%`,
                        backgroundColor: piece.color,
                        transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: '3s',
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;
