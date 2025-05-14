let currentPlayer = 'X';

// entry point
document.addEventListener('DOMContentLoaded', () => {
    // document.getElementById('reset-game')
    //         .addEventListener('click', resetGame);
    // fetchState();
    // const canvas = document.getElementById("canvas");
    // const ctx = canvas.getContext("2d");

    // ctx.fillStyle = "green";
    // ctx.fillRect(10, 10, 150, 100);

});

function resetGame() {
    fetch('/reset', { method: 'POST' })
    .then(() => {
        fetchState();
    })
    .catch(() => {
        showStatusMessage('Failed to reset the game.');
    });
}

function fetchState() {
    fetch('/state')
        .then(res => res.json())
        .then(data => {
            renderBoard(data.board);
            updateStatus(data); 
            currentPlayer = data.turn; 
        })
        .catch(error => {
            showStatus(`Failed to load game state: ${error.message}`);
        });
}

/**
 * Renders the board HTML dynamically.
 * @param {Array<string>} board - Array representing the Tic-Tac-Toe board state.
 * @returns {string} - HTML string to render the board.
 */
function renderBoard(board) {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';

    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'w-[100px] h-[100px] bg-gray-100 border border-gray-400 hover:bg-gray-200 flex items-center justify-center cursor-pointer';
            //    "
            cellEl.textContent = cell;
            if (cell) {
                cellEl.classList.add('cursor-not-allowed', 'pointer-events-none', 'bg-gray-300'); //remove cursor-pointer
            } else {
                cellEl.addEventListener('click', () => makeMove(rowIndex, colIndex));
            }
            boardEl.appendChild(cellEl);
        });
    });
}

function updateStatus({ winner, draw, turn }) {
    if (winner) {
        showStatusMessage(`Player ${winner} wins!`);
    } else if (draw) {
        showStatusMessage("It's a draw!");
    } else {
        showStatusMessage(`Current turn: ${turn}`);
    }
}

function showStatusMessage(message) {
    document.getElementById('game-status')
            .textContent = message;
}

/** 
 * Handles the cell click event.
 * @param {number} row - The row of the clicked cell.
 * @param {number} col - The column of the clicked cell.
 */
function makeMove(row, col) {
    fetch('/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: currentPlayer, row, col })
        })
    .then(res => {
        if (!res.ok) {
            return res.text().then(errorText => {
            throw new Error(`Error: ${errorText}`);
            });
        }
        return res.json();
    })
    .then(data => {
        renderBoard(data.board);
        updateStatus(data);
        currentPlayer = data.turn;
    })
    .catch(error => {
        showStatusMessage(`Move failed: ${error.message}`);
    });
  }
