export type Language = 'en' | 'zh' | 'ja';

export interface Translations {
    title: string;
    humanVsHuman: string;
    humanVsAI: string;
    currentTurn: string;
    black: string;
    white: string;
    wins: string;
    thinking: string;
    undo: string;
    restart: string;
    moveHistory: string;
    noMovesYet: string;
    // Game Modes
    modeCompetition: string;
    modeTeaching: string;
    modeReview: string;
    modeSpectator: string;
    selectMode: string;
    // Competition Mode
    timer: string;
    blackTime: string;
    whiteTime: string;
    timePerMove: string;
    // Teaching Mode
    hint: string;
    aiSuggestion: string;
    goodMove: string;
    considerThis: string;
    // Review Mode
    loadGame: string;
    previousMove: string;
    nextMove: string;
    autoPlay: string;
    pause: string;
    gameNotation: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        title: 'GOMOKU',
        humanVsHuman: 'Human vs Human',
        humanVsAI: 'Human vs AI',
        currentTurn: 'Current Turn',
        black: 'Black',
        white: 'White',
        wins: 'Wins!',
        thinking: 'Thinking...',
        undo: 'Undo',
        restart: 'Restart Game',
        moveHistory: 'Move History',
        noMovesYet: 'No moves yet',
        // Game Modes
        modeCompetition: 'Competition',
        modeTeaching: 'Teaching',
        modeReview: 'Review',
        modeSpectator: 'Spectator',
        selectMode: 'Select Mode',
        // Competition
        timer: 'Timer',
        blackTime: 'Black Time',
        whiteTime: 'White Time',
        timePerMove: 'Time per move',
        // Teaching
        hint: 'Hint',
        aiSuggestion: 'AI Suggestion',
        goodMove: 'Good move!',
        considerThis: 'Consider this position',
        // Review
        loadGame: 'Load Game',
        previousMove: 'Previous',
        nextMove: 'Next',
        autoPlay: 'Auto Play',
        pause: 'Pause',
        gameNotation: 'Game Notation',
    },
    zh: {
        title: '五子棋',
        humanVsHuman: '人人对战',
        humanVsAI: '人机对战',
        currentTurn: '当前回合',
        black: '黑方',
        white: '白方',
        wins: '获胜！',
        thinking: '思考中...',
        undo: '悔棋',
        restart: '重新开始',
        moveHistory: '走子历史',
        noMovesYet: '暂无走子',
        // Game Modes
        modeCompetition: '比赛模式',
        modeTeaching: '教学模式',
        modeReview: '打谱模式',
        modeSpectator: '旁观模式',
        selectMode: '选择模式',
        // Competition
        timer: '计时器',
        blackTime: '黑方时间',
        whiteTime: '白方时间',
        timePerMove: '单步用时',
        // Teaching
        hint: '提示',
        aiSuggestion: 'AI建议',
        goodMove: '好棋！',
        considerThis: '考虑此位置',
        // Review
        loadGame: '载入棋谱',
        previousMove: '上一手',
        nextMove: '下一手',
        autoPlay: '自动播放',
        pause: '暂停',
        gameNotation: '棋谱记录',
    },
    ja: {
        title: '五目並べ',
        humanVsHuman: '対人戦',
        humanVsAI: '対AI戦',
        currentTurn: '現在のターン',
        black: '黒',
        white: '白',
        wins: '勝利！',
        thinking: '思考中...',
        undo: '待った',
        restart: 'ゲームを再開',
        moveHistory: '手の履歴',
        noMovesYet: 'まだ手がありません',
        // Game Modes
        modeCompetition: '対局モード',
        modeTeaching: '教学モード',
        modeReview: '棋譜モード',
        modeSpectator: '観戦モード',
        selectMode: 'モード選択',
        // Competition
        timer: 'タイマー',
        blackTime: '黒の時間',
        whiteTime: '白の時間',
        timePerMove: '一手の時間',
        // Teaching
        hint: 'ヒント',
        aiSuggestion: 'AI提案',
        goodMove: '良い手！',
        considerThis: 'この位置を考慮',
        // Review
        loadGame: '棋譜読込',
        previousMove: '前の手',
        nextMove: '次の手',
        autoPlay: '自動再生',
        pause: '一時停止',
        gameNotation: '棋譜',
    },
};
