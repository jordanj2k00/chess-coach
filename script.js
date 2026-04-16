const chess = new Chess();

/*
========================
STOCKFISH ENGINE
========================
*/
const engine = new Worker("https://unpkg.com/stockfish.js@10.0.2/stockfish.js");

engine.onmessage = function(event) {
    const line = event.data;
    console.log("ENGINE:", line);

    if (typeof line === "string" && line.includes("bestmove")) {
        const bestMove = line.split(" ")[1];

        if (!bestMove || bestMove === "(none)") return;

        chess.move({
            from: bestMove.substring(0, 2),
            to: bestMove.substring(2, 4),
            promotion: "q"
        });

        renderBoard();
    }
};

/*
========================
PIECE DISPLAY
========================
*/
const pieceMap = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔"
};

let selectedSquare = null;

/*
========================
RENDER BOARD
========================
*/
function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const currentBoard = chess.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");

            square.classList.add("square");
            square.classList.add((row + col) % 2 === 0 ? "light" : "dark");

            const piece = currentBoard[row][col];

            if (piece) {
                square.textContent =
                    pieceMap[
                        piece.color === "w"
                            ? piece.type.toUpperCase()
                            : piece.type
                    ];

                square.classList.add(
                    piece.color === "w" ? "white-piece" : "black-piece"
                );
            }

            /*
            SELECTED HIGHLIGHT
            */
            if (
                selectedSquare &&
                selectedSquare.row === row &&
                selectedSquare.col === col
            ) {
                square.classList.add("selected");
            }

            /*
            LEGAL MOVE HIGHLIGHTS
            */
            if (selectedSquare) {
                const moves = chess.moves({
                    square: coordsToSquare(
                        selectedSquare.row,
                        selectedSquare.col
                    ),
                    verbose: true
                });

                if (
                    moves.some(
                        move => move.to === coordsToSquare(row, col)
                    )
                ) {
                    square.classList.add("legal");
                }
            }

            square.onclick = () => handleClick(row, col);

            boardDiv.appendChild(square);
        }
    }

    updateUI();
}

/*
========================
HANDLE CLICK
========================
*/
function handleClick(row, col) {
    const clickedSquare = coordsToSquare(row, col);

    if (!selectedSquare) {
        const piece = chess.get(clickedSquare);

        if (piece && piece.color === "w") {
            selectedSquare = { row, col };
            renderBoard();
        }

        return;
    }

    const move = chess.move({
        from: coordsToSquare(selectedSquare.row, selectedSquare.col),
        to: clickedSquare,
        promotion: "q"
    });

    selectedSquare = null;

    if (!move) {
        renderBoard();
        return;
    }

    renderBoard();

    if (!chess.game_over()) {
        document.getElementById("status").innerText =
            "🤖 Stockfish Thinking...";

        setTimeout(stockfishMove, 500);
    }
}

/*
========================
STOCKFISH MOVE
========================
*/
function stockfishMove() {
    engine.postMessage("uci");
    engine.postMessage("ucinewgame");
    engine.postMessage("position fen " + chess.fen());
    engine.postMessage("go depth 8");
}

/*
========================
UI UPDATE
========================
*/
function updateUI() {
    let statusText = "";

    if (chess.in_checkmate()) {
        statusText =
            chess.turn() === "w"
                ? "Checkmate! Black Wins"
                : "Checkmate! White Wins";
    } else if (chess.in_draw()) {
        statusText = "Draw";
    } else if (chess.in_check()) {
        statusText =
            chess.turn() === "w"
                ? "White in Check"
                : "Black in Check";
    } else {
        statusText =
            chess.turn() === "w"
                ? "White to Move"
                : "Black to Move";
    }

    document.getElementById("status").innerText = statusText;

    /*
    MOVE HISTORY
    */
    document.getElementById("history").innerHTML =
        chess.history().join("<br>");
}

/*
========================
HELPERS
========================
*/
function coordsToSquare(row, col) {
    return "abcdefgh"[col] + (8 - row);
}

/*
========================
RESET
========================
*/
function resetGame() {
    chess.reset();
    selectedSquare = null;
    renderBoard();
}

/*
========================
START
========================
*/
renderBoard();
