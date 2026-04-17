// ======================
// GAME SETUP
// ======================

let currentMode = "computer";
const chess = new Chess();

let selectedSquare = null;
let lastMove = null;
let bestMoveHighlight = null;

// ======================
// PLAYER + ELO
// ======================

let playerElo = 1200;

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
// THEORY MODE
// ======================

const openingLines = [
    {
        name: "Four Knights Game",
        moves: ["e4","e5","Nf3","Nc6","Nc3","Nf6"]
    },
    {
        name: "Scotch Game",
        moves: ["e4","e5","Nf3","Nc6","d4"]
    }
];

let theoryLine = null;
let theoryIndex = 0;

// ======================
// SAVE / LOAD
// ======================

function saveProgress(){
    localStorage.setItem("chessCoachData", JSON.stringify({
        playerProfile,
        playerElo
    }));
}

function loadProgress(){
    const data = JSON.parse(localStorage.getItem("chessCoachData"));
    if(data){
        playerProfile = data.playerProfile || playerProfile;
        playerElo = data.playerElo || 1200;
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
            square.classList.add("square",(r+c)%2===0?"light":"dark");

            const piece = board[r][c];

            if(piece){
                const img = document.createElement("img");
                img.src = getPieceImage(piece);
                img.classList.add("piece-img");
                square.appendChild(img);
            }

            // Selected
            if(selectedSquare && selectedSquare.row===r && selectedSquare.col===c){
                square.classList.add("selected");
            }

            // Last move
            if(lastMove){
                const sq = coordsToSquare(r,c);
                if(sq===lastMove.from || sq===lastMove.to){
                    square.classList.add("last-move");
                }
            }

            // Best move highlight
            if(bestMoveHighlight){
                const sq = coordsToSquare(r,c);
                if(sq===bestMoveHighlight.from || sq===bestMoveHighlight.to){
                    square.classList.add("best-move");
                }
            }

            // Legal moves
            if(selectedSquare){
                const moves = chess.moves({
                    square: coordsToSquare(selectedSquare.row,selectedSquare.col),
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

    if(!selectedSquare){
        const piece = chess.get(sq);

        if(piece && (currentMode==="analysis" || piece.color==="w")){
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
    bestMoveHighlight = null;

    if(!moveResult){
        renderBoard();
        return;
    }

    lastMove = moveResult;

    const afterEval = evaluateBoard();

    if(afterEval < beforeEval - 2){
        document.getElementById("coach").innerText =
            "Blunder: You lost material!";
    }

    // TRAINING MODE
    if(currentMode==="training" && trainingLine){
        const expected = trainingLine.moves[trainingIndex];

        if(moveResult.san !== expected){
            alert("Wrong move! Expected: " + expected);
            chess.undo();
            renderBoard();
            return;
        }

        trainingIndex++;

        if(trainingIndex >= trainingLine.moves.length){
            document.getElementById("coach").innerText = "Training complete!";
        }
    }

    // THEORY MODE
    if(currentMode==="theory" && theoryLine){

        const expectedMove = theoryLine.moves[theoryIndex];

        if(moveResult.san !== expectedMove){
            alert("Wrong move! Expected: " + expectedMove);
            chess.undo();
            renderBoard();
            return;
        }

        theoryIndex++;

        if(theoryIndex < theoryLine.moves.length){

            const opponentMove = theoryLine.moves[theoryIndex];

            setTimeout(()=>{
                const move = chess.move(opponentMove);
                lastMove = move;

                theoryIndex++;

                renderBoard();

                if(theoryIndex < theoryLine.moves.length){
                    document.getElementById("coach").innerText =
                        "Next: " + theoryLine.moves[theoryIndex];
                } else {
                    document.getElementById("coach").innerText =
                        "🔥 Theory complete!";
                }

            },400);

            return;
        }
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
// BEST MOVE
// ======================

function showBestMove(){

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

    bestMoveHighlight = bestMove;
    renderBoard();
}

// ======================
// EVALUATION
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
// UI
// ======================

function updateUI(){

    const evalScore = evaluateBoard();

    document.getElementById("status").innerText =
        (chess.turn()==="w" ? "White" : "Black") +
        " to Move | ELO: " + playerElo +
        " | Eval: " + evalScore.toFixed(2);

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    adaptiveCoach();
}

// ======================
// COACH
// ======================

function adaptiveCoach(){

    let advice = "Balanced play.";

    if(playerProfile.earlyQueenMoves > 3){
        advice = "Stop moving your queen early.";
    }

    document.getElementById("adaptiveCoach").innerText = advice;
}

// ======================
// MODE SWITCH
// ======================

function changeMode(){

    currentMode = document.getElementById("gameMode").value;

    resetGame();

    if(currentMode==="training"){
        trainingLine = trainingLines[Math.floor(Math.random()*trainingLines.length)];
        trainingIndex = 0;

        document.getElementById("coach").innerText =
            "Training: " + trainingLine.name;
    }

    if(currentMode==="theory"){
        theoryLine = openingLines[Math.floor(Math.random()*openingLines.length)];
        theoryIndex = 0;

        document.getElementById("coach").innerText =
            "Play: " + theoryLine.moves[0];
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
    bestMoveHighlight = null;
    renderBoard();
}

// ======================
// INIT
// ======================

loadProgress();
renderBoard();
