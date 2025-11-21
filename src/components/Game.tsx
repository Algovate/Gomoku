import React, { useState, useCallback, useEffect, useRef } from 'react';
import Board from './Board';
import Confetti from './Confetti';
import type { BoardState, Player } from '../game/logic';
import { createEmptyBoard, checkWin } from '../game/logic';
import { getBestMove, getBestMoveWithExplanation, type MoveReason } from '../game/ai';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import { soundManager } from '../utils/sounds';

type GameMode = 'PvP' | 'PvE';
type PlayMode = 'competition' | 'teaching' | 'review' | 'spectator';

interface Move {
    x: number;
    y: number;
    player: Player;
}

const Game: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const [playMode, setPlayMode] = useState<PlayMode | null>('competition');
    const [board, setBoard] = useState<BoardState>(createEmptyBoard());
    const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
    const [winner, setWinner] = useState<Player>(null);
    const [gameMode, setGameMode] = useState<GameMode>('PvP');
    const [lastMove, setLastMove] = useState<{ x: number, y: number } | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [moveHistory, setMoveHistory] = useState<Move[]>([]);
    const moveHistoryRef = useRef<HTMLDivElement>(null);

    // Competition mode state
    const [blackTime, setBlackTime] = useState(600); // 10 minutes in seconds
    const [whiteTime, setWhiteTime] = useState(600);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Review mode state
    const [reviewIndex, setReviewIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);

    // Teaching mode state
    const [showHint, setShowHint] = useState(false);
    const [aiHint, setAiHint] = useState<{ x: number, y: number, reason: MoveReason } | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    // Speed and duration control states (reasonable defaults)
    const [spectatorSpeed, setSpectatorSpeed] = useState(800); // Medium: 800ms
    const [reviewSpeed, setReviewSpeed] = useState(1000); // Medium: 1000ms
    const [matchDuration, setMatchDuration] = useState(600); // Standard: 10 minutes

    // Move history UI control states
    const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(() => {
        // Auto-collapse for competition and spectator modes
        return playMode === 'competition' || playMode === 'spectator';
    });
    const [hoverMove, setHoverMove] = useState<{ x: number, y: number } | null>(null);
    const [autoScrollLocked, setAutoScrollLocked] = useState(false);

    // Sync sound manager with state
    useEffect(() => {
        soundManager.setEnabled(soundEnabled);
    }, [soundEnabled]);

    // Timer effect for competition mode
    useEffect(() => {
        if (playMode === 'competition' && isTimerRunning && !winner) {
            const interval = setInterval(() => {
                if (currentPlayer === 'black') {
                    setBlackTime(prev => {
                        const newTime = Math.max(0, prev - 1);
                        if (newTime === 10) soundManager.playTimerWarning();
                        if (newTime === 0) {
                            setWinner('white');
                            setIsTimerRunning(false);
                        }
                        return newTime;
                    });
                } else {
                    setWhiteTime(prev => {
                        const newTime = Math.max(0, prev - 1);
                        if (newTime === 10) soundManager.playTimerWarning();
                        if (newTime === 0) {
                            setWinner('black');
                            setIsTimerRunning(false);
                        }
                        return newTime;
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
            }, reviewSpeed); // Use configurable review speed
            return () => clearTimeout(timeout);
        } else if (reviewIndex >= moveHistory.length) {
            // Stop auto-playing when review completes
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsAutoPlaying(false);
        }
    }, [playMode, isAutoPlaying, reviewIndex, moveHistory.length, reviewSpeed]);

    // Update board for review mode
    useEffect(() => {
        if (playMode === 'review') {
            const newBoard = createEmptyBoard();
            for (let i = 0; i < reviewIndex; i++) {
                const move = moveHistory[i];
                newBoard[move.x][move.y] = move.player;
            }
            // Sync board state with review index - necessary for review mode
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBoard(newBoard);
            if (reviewIndex > 0) {
                setLastMove(moveHistory[reviewIndex - 1]);
            } else {
                setLastMove(null);
            }
        }
    }, [playMode, reviewIndex, moveHistory]);

    // Auto-scroll to latest move in history (with lock support)
    useEffect(() => {
        if (moveHistoryRef.current && playMode !== 'review' && !autoScrollLocked) {
            moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
        }
    }, [moveHistory.length, playMode, autoScrollLocked]);

    const handleCellClick = useCallback((x: number, y: number) => {
        if (playMode === 'review' || playMode === 'spectator') return; // No moves in review or spectator mode
        if (board[x][y] || winner || (gameMode === 'PvE' && currentPlayer === 'white' && isAiThinking)) return;

        const newBoard = board.map(row => [...row]);
        newBoard[x][y] = currentPlayer;
        setBoard(newBoard);
        setLastMove({ x, y });
        setMoveHistory(prev => [...prev, { x, y, player: currentPlayer }]);

        // Play piece sound
        soundManager.playPieceSound(currentPlayer === 'black');

        // Start timer on first move in competition mode
        if (playMode === 'competition' && !isTimerRunning) {
            setIsTimerRunning(true);
        }

        if (checkWin(newBoard, x, y, currentPlayer)) {
            setWinner(currentPlayer);
            setIsTimerRunning(false);
            soundManager.playWinSound();
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
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
            // Trigger AI move - setState in effect is necessary for AI turn handling
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsAiThinking(true);
            const timeoutId = setTimeout(() => {
                const bestMove = getBestMove(board, 'white');
                if (bestMove) {
                    const newBoard = board.map(row => [...row]);
                    newBoard[bestMove.x][bestMove.y] = 'white';
                    setBoard(newBoard);
                    setLastMove(bestMove);
                    setMoveHistory(prev => [...prev, { x: bestMove.x, y: bestMove.y, player: 'white' }]);
                    soundManager.playPieceSound(false);

                    if (checkWin(newBoard, bestMove.x, bestMove.y, 'white')) {
                        setWinner('white');
                        setIsTimerRunning(false);
                        soundManager.playWinSound();
                        setShowConfetti(true);
                        setTimeout(() => setShowConfetti(false), 5000);
                    } else {
                        setCurrentPlayer('black');
                    }
                }
                setIsAiThinking(false);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [currentPlayer, gameMode, winner, board, playMode]);

    // AI vs AI effect for spectator mode
    useEffect(() => {
        if (playMode === 'spectator' && !winner) {
            // Trigger AI move - setState in effect is necessary for AI vs AI handling
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsAiThinking(true);
            const timeoutId = setTimeout(() => {
                const bestMove = getBestMove(board, currentPlayer);
                if (bestMove) {
                    const newBoard = board.map(row => [...row]);
                    newBoard[bestMove.x][bestMove.y] = currentPlayer;
                    setBoard(newBoard);
                    setLastMove(bestMove);
                    setMoveHistory(prev => [...prev, { x: bestMove.x, y: bestMove.y, player: currentPlayer }]);
                    soundManager.playPieceSound(currentPlayer === 'black');

                    if (checkWin(newBoard, bestMove.x, bestMove.y, currentPlayer)) {
                        setWinner(currentPlayer);
                        setIsTimerRunning(false);
                        soundManager.playWinSound();
                        setShowConfetti(true);
                        setTimeout(() => setShowConfetti(false), 5000);
                    } else {
                        setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
                    }
                }
                setIsAiThinking(false);
            }, spectatorSpeed); // Use configurable spectator speed
            return () => clearTimeout(timeoutId);
        }
    }, [currentPlayer, winner, board, playMode, spectatorSpeed]);

    const resetGame = () => {
        setBoard(createEmptyBoard());
        setCurrentPlayer('black');
        setWinner(null);
        setLastMove(null);
        setIsAiThinking(false);
        setMoveHistory([]);
        setBlackTime(matchDuration); // Use configurable match duration
        setWhiteTime(matchDuration); // Use configurable match duration
        setIsTimerRunning(false);
        setReviewIndex(0);
        setIsAutoPlaying(false);
        setShowHint(false);
        setAiHint(null);
        setAutoScrollLocked(false); // Reset scroll lock on new game
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
        const hintWithReason = getBestMoveWithExplanation(board, currentPlayer);
        if (hintWithReason) {
            setAiHint(hintWithReason);
            setShowHint(true);
            soundManager.playHintSound();
            setTimeout(() => {
                setShowHint(false);
                setAiHint(null);
            }, 3000);
        }
    };

    const getHintReasonText = (reason: MoveReason): string => {
        const reasonMap: Record<MoveReason, keyof typeof t> = {
            win: 'hintReasonWin',
            blockWin: 'hintReasonBlockWin',
            createOpenFour: 'hintReasonCreateOpenFour',
            blockOpenFour: 'hintReasonBlockOpenFour',
            createFour: 'hintReasonCreateFour',
            blockFour: 'hintReasonBlockFour',
            createOpenThree: 'hintReasonCreateOpenThree',
            blockOpenThree: 'hintReasonBlockOpenThree',
            strategic: 'hintReasonStrategic',
        };
        return t[reasonMap[reason]];
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
        const modeCards = [
            {
                mode: 'competition' as PlayMode,
                icon: '🏆',
                title: t.modeCompetition,
                description: language === 'zh' ? '计时对局，禁止悔棋' : language === 'ja' ? 'タイマー付き、待ったなし' : 'Timed game, no undo',
                gradient: 'from-blue-500 to-blue-700',
                bgGradient: 'from-blue-50 to-blue-100',
                accent: 'blue',
            },
            {
                mode: 'teaching' as PlayMode,
                icon: '📚',
                title: t.modeTeaching,
                description: language === 'zh' ? 'AI提示，学习棋艺' : language === 'ja' ? 'AIヒント、学習モード' : 'AI hints and learning',
                gradient: 'from-green-500 to-green-700',
                bgGradient: 'from-green-50 to-green-100',
                accent: 'green',
            },
            {
                mode: 'review' as PlayMode,
                icon: '📖',
                title: t.modeReview,
                description: language === 'zh' ? '复盘分析，逐步回放' : language === 'ja' ? '棋譜再生、分析' : 'Replay and analyze games',
                gradient: 'from-purple-500 to-purple-700',
                bgGradient: 'from-purple-50 to-purple-100',
                accent: 'purple',
            },
            {
                mode: 'spectator' as PlayMode,
                icon: '👀',
                title: t.modeSpectator,
                description: language === 'zh' ? 'AI对战，观看对弈' : language === 'ja' ? 'AI対戦、観戦' : 'Watch AI vs AI battles',
                gradient: 'from-orange-500 to-orange-700',
                bgGradient: 'from-orange-50 to-orange-100',
                accent: 'orange',
            },
        ];

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background font-sans animate-fade-in">
                {/* Language Switcher */}
                <div className="absolute top-6 right-6 flex gap-2 z-10">
                    {languageOptions.map(({ code, flag, label }) => (
                        <button
                            key={code}
                            onClick={() => setLanguage(code)}
                            className={`ripple material-button-text px-4 py-2 text-2xl rounded-full transition-all duration-material-normal ${language === code
                                ? 'bg-primary-500 text-white shadow-elevation-2 scale-110'
                                : 'bg-surface text-gray-700 hover:bg-surface-100 shadow-elevation-1'
                                }`}
                            title={label}
                        >
                            {flag}
                        </button>
                    ))}
                </div>

                {/* Title Section */}
                <div className="text-center mb-12 animate-slide-in">
                    <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent tracking-tight">
                        {t.title}
                    </h1>
                    <h2 className="text-xl font-medium text-gray-600">{t.selectMode}</h2>
                </div>

                {/* Mode Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-6">
                    {modeCards.map((card, index) => (
                        <button
                            key={card.mode}
                            onClick={() => setPlayMode(card.mode)}
                            className={`ripple material-card group relative overflow-hidden bg-surface shadow-elevation-2 hover:shadow-elevation-4 p-8 rounded-2xl transition-all duration-material-normal animate-slide-in`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-material-normal`} />

                            {/* Content */}
                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`text-5xl mb-4 transform transition-transform duration-material-normal group-hover:scale-110 group-hover:rotate-3`}>
                                    {card.icon}
                                </div>

                                {/* Title */}
                                <div className={`text-2xl font-bold mb-2 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                                    {card.title}
                                </div>

                                {/* Description */}
                                <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                                    {card.description}
                                </div>
                            </div>

                            {/* Accent Border */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-material-normal origin-left`} />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const getModeLabel = () => {
        switch (playMode) {
            case 'competition': return t.modeCompetition;
            case 'teaching': return t.modeTeaching;
            case 'review': return t.modeReview;
            case 'spectator': return t.modeSpectator;
            default: return '';
        }
    };

    const getModeColorClasses = () => {
        switch (playMode) {
            case 'competition': return 'bg-blue-50 text-blue-700';
            case 'teaching': return 'bg-green-50 text-green-700';
            case 'review': return 'bg-purple-50 text-purple-700';
            case 'spectator': return 'bg-orange-50 text-orange-700';
            default: return 'bg-primary-50 text-primary-700';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background font-sans p-4 animate-fade-in">
            {/* Confetti */}
            <Confetti show={showConfetti} />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 bg-surface shadow-elevation-2 z-20 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Back button */}
                    <button
                        onClick={() => setPlayMode(null)}
                        className="ripple material-button-text px-4 py-2 rounded-full text-gray-700 hover:bg-surface-100 transition-all duration-material-normal flex items-center gap-2"
                    >
                        <span className="text-xl">←</span>
                        <span className="font-medium">{t.selectMode}</span>
                    </button>

                    {/* Title and Mode Chip */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            {t.title}
                        </h1>
                        <span className={`material-chip material-chip-elevated ${getModeColorClasses()} px-4 py-1.5 font-medium`}>
                            {getModeLabel()}
                        </span>
                    </div>

                    {/* Language Switcher and Sound Toggle */}
                    <div className="flex gap-2 items-center">
                        {/* Sound Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`ripple material-button-text px-3 py-2 text-xl rounded-full transition-all duration-material-normal ${soundEnabled
                                ? 'bg-primary-500 text-white shadow-elevation-2'
                                : 'bg-surface text-gray-400 hover:bg-surface-100 shadow-elevation-1'
                                }`}
                            title={soundEnabled ? 'Sound On' : 'Sound Off'}
                        >
                            {soundEnabled ? '🔊' : '🔇'}
                        </button>

                        {languageOptions.map(({ code, flag, label }) => (
                            <button
                                key={code}
                                onClick={() => setLanguage(code)}
                                className={`ripple material-button-text px-3 py-2 text-xl rounded-full transition-all duration-material-normal ${language === code
                                    ? 'bg-primary-500 text-white shadow-elevation-2 scale-110'
                                    : 'bg-surface text-gray-700 hover:bg-surface-100 shadow-elevation-1'
                                    }`}
                                title={label}
                            >
                                {flag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-6xl mt-24 flex flex-col lg:flex-row gap-6">
                {/* Left Column - Game Info and Controls */}
                <div className="flex flex-col gap-4 w-full lg:w-80">
                    {/* Competition mode timer */}
                    {playMode === 'competition' && (
                        <div className="material-card bg-surface shadow-elevation-2 p-4 rounded-2xl">
                            <div className="text-sm font-medium text-gray-600 mb-3">{t.timer}</div>
                            <div className="flex gap-3">
                                <div className={`flex-1 p-4 rounded-xl transition-all duration-material-normal ${currentPlayer === 'black'
                                    ? 'bg-gradient-to-br from-gray-800 to-black text-white shadow-elevation-4 scale-105'
                                    : 'bg-surface-100 text-gray-700 shadow-elevation-1'
                                    }`}>
                                    <div className="text-xs font-medium opacity-80 mb-1">{t.black}</div>
                                    <div className="text-2xl font-mono font-bold">{formatTime(blackTime)}</div>
                                </div>
                                <div className={`flex-1 p-4 rounded-xl transition-all duration-material-normal ${currentPlayer === 'white'
                                    ? 'bg-gradient-to-br from-gray-100 to-white text-gray-900 shadow-elevation-4 scale-105 border-2 border-gray-300'
                                    : 'bg-surface-100 text-gray-700 shadow-elevation-1'
                                    }`}>
                                    <div className="text-xs font-medium opacity-80 mb-1">{t.white}</div>
                                    <div className="text-2xl font-mono font-bold">{formatTime(whiteTime)}</div>
                                </div>
                            </div>

                            {/* Match Duration Selector */}
                            <div className="mt-3 pt-3 border-t border-surface-200">
                                <div className="text-xs font-medium text-gray-600 mb-2">{t.matchDuration}</div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {[
                                        { label: t.lightning, value: 180, emoji: '⚡' },
                                        { label: t.blitz, value: 300, emoji: '⏱️' },
                                        { label: t.standard, value: 600, emoji: '🎯' },
                                        { label: t.long, value: 900, emoji: '📚' },
                                        { label: t.tournament, value: 1800, emoji: '🏆' },
                                    ].map(({ label, value, emoji }) => (
                                        <button
                                            key={value}
                                            onClick={() => {
                                                setMatchDuration(value);
                                                setBlackTime(value);
                                                setWhiteTime(value);
                                            }}
                                            className={`px-2.5 py-1 text-xs rounded-full transition-all ${matchDuration === value
                                                ? 'bg-primary-500 text-white shadow-elevation-2'
                                                : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
                                                }`}
                                        >
                                            {emoji} {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Spectator Speed Control */}
                    {playMode === 'spectator' && (
                        <div className="material-card bg-surface shadow-elevation-2 p-4 rounded-2xl">
                            <div className="text-sm font-medium text-gray-600 mb-2">{t.speed}</div>
                            <div className="flex gap-2">
                                {[
                                    { label: t.slow, value: 1500, emoji: '🐌' },
                                    { label: t.medium, value: 800, emoji: '🚶' },
                                    { label: t.fast, value: 400, emoji: '🏃' },
                                ].map(({ label, value, emoji }) => (
                                    <button
                                        key={value}
                                        onClick={() => setSpectatorSpeed(value)}
                                        className={`flex-1 px-3 py-2 text-sm rounded-full transition-all ${spectatorSpeed === value
                                            ? 'bg-primary-500 text-white shadow-elevation-2'
                                            : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
                                            }`}
                                    >
                                        {emoji} {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Game Mode Selector */}
                    {playMode !== 'review' && playMode !== 'spectator' && (
                        <div className="material-card bg-surface shadow-elevation-2 p-4 rounded-2xl">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setGameMode('PvP'); resetGame(); }}
                                    className={`ripple flex-1 material-button px-4 py-2.5 rounded-full font-medium transition-all duration-material-normal ${gameMode === 'PvP'
                                        ? 'material-button-contained shadow-elevation-2'
                                        : 'material-button-outlined'
                                        }`}
                                >
                                    {t.humanVsHuman}
                                </button>
                                <button
                                    onClick={() => { setGameMode('PvE'); resetGame(); }}
                                    className={`ripple flex-1 material-button px-4 py-2.5 rounded-full font-medium transition-all duration-material-normal ${gameMode === 'PvE'
                                        ? 'material-button-contained shadow-elevation-2'
                                        : 'material-button-outlined'
                                        }`}
                                >
                                    {t.humanVsAI}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status Card */}
                    <div className="material-card bg-surface shadow-elevation-2 p-4 rounded-2xl">
                        {winner ? (
                            <div className="text-center py-2">
                                <div className="text-2xl mb-2 animate-bounce-celebration">🎉</div>
                                <div className="text-lg font-bold text-success-600">
                                    {winner === 'black' ? t.black : t.white} {t.wins}
                                </div>
                            </div>
                        ) : playMode === 'review' ? (
                            <div className="text-center">
                                <div className="text-sm text-gray-600 mb-1">{t.moveHistory}</div>
                                <div className="text-2xl font-bold text-primary-600">
                                    {reviewIndex} / {moveHistory.length}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="text-sm text-gray-600 mb-1">{t.currentTurn}</div>
                                <div className="flex items-center justify-center gap-2">
                                    <span className={`w-6 h-6 rounded-full ${currentPlayer === 'black'
                                        ? 'bg-gradient-to-br from-gray-800 to-black shadow-elevation-2'
                                        : 'bg-gradient-to-br from-gray-100 to-white border-2 border-gray-300 shadow-elevation-2'
                                        }`} />
                                    <span className="text-lg font-bold text-gray-800">
                                        {currentPlayer === 'black' ? t.black : t.white}
                                    </span>
                                    {isAiThinking && (
                                        <div className="ml-2 material-spinner w-4 h-4" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Teaching mode hint display */}
                    {playMode === 'teaching' && showHint && aiHint && (
                        <div className="material-card bg-success-50 border-2 border-success-400 shadow-elevation-2 p-4 rounded-2xl animate-slide-in">
                            <div className="text-sm font-medium text-success-700 mb-1">{t.aiSuggestion}</div>
                            <div className="text-lg font-bold text-success-800 mb-2">({aiHint.x}, {aiHint.y})</div>
                            <div className="text-sm text-success-600">{getHintReasonText(aiHint.reason)}</div>
                        </div>
                    )}

                    {/* Move History */}
                    <div className="material-card bg-surface shadow-elevation-2 p-4 rounded-2xl flex flex-col" style={{ maxHeight: '400px' }}>
                        {/* Header with collapse button */}
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-800">{t.moveHistory}</h2>
                            <button
                                onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                                className="text-gray-500 hover:text-gray-700 transition-colors duration-material-fast text-xl leading-none"
                                title={isHistoryCollapsed ? 'Expand' : 'Collapse'}
                            >
                                {isHistoryCollapsed ? '▶' : '▼'}
                            </button>
                        </div>

                        {/* Collapsible content */}
                        {!isHistoryCollapsed && (
                            <>
                                {/* Scroll lock button for spectator mode */}
                                {playMode === 'spectator' && moveHistory.length > 0 && (
                                    <button
                                        onClick={() => setAutoScrollLocked(!autoScrollLocked)}
                                        className={`mb-2 px-3 py-1.5 text-xs rounded-full transition-all duration-material-normal ${autoScrollLocked
                                            ? 'bg-warning-500 text-white shadow-elevation-1'
                                            : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
                                            }`}
                                    >
                                        {autoScrollLocked ? `🔒 ${t.lockScroll}` : `🔓 ${t.unlockScroll}`}
                                    </button>
                                )}

                                <div ref={moveHistoryRef} className="flex-1 overflow-y-auto pr-2" style={{ scrollBehavior: 'smooth', willChange: 'scroll-position' }}>
                                    {moveHistory.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">{t.noMovesYet}</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {moveHistory.map((move, index) => {
                                                const isCurrentMove = playMode === 'review' && index === reviewIndex - 1;
                                                const isClickable = playMode === 'review';

                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => isClickable && setReviewIndex(index + 1)}
                                                        onMouseEnter={() => setHoverMove({ x: move.x, y: move.y })}
                                                        onMouseLeave={() => setHoverMove(null)}
                                                        className={`text-sm flex items-center gap-2 p-2 rounded-lg transition-all duration-material-fast ${isCurrentMove
                                                            ? 'bg-primary-100 text-primary-700 shadow-elevation-1'
                                                            : 'text-gray-700 hover:bg-surface-100'
                                                            } ${isClickable ? 'cursor-pointer' : ''}`}
                                                    >
                                                        {/* Current step indicator */}
                                                        {isCurrentMove && (
                                                            <span className="text-primary-600">👉</span>
                                                        )}

                                                        <span className="font-mono text-xs text-gray-500 w-6">{index + 1}.</span>
                                                        <span className={`w-4 h-4 rounded-full shadow-elevation-1 ${move.player === 'black'
                                                            ? 'bg-gradient-to-br from-gray-800 to-black'
                                                            : 'bg-gradient-to-br from-gray-100 to-white border border-gray-300'
                                                            }`} />
                                                        <span className="font-mono">({move.x}, {move.y})</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Center Column - Board */}
                <div className="flex-1 flex flex-col items-center gap-6">
                    <Board
                        board={board}
                        onCellClick={handleCellClick}
                        lastMove={lastMove}
                        hintMove={playMode === 'teaching' && showHint && aiHint ? { x: aiHint.x, y: aiHint.y } : null}
                        hoverMove={hoverMove}
                    />

                    {/* Review mode controls */}
                    {playMode === 'review' && (
                        <>
                            <div className="flex gap-3 items-center material-card bg-surface shadow-elevation-2 p-4 rounded-2xl">
                                <button
                                    onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                                    disabled={reviewIndex === 0}
                                    className="ripple material-button material-button-outlined px-4 py-2 rounded-full font-medium disabled:opacity-38"
                                >
                                    ← {t.previousMove}
                                </button>
                                <button
                                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                                    className={`ripple material-button material-button-contained px-6 py-2 rounded-full font-medium ${isAutoPlaying ? 'bg-warning-500' : 'bg-primary-500'
                                        }`}
                                >
                                    {isAutoPlaying ? t.pause : t.autoPlay}
                                </button>
                                <button
                                    onClick={() => setReviewIndex(Math.min(moveHistory.length, reviewIndex + 1))}
                                    disabled={reviewIndex >= moveHistory.length}
                                    className="ripple material-button material-button-outlined px-4 py-2 rounded-full font-medium disabled:opacity-38"
                                >
                                    {t.nextMove} →
                                </button>
                            </div>

                            {/* Review Speed Control */}
                            <div className="material-card bg-surface shadow-elevation-2 p-4 rounded-2xl">
                                <div className="text-sm font-medium text-gray-600 mb-2">{t.playbackSpeed}</div>
                                <div className="flex gap-2">
                                    {[
                                        { label: t.slow, value: 2000, emoji: '🐌' },
                                        { label: t.medium, value: 1000, emoji: '🚶' },
                                        { label: t.fast, value: 500, emoji: '🏃' },
                                    ].map(({ label, value, emoji }) => (
                                        <button
                                            key={value}
                                            onClick={() => setReviewSpeed(value)}
                                            className={`flex-1 px-3 py-2 text-sm rounded-full transition-all ${reviewSpeed === value
                                                ? 'bg-primary-500 text-white shadow-elevation-2'
                                                : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
                                                }`}
                                        >
                                            {emoji} {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Teaching mode hint button */}
                    {playMode === 'teaching' && !winner && (
                        <button
                            onClick={getHint}
                            className="ripple material-button material-button-contained px-8 py-3 rounded-full font-medium shadow-elevation-2 bg-success-500 hover:bg-success-600"
                        >
                            💡 {t.hint}
                        </button>
                    )}

                    {/* Standard controls */}
                    {playMode !== 'review' && playMode !== 'spectator' && (
                        <div className="flex gap-3">
                            {playMode !== 'competition' && (
                                <button
                                    onClick={undoMove}
                                    disabled={moveHistory.length === 0 || winner !== null}
                                    className="ripple material-button material-button-outlined px-6 py-3 rounded-full font-medium disabled:opacity-38"
                                >
                                    {t.undo}
                                </button>
                            )}
                            <button
                                onClick={resetGame}
                                className="ripple material-button material-button-contained px-6 py-3 rounded-full font-medium shadow-elevation-2 bg-error-500 hover:bg-error-600"
                            >
                                {t.restart}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Game;
