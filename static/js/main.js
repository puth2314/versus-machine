

let currentPlayer = 'X';

async function fetchState() {
    const res = await fetch('/state');
    const data = await res.json();
    renderBoard(data.board);
    updateStatus(data);
    currentPlayer = data.turn;
}

function renderBoard(board) {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';

    // const board = Array(9).fill(null);
    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellEl = document.createElement('div');
            // if (value) {
            cellEl.className = 'cell' + (cell ? ' disabled' : '');
            cellEl.textContent = cell;
            // else
            if (!cell) {
                cellEl.addEventListener('click', () => makeMove(rowIndex, colIndex));
            }
            boardEl.appendChild(cellEl);
        });
    });
}

function updateStatus(state) {
    const statusEl = document.getElementById('status');
    if (state.winner) {
        statusEl.textContent = `Player ${state.winner} wins!`;
    } else if (state.draw) {
        statusEl.textContent = "It's a draw!";
    } else {
        statusEl.textContent = `Current turn: ${state.turn}`;
    }
}

async function makeMove(row, col) {

    // if (cells[index] !== null) return;

    // cells[index] = currentPlayer;
    // renderBoard();

    const res = await fetch('/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: currentPlayer, row, col })
    });
    // .then(response => response.json())
    // .then(data => {
    //     if (data.winner) {
    //         alert(`${data.winner} wins!`);
    //         resetGame();
    //     } else if (data.draw) {
    //         alert('It\'s a draw!');
    //         resetGame();
    //     } else {
    //         currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    //     }
    // });

    if (res.ok) {
        const data = await res.json();
        renderBoard(data.board);
        updateStatus(data);
        currentPlayer = data.turn;
    } else {
        const error = await res.text();
        alert(error);
    }
}

const resetButton = document.getElementById('resetBtn');

async function resetGame() {
    // currentPlayer = 'X';
    // cells.fill(null);
    // renderBoard();
    await fetch('/reset', { method: 'POST' });
    fetchState();
}

resetButton.addEventListener('click', resetGame);
fetchState();