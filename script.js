// ======================
// GAME SETUP
// ======================

let currentMode = "computer";
const chess = new Chess();

let selectedSquare = null;
let lastMove = null;
let bestMoveHighlight = null;
let lessonMoveHighlight = null;

let lessonTimeoutId = null;
let gameResultRecorded = false;

// ======================
// PLAYER + ELO
// ======================

let playerElo = 1200;
let aiElo = 1300;
const K_FACTOR = 32;

let playerProfile = {
    earlyQueenMoves: 0,
    earlyAttacks: 0,
    pawnRushes: 0,
    gamesPlayed: 0
};

// ======================
// OPENING REPERTOIRE
// ======================

const openingLines = [
    {
        name: "Four Knights Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"]
    },
    {
        name: "Four Knights Scotch",
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4"]
    },
    {
        name: "Three Knights Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3"]
    },
    {
        name: "Scotch Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4"]
    },
    {
        name: "Italian Game",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"]
    },
    {
        name: "Giuoco Piano",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"]
    },
    {
        name: "Ruy Lopez",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]
    },
    {
        name: "Vienna Game",
        moves: ["e4", "e5", "Nc3", "Nf6", "f4"]
    },
    {
        name: "King's Gambit",
        moves: ["e4", "e5", "f4", "exf4", "Nf3"]
    },
    {
        name: "French Defense: Advance",
        moves: ["e4", "e6", "d4", "d5", "e5", "c5"]
    },
    {
        name: "French Defense: Exchange",
        moves: ["e4", "e6", "d4", "d5", "exd5", "exd5"]
    },
    {
        name: "French Defense: Classical",
        moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"]
    },
    {
        name: "Caro-Kann: Advance",
        moves: ["e4", "c6", "d4", "d5", "e5", "Bf5"]
    },
    {
        name: "Sicilian Defense: Open",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6"]
    },
    {
        name: "Alekhine Defense",
        moves: ["e4", "Nf6", "e5", "Nd5", "d4"]
    },
    {
        name: "King's Indian Defense",
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"]
    },
    {
        name: "Queen's Gambit Declined",
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6"]
    },
    {
        name: "London System",
        moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"]
    },
    {
        name: "Nimzo-Indian Defense",
        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"]
    },
    {
        name: "Dutch Defense",
        moves: ["d4", "f5", "c4", "Nf6", "g3", "e6", "Bg2", "Be7"]
    }
];

const trainingLines = openingLines.slice();

let trainingLine = null;
let theoryLine = null;

// ======================
// POSITION PLANS
// ======================

const positionPlans = {
    frenchAdvance: {
        condition: () =>
            chess.get("e5") && chess.get("d4") && chess.get("e6"),
        advice:
            "French Advance: space advantage. Keep the center locked and attack the kingside."
    },
    frenchExchange: {
        condition: () =>
            chess.get("d4") && chess.get("e6") && !chess.get("e5"),
        advice:
            "French Exchange: simplify, develop fast, and target the center."
    },
    kingsideAttack: {
        condition: () =>
            chess.get("f4") || chess.get("g4") || chess.get("h4"),
        advice:
            "Kingside attack: bring rooks in and open files toward the king."
    },
    developedCenter: {
        condition: () =>
            chess.get("e4") && chess.get("d4"),
        advice:
            "Strong center: develop quickly and castle."
    },
    openCenter: {
        condition: () =>
            !chess.get("d4") && !chess.get("e4"),
        advice:
            "Open center: activate pieces and look for tactics."
    }
};

// ======================
// SAVE / LOAD
// ======================

function saveProgress() {
    localStorage.setItem(
        "chessCoachData",
        JSON.stringify({
            playerProfile,
            playerElo,
            aiElo
        })
    );
}

function loadProgress() {
    const raw = localStorage.getItem("chessCoachData");
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        playerProfile = data.playerProfile || playerProfile;
        playerElo = Number.isFinite(data.playerElo) ? data.playerElo : 1200;
        aiElo = Number.isFinite(data.aiElo) ? data.aiElo : playerElo + 100;
    } catch {
        // Ignore malformed saved data
    }
}

// ======================
// HELPERS
// ======================

function coordsToSquare(r, c) {
    return "abcdefgh"[c] + (8 - r);
}

function getPieceImage(piece) {
    return `https://chessboardjs.com/img/chesspieces/wikipedia/${piece.color}${piece.type.toUpperCase()}.png`;
}

function syncLastMoveFromHistory() {
    const history = chess.history({ verbose: true });
    lastMove = history.length ? history[history.length - 1] : null;
}

function findLegalMoveBySan(targetSan) {
    if (!targetSan) return null;
    return chess.moves({ verbose: true }).find(move => move.san === targetSan) || null;
}

function findOpeningCandidates(history) {
    if (!history || history.length === 0) return [];

    return openingLines.filter(line => {
        if (history.length > line.moves.length) return false;

        for (let i = 0; i < history.length; i++) {
            if (line.moves[i] !== history[i]) return false;
        }
        return true;
    });
}

function formatOpeningCandidates(candidates) {
    const names = candidates.slice(0, 4).map(line => line.name);
    if (candidates.length > 4) names.push("...");
    return names.join(" / ");
}

function getAnalysisCoachText() {
    const history = chess.history();
    const evalScore = evaluateBoard().toFixed(2);

    if (history.length === 0) {
        const bestText = bestMoveHighlight ? `Best: ${bestMoveHighlight.san}` : "";
        return ["Opening: Starting position", `Eval: ${evalScore}`, bestText]
            .filter(Boolean)
            .join("\n");
    }

    const candidates = findOpeningCandidates(history);
    const openingText = candidates.length
        ? `Theory: ${formatOpeningCandidates(candidates)}`
        : "Theory: Out of book";

    const bestText = bestMoveHighlight ? `Best: ${bestMoveHighlight.san}` : "";

    return [openingText, `Eval: ${evalScore}`, bestText]
        .filter(Boolean)
        .join("\n");
}

function getSearchDepth() {
    if (currentMode === "analysis") return 3;
    if (aiElo < 1000) return 1;
    if (aiElo < 1400) return 2;
    return 3;
}

function getMistakeChance() {
    if (aiElo < 1000) return 0.30;
    if (aiElo < 1400) return 0.18;
    if (aiElo < 1700) return 0.08;
    return 0.03;
}

// ======================
// EVALUATION + SEARCH
// ======================

function evaluateBoard() {
    const values = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 0
    };

    let score = 0;

    chess.board().forEach(row => {
        row.forEach(piece => {
            if (piece) {
                score += piece.color === "w"
                    ? values[piece.type]
                    : -values[piece.type];
            }
        });
    });

    return score;
}

function minimax(depth, alpha, beta) {
    if (depth <= 0 || chess.game_over()) {
        return evaluateBoard();
    }

    const moves = chess.moves({ verbose: true });

    if (chess.turn() === "w") {
        let maxEval = -Infinity;

        for (const move of moves) {
            chess.move(move);
            const evalScore = minimax(depth - 1, alpha, beta);
            chess.undo();

            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);

            if (beta <= alpha) break;
        }

        return maxEval;
    } else {
        let minEval = Infinity;

        for (const move of moves) {
            chess.move(move);
            const evalScore = minimax(depth - 1, alpha, beta);
            chess.undo();

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);

            if (beta <= alpha) break;
        }

        return minEval;
    }
}

function rankMoves(depth = getSearchDepth()) {
    const moves = chess.moves({ verbose: true });
    const whiteToMove = chess.turn() === "w";

    const scored = moves.map(move => {
        chess.move(move);
        const score = minimax(depth - 1, -Infinity, Infinity);
        chess.undo();

        return { move, score };
    });

    scored.sort((a, b) => whiteToMove
        ? b.score - a.score
        : a.score - b.score
    );

    return scored;
}

function findBestMove(depth = getSearchDepth()) {
    const ranked = rankMoves(depth);
    return ranked.length ? ranked[0].move : null;
}

function chooseAiMove() {
    const ranked = rankMoves(getSearchDepth());
    if (!ranked.length) return null;

    const mistakeChance = getMistakeChance();

    if (Math.random() < mistakeChance && ranked.length > 1) {
        const poolSize = Math.min(3, ranked.length);
        const choice = ranked[Math.floor(Math.random() * poolSize)];
        return choice.move;
    }

    return ranked[0].move;
}

// ======================
// ELO + RESULT
// ======================

function updateElo(result) {
    const expected =
        1 / (1 + Math.pow(10, (aiElo - playerElo) / 400));

    playerElo = Math.round(playerElo + K_FACTOR * (result - expected));
    aiElo = Math.max(800, playerElo + 100);

    saveProgress();
}

function maybeFinalizeComputerGame() {
    if (currentMode !== "computer") return;
    if (gameResultRecorded) return;
    if (!chess.game_over()) return;

    let result = 0.5;

    if (chess.in_checkmate()) {
        result = chess.turn() === "w" ? 0 : 1;
    } else if (
        chess.in_draw() ||
        chess.in_stalemate() ||
        chess.in_threefold_repetition() ||
        chess.insufficient_material()
    ) {
        result = 0.5;
    }

    updateElo(result);
    playerProfile.gamesPlayed += 1;
    gameResultRecorded = true;
    saveProgress();

    const msg =
        result === 1 ? "You won!" :
        result === 0 ? "You lost!" :
        "Draw.";

    document.getElementById("coach").innerText =
        `${msg} New ELO: ${playerElo}`;

    renderBoard();
}

// ======================
// PLAYER TENDENCY TRACKING
// ======================

function updatePlayerProfile(moveResult) {
    if (currentMode === "analysis") return;

    const plies = chess.history().length;

    if (moveResult.piece === "q" && plies <= 6) {
        playerProfile.earlyQueenMoves += 1;
    }

    if ((moveResult.san.includes("+") || moveResult.san.includes("#")) && plies <= 10) {
        playerProfile.earlyAttacks += 1;
    }

    if (moveResult.piece === "p" && plies <= 10) {
        playerProfile.pawnRushes += 1;
    }
}

// ======================
// BOARD RENDER
// ======================

function refreshHints() {
    lessonMoveHighlight = null;

    if (currentMode === "training" && trainingLine) {
        const nextSan = trainingLine.moves[chess.history().length];
        lessonMoveHighlight = findLegalMoveBySan(nextSan);
    } else if (currentMode === "theory" && theoryLine) {
        const nextSan = theoryLine.moves[chess.history().length];
        lessonMoveHighlight = findLegalMoveBySan(nextSan);
    }

    if (currentMode === "analysis") {
        bestMoveHighlight = chess.game_over() ? null : findBestMove();
    }
}

function renderBoard() {
    refreshHints();

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const board = chess.board();

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement("div");
            square.classList.add("square", (r + c) % 2 === 0 ? "light" : "dark");

            const piece = board[r][c];

            if (piece) {
                const img = document.createElement("img");
                img.src = getPieceImage(piece);
                img.classList.add("piece-img");
                square.appendChild(img);
            }

            if (selectedSquare && selectedSquare.row === r && selectedSquare.col === c) {
                square.classList.add("selected");
            }

            if (lastMove) {
                const sq = coordsToSquare(r, c);
                if (sq === lastMove.from || sq === lastMove.to) {
                    square.classList.add("last-move");
                }
            }

            if (lessonMoveHighlight) {
                const sq = coordsToSquare(r, c);
                if (sq === lessonMoveHighlight.from || sq === lessonMoveHighlight.to) {
                    square.classList.add("lesson-move");
                }
            }

            if (bestMoveHighlight) {
                const sq = coordsToSquare(r, c);
                if (sq === bestMoveHighlight.from || sq === bestMoveHighlight.to) {
                    square.classList.add("best-move");
                }
            }

            if (selectedSquare) {
                const moves = chess.moves({
                    square: coordsToSquare(selectedSquare.row, selectedSquare.col),
                    verbose: true
                });

                if (moves.some(move => move.to === coordsToSquare(r, c))) {
                    square.classList.add("legal");
                }
            }

            square.onclick = () => handleClick(r, c);
            boardDiv.appendChild(square);
        }
    }

    updateUI();
}

// ======================
// LESSON MODES
// ======================

function processLessonMove(line, label, moveResult) {
    const history = chess.history();
    const expected = line.moves[history.length - 1];

    if (moveResult.san !== expected) {
        document.getElementById("coach").innerText =
            `Wrong move! Expected: ${expected}`;

        alert(`Wrong move! Expected: ${expected}`);

        chess.undo();
        syncLastMoveFromHistory();
        renderBoard();

        return { valid: false };
    }

    const nextSan = line.moves[history.length];

    if (nextSan) {
        document.getElementById("coach").innerText =
            `${label}: ${line.name}\nNext: ${nextSan}`;

        clearTimeout(lessonTimeoutId);
        lessonTimeoutId = setTimeout(() => {
            if (chess.game_over()) return;

            const reply = chess.move(nextSan);
            lastMove = reply;
            syncLastMoveFromHistory();
            renderBoard();

            const newHistory = chess.history();
            const upcoming = line.moves[newHistory.length];

            if (upcoming) {
                document.getElementById("coach").innerText =
                    `${label}: ${line.name}\nNext: ${upcoming}`;
            } else {
                document.getElementById("coach").innerText =
                    `${label} complete!`;
            }

            maybeFinalizeComputerGame();
        }, 400);
    } else {
        document.getElementById("coach").innerText =
            `${label} complete!`;
    }

    return { valid: true };
}

// ======================
// CLICK LOGIC
// ======================

function handleClick(r, c) {
    const sq = coordsToSquare(r, c);

    if (!selectedSquare) {
        const piece = chess.get(sq);

        if (piece && (currentMode === "analysis" || piece.color === "w")) {
            selectedSquare = { row: r, col: c };
            renderBoard();
        }

        return;
    }

    const beforeEval = evaluateBoard();

    const moveResult = chess.move({
        from: coordsToSquare(selectedSquare.row, selectedSquare.col),
        to: sq,
        promotion: "q"
    });

    selectedSquare = null;
    bestMoveHighlight = null;
    lessonMoveHighlight = null;

    if (!moveResult) {
        renderBoard();
        return;
    }

    lastMove = moveResult;

    if (currentMode !== "analysis") {
        updatePlayerProfile(moveResult);
    }

    const afterEval = evaluateBoard();

    if (currentMode !== "analysis" && afterEval < beforeEval - 2) {
        document.getElementById("coach").innerText =
            "Blunder: You lost material!";
    }

    if (currentMode === "training" && trainingLine) {
        const lesson = processLessonMove(trainingLine, "Training", moveResult);
        saveProgress();
        renderBoard();
        return;
    }

    if (currentMode === "theory" && theoryLine) {
        const lesson = processLessonMove(theoryLine, "Theory", moveResult);
        saveProgress();
        renderBoard();
        return;
    }

    saveProgress();
    renderBoard();

    maybeFinalizeComputerGame();

    if (currentMode === "computer" && !chess.game_over()) {
        setTimeout(aiMove, 400);
    }
}

// ======================
// AI
// ======================

function aiMove() {
    const best = chooseAiMove();
    if (!best) return;

    const move = chess.move(best);
    lastMove = move;

    renderBoard();
    maybeFinalizeComputerGame();
}

// ======================
// BEST MOVE BUTTON
// ======================

function showBestMove() {
    bestMoveHighlight = chess.game_over() ? null : findBestMove();
    renderBoard();
}

// ======================
// UI
// ======================

function updateUI() {
    const evalScore = evaluateBoard();

    document.getElementById("status").innerText =
        (chess.turn() === "w" ? "White" : "Black") +
        " to Move | ELO: " + playerElo +
        " | Eval: " + evalScore.toFixed(2);

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    if (currentMode === "analysis") {
        document.getElementById("coach").innerText = getAnalysisCoachText();
    }

    adaptiveCoach();
    detectPositionPlan();
}

// ======================
// COACHING
// ======================

function adaptiveCoach() {
    let advice = "Balanced play.";

    if (playerProfile.earlyQueenMoves > 3) {
        advice = "You move your queen early. Develop first.";
    } else if (playerProfile.earlyAttacks > 5) {
        advice = "You attack too early. Build your position first.";
    } else if (playerProfile.pawnRushes > 10) {
        advice = "Too many pawn pushes. Watch your structure.";
    }

    document.getElementById("adaptiveCoach").innerText = advice;
}

function detectPositionPlan() {
    for (const key in positionPlans) {
        if (positionPlans[key].condition()) {
            document.getElementById("positionPlan").innerText =
                positionPlans[key].advice;
            return;
        }
    }

    document.getElementById("positionPlan").innerText =
        "No structure detected.";
}

// ======================
// MODE SWITCH
// ======================

function changeMode() {
    currentMode = document.getElementById("gameMode").value;

    clearTimeout(lessonTimeoutId);
    lessonTimeoutId = null;

    resetGame();
    bestMoveHighlight = null;
    lessonMoveHighlight = null;

    if (currentMode === "training") {
        trainingLine = trainingLines[Math.floor(Math.random() * trainingLines.length)];

        document.getElementById("coach").innerText =
            `Training: ${trainingLine.name}\nNext: ${trainingLine.moves[0]}`;
    }

    if (currentMode === "theory") {
        theoryLine = openingLines[Math.floor(Math.random() * openingLines.length)];

        document.getElementById("coach").innerText =
            `Theory: ${theoryLine.name}\nNext: ${theoryLine.moves[0]}`;
    }

    if (currentMode === "analysis") {
        document.getElementById("coach").innerText =
            "Analysis board active.";
    }
}

// ======================
// RESET
// ======================

function resetGame() {
    clearTimeout(lessonTimeoutId);
    lessonTimeoutId = null;

    chess.reset();
    lastMove = null;
    selectedSquare = null;
    bestMoveHighlight = null;
    lessonMoveHighlight = null;
    gameResultRecorded = false;

    renderBoard();
}

// ======================
// INIT
// ======================

loadProgress();
renderBoard();
