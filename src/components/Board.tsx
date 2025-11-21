import React from 'react';
import type { BoardState } from '../game/logic';
import { BOARD_SIZE } from '../game/logic';

interface BoardProps {
    board: BoardState;
    onCellClick: (x: number, y: number) => void;
    lastMove: { x: number, y: number } | null;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, lastMove }) => {
    return (
        <div className="relative p-4 bg-[#e0c090] rounded-lg shadow-2xl border-8 border-[#8b5a2b]"
            style={{
                backgroundImage: 'linear-gradient(45deg, #d4a76a 25%, transparent 25%, transparent 75%, #d4a76a 75%, #d4a76a), linear-gradient(45deg, #d4a76a 25%, transparent 25%, transparent 75%, #d4a76a 75%, #d4a76a)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px'
            }}>
            <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-0 bg-[#deb887] border-2 border-[#5c4033] relative">
                {/* Grid Lines */}
                {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                    <React.Fragment key={i}>
                        <div className="absolute bg-[#5c4033] h-px w-full" style={{ top: `${(i + 0.5) * (100 / BOARD_SIZE)}%` }} />
                        <div className="absolute bg-[#5c4033] w-px h-full" style={{ left: `${(i + 0.5) * (100 / BOARD_SIZE)}%` }} />
                    </React.Fragment>
                ))}

                {/* Star Points (Tengen and Hoshi) */}
                {[3, 7, 11].map(x => [3, 7, 11].map(y => (
                    <div key={`${x}-${y}`} className="absolute w-2 h-2 bg-[#5c4033] rounded-full transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${(x + 0.5) * (100 / BOARD_SIZE)}%`, top: `${(y + 0.5) * (100 / BOARD_SIZE)}%` }} />
                )))}

                {/* Cells and Pieces */}
                {board.map((row, x) => (
                    row.map((cell, y) => (
                        <div key={`${x}-${y}`}
                            className="w-8 h-8 flex items-center justify-center relative z-10 cursor-pointer"
                            onClick={() => onCellClick(x, y)}>
                            {cell && (
                                <div className={`w-7 h-7 rounded-full shadow-md transition-all duration-200 transform scale-100
                                ${cell === 'black'
                                        ? 'bg-gradient-to-br from-gray-800 to-black'
                                        : 'bg-gradient-to-br from-white to-gray-200'}
                                ${lastMove?.x === x && lastMove?.y === y ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                                    <div className={`w-2 h-2 rounded-full absolute top-1.5 left-1.5 opacity-50
                                  ${cell === 'black' ? 'bg-gray-600' : 'bg-white'}`} />
                                </div>
                            )}
                            {!cell && (
                                <div className="w-full h-full opacity-0 hover:opacity-30 bg-black rounded-full transform scale-50 transition-opacity duration-200" />
                            )}
                        </div>
                    ))
                ))}
            </div>
        </div>
    );
};

export default Board;
