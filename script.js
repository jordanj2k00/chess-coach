let currentMode = "computer";
const chess = new Chess();

let selectedSquare = null;
let lastMove = null;

/* PLAYER PROFILE */
let playerProfile = {
    earlyQueenMoves: 0,
    earlyAttacks: 0,
    pawnRushes: 0
};

/* POSITION PLANS */
const positionPlans = {

    advanceFrench: {
        condition: () =>
            chess.get("e5") && chess.get("d4"),
        advice:
            "Advance French: Space advantage. Attack kingside and control center."
    },

    kingsideAttack: {
        condition: () =>
            chess.get("f4") || chess.get("g4") || chess.get("h4"),
        advice:
            "Kingside attack: Bring rook to f-file and attack the king."
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
            "Open center: Focus on development and tactics."
    }

};

/* OPENING THEORY */
const openingLines = [
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","d4"],
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","Nxe5"],
    ["d4","Nf6","c4","g6"],
    ["e4","Nf6"]
];

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

/* RENDER BOARD */
function renderBoard(){

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const board = chess.board();

    for(let row=0; row<8; row++){
        for(let col=0; col<8; col++){

            const square = document.createElement("div");

            square.classList.add("square");
            square.classList.add((row+col)%2===0 ? "light" : "dark");

            const piece = board[row][col];

            if(piece){
                const img = document.createElement("img");

                img.src = pieceImages[
                    piece.color === "w"
                    ? piece.type.toUpperCase()
                    : piece.type
                ];

                img.classList.add("piece-img");
                square.appendChild(img);
            }

            /* SELECTED */
            if(
                selectedSquare &&
                selectedSquare.row === row &&
                selectedSquare.col === col
            ){
                square.classList.add("selected");
            }

            /* LEGAL MOVES */
            if(selectedSquare){

                const moves = chess.moves({
                    square: coordsToSquare(
                        selectedSquare.row,
                        selectedSquare.col
                    ),
                    verbose: true
                });

                if(
                    moves.some(
                        move => move.to === coordsToSquare(row,col)
                    )
                ){
                    square.classList.add("legal");
                }
            }

            /* LAST MOVE */
            const squareName = coordsToSquare(row,col);

            if(lastMove){
                if(squareName === lastMove.from){
                    square.classList.add("last-from");
                }
                if(squareName === lastMove.to){
                    square.classList.add("last-to");
                }
            }

            square.onclick = () => handleClick(row,col);

            boardDiv.appendChild(square);
        }
    }

    updateUI();
}

/* HANDLE CLICK */
function handleClick(row,col){

    const clicked = coordsToSquare(row,col);

    if(!selectedSquare){

        const piece = chess.get(clicked);

        if(piece && piece.color === "w"){
            selectedSquare = {row,col};
            renderBoard();
        }

        return;
    }

    const move = chess.move({
        from: coordsToSquare(selectedSquare.row, selectedSquare.col),
        to: clicked,
        promotion: "q"
    });

    if(move){

        lastMove = move;

        if(move.piece === "q" && chess.history().length < 10){
            playerProfile.earlyQueenMoves++;
        }

        if(move.san.includes("+") && chess.history().length < 12){
            playerProfile.earlyAttacks++;
        }

        if(move.piece === "p"){
            playerProfile.pawnRushes++;
        }
    }

    selectedSquare = null;

    if(!move){
        renderBoard();
        return;
    }

    renderBoard();
    coachPlayer();

    if(!chess.game_over() && currentMode === "computer"){
        setTimeout(aiMove, 400);
    }
}

/* AI MOVE (SMARTER) */
function aiMove(){

    const moves = chess.moves({ verbose: true });

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

    if(!bestMove) return;

    const move = chess.move(bestMove);
    lastMove = move;

    renderBoard();
}

/* BOARD EVALUATION */
function evaluateBoard(){

    let total = 0;

    const board = chess.board();

    for(let row of board){
        for(let piece of row){

            if(piece){
                let value = getPieceValue(piece);
                total += piece.color === "w" ? value : -value;
            }
        }
    }

    return total;
}

/* PIECE VALUES */
function getPieceValue(piece){

    const values = {
        p:10,
        n:30,
        b:30,
        r:50,
        q:90,
        k:900
    };

    return values[piece.type];
}

/* OPENING COACH */
function coachPlayer(){

    const history = chess.history();

    for(let line of openingLines){

        let partial = line.slice(0, history.length);

        if(JSON.stringify(history) === JSON.stringify(partial)){

            document.getElementById("coach").innerText =
                "Excellent. You are following theory.";

            return;
        }
    }

    document.getElementById("coach").innerText =
        "You have deviated from your opening prep.";
}

/* ADAPTIVE COACH */
function adaptiveCoach(){

    let advice = "Balanced play detected. Keep developing.";

    if(playerProfile.earlyQueenMoves > 3){
        advice = "Stop moving your queen early. Develop pieces first.";
    }
    else if(playerProfile.earlyAttacks > 5){
        advice = "You attack too early. Build position first.";
    }
    else if(playerProfile.pawnRushes > 10){
        advice = "Too many pawn pushes. Watch your structure.";
    }

    document.getElementById("adaptiveCoach").innerText = advice;
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
        "No clear plan detected.";
}

/* UPDATE UI */
function updateUI(){

    document.getElementById("status").innerText =
        chess.turn() === "w"
        ? "White to Move"
        : "Black to Move";

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    adaptiveCoach();
    detectPositionPlan();
}

/* HELPERS */
function coordsToSquare(row,col){
    return "abcdefgh"[col] + (8-row);
}

/* RESET */
function resetGame(){

    chess.reset();
    selectedSquare = null;
    lastMove = null;

    document.getElementById("coach").innerText =
        "Ready for battle.";

    renderBoard();
}

/* MODE CHANGE */
function changeMode(){
    currentMode = document.getElementById("gameMode").value;
    resetGame();
}

/* INIT */
renderBoard();
