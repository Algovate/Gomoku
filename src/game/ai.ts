import type { BoardState, Player } from './logic';
import { BOARD_SIZE, checkWin } from './logic';

const MAX_DEPTH = 3; // Depth of the minimax search

// Heuristic weights
const SCORES = {
    WIN: 100000,
    OPEN_FOUR: 10000,
    FOUR: 1000,
    OPEN_THREE: 1000,
    THREE: 100,
    OPEN_TWO: 100,
    TWO: 10,
};

// Evaluate the board for the given player
const evaluateBoard = (board: BoardState, player: Player): number => {
    let score = 0;

    // Simple heuristic: count consecutive pieces
    // This is a simplified evaluation function. A robust one would need pattern matching.
    // For now, we'll just check for wins and basic patterns.

    // Check all lines (horizontal, vertical, diagonal)
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] === null) continue;

            const isCurrent = board[x][y] === player;
            const multiplier = isCurrent ? 1 : -1;

            for (const [dx, dy] of directions) {
                // Only check if it's the start of a sequence to avoid double counting
                if (x - dx >= 0 && x - dx < BOARD_SIZE && y - dy >= 0 && y - dy < BOARD_SIZE && board[x - dx][y - dy] === board[x][y]) {
                    continue;
                }

                let count = 0;
                let openEnds = 0;

                // Check forward
                let nx = x;
                let ny = y;
                while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === board[x][y]) {
                    count++;
                    nx += dx;
                    ny += dy;
                }

                // Check ends
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === null) {
                    openEnds++;
                }
                if (x - dx >= 0 && x - dx < BOARD_SIZE && y - dy >= 0 && y - dy < BOARD_SIZE && board[x - dx][y - dy] === null) {
                    openEnds++;
                }

                if (count >= 5) score += SCORES.WIN * multiplier;
                else if (count === 4) {
                    if (openEnds > 0) score += (openEnds === 2 ? SCORES.OPEN_FOUR : SCORES.FOUR) * multiplier;
                }
                else if (count === 3) {
                    if (openEnds > 0) score += (openEnds === 2 ? SCORES.OPEN_THREE : SCORES.THREE) * multiplier;
                }
                else if (count === 2) {
                    if (openEnds > 0) score += (openEnds === 2 ? SCORES.OPEN_TWO : SCORES.TWO) * multiplier;
                }
            }
        }
    }

    return score;
};

// Minimax with Alpha-Beta Pruning
const minimax = (
    board: BoardState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    player: Player
): number => {
    const opponent = player === 'black' ? 'white' : 'black';

    // Check terminal states
    // Note: This checkWin is expensive to run every time. 
    // Ideally we pass the last move to checkWin, but here we scan.
    // Optimization: Only check if depth is 0 or we suspect a win? 
    // For simplicity, we rely on evaluateBoard giving high score for win.

    if (depth === 0) {
        return evaluateBoard(board, player);
    }

    const possibleMoves: { x: number, y: number }[] = [];
    // Optimization: Only consider moves near existing pieces
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] !== null) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === null) {
                            // Check if already added
                            if (!possibleMoves.some(m => m.x === nx && m.y === ny)) {
                                possibleMoves.push({ x: nx, y: ny });
                            }
                        }
                    }
                }
            }
        }
    }

    // If board is empty (first move), pick center
    if (possibleMoves.length === 0 && board[7][7] === null) {
        possibleMoves.push({ x: 7, y: 7 });
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            board[move.x][move.y] = player;
            // Check instant win
            if (checkWin(board, move.x, move.y, player)) {
                board[move.x][move.y] = null;
                return SCORES.WIN;
            }

            const evalScore = minimax(board, depth - 1, alpha, beta, false, player);
            board[move.x][move.y] = null;
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            board[move.x][move.y] = opponent;
            // Check instant win for opponent
            if (checkWin(board, move.x, move.y, opponent)) {
                board[move.x][move.y] = null;
                return -SCORES.WIN;
            }

            const evalScore = minimax(board, depth - 1, alpha, beta, true, player);
            board[move.x][move.y] = null;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getBestMove = (board: BoardState, player: Player): { x: number, y: number } | null => {
    let bestScore = -Infinity;
    let bestMove: { x: number, y: number } | null = null;
    const alpha = -Infinity;
    const beta = Infinity;

    // Generate possible moves (same logic as in minimax)
    const possibleMoves: { x: number, y: number }[] = [];
    let hasPieces = false;
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (board[x][y] !== null) {
                hasPieces = true;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === null) {
                            if (!possibleMoves.some(m => m.x === nx && m.y === ny)) {
                                possibleMoves.push({ x: nx, y: ny });
                            }
                        }
                    }
                }
            }
        }
    }

    if (!hasPieces) return { x: 7, y: 7 };

    for (const move of possibleMoves) {
        board[move.x][move.y] = player;

        // Check instant win
        if (checkWin(board, move.x, move.y, player)) {
            board[move.x][move.y] = null;
            return move;
        }

        const score = minimax(board, MAX_DEPTH - 1, alpha, beta, false, player);
        board[move.x][move.y] = null;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
};
