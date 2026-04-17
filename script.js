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
let currentMode = "computer";
const chess = new Chess();

let selectedSquare = null;
let lastMove = null;
let trainingLine = null;
let trainingIndex = 0;

/* PLAYER PROFILE */
let playerProfile = {
    earlyQueenMoves: 0,
    earlyAttacks: 0,
    pawnRushes: 0
};

/* OPENING DATABASE */
const openingNames = {
    "e4 e5 Nf3 Nc6 Nc3 Nf6": "Four Knights Game",
    "e4 e5 Nf3 Nc6 Nc3 Nf6 d4": "Four Knights Scotch",
    "e4 e6 d4 d5 e5": "French Defense: Advance",
    "d4 Nf6 c4 g6": "King's Indian Defense",
    "e4 Nf6": "Alekhine Defense"
};

/* POSITION PLANS */
const positionPlans = {
    center: {
        condition: () => chess.get("e4") && chess.get("d4"),
        advice: "Strong center: Develop pieces and attack."
    },
    kingside: {
        condition: () => chess.get("f4") || chess.get("g4"),
        advice: "Kingside attack forming. Bring rook to f-file."
    }
};

/* PIECE IMAGES */
const pieceImages = {
    p:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png",
    r:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png",
    n:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png",
    b:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png",
    q:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png",
    k:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png",

    P:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png",
    R:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png",
    N:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png",
    B:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png",
    Q:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png",
    K:"https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png"
};

/* RENDER */
function renderBoard(){
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const board = chess.board();

    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){

            const square = document.createElement("div");
            square.className = "square " + ((r+c)%2===0?"light":"dark");

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

            if(selectedSquare && selectedSquare.row===r && selectedSquare.col===c){
                square.classList.add("selected");
            }

            if(selectedSquare){
                const moves = chess.moves({
                    square: coordsToSquare(selectedSquare.row,selectedSquare.col),
                    verbose:true
                });

                if(moves.some(m=>m.to===coordsToSquare(r,c))){
                    square.classList.add("legal");
                }
            }

            const name = coordsToSquare(r,c);

            if(lastMove){
                if(name===lastMove.from) square.classList.add("last-from");
                if(name===lastMove.to) square.classList.add("last-to");
            }

            square.onclick = ()=>handleClick(r,c);
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
            selectedSquare={row:r,col:c};
            renderBoard();
        }
        return;
    }

    const beforeEval = evaluateBoard();

    const move = chess.move({
        from: coordsToSquare(selectedSquare.row,selectedSquare.col),
        to: sq,
        promotion:"q"
    });

    selectedSquare=null;

    if(!move){
        renderBoard();
        return;
    }

    lastMove = move;

    const afterEval = evaluateBoard();

    if(afterEval < beforeEval - 20){
        document.getElementById("coach").innerText =
            "Blunder: You lost material!";
    }

    renderBoard();

    if(!chess.game_over()){
        setTimeout(aiMove,400);
    }
}

/* AI */
function aiMove(){
    const moves = chess.moves({verbose:true});

    let bestMove=null;
    let bestValue=-9999;

    for(let m of moves){
        chess.move(m);
        let val = evaluateBoard();
        chess.undo();

        if(val>bestValue){
            bestValue=val;
            bestMove=m;
        }
    }

    if(!bestMove) return;

    const move = chess.move(bestMove);
    lastMove = move;

    renderBoard();
}

/* EVAL */
function evaluateBoard(){
    let total=0;
    const board = chess.board();

    for(let row of board){
        for(let p of row){
            if(p){
                let val = getPieceValue(p);
                total += p.color==="w"?val:-val;
            }
        }
    }
    return total;
}

function getPieceValue(p){
    return {p:10,n:30,b:30,r:50,q:90,k:900}[p.type];
}

/* BEST MOVE BUTTON */
function showBestMove(){
    const moves = chess.moves({verbose:true});

    let bestMove=null;
    let bestValue=-9999;

    for(let m of moves){
        chess.move(m);
        let val = evaluateBoard();
        chess.undo();

        if(val>bestValue){
            bestValue=val;
            bestMove=m;
        }
    }

    if(bestMove){
        document.getElementById("coach").innerText =
            "Best move: " + bestMove.from + " → " + bestMove.to;
    }
}

/* OPENING NAME */
function detectOpening(){
    const history = chess.history().join(" ");

    for(let line in openingNames){
        if(history.startsWith(line)){
            return openingNames[line];
        }
    }

    return null;
}

/* UPDATE UI */
function updateUI(){

    document.getElementById("status").innerText =
        chess.turn()==="w"?"White to Move":"Black to Move";

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    const opening = detectOpening();
    if(opening){
        document.getElementById("coach").innerText =
            "Opening: " + opening;
    }
}

/* HELPERS */
function coordsToSquare(r,c){
    return "abcdefgh"[c]+(8-r);
}

function resetGame(){
    chess.reset();
    lastMove=null;
    selectedSquare=null;
    renderBoard();
}

function changeMode(){
    currentMode=document.getElementById("gameMode").value;
    resetGame();
}

renderBoard();
