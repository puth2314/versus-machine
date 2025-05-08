
// // Entry point
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('resetBtn').addEventListener('click', resetGame);
//     fetchState();
// });

// async function fetchState() {
//     try {
//         const res = await fetch('/state');
//         const data = await res.json();
//         updateUI(data);
//     } catch (error) {
//         showStatus(`Failed to load game state: ${error.message}`);
//     }
// }


// function renderBoard(board) {
//     const boardEl = document.getElementById('game-board');
//     boardEl.innerHTML = '';

//     board.forEach((row, rowIndex) => {
//         row.forEach((cell, colIndex) => {
//             const cellEl = document.createElement('div');
//             cellEl.className = 'cell' + (cell ? ' disabled' : '');
//             cellEl.textContent = cell;

//             if (!cell && !isGameOver()) {
//                 cellEl.addEventListener('click', () => makeMove(rowIndex, colIndex));
//             }

//             boardEl.appendChild(cellEl);
//         });
//     });
// }

// function updateStatus({ winner, draw, turn }) {
//     if (winner) {
//         showStatus(`Player ${winner} wins!`);
//     } else if (draw) {
//         showStatus("It's a draw!");
//     } else {
//         showStatus(`Current turn: ${turn}`);
//     }
// }

// function isGameOver() {
//     const statusText = document.getElementById('status').textContent;
//     return statusText.includes('wins') || statusText.includes('draw');
// }

let currentPlayer = 'X';

async function fetchState() {
    const res = await fetch('/state');
    const data = await res.json();
    renderBoard(data.board);
    updateStatus(data);
    currentPlayer = data.turn;
}

/**
 * Renders the board HTML dynamically.
 * @param {Array<string>} board - Array representing the Tic-Tac-Toe board state.
 * @returns {string} - HTML string to render the board.
 */
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

/** 
 * Handles the cell click event.
 * @param {number} row - The row of the clicked cell.
 * @param {number} col - col of the clicked cell.
 */
// async function makeMove(row, col) {

//     // if (cells[index] !== null) return;

//     // cells[index] = currentPlayer;
//     // renderBoard();

//     // .then(response => response.json())
//     // .then(data => {
//         // document.getElementById("board").innerHTML = data.boardHTML;
//     //     if (data.winner) {
//     //         alert(`${data.winner} wins!`);
//     //         resetGame();
//     //     } else if (data.draw) {
//     //         alert('It\'s a draw!');
//     //         resetGame();
//     //     } else {
//     //         currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
//     //     }
//     // });

// }

async function makeMove(row, col) {
    try {
        const res = await fetch('/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player: currentPlayer, row, col })
        });

        if (!res.ok) {
            const error = await res.text();
            showStatus(`Error: ${error}`);
            return;
        }

        const data = await res.json();
        updateUI(data);
    } catch (error) {
        showStatus(`Move failed: ${error.message}`);
    }
}


function updateUI(state) {
    renderBoard(state.board);
    updateStatus(state);
    currentPlayer = state.turn;
}


const resetButton = document.getElementById('resetBtn');

async function resetGame() {
    try {
        await fetch('/reset', { method: 'POST' });
        fetchState();
    } catch (error) {
        showStatus('Failed to reset the game.');
    }
}

function showStatus(message) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
}

resetButton.addEventListener('click', resetGame);
fetchState();