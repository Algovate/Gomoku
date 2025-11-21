import React, { useState, useCallback, useEffect } from 'react';
import Board from './Board';
import type { BoardState, Player } from '../game/logic';
import { createEmptyBoard, checkWin } from '../game/logic';
import { getBestMove } from '../game/ai';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';

type GameMode = 'PvP' | 'PvE';

interface Move {
    x: number;
    y: number;
    player: Player;
}

const Game: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const [board, setBoard] = useState<BoardState>(createEmptyBoard());
    const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
    const [winner, setWinner] = useState<Player>(null);
    const [gameMode, setGameMode] = useState<GameMode>('PvP');
    const [lastMove, setLastMove] = useState<{ x: number, y: number } | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [moveHistory, setMoveHistory] = useState<Move[]>([]);

    const handleCellClick = useCallback((x: number, y: number) => {
        if (board[x][y] || winner || (gameMode === 'PvE' && currentPlayer === 'white' && isAiThinking)) return;

        const newBoard = board.map(row => [...row]);
        newBoard[x][y] = currentPlayer;
        setBoard(newBoard);
        setLastMove({ x, y });
        setMoveHistory(prev => [...prev, { x, y, player: currentPlayer }]);

        if (checkWin(newBoard, x, y, currentPlayer)) {
            setWinner(currentPlayer);
        } else {
            setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
        }
    }, [board, currentPlayer, winner, gameMode, isAiThinking]);

    useEffect(() => {
        if (gameMode === 'PvE' && currentPlayer === 'white' && !winner) {
            setIsAiThinking(true);
            // Small delay to let UI update and feel more natural
            setTimeout(() => {
                const bestMove = getBestMove(board, 'white');
                if (bestMove) {
                    const newBoard = board.map(row => [...row]);
                    newBoard[bestMove.x][bestMove.y] = 'white';
                    setBoard(newBoard);
                    setLastMove(bestMove);
                    setMoveHistory(prev => [...prev, { x: bestMove.x, y: bestMove.y, player: 'white' }]);

                    if (checkWin(newBoard, bestMove.x, bestMove.y, 'white')) {
                        setWinner('white');
                    } else {
                        setCurrentPlayer('black');
                    }
                }
                setIsAiThinking(false);
            }, 500);
        }
    }, [currentPlayer, gameMode, winner, board]);

    const resetGame = () => {
        setBoard(createEmptyBoard());
        setCurrentPlayer('black');
        setWinner(null);
        setLastMove(null);
        setIsAiThinking(false);
        setMoveHistory([]);
    };

    const undoMove = () => {
        if (moveHistory.length === 0 || winner) return;

        // In PvE mode, undo both player and AI moves
        const movesToUndo = gameMode === 'PvE' && moveHistory.length >= 2 ? 2 : 1;

        const newHistory = moveHistory.slice(0, -movesToUndo);
        const newBoard = createEmptyBoard();

        // Replay all moves except the undone ones
        newHistory.forEach(move => {
            newBoard[move.x][move.y] = move.player;
        });

        setMoveHistory(newHistory);
        setBoard(newBoard);
        setWinner(null);

        // Set last move to the most recent move after undo
        if (newHistory.length > 0) {
            const lastHistoryMove = newHistory[newHistory.length - 1];
            setLastMove({ x: lastHistoryMove.x, y: lastHistoryMove.y });
            setCurrentPlayer(lastHistoryMove.player === 'black' ? 'white' : 'black');
        } else {
            setLastMove(null);
            setCurrentPlayer('black');
        }
    };

    const languageOptions: { code: Language; label: string; flag: string }[] = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'zh', label: '简体中文', flag: '🇨🇳' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 font-sans">
            {/* Language Switcher */}
            <div className="absolute top-4 right-4 flex gap-2">
                {languageOptions.map(({ code, flag }) => (
                    <button
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`px-3 py-2 text-2xl rounded-lg transition-all ${language === code
                                ? 'bg-stone-800 shadow-lg scale-110'
                                : 'bg-white hover:bg-stone-200'
                            }`}
                        title={languageOptions.find(l => l.code === code)?.label}
                    >
                        {flag}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4 mb-8">
                <img
                    src="/gomoku-logo.svg"
                    alt="Gomoku Logo"
                    className="w-20 h-20 drop-shadow-sm"
                />
                <h1 className="text-4xl font-bold text-stone-800 tracking-wider">{t.title}</h1>
            </div>

            <div className="mb-6 flex gap-4">
                <button
                    onClick={() => { setGameMode('PvP'); resetGame(); }}
                    className={`px-4 py-2 rounded-full transition-all ${gameMode === 'PvP' ? 'bg-stone-800 text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-200'}`}
                >
                    {t.humanVsHuman}
                </button>
                <button
                    onClick={() => { setGameMode('PvE'); resetGame(); }}
                    className={`px-4 py-2 rounded-full transition-all ${gameMode === 'PvE' ? 'bg-stone-800 text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-200'}`}
                >
                    {t.humanVsAI}
                </button>
            </div>

            <div className="mb-4 text-xl font-semibold text-stone-700 h-8">
                {winner ? (
                    <span className="text-green-600 animate-bounce inline-block">
                        {winner === 'black' ? t.black : t.white} {t.wins}
                    </span>
                ) : (
                    <span>
                        {t.currentTurn}: {currentPlayer === 'black' ? t.black : t.white}
                        {isAiThinking && <span className="ml-2 text-sm text-stone-500">({t.thinking})</span>}
                    </span>
                )}
            </div>

            <Board board={board} onCellClick={handleCellClick} lastMove={lastMove} />

            <div className="mt-8 flex gap-4">
                <button
                    onClick={undoMove}
                    disabled={moveHistory.length === 0 || winner !== null}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {t.undo}
                </button>
                <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors font-medium"
                >
                    {t.restart}
                </button>
            </div>

            {/* Move History */}
            <div className="mt-8 w-full max-w-md bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2 text-stone-800">{t.moveHistory} ({moveHistory.length})</h2>
                <div className="max-h-40 overflow-y-auto">
                    {moveHistory.length === 0 ? (
                        <p className="text-sm text-stone-500">{t.noMovesYet}</p>
                    ) : (
                        <div className="space-y-1">
                            {moveHistory.map((move, index) => (
                                <div key={index} className="text-sm text-stone-600 flex items-center gap-2">
                                    <span className="font-mono">{index + 1}.</span>
                                    <span className={`w-4 h-4 rounded-full ${move.player === 'black' ? 'bg-black' : 'bg-white border border-stone-300'}`}></span>
                                    <span>({move.x}, {move.y})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Game;
