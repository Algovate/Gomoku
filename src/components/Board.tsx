import React, { useState, useEffect, useRef } from 'react';
import type { BoardState } from '../game/logic';
import { BOARD_SIZE } from '../game/logic';

interface BoardProps {
    board: BoardState;
    onCellClick: (x: number, y: number) => void;
    lastMove: { x: number, y: number } | null;
    hintMove?: { x: number, y: number } | null;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, lastMove, hintMove }) => {
    const [activeRipple, setActiveRipple] = useState<string | null>(null);
    const [newPieces, setNewPieces] = useState<Set<string>>(new Set());
    const prevBoardRef = useRef<BoardState>(board);

    // Track new pieces for drop animation
    useEffect(() => {
        const newPiecesSet = new Set<string>();
        board.forEach((row, x) => {
            row.forEach((cell, y) => {
                const key = `${x}-${y}`;
                if (cell && !prevBoardRef.current[x][y]) {
                    newPiecesSet.add(key);
                    // Remove from new pieces after animation completes
                    setTimeout(() => {
                        setNewPieces(prev => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                        });
                    }, 400);
                }
            });
        });
        // Track new pieces for animation - setState in effect is necessary for animation tracking
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNewPieces(prev => new Set([...prev, ...newPiecesSet]));
        prevBoardRef.current = board.map(row => [...row]);
    }, [board]);

    const handleCellClick = (x: number, y: number) => {
        if (board[x][y]) return; // Cell is occupied
        
        // Create ripple effect
        const key = `${x}-${y}`;
        setActiveRipple(key);
        
        setTimeout(() => {
            setActiveRipple(null);
        }, 600);
        
        onCellClick(x, y);
    };

    return (
        <div className="relative p-6 bg-gradient-to-br from-[#e0c090] to-[#d4a76a] rounded-3xl shadow-elevation-8 border-4 border-[#8b5a2b] transition-all duration-material-normal"
            style={{
                backgroundImage: 'linear-gradient(45deg, #d4a76a 25%, transparent 25%, transparent 75%, #d4a76a 75%, #d4a76a), linear-gradient(45deg, #d4a76a 25%, transparent 25%, transparent 75%, #d4a76a 75%, #d4a76a)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px'
            }}>
            <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-0 bg-[#deb887] border-2 border-[#5c4033] relative rounded-lg overflow-hidden shadow-elevation-4">
                {/* Grid Lines */}
                {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                    <React.Fragment key={i}>
                        <div 
                            className="absolute bg-[#5c4033] h-px w-full opacity-30" 
                            style={{ top: `${(i + 0.5) * (100 / BOARD_SIZE)}%` }} 
                        />
                        <div 
                            className="absolute bg-[#5c4033] w-px h-full opacity-30" 
                            style={{ left: `${(i + 0.5) * (100 / BOARD_SIZE)}%` }} 
                        />
                    </React.Fragment>
                ))}

                {/* Star Points (Tengen and Hoshi) */}
                {[3, 7, 11].map(x => [3, 7, 11].map(y => (
                    <div 
                        key={`star-${x}-${y}`} 
                        className="absolute w-2.5 h-2.5 bg-[#5c4033] rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-elevation-1" 
                        style={{ 
                            left: `${(x + 0.5) * (100 / BOARD_SIZE)}%`, 
                            top: `${(y + 0.5) * (100 / BOARD_SIZE)}%` 
                        }} 
                    />
                )))}

                {/* Cells and Pieces */}
                {board.map((row, x) => (
                    row.map((cell, y) => {
                        const isLastMove = lastMove?.x === x && lastMove?.y === y;
                        const isHint = hintMove?.x === x && hintMove?.y === y;
                        const pieceKey = `${x}-${y}`;
                        const isNewPiece = newPieces.has(pieceKey);

                        const isRippleActive = activeRipple === pieceKey;

                        return (
                            <div 
                                key={pieceKey}
                                className="w-8 h-8 flex items-center justify-center relative z-10 cursor-pointer group ripple"
                                onClick={() => handleCellClick(x, y)}
                            >
                                {/* Ripple effect */}
                                {isRippleActive && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        <div className="w-4 h-4 bg-primary-500 rounded-full animate-ripple opacity-60" />
                                    </div>
                                )}

                                {cell && (
                                    <div 
                                        className={`w-7 h-7 rounded-full transition-all duration-material-normal relative ${
                                            isNewPiece ? 'animate-piece-drop' : ''
                                        } ${
                                            cell === 'black'
                                                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-elevation-4'
                                                : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-elevation-4 border border-gray-300'
                                        } ${
                                            isLastMove 
                                                ? 'ring-4 ring-primary-400 ring-offset-2 scale-110 shadow-elevation-8' 
                                                : 'scale-100'
                                        }`}
                                    >
                                        {/* Piece highlight */}
                                        <div 
                                            className={`absolute top-1 left-1 w-2 h-2 rounded-full ${
                                                cell === 'black' 
                                                    ? 'bg-gray-400 opacity-60' 
                                                    : 'bg-white opacity-80'
                                            }`} 
                                        />
                                        
                                        {/* Last move indicator */}
                                        {isLastMove && (
                                            <div className="absolute inset-0 rounded-full animate-pulse-glow bg-primary-400 opacity-30" />
                                        )}
                                    </div>
                                )}
                                
                                {!cell && isHint && (
                                    <div className="w-6 h-6 rounded-full bg-success-400 opacity-70 animate-pulse-glow shadow-elevation-2 border-2 border-success-500" />
                                )}
                                
                                {!cell && !isHint && (
                                    <div className="w-full h-full opacity-0 group-hover:opacity-20 bg-primary-500 rounded-full transform scale-50 transition-all duration-material-fast" />
                                )}
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
};

export default Board;
