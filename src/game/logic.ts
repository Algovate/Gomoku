export type Player = 'black' | 'white' | null;
export type BoardState = Player[][];

export const BOARD_SIZE = 15;

export const createEmptyBoard = (): BoardState => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

export const checkWin = (board: BoardState, x: number, y: number, player: Player): boolean => {
    if (!player) return false;

    const directions = [
        [1, 0],   // Horizontal
        [0, 1],   // Vertical
        [1, 1],   // Diagonal \
        [1, -1],  // Diagonal /
    ];

    for (const [dx, dy] of directions) {
        let count = 1;

        // Check forward
        let nx = x + dx;
        let ny = y + dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === player) {
            count++;
            nx += dx;
            ny += dy;
        }

        // Check backward
        nx = x - dx;
        ny = y - dy;
        while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === player) {
            count++;
            nx -= dx;
            ny -= dy;
        }

        if (count >= 5) return true;
    }

    return false;
};
