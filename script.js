// ======================
// GAME SETUP
// ======================

let currentMode = "computer";
const chess = new Chess();

let selectedSquare = null;
let lastMove = null;

// ======================
// ELO SYSTEM
// ======================

let playerElo = 1200;
let aiElo = 1300;
const K_FACTOR = 32;

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
// OPENING THEORY DATABASE
// ======================

const openingLines = [
    {
        name: "Four Knights Game",
        moves: ["e4","e5","Nf3","Nc6","Nc3","Nf6"]
    },
    {
        name: "Four Knights Scotch",
        moves: ["e4","e5","Nf3","Nc6","Nc3","Nf6","d4"]
    },
    {
        name: "Alekhine Defense",
        moves: ["e4","Nf6"]
    },
    {
        name: "King's Indian Defense",
        moves: ["d4","Nf6","c4","g6"]
    }
];

// ======================
// SAVE / LOAD
// ======================

function saveProgress(){
    const data = {
        playerElo,
        trainingIndex,
        trainingLine
    };
    localStorage.setItem("chessCoachData", JSON.stringify(data));
}

function loadProgress(){
    const saved = localStorage.getItem("chessCoachData");
    if(saved){
        const data = JSON.parse(saved);
        playerElo = data.playerElo || 1200;
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

            if(selectedSquare && selectedSquare.row===r && selectedSquare.col===c){
                square.classList.add("selected");
            }

            if(lastMove){
                const sq = coordsToSquare(r,c);
                if(sq===lastMove.from || sq===lastMove.to){
                    square.classList.add("last-move");
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
        if(piece && piece.color==="w"){
            selectedSquare = {row:r,col:c};
            renderBoard();
        }
        return;
    }

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

    // ======================
    // TRAINING MODE
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

        if(trainingIndex < trainingLine.moves.length){
            const opponentMove = trainingLine.moves[trainingIndex];

            setTimeout(()=>{
                const move = chess.move(opponentMove);
                lastMove = move;
                renderBoard();
            },400);

            trainingIndex++;
        }

        if(trainingIndex < trainingLine.moves.length){
            document.getElementById("coach").innerText =
                "Play: " + trainingLine.moves[trainingIndex];
        } else {
            document.getElementById("coach").innerText =
                "Training complete!";
        }

        saveProgress();
        return;
    }

    // ======================
    // THEORY MODE (NEW)
    // ======================

    if(currentMode==="theory"){
        checkOpeningTheory();
    }

    renderBoard();

    if(currentMode==="computer"){
        setTimeout(aiMove,400);
    }
}

// ======================
// THEORY CHECK FUNCTION
// ======================

function checkOpeningTheory(){

    const history = chess.history();

    for(let line of openingLines){

        let partial = line.moves.slice(0, history.length);

        if(JSON.stringify(history) === JSON.stringify(partial)){

            document.getElementById("coach").innerText =
                "Following theory: " + line.name;
            return;
        }
    }

    document.getElementById("coach").innerText =
        "Out of theory.";
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

    document.getElementById("status").innerText =
        (chess.turn()==="w" ? "White to Move" : "Black to Move")
        + " | ELO: " + playerElo;

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");
}

// ======================
// MODE
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

    if(currentMode==="theory"){
        document.getElementById("coach").innerText =
            "Opening theory mode active.";
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
