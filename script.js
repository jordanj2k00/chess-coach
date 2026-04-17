// ======================
// GAME SETUP
// ======================

let currentMode = "computer";
const chess = new Chess();

let selectedSquare = null;
let lastMove = null;

// ======================
// PLAYER PROFILE
// ======================

let playerProfile = {
    earlyQueenMoves: 0,
    earlyAttacks: 0,
    pawnRushes: 0,
    gamesPlayed: 0
};

// ======================
// TRAINING MODE
// ======================

const trainingLines = [
    {
        name: "Four Knights Scotch",
        moves: ["e4","e5","Nf3","Nc6","Nc3","Nf6","d4"]
    },
    {
        name: "Alekhine Defense",
        moves: ["e4","Nf6","e5","Nd5","d4"]
    }
];

let trainingLine = null;
let trainingIndex = 0;

// ======================
// POSITION PLANS
// ======================

const positionPlans = {

    kingsideAttack: {
        condition: () =>
            chess.get("f4") || chess.get("g4") || chess.get("h4"),

        advice:
            "Kingside attack detected: Bring rook to f-file and attack the king."
    },

    developedCenter: {
        condition: () =>
            chess.get("e4") && chess.get("d4"),

        advice:
            "Strong center: Develop pieces quickly and castle."
    },

    openCenter: {
        condition: () =>
            !chess.get("d4") && !chess.get("e4"),

        advice:
            "Open center: Activate pieces and look for tactics."
    }

};

// ======================
// SAVE / LOAD
// ======================

function saveProgress(){
    const data = {
        playerProfile,
        trainingIndex,
        trainingLine
    };
    localStorage.setItem("chessCoachData", JSON.stringify(data));
}

function loadProgress(){
    const saved = localStorage.getItem("chessCoachData");
    if(saved){
        const data = JSON.parse(saved);
        playerProfile = data.playerProfile || playerProfile;
        trainingIndex = data.trainingIndex || 0;
        trainingLine = data.trainingLine || null;
    }
}

// ======================
// BOARD RENDER
// ======================

function renderBoard(){

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const board = chess.board();

    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){

            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add((r+c)%2===0?"light":"dark");

            const piece = board[r][c];

            if(piece){
                const img = document.createElement("img");
                img.src = getPieceImage(piece);
                img.classList.add("piece-img");
                square.appendChild(img);
            }

            // SELECTED
            if(selectedSquare && selectedSquare.row===r && selectedSquare.col===c){
                square.classList.add("selected");
            }

            // LAST MOVE
            if(lastMove){
                const sq = coordsToSquare(r,c);
                if(sq===lastMove.from || sq===lastMove.to){
                    square.classList.add("last-move");
                }
            }

            // LEGAL MOVES
            if(selectedSquare){
                const moves = chess.moves({
                    square: coordsToSquare(selectedSquare.row, selectedSquare.col),
                    verbose:true
                });

                if(moves.some(m=>m.to===coordsToSquare(r,c))){
                    square.classList.add("legal");
                }
            }

            square.onclick = () => handleClick(r,c);

            boardDiv.appendChild(square);
        }
    }

    updateUI();
}

// ======================
// CLICK LOGIC
// ======================

function handleClick(r,c){

    const sq = coordsToSquare(r,c);

    // SELECT PIECE
    if(!selectedSquare){
        const piece = chess.get(sq);
        if(piece && piece.color==="w"){
            selectedSquare = {row:r,col:c};
            renderBoard();
        }
        return;
    }

    const beforeEval = evaluateBoard();

    const moveResult = chess.move({
        from: coordsToSquare(selectedSquare.row,selectedSquare.col),
        to: sq,
        promotion:"q"
    });

    selectedSquare = null;

    if(!moveResult){
        renderBoard();
        return;
    }

    lastMove = moveResult;

    const afterEval = evaluateBoard();

    // BLUNDER DETECTION
    if(afterEval < beforeEval - 2){
        document.getElementById("coach").innerText =
            "Blunder: You lost material!";
    }

    // ======================
    // TRAINING MODE (FIXED)
    // ======================

    if(currentMode==="training" && trainingLine){

        const expected = trainingLine.moves[trainingIndex];

        if(moveResult.san !== expected){
            alert("Wrong move! Expected: " + expected);
            chess.undo();
            renderBoard();
            return;
        }

        trainingIndex++;

        // Auto-play opponent move
        if(trainingIndex < trainingLine.moves.length){

            const opponentMove = trainingLine.moves[trainingIndex];

            setTimeout(()=>{
                const move = chess.move(opponentMove);
                lastMove = move;
                renderBoard();
            },400);

            trainingIndex++;
        }

        // Show next move
        if(trainingIndex < trainingLine.moves.length){
            document.getElementById("coach").innerText =
                "Play: " + trainingLine.moves[trainingIndex];
        }

        // Finished
        if(trainingIndex >= trainingLine.moves.length){
            document.getElementById("coach").innerText =
                "Training complete!";
        }

        saveProgress();
    }

    saveProgress();

    renderBoard();

    if(!chess.game_over() && currentMode==="computer"){
        setTimeout(aiMove,400);
    }
}

// ======================
// AI
// ======================

function aiMove(){

    const moves = chess.moves({ verbose:true });

    let bestMove = null;
    let bestValue = -9999;

    for(let move of moves){
        chess.move(move);
        let value = evaluateBoard();
        chess.undo();

        if(value > bestValue){
            bestValue = value;
            bestMove = move;
        }
    }

    const move = chess.move(bestMove);
    lastMove = move;

    renderBoard();
}

// ======================
// SIMPLE EVALUATION
// ======================

function evaluateBoard(){

    const values = {p:1,n:3,b:3,r:5,q:9,k:0};

    let score = 0;

    chess.board().forEach(row=>{
        row.forEach(piece=>{
            if(piece){
                score += piece.color==="w"
                    ? values[piece.type]
                    : -values[piece.type];
            }
        });
    });

    return score;
}

// ======================
// UI + COACH
// ======================

function updateUI(){

    document.getElementById("status").innerText =
        chess.turn()==="w" ? "White to Move" : "Black to Move";

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    adaptiveCoach();
    detectPositionPlan();
}

// ======================
// ADAPTIVE COACH
// ======================

function adaptiveCoach(){

    let advice = "Balanced play detected.";

    if(playerProfile.earlyQueenMoves > 3){
        advice = "You move your queen early. Develop first.";
    }
    else if(playerProfile.earlyAttacks > 5){
        advice = "You attack too early. Build position first.";
    }
    else if(playerProfile.pawnRushes > 10){
        advice = "Too many pawn pushes. Watch structure.";
    }

    document.getElementById("adaptiveCoach").innerText = advice;
}

// ======================
// POSITION PLAN
// ======================

function detectPositionPlan(){

    for(let key in positionPlans){
        if(positionPlans[key].condition()){
            document.getElementById("positionPlan").innerText =
                positionPlans[key].advice;
            return;
        }
    }

    document.getElementById("positionPlan").innerText =
        "No special structure recognized.";
}

// ======================
// MODE SWITCH
// ======================

function changeMode(){

    currentMode = document.getElementById("gameMode").value;

    resetGame();

    if(currentMode==="training"){
        trainingLine =
            trainingLines[Math.floor(Math.random()*trainingLines.length)];
        trainingIndex = 0;

        document.getElementById("coach").innerText =
            "Training: " + trainingLine.name +
            " | Play: " + trainingLine.moves[0];
    }
}

// ======================
// HELPERS
// ======================

function coordsToSquare(r,c){
    return "abcdefgh"[c] + (8-r);
}

function getPieceImage(piece){
    return `https://chessboardjs.com/img/chesspieces/wikipedia/${piece.color}${piece.type.toUpperCase()}.png`;
}

function resetGame(){
    chess.reset();
    lastMove = null;
    selectedSquare = null;
    renderBoard();
}

// ======================
// INIT
// ======================

loadProgress();
renderBoard();
