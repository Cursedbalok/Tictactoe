let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X"; // X is always the player
let gameActive = true;
let scoreX = 0;
let scoreO = 0;
let moveHistory = [];
let aiDifficulty = "none"; // Current AI difficulty
let isPlayerTurn = true; // Flag to track player turn

const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    updateTurnIndicator();
});

function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        document.getElementById("themeToggle").textContent = "🌞 Light Mode";
    } else {
        document.body.classList.remove("light-theme");
        document.getElementById("themeToggle").textContent = "🌙 Dark Mode";
    }
}

function toggleTheme() {
    document.body.classList.toggle("light-theme");
    const theme = document.body.classList.contains("light-theme") ? "light" : "dark";
    localStorage.setItem("theme", theme);
    document.getElementById("themeToggle").textContent = theme === "light" ? "🌞 Light Mode" : "🌙 Dark Mode";
}

function setDifficulty() {
    aiDifficulty = document.getElementById("difficulty").value;
}

function makeMove(cell, index) {
    // Allow move only if the cell is empty, game is active, and it's the player's turn
    if (board[index] === "" && gameActive && isPlayerTurn) {
        board[index] = currentPlayer;
        cell.textContent = currentPlayer;
        cell.classList.add("clicked");

        // Log move to history
        moveHistory.push(`Player ${currentPlayer} moved to cell ${index + 1}`);
        updateMoveHistory();

        checkResult();

        // Check if AI is enabled and it's the player's turn
        if (aiDifficulty !== "none" && currentPlayer === "X") {
            isPlayerTurn = false; // Prevent player from moving
            currentPlayer = "O"; // Change to AI
            setTimeout(aiMove, 2000); // Delay of 2 seconds for AI move
        } else {
            // Switch player turn for human player
            currentPlayer = currentPlayer === "X" ? "O" : "X";
            updateTurnIndicator();
        }
    }
}

function aiMove() {
    let moveIndex;

    switch (aiDifficulty) {
        case "easy":
            moveIndex = getRandomMove();
            break;
        case "medium":
            moveIndex = getMediumMove();
            break;
        case "hard":
            moveIndex = getBestMove();
            break;
    }

    // Make the AI's move
    if (moveIndex !== null) {
        board[moveIndex] = currentPlayer;
        document.querySelectorAll(".cell")[moveIndex].textContent = currentPlayer;
        document.querySelectorAll(".cell")[moveIndex].classList.add("clicked");

        // Log move to history
        moveHistory.push(`AI moved to cell ${moveIndex + 1}`);
        updateMoveHistory();

        checkResult();

        // Switch back to player X
        currentPlayer = "X";
        isPlayerTurn = true; // Allow player to move again
        updateTurnIndicator();
    }
}

function getRandomMove() {
    const availableMoves = board.map((cell, index) => (cell === "" ? index : null)).filter(index => index !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getMediumMove() {
    // Check for winning move for AI
    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] === "O" && board[b] === "O" && board[c] === "") return c;
        if (board[a] === "O" && board[c] === "O" && board[b] === "") return b;
        if (board[b] === "O" && board[c] === "O" && board[a] === "") return a;
    }
    
    // Check for blocking move against Player X
    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] === "X" && board[b] === "X" && board[c] === "") return c;
        if (board[a] === "X" && board[c] === "X" && board[b] === "") return b;
        if (board[b] === "X" && board[c] === "X" && board[a] === "") return a;
    }
    
    // If no winning or blocking move, choose a random available cell
    return getRandomMove();
}

function getBestMove() {
    const minimax = (newBoard, depth, isMaximizing) => {
        const scores = { X: -10, O: 10, tie: 0 };

        // Check for terminal states
        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (newBoard[a] === "O" && newBoard[b] === "O" && newBoard[c] === "") return scores["O"];
            if (newBoard[a] === "X" && newBoard[b] === "X" && newBoard[c] === "") return scores["X"];
        }

        if (!newBoard.includes("")) return scores["tie"];

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (newBoard[i] === "") {
                    newBoard[i] = "O";
                    bestScore = Math.max(bestScore, minimax(newBoard, depth + 1, false));
                    newBoard[i] = ""; // Undo move
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (newBoard[i] === "") {
                    newBoard[i] = "X";
                    bestScore = Math.min(bestScore, minimax(newBoard, depth + 1, true));
                    newBoard[i] = ""; // Undo move
                }
            }
            return bestScore;
        }
    };

    let bestMove = null;
    let bestScore = -Infinity;

    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            board[i] = "O";
            let score = minimax(board, 0, false);
            board[i] = ""; // Undo move
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function checkResult() {
    let roundWon = false;
    let winningCells = [];
    
    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCells = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        highlightWinningCells(winningCells);
        updateScore();
        showPopup(`Congratulations! Player ${currentPlayer} wins! 🎉`);
        setMessage(`Player ${currentPlayer} has won! 🎉`);
        gameActive = false;
    } else if (!board.includes("")) {
        showPopup("It's a draw!");
        setMessage("It's a draw!");
        gameActive = false;
    }
}

function highlightWinningCells(cells) {
    cells.forEach(index => {
        document.querySelectorAll(".cell")[index].classList.add("winning-cell");
    });
}

function resetGame() {
    board = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";
    moveHistory = [];
    isPlayerTurn = true; // Reset player turn flag
    document.querySelectorAll(".cell").forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("clicked", "winning-cell");
    });
    setMessage("");
    updateTurnIndicator();
    updateMoveHistory();
}

function updateScore() {
    if (currentPlayer === "X") {
        scoreX++;
        document.getElementById("scoreX").textContent = scoreX;
    } else {
        scoreO++;
        document.getElementById("scoreO").textContent = scoreO;
    }
}

function resetScores() {
    scoreX = 0;
    scoreO = 0;
    document.getElementById("scoreX").textContent = scoreX;
    document.getElementById("scoreO").textContent = scoreO;
    resetGame();
}

function updateTurnIndicator() {
    document.getElementById("turnIndicator").textContent = `Player ${currentPlayer}'s turn`;
}

function updateMoveHistory() {
    const historyElement = document.getElementById("moveHistory");
    historyElement.innerHTML = "";
    moveHistory.forEach(move => {
        const li = document.createElement("li");
        li.textContent = move;
        historyElement.appendChild(li);
    });
}

function showPopup(message) {
    document.getElementById("popupMessage").textContent = message;
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
    resetGame();
}

function setMessage(message) {
    document.getElementById("message").textContent = message;
}
