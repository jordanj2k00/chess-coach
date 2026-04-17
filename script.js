let currentMode = "computer";

const chess = new Chess();

let selectedSquare = null;
let lastMove = null;

// TRAINING STATE
let trainingLine = null;
let trainingIndex = 0;

let playerProfile = {
    earlyQueenMoves: 0,
    earlyAttacks: 0,
    pawnRushes: 0
};

/* TRAINING LINES */
const trainingLines = [
    {
        name: "Four Knights Scotch",
        moves: ["e4","e5","Nf3","Nc6","Nc3","Nf6","d4"]
    },
    {
        name: "French Advance",
        moves: ["e4","e6","d4","d5","e5"]
    },
    {
        name: "King's Indian Defense",
        moves: ["d4","Nf6","c4","g6"]
    }
];

/* POSITION PLANS */
const positionPlans = {
    advanceFrench: {
        condition: () => chess.get("e5") && chess.get("d4"),
        advice: "Advance French: Space advantage. Attack kingside."
    },
    kingsideAttack: {
        condition: () => chess.get("f4") || chess.get("h4"),
        advice: "Kingside attack: Bring rook, open lines."
    },
    openCenter: {
        condition: () => !chess.get("d4") && !chess.get("e4"),
        advice: "Open center: Develop pieces quickly."
    }
};

/* PIECES */
const pieceImages = {
    p: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png",
    r: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png",
    n: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png",
    b: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png",
    q: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png",
    k: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png",

    P: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png",
    R: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png",
    N: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png",
    B: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png",
    Q: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png",
    K: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png"
};

/* BOARD RENDER */
function renderBoard(){

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const board = chess.board();

    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){

            const square = document.createElement("div");
            square.className = "square " + ((r+c)%2===0 ? "light" : "dark");

            const piece = board[r][c];

            if(piece){
                const img = document.createElement("img");
                img.src = pieceImages[
                    piece.color==="w"
                    ? piece.type.toUpperCase()
                    : piece.type
                ];
                img.classList.add("piece-img");
                square.appendChild(img);
            }

            // highlight last move
            if(lastMove){
                const from = lastMove.from;
                const to = lastMove.to;

                if(coordsToSquare(r,c) === from ||
                   coordsToSquare(r,c) === to){
                    square.classList.add("last-move");
                }
            }

            if(selectedSquare &&
               selectedSquare.row===r &&
               selectedSquare.col===c){
                square.classList.add("selected");
            }

            square.onclick = () => handleClick(r,c);

            boardDiv.appendChild(square);
        }
    }

    updateUI();
}

/* CLICK */
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

    const beforeEval = evaluateBoard();

    const moveObj = {
        from: coordsToSquare(selectedSquare.row, selectedSquare.col),
        to: sq,
        promotion: "q"
    };

    const moveResult = chess.move(moveObj);

    if(!moveResult){
        selectedSquare = null;
        renderBoard();
        return;
    }

    // TRAINING MODE
    if(currentMode === "training"){

        const moveSAN = moveResult.san;
        const expectedMove = trainingLine.moves[trainingIndex];

        if(moveSAN !== expectedMove){
            chess.undo();

            document.getElementById("coach").innerText =
                "❌ Expected: " + expectedMove;

            selectedSquare = null;
            renderBoard();
            return;
        }

        lastMove = moveResult;
        trainingIndex++;

        if(trainingIndex >= trainingLine.moves.length){
            document.getElementById("coach").innerText =
                "✅ Line complete!";
            renderBoard();
            return;
        }

        renderBoard();

        const opponentMove = trainingLine.moves[trainingIndex];
        const aiMoveResult = chess.move(opponentMove);

        lastMove = aiMoveResult;
        trainingIndex++;

        renderBoard();
        return;
    }

    // NORMAL PLAY
    lastMove = moveResult;

    const afterEval = evaluateBoard();

    if(afterEval < beforeEval - 20){
        document.getElementById("coach").innerText =
            "Blunder: You lost material!";
    }

    selectedSquare = null;
    renderBoard();

    if(!chess.game_over() && currentMode==="computer"){
        setTimeout(aiMove,400);
    }
}

/* AI */
function aiMove(){

    const moves = chess.moves({verbose:true});
    const move = moves[Math.floor(Math.random()*moves.length)];

    const result = chess.move(move);
    lastMove = result;

    renderBoard();
}

/* UI */
function updateUI(){

    document.getElementById("status").innerText =
        chess.turn()==="w" ? "White to Move" : "Black to Move";

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    detectPositionPlan();
}

/* POSITION PLAN */
function detectPositionPlan(){

    for(let key in positionPlans){
        if(positionPlans[key].condition()){
            document.getElementById("positionPlan").innerText =
                positionPlans[key].advice;
            return;
        }
    }

    document.getElementById("positionPlan").innerText =
        "No structure detected.";
}

/* MODE */
function changeMode(){

    currentMode = document.getElementById("gameMode").value;
    resetGame();

    if(currentMode==="training"){
        trainingLine =
            trainingLines[Math.floor(Math.random()*trainingLines.length)];
        trainingIndex = 0;

        document.getElementById("coach").innerText =
            "Training: " + trainingLine.name;
    }
}

/* RESET */
function resetGame(){
    chess.reset();
    selectedSquare = null;
    lastMove = null;
    renderBoard();
}

/* UTILS */
function coordsToSquare(r,c){
    return "abcdefgh"[c] + (8-r);
}

/* SIMPLE EVAL */
function evaluateBoard(){

    const values = {
        p:1,n:3,b:3,r:5,q:9,k:0
    };

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

renderBoard();
