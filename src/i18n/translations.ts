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
    },
};
