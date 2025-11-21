import type { BoardState, Player } from './logic';
import { BOARD_SIZE, checkWin } from './logic';

const MAX_DEPTH = 3; // Depth of the minimax search

// Move explanation reason types
export type MoveReason = 
    | 'win'
    | 'blockWin'
    | 'createOpenFour'
    | 'blockOpenFour'
    | 'createFour'
    | 'blockFour'
    | 'createOpenThree'
    | 'blockOpenThree'
    | 'strategic';

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

// Check what patterns exist at a specific position for a given player
interface PatternInfo {
    openFour: number;  // 4 with 2 open ends
    four: number;      // 4 with 1 open end
    openThree: number; // 3 with 2 open ends
    three: number;     // 3 with 1 open end
}

const checkPatternsAtPosition = (
    board: BoardState,
    x: number,
    y: number,
    player: Player
): PatternInfo => {
    const patterns: PatternInfo = {
        openFour: 0,
        four: 0,
        openThree: 0,
        three: 0,
    };

    if (board[x][y] !== player) return patterns;

    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
        // Only check if it's the start of a sequence to avoid double counting
        if (x - dx >= 0 && x - dx < BOARD_SIZE && y - dy >= 0 && y - dy < BOARD_SIZE && board[x - dx][y - dy] === player) {
            continue;
        }

        let count = 0;
        let openEnds = 0;

        // Check forward
        let nx = x;
        let ny = y;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === player) {
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

        // Classify the pattern
        if (count === 4) {
            if (openEnds === 2) patterns.openFour++;
            else if (openEnds === 1) patterns.four++;
        } else if (count === 3) {
            if (openEnds === 2) patterns.openThree++;
            else if (openEnds === 1) patterns.three++;
        }
    }

    return patterns;
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

// Get explanation for why a specific move is recommended
export const getMoveExplanation = (
    board: BoardState,
    x: number,
    y: number,
    player: Player
): MoveReason => {
    if (board[x][y] !== null) return 'strategic'; // Invalid move

    const opponent: Player = player === 'black' ? 'white' : 'black';

    // Priority 1: Check if this move wins (need to place piece first)
    board[x][y] = player;
    if (checkWin(board, x, y, player)) {
        board[x][y] = null;
        return 'win';
    }

    // Priority 2: Check if this move blocks opponent's win
    // Check BEFORE placing piece if opponent has a win threat at this position
    board[x][y] = null; // Remove piece to check opponent threats
    const opponentWouldWin = checkOpponentWinThreat(board, x, y, opponent);
    if (opponentWouldWin) {
        return 'blockWin';
    }

    // Check what patterns this move creates (place piece again)
    board[x][y] = player;
    const createdPatterns = checkPatternsAtPosition(board, x, y, player);
    board[x][y] = null;

    // Check what patterns opponent has that we're blocking
    const blockedPatterns = checkBlockedPatterns(board, x, y, opponent);

    // Priority 3: Create open four (very strong - almost guaranteed win)
    if (createdPatterns.openFour > 0) {
        return 'createOpenFour';
    }

    // Priority 4: Block opponent's open four (critical defense)
    if (blockedPatterns.openFour > 0) {
        return 'blockOpenFour';
    }

    // Priority 5: Create four (strong threat)
    if (createdPatterns.four > 0) {
        return 'createFour';
    }

    // Priority 6: Block opponent's four
    if (blockedPatterns.four > 0) {
        return 'blockFour';
    }

    // Priority 7: Create open three (good threat)
    if (createdPatterns.openThree > 0) {
        return 'createOpenThree';
    }

    // Priority 8: Block opponent's open three
    if (blockedPatterns.openThree > 0) {
        return 'blockOpenThree';
    }

    // Default: strategic move
    return 'strategic';
};

// Helper: Check if opponent has a winning threat that placing at (x,y) would block
const checkOpponentWinThreat = (
    board: BoardState,
    x: number,
    y: number,
    opponent: Player
): boolean => {
    // Check all directions from this position to see if opponent has exactly 4 in a row
    // with this position being one of the open ends
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
        let forwardCount = 0;
        let backwardCount = 0;

        // Check forward direction
        let nx = x + dx;
        let ny = y + dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === opponent) {
            forwardCount++;
            nx += dx;
            ny += dy;
        }
        const forwardOpen = nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === null;

        // Check backward direction
        nx = x - dx;
        ny = y - dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === opponent) {
            backwardCount++;
            nx -= dx;
            ny -= dy;
        }
        const backwardOpen = nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === null;

        const totalCount = forwardCount + backwardCount;

        // If opponent has exactly 4 in a row and this position is at an open end, this blocks their win
        // We need at least one open end (either forward or backward) for it to be a threat
        if (totalCount === 4 && (forwardOpen || backwardOpen)) {
            return true;
        }
    }

    return false;
};

// Helper: Check what patterns would be blocked by placing at (x, y)
const checkBlockedPatterns = (
    board: BoardState,
    x: number,
    y: number,
    opponent: Player
): PatternInfo => {
    // Temporarily place opponent's piece to see what patterns they would have
    board[x][y] = opponent;
    const patterns = checkPatternsAtPosition(board, x, y, opponent);
    board[x][y] = null;
    return patterns;
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

// Get best move with explanation for teaching mode
export const getBestMoveWithExplanation = (
    board: BoardState,
    player: Player
): { x: number, y: number, reason: MoveReason } | null => {
    const bestMove = getBestMove(board, player);
    if (!bestMove) return null;

    const reason = getMoveExplanation(board, bestMove.x, bestMove.y, player);
    return { ...bestMove, reason };
};
