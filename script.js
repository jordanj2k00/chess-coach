// ======================
// GAME SETUP
// ======================

let currentMode = "computer";
const chess = new Chess();

let selectedSquare = null;
let lastMove = null;
let bestMoveHighlight = null;
let lessonMoveHighlight = null;
let flipped = false;

let lessonTimeoutId = null;
let gameResultRecorded = false;
let gameReviewShown = false;

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
    gamesPlayed: 0,
    blunders: 0,
    mistakes: 0,
    inaccuracies: 0,
    goodMoves: 0
};

// Current game tracking
let currentGameStats = resetGameStats();

function resetGameStats() {
    return {
        earlyQueenMoves: 0,
        earlyAttacks: 0,
        pawnRushes: 0,
        blunders: 0,
        mistakes: 0,
        inaccuracies: 0,
        goodMoves: 0
    };
}

// ======================
// REPERTOIRE TREE
// ======================

const repertoireTree = {
    white: {
        fourKnightsScotch: {
            name: "Four Knights Scotch",
            side: "white",
            branches: [
                {
                    name: "Main Line",
                    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4"],
                    plan: "Fast development, central strike, open files, active pieces."
                },
                {
                    name: "4...exd4 5.Nxd4",
                    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4", "exd4", "Nxd4"],
                    plan: "Recapture actively, keep pieces active, and use the open center."
                },
                {
                    name: "4...Bb4 Pin",
                    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4", "Bb4", "Bd2", "exd4"],
                    plan: "Break the pin, keep development calm, and fight for the center."
                },
                {
                    name: "4...d5 Break",
                    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4", "d5", "exd5", "Nxd5"],
                    plan: "Meet the central break, simplify if needed, and keep piece activity."
                }
            ]
        },

        threeKnights: {
            name: "Three Knights Game",
            side: "white",
            branches: [
                {
                    name: "Transposition to Four Knights",
                    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4"],
                    plan: "Transpose into Four Knights territory and choose Scotch ideas."
                },
                {
                    name: "Italian Setup with ...Bc5",
                    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Bc5", "Bc4", "Nf6", "d3"],
                    plan: "Develop naturally, pressure f7, and castle smoothly."
                },
                {
                    name: "Fianchetto Setup",
                    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "g6", "Bc4", "Bg7", "d3"],
                    plan: "Use calm development, occupy the center, and punish the slower setup."
                }
            ]
        },

        frenchAdvance: {
            name: "French Defense: Advance Variation",
            side: "white",
            branches: [
                {
                    name: "Main Line ...c5",
                    moves: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3"],
                    plan: "Keep the center closed, support d4, and prepare kingside play."
                },
                {
                    name: "...Qb6 Pressure",
                    moves: ["e4", "e6", "d4", "d5", "e5", "Qb6", "Nf3", "Nc6", "c3"],
                    plan: "Defend the center calmly and keep the space advantage."
                },
                {
                    name: "...Nc6 Classical",
                    moves: ["e4", "e6", "d4", "d5", "e5", "Nc6", "c3", "Qb6", "Bd3"],
                    plan: "Develop smoothly and aim for a strong pawn chain and kingside initiative."
                }
            ]
        },

        caroKannTal: {
            name: "Caro-Kann: Tal Variation",
            side: "white",
            branches: [
                {
                    name: "Main Tal Attack",
                    moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "h4", "e6"],
                    plan: "Use space, hit the bishop, and build direct kingside pressure."
                },
                {
                    name: "...h5",
                    moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "h4", "h5", "Bd3"],
                    plan: "Keep attacking themes alive and stay aggressive on the kingside."
                },
                {
                    name: "...c5",
                    moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "h4", "c5", "Bd3"],
                    plan: "Stay alert to counterplay and keep the attack rolling."
                }
            ]
        },

        sicilianGrandPrix: {
            name: "Sicilian Defense: Grand Prix Attack",
            side: "white",
            branches: [
                {
                    name: "...Nc6",
                    moves: ["e4", "c5", "Nc3", "Nc6", "f4", "g6", "Nf3"],
                    plan: "Build the Grand Prix setup and launch a kingside attack."
                },
                {
                    name: "...d6",
                    moves: ["e4", "c5", "Nc3", "d6", "f4", "Nc6", "Nf3"],
                    plan: "Keep the attacking structure and strike before Black settles."
                },
                {
                    name: "...e6",
                    moves: ["e4", "c5", "Nc3", "e6", "f4", "d5"],
                    plan: "Keep the initiative and stay ready for central breaks."
                }
            ]
        }
    },

    black: {
        kingsIndianDefense: {
            name: "King's Indian Defense",
            side: "black",
            branches: [
                {
                    name: "Classical",
                    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O"],
                    plan: "Challenge the center later and prepare the kingside attack."
                },
                {
                    name: "Fianchetto",
                    moves: ["d4", "Nf6", "c4", "g6", "Nf3", "Bg7", "g3", "O-O", "Bg2"],
                    plan: "Play for central breaks and active piece play."
                },
                {
                    name: "Sämisch",
                    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "f3", "O-O", "e4"],
                    plan: "Attack the center, keep the position flexible, and prepare counterplay."
                },
                {
                    name: "Four Pawns",
                    moves: ["d4", "Nf6", "c4", "g6", "e4", "Bg7", "f4", "d6", "Nf3"],
                    plan: "Strike the center fast and punish overextension with timely breaks."
                }
            ]
        },

        alekhineDefense: {
            name: "Alekhine Defense",
            side: "black",
            branches: [
                {
                    name: "Main Line",
                    moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "Nf3"],
                    plan: "Attack White's center later with ...d6 and ...c5 ideas."
                },
                {
                    name: "Exchange Structure",
                    moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6"],
                    plan: "Use the central tension and piece activity to equalize and counterattack."
                },
                {
                    name: "Four Pawns Attack",
                    moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6", "f4"],
                    plan: "Stay flexible, hit the center from the sides, and exploit overextension."
                }
            ]
        }
    }
};

function buildRepertoireLessons(tree) {
    const lessons = [];

    for (const sideGroup of Object.values(tree)) {
        for (const opening of Object.values(sideGroup)) {
            for (const branch of opening.branches) {
                lessons.push({
                    side: opening.side,
                    opening: opening.name,
                    branch: branch.name,
                    name: `${opening.name} - ${branch.name}`,
                    moves: branch.moves,
                    plan: branch.plan
                });
            }
        }
    }

    return lessons;
}

const repertoireLessons = buildRepertoireLessons(repertoireTree);

// ======================
// CURRENT LESSON STATE
// ======================

let trainingLine = null;
let theoryLine = null;

// ======================
// MOVE EXPLANATIONS
// ======================

const moveExplanations = {
    e4: "Take the center and open lines for your pieces.",
    e5: "Challenge the center and free your pieces.",
    Nf3: "Develop a knight and pressure the center.",
    Nc3: "Support the center and stay flexible.",
    d4: "Strike the center and open the position.",
    d5: "Challenge the center and keep the position balanced.",
    c3: "Support d4 and build a strong pawn chain.",
    c4: "Fight for central space and diagonal control.",
    exd4: "Open the center and simplify the pawn structure.",
    Nxd4: "Recapture actively and keep pressure in the center.",
    Bb5: "Pin the knight and pressure the center.",
    Bc4: "Aim at f7 and develop with initiative.",
    Bd3: "Develop toward the kingside and keep attacking chances alive.",
    Bf4: "Develop naturally and prepare active piece play.",
    f4: "Gain kingside space and start an attack.",
    h4: "Expand on the kingside and pressure the setup.",
    g3: "Prepare a fianchetto and control the long diagonal.",
    Bg2: "Fianchetto the bishop and support the center from afar.",
    Bg7: "Fianchetto the bishop and fight the center from distance.",
    "O-O": "Keep the king safe and connect the rooks.",
    "O-O-O": "Castle long for opposite-side attacking chances.",
    Qb6: "Pressure b2 and d4 while increasing central tension.",
    Bb4: "Pin the knight and create pressure on the center.",
    Bf5: "Develop the bishop outside the pawn chain and fight for active squares.",
    Bc5: "Develop actively and aim at f2/f7.",
    Nd5: "Retreat while keeping pressure on the center.",
    Nf6: "Develop a piece and challenge White’s center.",
    Nc6: "Develop naturally and support central play.",
    e6: "Support the center and free the light-squared bishop.",
    d6: "Support the center and keep the king flexible.",
    c5: "Strike the center and gain queenside space.",
    g6: "Prepare a fianchetto and control long diagonals.",
    b6: "Prepare a queenside fianchetto and control dark squares.",
    a6: "Kick the bishop and gain space on the queenside.",
    h6: "Stop piece jumps and prepare counterplay.",
    c6: "Support the center and prepare ...d5.",
    Be7: "Prepare to castle and keep the position flexible.",
    Nbd7: "Improve piece coordination and support central play."
};

function explainMove(moveSan) {
    const clean = normalizeSan(moveSan);
    return moveExplanations[clean] || "Keep developing with purpose and stay true to the plan.";
}

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
        // ignore malformed saved data
    }
}

function syncAiElo() {
    aiElo = Math.max(800, Math.round(playerElo + 100));
}

// ======================
// GENERAL HELPERS
// ======================

function coordsToSquare(r, c) {
    return "abcdefgh"[c] + (8 - r);
}

function getPieceImage(piece) {
    return `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${piece.color}${piece.type}.png`;
}

function normalizeSan(san) {
    return String(san || "").replace(/[+#?!]/g, "");
}

function commonPrefixLength(a, b) {
    const limit = Math.min(a.length, b.length);

    for (let i = 0; i < limit; i++) {
        if (normalizeSan(a[i]) !== normalizeSan(b[i])) {
            return i;
        }
    }

    return limit;
}

function pickRandomLesson() {
    return repertoireLessons[Math.floor(Math.random() * repertoireLessons.length)];
}

function getActiveLesson() {
    if (currentMode === "training") return trainingLine;
    if (currentMode === "theory") return theoryLine;
    return null;
}

function lessonUserColor(lesson) {
    return lesson && lesson.side === "black" ? "b" : "w";
}

function getCurrentUserColor() {
    const lesson = getActiveLesson();
    if (lesson) {
        return lessonUserColor(lesson);
    }
    return "w";
}

function syncLastMoveFromHistory() {
    const history = chess.history({ verbose: true });
    lastMove = history.length ? history[history.length - 1] : null;
}

function findLegalMoveBySan(targetSan) {
    if (!targetSan) return null;

    const target = normalizeSan(targetSan);

    return chess.moves({ verbose: true }).find(
        move => normalizeSan(move.san) === target
    ) || null;
}

function findBestRepertoireMatch(history) {
    let best = null;
    let bestLen = 0;

    for (const lesson of repertoireLessons) {
        const prefixLen = commonPrefixLength(history, lesson.moves);

        if (prefixLen > bestLen) {
            best = {
                ...lesson,
                matchedPlies: prefixLen,
                complete: prefixLen >= lesson.moves.length
            };
            bestLen = prefixLen;
        }
    }

    return best;
}

// ======================
// VOICE
// ======================

function speak(text) {
    if (!("speechSynthesis" in window)) return;

    const clean = String(text || "").trim();
    if (!clean) return;

    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.96;
    utter.pitch = 1;
    utter.volume = 1;

    const voices = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
    const preferred = voices.find(v =>
        /natural|google|microsoft|samantha|victoria|aria|zira|alex/i.test(v.name)
    ) || voices.find(v => /^en/i.test(v.lang)) || voices[0];

    if (preferred) utter.voice = preferred;

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
}

// ======================
// EVAL + SEARCH
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
    syncAiElo();

    const ranked = rankMoves(getSearchDepth());
    if (!ranked.length) return null;

    if (Math.random() < getMistakeChance() && ranked.length > 1) {
        const poolSize = Math.min(3, ranked.length);
        return ranked[Math.floor(Math.random() * poolSize)].move;
    }

    return ranked[0].move;
}

// ======================
// REPERTOIRE AI
// ======================

function getRepertoireMove() {
    const history = chess.history();

    for (const lesson of repertoireLessons) {
        const moves = lesson.moves;
        let match = true;

        for (let i = 0; i < history.length; i++) {
            if (normalizeSan(history[i]) !== normalizeSan(moves[i])) {
                match = false;
                break;
            }
        }

        if (match) {
            return moves[history.length] || null;
        }
    }

    return null;
}

// ======================
// ELO + RESULT
// ======================

function updateElo(result) {
    syncAiElo();

    const expected =
        1 / (1 + Math.pow(10, (aiElo - playerElo) / 400));

    playerElo = Math.round(playerElo + K_FACTOR * (result - expected));
    syncAiElo();

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

    document.getElementById("coach").innerText = `${msg} New ELO: ${playerElo}`;
    renderBoard();
}

// ======================
// PROFILE TRACKING
// ======================

function updatePlayerProfile(moveResult, beforeEval, afterEval) {
    const plies = chess.history().length;

    if (moveResult.piece === "q" && plies <= 6) {
        playerProfile.earlyQueenMoves += 1;
        currentGameStats.earlyQueenMoves += 1;
    }

    if ((moveResult.san.includes("+") || moveResult.san.includes("#")) && plies <= 10) {
        playerProfile.earlyAttacks += 1;
        currentGameStats.earlyAttacks += 1;
    }

    if (moveResult.piece === "p" && plies <= 10) {
        playerProfile.pawnRushes += 1;
        currentGameStats.pawnRushes += 1;
    }

    const diff = afterEval - beforeEval;
    const moverScore = moveResult.color === "w" ? diff : -diff;

    if (moverScore <= -3) {
        playerProfile.blunders += 1;
        currentGameStats.blunders += 1;
    } else if (moverScore <= -1) {
        playerProfile.mistakes += 1;
        currentGameStats.mistakes += 1;
    } else if (moverScore <= -0.3) {
        playerProfile.inaccuracies += 1;
        currentGameStats.inaccuracies += 1;
    } else if (moverScore >= 1) {
        playerProfile.goodMoves += 1;
        currentGameStats.goodMoves += 1;
    }
}

// ======================
// LESSON / THEORY COACHING
// ======================

function lessonCoachText(label, lesson, nextMove) {
    const sideText = lesson.side === "white" ? "White" : "Black";

    return [
        `${label}: ${lesson.opening} - ${lesson.branch}`,
        `Side: ${sideText}`,
        `Plan: ${lesson.plan}`,
        nextMove ? `Next: ${nextMove}` : `${label} complete!`,
        nextMove ? `Why: ${explainMove(nextMove)}` : "Why: Review the resulting position and the plan."
    ].join("\n");
}

function autoPlayLessonPrelude(lesson, label) {
    if (!lesson) return;

    const userColor = lessonUserColor(lesson);

    while (chess.turn() !== userColor) {
        const idx = chess.history().length;
        const san = lesson.moves[idx];

        if (!san) break;

        const move = chess.move(san);
        if (!move) break;

        lastMove = move;
    }

    syncLastMoveFromHistory();

    const next = lesson.moves[chess.history().length];
    const coachText = lessonCoachText(label, lesson, next || null);

    document.getElementById("coach").innerText = coachText;
    renderBoard();
}

function processLessonMove(lesson, label, moveResult) {
    clearTimeout(lessonTimeoutId);
    lessonTimeoutId = null;

    const history = chess.history();
    const expected = lesson.moves[history.length - 1];

    if (typeof expected === "undefined") {
        const completeText = `${label} complete!`;
        document.getElementById("coach").innerText = completeText;
        renderBoard();
        return;
    }

    if (normalizeSan(moveResult.san) !== normalizeSan(expected)) {
        alert(`Wrong move! Expected: ${expected}`);

        chess.undo();
        syncLastMoveFromHistory();
        renderBoard();
        return;
    }

    const nextSan = lesson.moves[history.length];

    let coachText = lessonCoachText(label, lesson, nextSan || null);
    const moveWhy = explainMove(moveResult.san);

    if (moveWhy) {
        coachText += `\n\nWhy this move: ${moveWhy}`;
    }

    document.getElementById("coach").innerText = coachText;
    speak(coachText);

    if (nextSan) {
        lessonTimeoutId = setTimeout(() => {
            if (chess.game_over()) return;

            const reply = chess.move(nextSan);
            if (!reply) return;

            lastMove = reply;
            syncLastMoveFromHistory();
            renderBoard();

            const newHistory = chess.history();
            const upcoming = lesson.moves[newHistory.length];

            const followupText = lessonCoachText(label, lesson, upcoming || null);
            document.getElementById("coach").innerText = followupText;

            lessonTimeoutId = null;
            saveProgress();
        }, 400);
    }

    renderBoard();
}

// ======================
// MOVE EXPLANATION
// ======================

function explainPlayedMove(moveResult, beforeEval, afterEval) {
    const diff = afterEval - beforeEval;
    const moverScore = moveResult.color === "w" ? diff : -diff;

    const parts = [];

    if (moveResult.san.includes("#")) {
        return "Checkmate. The game is over.";
    }

    if (moverScore <= -3) {
        parts.push("Blunder. You likely dropped material or a major advantage.");
    } else if (moverScore <= -1) {
        parts.push("Mistake. Your position got worse.");
    } else if (moverScore <= -0.3) {
        parts.push("Inaccuracy. A better move existed.");
    } else if (moverScore >= 3) {
        parts.push("Brilliant move. Big gain.");
    } else if (moverScore >= 1) {
        parts.push("Strong move. You improved the position.");
    } else if (moverScore >= 0.3) {
        parts.push("Good move. Slight improvement.");
    } else {
        parts.push("Solid move.");
    }

    if (["e4", "d4", "e5", "d5", "c4", "c5"].includes(moveResult.to)) {
        parts.push("It fights for the center.");
    }

    if (moveResult.piece === "n" || moveResult.piece === "b") {
        if (chess.history().length <= 12) {
            parts.push("It develops a piece.");
        } else {
            parts.push("It improves piece activity.");
        }
    }

    if (moveResult.piece === "q" && chess.history().length <= 10) {
        parts.push("Your queen is out early, so keep it safe.");
    }

    if (moveResult.piece === "p" && chess.history().length <= 10) {
        parts.push("This is a pawn push. Watch your structure.");
    }

    if (moveResult.captured) {
        parts.push("It wins material.");
    }

    if (moveResult.san.includes("+")) {
        parts.push("It gives check.");
    }

    if (parts.length === 0) {
        parts.push("Keep developing with purpose and stay true to the plan.");
    }

    return parts.join(" ");
}

// ======================
// ANALYSIS / OPENING IDENTIFICATION
// ======================

function getAnalysisCoachText() {
    const history = chess.history();
    const evalScore = evaluateBoard().toFixed(2);
    const bestText = bestMoveHighlight
        ? `Best: ${bestMoveHighlight.san} — ${explainMove(bestMoveHighlight.san)}`
        : "";

    const match = findBestRepertoireMatch(history);

    if (!match) {
        return [
            "Opening: Unrecognized",
            `Eval: ${evalScore}`,
            bestText
        ].filter(Boolean).join("\n");
    }

    return [
        `Opening: ${match.opening}`,
        `Branch: ${match.branch}`,
        `In book: ${match.matchedPlies}/${match.moves.length} plies`,
        `Plan: ${match.plan}`,
        `Eval: ${evalScore}`,
        bestText
    ].filter(Boolean).join("\n");
}

// ======================
// GAME REVIEW
// ======================

let gameReview = [];

function gradeMove(diff) {
    if (diff <= -3) return "??";
    if (diff <= -1) return "?";
    if (diff < 0.3) return "✓";
    if (diff < 1.5) return "!";
    return "!!";
}

function generateGameReview() {
    let blunders = 0;
    let mistakes = 0;
    let inaccuracies = 0;
    let greatMoves = 0;
    let totalLoss = 0;

    let reviewText = "📊 GAME REVIEW\n\n";

    gameReview.forEach(entry => {
        const grade = gradeMove(entry.diff);

        if (grade === "??") blunders++;
        else if (grade === "?") mistakes++;
        else if (grade === "✓") inaccuracies++;
        else greatMoves++;

        totalLoss += Math.abs(entry.diff);

        reviewText += `Move ${entry.moveNumber}: ${entry.move} ${grade}\n`;

        if (grade === "??") {
            reviewText += `   ❌ Blunder. Best was ${entry.bestMove}\n`;
        } else if (grade === "?") {
            reviewText += `   ⚠️ Better was ${entry.bestMove}\n`;
        } else if (grade === "!!") {
            reviewText += `   🔥 Excellent move!\n`;
        }
    });

    const avgLoss = gameReview.length ? (totalLoss / gameReview.length).toFixed(2) : "0.00";
    const accuracy = Math.max(0, 100 - (avgLoss * 10)).toFixed(0);

    reviewText += "\n====================\n";
    reviewText += `Accuracy: ${accuracy}%\n`;
    reviewText += `Blunders: ${blunders}\n`;
    reviewText += `Mistakes: ${mistakes}\n`;
    reviewText += `Inaccuracies: ${inaccuracies}\n`;
    reviewText += `Great Moves: ${greatMoves}\n`;

    const history = gameReview.map(m => m.move);
    const match = findBestRepertoireMatch(history);

    if (match) {
        reviewText += `\n📖 Opening: ${match.opening} (${match.branch})\n`;
        reviewText += `Plan: ${match.plan}\n`;
    }

    reviewText += "\n🧠 Coaching Summary:\n";

    if (currentGameStats.pawnRushes > 3) {
        reviewText += "- Too many pawn pushes early\n";
    }

    if (currentGameStats.earlyQueenMoves > 2) {
        reviewText += "- Queen developed too early\n";
    }

    if (blunders > 2) {
        reviewText += "- Major issue: Blunders. Slow down and calculate.\n";
    } else if (mistakes > 3) {
        reviewText += "- Improve consistency in move quality.\n";
    } else {
        reviewText += "- Solid overall performance.\n";
    }

    return reviewText;
}

function endGameReview() {
    if (gameReviewShown) return;
    gameReviewShown = true;

    const review = generateGameReview();
    document.getElementById("coach").innerText = review;
    alert(review);
    gameReview = [];
}

// ======================
// BOARD RENDER
// ======================

function refreshHints() {
    lessonMoveHighlight = null;

    const activeLesson = getActiveLesson();

    if (activeLesson && (currentMode === "training" || currentMode === "theory")) {
        const nextSan = activeLesson.moves[chess.history().length];
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
            const displayR = flipped ? 7 - r : r;
            const displayC = flipped ? 7 - c : c;

            const square = document.createElement("div");
            square.classList.add("square", (r + c) % 2 === 0 ? "light" : "dark");

            const piece = board[displayR][displayC];

            if (piece) {
                const img = document.createElement("img");
                img.src = getPieceImage(piece);
                img.classList.add("piece-img");
                square.appendChild(img);
            }

            const actualSq = coordsToSquare(displayR, displayC);

            if (selectedSquare && selectedSquare.row === displayR && selectedSquare.col === displayC) {
                square.classList.add("selected");
            }

            if (lastMove) {
                if (actualSq === lastMove.from || actualSq === lastMove.to) {
                    square.classList.add("last-move");
                }
            }

            if (lessonMoveHighlight) {
                if (actualSq === lessonMoveHighlight.from || actualSq === lessonMoveHighlight.to) {
                    square.classList.add("lesson-move");
                }
            }

            if (bestMoveHighlight) {
                if (actualSq === bestMoveHighlight.from || actualSq === bestMoveHighlight.to) {
                    square.classList.add("best-move");
                }
            }

            if (selectedSquare) {
                const moves = chess.moves({
                    square: coordsToSquare(selectedSquare.row, selectedSquare.col),
                    verbose: true
                });

                if (moves.some(move => move.to === actualSq)) {
                    square.classList.add("legal");
                }
            }

            square.onclick = () => handleClick(displayR, displayC);
            boardDiv.appendChild(square);
        }
    }

    updateUI();
}

// ======================
// CLICK LOGIC
// ======================

function handleClick(r, c) {
    if ((currentMode === "training" || currentMode === "theory") && lessonTimeoutId) {
        return;
    }

    const sq = coordsToSquare(r, c);

    if (!selectedSquare) {
        const piece = chess.get(sq);
        const userColor = getCurrentUserColor();

        if (piece && (
            currentMode === "analysis" ||
            (piece.color === userColor && chess.turn() === userColor)
        )) {
            selectedSquare = { row: r, col: c };
            renderBoard();
        }

        return;
    }

    const beforeEval = evaluateBoard();
    const bestBeforeMove = findBestMove();

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

    const afterEval = evaluateBoard();

    // Track current game review
    gameReview.push({
        move: moveResult.san,
        piece: moveResult.piece,
        color: moveResult.color,
        before: beforeEval,
        after: afterEval,
        diff: afterEval - beforeEval,
        moveNumber: chess.history().length,
        bestMove: bestBeforeMove ? bestBeforeMove.san : null
    });

    updatePlayerProfile(moveResult, beforeEval, afterEval);

    if (currentMode === "computer") {
        const explanation = explainPlayedMove(moveResult, beforeEval, afterEval);
        document.getElementById("coach").innerText = explanation;
        speak(explanation);
    }

    if (currentMode === "training" && trainingLine) {
        processLessonMove(trainingLine, "Training", moveResult);
        saveProgress();
        if (chess.game_over()) endGameReview();
        return;
    }

    if (currentMode === "theory" && theoryLine) {
        processLessonMove(theoryLine, "Theory", moveResult);
        saveProgress();
        if (chess.game_over()) endGameReview();
        return;
    }

    if (currentMode === "analysis") {
        const explanation = explainPlayedMove(moveResult, beforeEval, afterEval);
        document.getElementById("coach").innerText = explanation;
        speak(explanation);
    }

    saveProgress();
    renderBoard();

    maybeFinalizeComputerGame();

    if (currentMode === "computer" && !chess.game_over()) {
        setTimeout(aiMove, 400);
    }

    if (chess.game_over()) {
        endGameReview();
    }
}

// ======================
// AI
// ======================

function getCommonFirstResponse() {
    const responses = [
        { move: "e5", weight: 50 },
        { move: "c5", weight: 25 },
        { move: "e6", weight: 15 },
        { move: "c6", weight: 10 }
    ];

    const pool = [];
    responses.forEach(entry => {
        for (let i = 0; i < entry.weight; i++) {
            pool.push(entry.move);
        }
    });

    return pool[Math.floor(Math.random() * pool.length)];
}

function aiMove() {
    const history = chess.history();
    const moveNumber = history.length;

    const repMoveSan = getRepertoireMove();

    let repertoireChance = 0.5;
    if (moveNumber > 6) repertoireChance = 0.5;
    if (moveNumber > 10) repertoireChance = 0.3;

    if (currentMode === "computer" && repMoveSan && Math.random() < repertoireChance) {
        const beforeEval = evaluateBoard();
        const bestBeforeMove = findBestMove();

        const move = findLegalMoveBySan(repMoveSan);

        if (move) {
            const played = chess.move(move);
            lastMove = played;

            const afterEval = evaluateBoard();

            gameReview.push({
                move: played.san,
                piece: played.piece,
                color: played.color,
                before: beforeEval,
                after: afterEval,
                diff: afterEval - beforeEval,
                moveNumber: chess.history().length,
                bestMove: bestBeforeMove ? bestBeforeMove.san : null
            });

            const text = `Repertoire move: ${played.san}. ${explainMove(played.san)}`;
            document.getElementById("coach").innerText = text;
            speak(text);

            renderBoard();
            maybeFinalizeComputerGame();
            if (chess.game_over()) endGameReview();
            return;
        }
    }

    const beforeEval = evaluateBoard();
    const bestBeforeMove = findBestMove();

    const best = chooseAiMove();
    if (!best) return;

    const move = chess.move(best);
    lastMove = move;

    const afterEval = evaluateBoard();

    gameReview.push({
        move: move.san,
        piece: move.piece,
        color: move.color,
        before: beforeEval,
        after: afterEval,
        diff: afterEval - beforeEval,
        moveNumber: chess.history().length,
        bestMove: bestBeforeMove ? bestBeforeMove.san : null
    });

    renderBoard();
    maybeFinalizeComputerGame();

    if (chess.game_over()) endGameReview();
}

// ======================
// BEST MOVE
// ======================

function showBestMove() {
    bestMoveHighlight = chess.game_over() ? null : findBestMove();
    renderBoard();

    if (bestMoveHighlight) {
        const text = `Best move: ${bestMoveHighlight.san}. ${explainMove(bestMoveHighlight.san)}`;
        document.getElementById("coach").innerText = text;
        speak(text);
    }
}

// ======================
// CONTROLS
// ======================

function flipBoard() {
    flipped = !flipped;
    renderBoard();
}

function resignGame() {
    if (chess.game_over()) return;

    if (currentMode === "computer") {
        gameResultRecorded = true;
        updateElo(false);
    }

    const text = "You resigned.";
    document.getElementById("coach").innerText = text;
    speak(text);

    endGameReview();

    setTimeout(() => {
        resetGame();
    }, 700);
}

// ======================
// UI
// ======================

function updateUI() {
    const evalScore = evaluateBoard();

    const modeLabel =
        currentMode === "computer" ? "Computer" :
        currentMode === "theory" ? "Theory" :
        currentMode === "training" ? "Training" :
        "Analysis";

    document.getElementById("status").innerText =
        (chess.turn() === "w" ? "White" : "Black") +
        " to Move | ELO: " + playerElo +
        " | Eval: " + evalScore.toFixed(2) +
        " | Mode: " + modeLabel +
        (flipped ? " | Flipped" : "");

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    const percent = Math.max(0, Math.min(100, 50 + (evalScore * 5)));
    const evalFill = document.getElementById("evalFill");
    if (evalFill) {
        evalFill.style.height = percent + "%";
    }

    if (currentMode === "analysis") {
        document.getElementById("coach").innerText = getAnalysisCoachText();
    }

    adaptiveCoach();
    detectPositionPlan();
}

// ======================
// COACH
// ======================

function adaptiveCoach() {
    const history = chess.history();

    if (history.length === 0) {
        document.getElementById("adaptiveCoach").innerText = "Ready for battle.";
        return;
    }

    if (history.length === 1) {
        document.getElementById("adaptiveCoach").innerText =
            "Good start. Control the center and develop your pieces.";
        return;
    }

    const messages = [];

    if (currentGameStats.pawnRushes > 3) {
        messages.push("You're pushing too many pawns. Develop pieces instead.");
    }

    if (currentGameStats.earlyQueenMoves > 1) {
        messages.push("Your queen is coming out too early.");
    }

    if (currentGameStats.blunders > 0) {
        messages.push("You've made a blunder. Watch your pieces.");
    }

    if (currentGameStats.mistakes > 1) {
        messages.push("Too many mistakes. Slow down.");
    }

    if (currentGameStats.goodMoves > currentGameStats.mistakes) {
        messages.push("You're playing solid chess.");
    }

    if (messages.length === 0) {
        messages.push("Balanced position. Keep improving.");
    }

    const advice = messages[Math.floor(Math.random() * messages.length)];
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

    gameResultRecorded = false;

    if (currentMode === "training") {
        trainingLine = pickRandomLesson();
        theoryLine = null;
    } else if (currentMode === "theory") {
        theoryLine = pickRandomLesson();
        trainingLine = null;
    } else {
        trainingLine = null;
        theoryLine = null;
    }

    resetGame();

    if (currentMode === "analysis") {
        const text = "Analysis board active.";
        document.getElementById("coach").innerText = text;
        speak(text);
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
    gameReviewShown = false;
    gameReview = [];
    currentGameStats = resetGameStats();

    if (currentMode === "training" && trainingLine) {
        autoPlayLessonPrelude(trainingLine, "Training");
        return;
    }

    if (currentMode === "theory" && theoryLine) {
        autoPlayLessonPrelude(theoryLine, "Theory");
        return;
    }

    renderBoard();
}

// ======================
// INIT
// ======================

loadProgress();
syncAiElo();
renderBoard();
