let currentMode = "computer";

const chess = new Chess();

let playerProfile = {
    earlyQueenMoves: 0,
    earlyAttacks: 0,
    pawnRushes: 0,
    gamesPlayed: 0
};

let selectedSquare = null;
let lastMove = null;

/*
========================
PIECE IMAGES
========================
*/
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

/*
========================
POSITION PLANS
========================
*/
const positionPlans = {

    advanceFrench: {
        condition: () =>
            chess.get("e5") &&
            chess.get("d4") &&
            chess.get("c3"),

        advice:
            "Advance French: Space advantage. Attack kingside, prepare for c5."
    },

    kingsideAttack: {
        condition: () =>
            chess.get("f4") ||
            chess.get("g4") ||
            chess.get("h4"),

        advice:
            "Kingside attack: Bring rook to f-file and attack enemy king."
    },

    developedCenter: {
        condition: () =>
            chess.get("e4") &&
            chess.get("d4") &&
            chess.get("f3"),

        advice:
            "Strong center: Develop quickly and castle."
    },

    openCenter: {
        condition: () =>
            !chess.get("d4") &&
            !chess.get("e4"),

        advice:
            "Open center: Activate pieces and look for tactics."
    },

    randomPlay: {
        condition: () =>
            chess.history().length > 6,

        advice:
            "No clear plan: Improve development and coordination."
    }
};

/*
========================
OPENING THEORY
========================
*/
const openingLines = [
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","d4"],
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","Nxe5"],
    ["d4","Nf6","c4","g6"],
    ["e4","Nf6"]
];

/*
========================
RENDER BOARD
========================
*/
function renderBoard(){

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const currentBoard = chess.board();

    for(let row=0; row<8; row++){
        for(let col=0; col<8; col++){

            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add((row+col)%2===0 ? "light":"dark");

            const squareName = coordsToSquare(row,col);
            const piece = currentBoard[row][col];

            // LAST MOVE HIGHLIGHT
            if(lastMove &&
               (squareName === lastMove.from || squareName === lastMove.to)){
                square.classList.add("last-move");
            }

            if(piece){

                const img = document.createElement("img");

                img.src =
                    pieceImages[
                        piece.color === "w"
                            ? piece.type.toUpperCase()
                            : piece.type
                    ];

                img.classList.add("piece-img");

                square.appendChild(img);
            }

            if(selectedSquare &&
               selectedSquare.row===row &&
               selectedSquare.col===col){
                square.classList.add("selected");
            }

            if(selectedSquare){

                const moves = chess.moves({
                    square: coordsToSquare(
                        selectedSquare.row,
                        selectedSquare.col
                    ),
                    verbose:true
                });

                if(moves.some(
                    move => move.to === coordsToSquare(row,col)
                )){
                    square.classList.add("legal");
                }
            }

            square.onclick = () => handleClick(row,col);

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
function handleClick(row,col){

    const clickedSquare = coordsToSquare(row,col);

    if(!selectedSquare){

        const piece = chess.get(clickedSquare);

        if(piece && piece.color==="w"){
            selectedSquare = {row,col};
            renderBoard();
        }

        return;
    }

    const move = chess.move({
        from: coordsToSquare(
            selectedSquare.row,
            selectedSquare.col
        ),
        to: clickedSquare,
        promotion:"q"
    });

    if(move){

        lastMove = {
            from: move.from,
            to: move.to
        };

        if(move.piece==="q" && chess.history().length<10){
            playerProfile.earlyQueenMoves++;
        }

        if(move.san.includes("+") && chess.history().length<12){
            playerProfile.earlyAttacks++;
        }

        if(move.piece==="p"){
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

    if(!chess.game_over() && currentMode==="computer"){
        setTimeout(aiMove,500);
    }
}

/*
========================
AI MOVE
========================
*/
function aiMove(){

    const moves = chess.moves({verbose:true});

    const randomMove =
        moves[Math.floor(Math.random()*moves.length)];

    chess.move(randomMove);

    lastMove = {
        from: randomMove.from,
        to: randomMove.to
    };

    renderBoard();
}

/*
========================
COACH
========================
*/
function coachPlayer(){

    const history = chess.history();

    let matched = false;

    for(let line of openingLines){

        let partial = line.slice(0, history.length);

        if(JSON.stringify(history) === JSON.stringify(partial)){
            matched = true;

            document.getElementById("coach").innerText =
                "Excellent. You are following theory.";

            return;
        }
    }

    if(!matched){
        document.getElementById("coach").innerText =
            "You have deviated from your opening prep.";
    }
}

/*
========================
ADAPTIVE COACH
========================
*/
function adaptiveCoach(){

    let advice = "Balanced play detected.";

    if(playerProfile.earlyQueenMoves > 3){
        advice = "You move your queen early. Develop pieces first.";
    }

    else if(playerProfile.earlyAttacks > 5){
        advice = "You attack too early. Build your position.";
    }

    else if(playerProfile.pawnRushes > 10){
        advice = "Too many pawn pushes. Watch structure.";
    }

    document.getElementById("adaptiveCoach").innerText = advice;
}

/*
========================
POSITION PLAN
========================
*/
function detectPositionPlan(){

    for(let key in positionPlans){

        if(positionPlans[key].condition()){

            document.getElementById("positionPlan").innerText =
                positionPlans[key].advice;

            return;
        }
    }

    document.getElementById("positionPlan").innerText =
        "No clear structure detected.";
}

/*
========================
UI UPDATE
========================
*/
function updateUI(){

    document.getElementById("status").innerText =
        chess.turn()==="w"
        ?"White to Move"
        :"Black to Move";

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    adaptiveCoach();
    detectPositionPlan();
}

/*
========================
HELPERS
========================
*/
function coordsToSquare(row,col){
    return "abcdefgh"[col] + (8-row);
}

/*
========================
RESET
========================
*/
function resetGame(){

    chess.reset();
    selectedSquare = null;
    lastMove = null;

    document.getElementById("coach").innerText =
        "Ready for battle.";

    renderBoard();
}

/*
========================
MODE SWITCH
========================
*/
function changeMode(){

    currentMode =
        document.getElementById("gameMode").value;

    resetGame();
}

/*
========================
START
========================
*/
renderBoard();
