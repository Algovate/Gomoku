import React, { useState, useEffect, useRef } from 'react';
import type { BoardState } from '../game/logic';
import { BOARD_SIZE } from '../game/logic';

interface BoardProps {
    board: BoardState;
    onCellClick: (x: number, y: number) => void;
    lastMove: { x: number, y: number } | null;
    hintMove?: { x: number, y: number } | null;
    hoverMove?: { x: number, y: number } | null; // New: for move history hover preview
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, lastMove, hintMove, hoverMove }) => {
    const [activeRipple, setActiveRipple] = useState<string | null>(null);
    const [newPieces, setNewPieces] = useState<Set<string>>(new Set());
    const [hoverCell, setHoverCell] = useState<{ x: number, y: number } | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black');
    const prevBoardRef = useRef<BoardState>(board);

    // Track new pieces for drop animation
    useEffect(() => {
        const newPiecesSet = new Set<string>();
        let totalPieces = 0;
        board.forEach((row, x) => {
            row.forEach((cell, y) => {
                const key = `${x}-${y}`;
                if (cell) totalPieces++;
                if (cell && !prevBoardRef.current[x][y]) {
                    newPiecesSet.add(key);
                    // Remove from new pieces after animation completes
                    setTimeout(() => {
                        setNewPieces(prev => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                        });
                    }, 500);
                }
            });
        });
        // Determine current player based on total pieces
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPlayer(totalPieces % 2 === 0 ? 'black' : 'white');
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

    const handleMouseEnter = (x: number, y: number) => {
        if (!board[x][y]) {
            setHoverCell({ x, y });
        }
    };

    const handleMouseLeave = () => {
        setHoverCell(null);
    };

    return (
        <div className="relative p-8 bg-gradient-to-br from-[#d8b48e] via-[#d4a574] to-[#c8a270] rounded-3xl shadow-elevation-8 border-[6px] border-[#8b6f47] transition-all duration-material-normal"
            style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.2), inset 0 -2px 8px rgba(0, 0, 0, 0.2)',
                backgroundImage: `
                    linear-gradient(90deg, rgba(139, 111, 71, 0.03) 1px, transparent 1px),
                    linear-gradient(rgba(139, 111, 71, 0.03) 1px, transparent 1px),
                    linear-gradient(180deg, rgba(216, 180, 142, 0.5) 0%, rgba(200, 162, 112, 0.5) 100%)
                `,
                backgroundSize: '40px 40px, 40px 40px, 100% 100%',
            }}>
            <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-0 bg-gradient-to-br from-[#deb887] to-[#d4a574] border-[3px] border-[#5c4033] relative rounded-xl overflow-hidden shadow-elevation-4"
                style={{
                    boxShadow: 'inset 0 2px 12px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.2)'
                }}>
                {/* Grid Lines */}
                {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                    <React.Fragment key={i}>
                        <div
                            className="absolute bg-[#3e2723] h-[1.5px] w-full opacity-40"
                            style={{
                                top: `${(i + 0.5) * (100 / BOARD_SIZE)}%`,
                                boxShadow: '0 0.5px 1px rgba(0, 0, 0, 0.2)'
                            }}
                        />
                        <div
                            className="absolute bg-[#3e2723] w-[1.5px] h-full opacity-40"
                            style={{
                                left: `${(i + 0.5) * (100 / BOARD_SIZE)}%`,
                                boxShadow: '0.5px 0 1px rgba(0, 0, 0, 0.2)'
                            }}
                        />
                    </React.Fragment>
                ))}

                {/* Enhanced outer border lines */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#3e2723] opacity-50"
                    style={{ top: `${0.5 * (100 / BOARD_SIZE)}%` }} />
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3e2723] opacity-50"
                    style={{ bottom: `${0.5 * (100 / BOARD_SIZE)}%` }} />
                <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-[#3e2723] opacity-50"
                    style={{ left: `${0.5 * (100 / BOARD_SIZE)}%` }} />
                <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-[#3e2723] opacity-50"
                    style={{ right: `${0.5 * (100 / BOARD_SIZE)}%` }} />

                {/* Star Points (Tengen and Hoshi) with gradient */}
                {[3, 7, 11].map(x => [3, 7, 11].map(y => (
                    <div
                        key={`star-${x}-${y}`}
                        className="absolute w-2.5 h-2.5 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${(x + 0.5) * (100 / BOARD_SIZE)}%`,
                            top: `${(y + 0.5) * (100 / BOARD_SIZE)}%`,
                            background: 'radial-gradient(circle, #3e2723 0%, #3e2723 60%, rgba(62, 39, 35, 0.5) 100%)',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3), inset 0 -0.5px 1px rgba(255, 255, 255, 0.1)'
                        }}
                    />
                )))}

                {/* Cells and Pieces */}
                {board.map((row, x) => (
                    row.map((cell, y) => {
                        const isLastMove = lastMove?.x === x && lastMove?.y === y;
                        const isHint = hintMove?.x === x && hintMove?.y === y;
                        const isHoverPreview = hoverMove?.x === x && hoverMove?.y === y; // History hover preview
                        const pieceKey = `${x}-${y}`;
                        const isNewPiece = newPieces.has(pieceKey);
                        const isHovered = hoverCell?.x === x && hoverCell?.y === y;
                        const isRippleActive = activeRipple === pieceKey;

                        return (
                            <div
                                key={pieceKey}
                                className="w-8 h-8 flex items-center justify-center relative z-10 cursor-pointer group"
                                onClick={() => handleCellClick(x, y)}
                                onMouseEnter={() => handleMouseEnter(x, y)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {/* Ripple effect */}
                                {isRippleActive && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        <div className="w-6 h-6 bg-primary-400 rounded-full animate-ripple opacity-50" />
                                    </div>
                                )}

                                {/* Actual pieces */}
                                {cell && (
                                    <div
                                        className={`w-[30px] h-[30px] rounded-full transition-all duration-material-normal relative ${isNewPiece ? 'animate-piece-drop' : ''
                                            } ${cell === 'black'
                                                ? 'bg-gradient-to-br from-gray-900 via-black to-gray-950'
                                                : 'bg-gradient-to-br from-white via-gray-50 to-gray-200'
                                            } ${isLastMove
                                                ? 'scale-110'
                                                : 'scale-100'
                                            }`}
                                        style={{
                                            boxShadow: cell === 'black'
                                                ? '0 4px 12px rgba(0, 0, 0, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.1), inset 2px 2px 4px rgba(0, 0, 0, 0.5)'
                                                : '0 4px 12px rgba(0, 0, 0, 0.3), inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -2px -2px 6px rgba(255, 255, 255, 0.9), 0 2px 4px rgba(0, 0, 0, 0.15)',
                                            border: cell === 'white' ? '1px solid rgba(200, 200, 200, 0.5)' : 'none'
                                        }}
                                    >
                                        {/* Enhanced highlight for 3D effect */}
                                        <div
                                            className={`absolute rounded-full ${cell === 'black'
                                                ? 'top-[4px] left-[6px] w-3 h-3 bg-gradient-radial from-white to-transparent opacity-30'
                                                : 'top-[3px] left-[5px] w-4 h-4 bg-gradient-radial from-white to-transparent opacity-90'
                                                }`}
                                            style={{
                                                background: cell === 'black'
                                                    ? 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)'
                                                    : 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 1) 0%, transparent 70%)'
                                            }}
                                        />

                                        {/* Last move indicator - colored dot */}
                                        {isLastMove && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div
                                                    className={`w-2 h-2 rounded-full animate-pulse-soft ${cell === 'black' ? 'bg-white' : 'bg-red-500'
                                                        }`}
                                                    style={{
                                                        boxShadow: cell === 'black'
                                                            ? '0 0 8px rgba(255, 255, 255, 0.8)'
                                                            : '0 0 8px rgba(239, 68, 68, 0.8)'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* AI Hint piece */}
                                {!cell && isHint && (
                                    <div className="w-7 h-7 rounded-full bg-success-400 opacity-70 animate-pulse-glow shadow-elevation-2 border-2 border-success-500" />
                                )}

                                {/* History hover preview - dashed circle */}
                                {!cell && !isHint && isHoverPreview && (
                                    <div
                                        className="w-7 h-7 rounded-full border-2 border-dashed border-primary-500 opacity-60 animate-fade-in-scale"
                                        style={{
                                            borderWidth: '2px',
                                            borderStyle: 'dashed',
                                        }}
                                    />
                                )}

                                {/* Preview piece on hover */}
                                {!cell && !isHint && !isHoverPreview && isHovered && (
                                    <div
                                        className={`w-[30px] h-[30px] rounded-full animate-fade-in-scale ${currentPlayer === 'black'
                                            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-950 opacity-30'
                                            : 'bg-gradient-to-br from-white via-gray-50 to-gray-200 opacity-40 border border-gray-300'
                                            }`}
                                        style={{
                                            boxShadow: currentPlayer === 'black'
                                                ? '0 2px 6px rgba(0, 0, 0, 0.3)'
                                                : '0 2px 6px rgba(0, 0, 0, 0.2)'
                                        }}
                                    />
                                )}

                                {/* Empty cell hover effect (fallback) */}
                                {!cell && !isHint && !isHovered && (
                                    <div className="w-full h-full opacity-0 group-hover:opacity-10 bg-primary-500 rounded-full transform scale-50 transition-all duration-material-fast" />
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
