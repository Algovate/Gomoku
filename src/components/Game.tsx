import React, { useState, useCallback, useEffect } from 'react';
import Board from './Board';
import type { BoardState, Player } from '../game/logic';
import { createEmptyBoard, checkWin } from '../game/logic';
import { getBestMove } from '../game/ai';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';

type GameMode = 'PvP' | 'PvE';
type PlayMode = 'competition' | 'teaching' | 'review' | 'spectator';

interface Move {
    x: number;
    y: number;
    player: Player;
}

const Game: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const [playMode, setPlayMode] = useState<PlayMode | null>(null);
    const [board, setBoard] = useState<BoardState>(createEmptyBoard());
    const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
    const [winner, setWinner] = useState<Player>(null);
    const [gameMode, setGameMode] = useState<GameMode>('PvP');
    const [lastMove, setLastMove] = useState<{ x: number, y: number } | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [moveHistory, setMoveHistory] = useState<Move[]>([]);

    // Competition mode state
    const [blackTime, setBlackTime] = useState(600); // 10 minutes in seconds
    const [whiteTime, setWhiteTime] = useState(600);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Review mode state
    const [reviewIndex, setReviewIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);

    // Teaching mode state
    const [showHint, setShowHint] = useState(false);
    const [aiHint, setAiHint] = useState<{ x: number, y: number } | null>(null);

    // Timer effect for competition mode
    useEffect(() => {
        if (playMode === 'competition' && isTimerRunning && !winner) {
            const interval = setInterval(() => {
                if (currentPlayer === 'black') {
                    setBlackTime(prev => {
                        if (prev <= 0) {
                            setWinner('white');
                            setIsTimerRunning(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setWhiteTime(prev => {
                        if (prev <= 0) {
                            setWinner('black');
                            setIsTimerRunning(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [playMode, isTimerRunning, currentPlayer, winner]);

    // Auto-play effect for review mode
    useEffect(() => {
        if (playMode === 'review' && isAutoPlaying && reviewIndex < moveHistory.length) {
            const timeout = setTimeout(() => {
                setReviewIndex(prev => prev + 1);
            }, 1000);
            return () => clearTimeout(timeout);
        } else if (reviewIndex >= moveHistory.length) {
            setIsAutoPlaying(false);
        }
    }, [playMode, isAutoPlaying, reviewIndex, moveHistory.length]);

    // Update board for review mode
    useEffect(() => {
        if (playMode === 'review') {
            const newBoard = createEmptyBoard();
            for (let i = 0; i < reviewIndex; i++) {
                const move = moveHistory[i];
                newBoard[move.x][move.y] = move.player;
            }
            setBoard(newBoard);
            if (reviewIndex > 0) {
                setLastMove(moveHistory[reviewIndex - 1]);
            } else {
                setLastMove(null);
            }
        }
    }, [playMode, reviewIndex, moveHistory]);

    const handleCellClick = useCallback((x: number, y: number) => {
        if (playMode === 'review' || playMode === 'spectator') return; // No moves in review or spectator mode
        if (board[x][y] || winner || (gameMode === 'PvE' && currentPlayer === 'white' && isAiThinking)) return;

        const newBoard = board.map(row => [...row]);
        newBoard[x][y] = currentPlayer;
        setBoard(newBoard);
        setLastMove({ x, y });
        setMoveHistory(prev => [...prev, { x, y, player: currentPlayer }]);

        // Start timer on first move in competition mode
        if (playMode === 'competition' && !isTimerRunning) {
            setIsTimerRunning(true);
        }

        if (checkWin(newBoard, x, y, currentPlayer)) {
            setWinner(currentPlayer);
            setIsTimerRunning(false);
        } else {
            setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
        }

        // Clear hint in teaching mode
        if (playMode === 'teaching') {
            setShowHint(false);
            setAiHint(null);
        }
    }, [board, currentPlayer, winner, gameMode, isAiThinking, playMode, isTimerRunning]);

    // AI move effect for PvE mode
    useEffect(() => {
        if (gameMode === 'PvE' && currentPlayer === 'white' && !winner && playMode !== 'review') {
            setIsAiThinking(true);
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
                        setIsTimerRunning(false);
                    } else {
                        setCurrentPlayer('black');
                    }
                }
                setIsAiThinking(false);
            }, 500);
        }
    }, [currentPlayer, gameMode, winner, board, playMode]);

    // AI vs AI effect for spectator mode
    useEffect(() => {
        if (playMode === 'spectator' && !winner) {
            setIsAiThinking(true);
            setTimeout(() => {
                const bestMove = getBestMove(board, currentPlayer);
                if (bestMove) {
                    const newBoard = board.map(row => [...row]);
                    newBoard[bestMove.x][bestMove.y] = currentPlayer;
                    setBoard(newBoard);
                    setLastMove(bestMove);
                    setMoveHistory(prev => [...prev, { x: bestMove.x, y: bestMove.y, player: currentPlayer }]);

                    if (checkWin(newBoard, bestMove.x, bestMove.y, currentPlayer)) {
                        setWinner(currentPlayer);
                        setIsTimerRunning(false);
                    } else {
                        setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
                    }
                }
                setIsAiThinking(false);
            }, 800); // Slightly slower for spectators to watch
        }
    }, [currentPlayer, winner, board, playMode]);

    const resetGame = () => {
        setBoard(createEmptyBoard());
        setCurrentPlayer('black');
        setWinner(null);
        setLastMove(null);
        setIsAiThinking(false);
        setMoveHistory([]);
        setBlackTime(600);
        setWhiteTime(600);
        setIsTimerRunning(false);
        setReviewIndex(0);
        setIsAutoPlaying(false);
        setShowHint(false);
        setAiHint(null);
    };

    const undoMove = () => {
        if (playMode === 'competition') return; // No undo in competition mode
        if (playMode === 'review') return; // No undo in review mode
        if (moveHistory.length === 0 || winner) return;

        const movesToUndo = gameMode === 'PvE' && moveHistory.length >= 2 ? 2 : 1;
        const newHistory = moveHistory.slice(0, -movesToUndo);
        const newBoard = createEmptyBoard();

        newHistory.forEach(move => {
            newBoard[move.x][move.y] = move.player;
        });

        setMoveHistory(newHistory);
        setBoard(newBoard);
        setWinner(null);

        if (newHistory.length > 0) {
            const lastHistoryMove = newHistory[newHistory.length - 1];
            setLastMove({ x: lastHistoryMove.x, y: lastHistoryMove.y });
            setCurrentPlayer(lastHistoryMove.player === 'black' ? 'white' : 'black');
        } else {
            setLastMove(null);
            setCurrentPlayer('black');
        }
    };

    const getHint = () => {
        if (playMode !== 'teaching') return;
        const hint = getBestMove(board, currentPlayer);
        if (hint) {
            setAiHint(hint);
            setShowHint(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const languageOptions: { code: Language; label: string; flag: string }[] = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'zh', label: '简体中文', flag: '🇨🇳' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
    ];

    // Mode selection screen
    if (!playMode) {
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

                <h1 className="text-5xl font-bold mb-12 text-stone-800 tracking-wider">{t.title}</h1>
                <h2 className="text-2xl font-semibold mb-8 text-stone-600">{t.selectMode}</h2>

                <div className="grid grid-cols-1 gap-6 max-w-md w-full px-4">
                    <button
                        onClick={() => setPlayMode('competition')}
                        className="group relative bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-400"
                    >
                        <div className="text-4xl mb-3">🏆</div>
                        <div className="text-2xl font-bold text-stone-800 mb-2">{t.modeCompetition}</div>
                        <div className="text-sm text-stone-600">
                            {language === 'zh' ? '计时对局，禁止悔棋' : language === 'ja' ? 'タイマー付き、待ったなし' : 'Timed game, no undo'}
                        </div>
                    </button>

                    <button
                        onClick={() => setPlayMode('teaching')}
                        className="group relative bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-400"
                    >
                        <div className="text-4xl mb-3">📚</div>
                        <div className="text-2xl font-bold text-stone-800 mb-2">{t.modeTeaching}</div>
                        <div className="text-sm text-stone-600">
                            {language === 'zh' ? 'AI提示，学习棋艺' : language === 'ja' ? 'AIヒント、学習モード' : 'AI hints and learning'}
                        </div>
                    </button>

                    <button
                        onClick={() => setPlayMode('review')}
                        className="group relative bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-400"
                    >
                        <div className="text-4xl mb-3">📖</div>
                        <div className="text-2xl font-bold text-stone-800 mb-2">{t.modeReview}</div>
                        <div className="text-sm text-stone-600">
                            {language === 'zh' ? '复盘分析，逐步回放' : language === 'ja' ? '棋譜再生、分析' : 'Replay and analyze games'}
                        </div>
                    </button>

                    <button
                        onClick={() => setPlayMode('spectator')}
                        className="group relative bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-400"
                    >
                        <div className="text-4xl mb-3">👀</div>
                        <div className="text-2xl font-bold text-stone-800 mb-2">{t.modeSpectator}</div>
                        <div className="text-sm text-stone-600">
                            {language === 'zh' ? 'AI对战，观看对弈' : language === 'ja' ? 'AI対戦、観戦' : 'Watch AI vs AI battles'}
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 font-sans p-4">
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

            {/* Back button */}
            <button
                onClick={() => setPlayMode(null)}
                className="absolute top-4 left-4 px-4 py-2 bg-white hover:bg-stone-200 rounded-lg shadow-md transition-all"
            >
                ← {t.selectMode}
            </button>

            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-4xl font-bold text-stone-800 tracking-wider">{t.title}</h1>
                <span className="text-lg px-3 py-1 bg-stone-800 text-white rounded-full">
                    {playMode === 'competition' ? t.modeCompetition :
                        playMode === 'teaching' ? t.modeTeaching :
                            playMode === 'review' ? t.modeReview :
                                t.modeSpectator}
                </span>
            </div>

            {/* Competition mode timer */}
            {playMode === 'competition' && (
                <div className="mb-4 flex gap-6 items-center">
                    <div className={`px-4 py-2 rounded-lg ${currentPlayer === 'black' ? 'bg-stone-800 text-white' : 'bg-white text-stone-800'}`}>
                        <div className="text-sm">{t.black}</div>
                        <div className="text-2xl font-mono font-bold">{formatTime(blackTime)}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${currentPlayer === 'white' ? 'bg-stone-800 text-white' : 'bg-white text-stone-800'}`}>
                        <div className="text-sm">{t.white}</div>
                        <div className="text-2xl font-mono font-bold">{formatTime(whiteTime)}</div>
                    </div>
                </div>
            )}

            {playMode !== 'review' && playMode !== 'spectator' && (
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
            )}

            <div className="mb-4 text-xl font-semibold text-stone-700 h-8">
                {winner ? (
                    <span className="text-green-600 animate-bounce inline-block">
                        {winner === 'black' ? t.black : t.white} {t.wins}
                    </span>
                ) : playMode === 'review' ? (
                    <span>{t.moveHistory}: {reviewIndex} / {moveHistory.length}</span>
                ) : (
                    <span>
                        {t.currentTurn}: {currentPlayer === 'black' ? t.black : t.white}
                        {isAiThinking && <span className="ml-2 text-sm text-stone-500">({t.thinking})</span>}
                    </span>
                )}
            </div>

            {/* Teaching mode hint display */}
            {playMode === 'teaching' && showHint && aiHint && (
                <div className="mb-4 px-4 py-2 bg-green-100 border-2 border-green-400 rounded-lg">
                    <span className="text-green-800 font-semibold">{t.aiSuggestion}: ({aiHint.x}, {aiHint.y})</span>
                </div>
            )}

            <Board
                board={board}
                onCellClick={handleCellClick}
                lastMove={lastMove}
                hintMove={playMode === 'teaching' && showHint ? aiHint : null}
            />

            {/* Review mode controls */}
            {playMode === 'review' && (
                <div className="mt-8 flex gap-4 items-center">
                    <button
                        onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                        disabled={reviewIndex === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                    >
                        ← {t.previousMove}
                    </button>
                    <button
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        className="px-6 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 transition-colors"
                    >
                        {isAutoPlaying ? t.pause : t.autoPlay}
                    </button>
                    <button
                        onClick={() => setReviewIndex(Math.min(moveHistory.length, reviewIndex + 1))}
                        disabled={reviewIndex >= moveHistory.length}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                    >
                        {t.nextMove} →
                    </button>
                </div>
            )}

            {/* Teaching mode hint button */}
            {playMode === 'teaching' && !winner && (
                <div className="mt-8">
                    <button
                        onClick={getHint}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors font-medium"
                    >
                        💡 {t.hint}
                    </button>
                </div>
            )}

            {/* Standard controls */}
            {playMode !== 'review' && playMode !== 'spectator' && (
                <div className="mt-8 flex gap-4">
                    {playMode !== 'competition' && (
                        <button
                            onClick={undoMove}
                            disabled={moveHistory.length === 0 || winner !== null}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {t.undo}
                        </button>
                    )}
                    <button
                        onClick={resetGame}
                        className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors font-medium"
                    >
                        {t.restart}
                    </button>
                </div>
            )}

            {/* Move History */}
            <div className="mt-8 w-full max-w-md bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2 text-stone-800">{t.moveHistory} ({moveHistory.length})</h2>
                <div className="max-h-40 overflow-y-auto">
                    {moveHistory.length === 0 ? (
                        <p className="text-sm text-stone-500">{t.noMovesYet}</p>
                    ) : (
                        <div className="space-y-1">
                            {moveHistory.map((move, index) => (
                                <div
                                    key={index}
                                    className={`text-sm text-stone-600 flex items-center gap-2 ${playMode === 'review' && index === reviewIndex - 1 ? 'bg-yellow-100' : ''
                                        }`}
                                >
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
