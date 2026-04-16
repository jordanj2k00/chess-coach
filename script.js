let currentMode = "computer";

const chess = new Chess();

let playerProfile = {
    earlyQueenMoves: 0,
    earlyAttacks: 0,
    pawnRushes: 0,
    gamesPlayed: 0
};

const positionPlans = {
    advanceFrench: {
        condition: () =>
            chess.get("e5") && chess.get("d4"),

        advice:
            "Advance French structure: Maintain center, prepare kingside pressure, watch for Black's c5 break."
    },

    kingsideAttack: {
        condition: () =>
            chess.get("f4") || chess.get("h4"),

        advice:
            "Kingside attack detected: Build pressure near enemy king and look for tactical opportunities."
    },

    openCenter: {
        condition: () =>
            !chess.get("d4") && !chess.get("e4"),

        advice:
            "Open center: Prioritize development, active pieces, and tactical awareness."
    }
};

const pieceMap = {
    p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
    P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

let selectedSquare = null;

const openingLines = [
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","d4"],
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","Nxe5"],
    ["d4","Nf6","c4","g6"],
    ["e4","Nf6"]
];

function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const currentBoard = chess.board();

    for(let row=0; row<8; row++){
        for(let col=0; col<8; col++){

            const square = document.createElement("div");

            square.classList.add("square");
            square.classList.add((row+col)%2===0 ? "light" : "dark");

            const piece = currentBoard[row][col];

            if(piece){
                square.textContent =
                    pieceMap[
                        piece.color==="w"
                        ? piece.type.toUpperCase()
                        : piece.type
                    ];

                square.classList.add(
                    piece.color==="w"
                    ? "white-piece"
                    : "black-piece"
                );
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
                    move => move.to===coordsToSquare(row,col)
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

function handleClick(row,col){
    const clickedSquare = coordsToSquare(row,col);

    if(!selectedSquare){
        const piece = chess.get(clickedSquare);

        if(piece && piece.color==="w"){
            selectedSquare={row,col};
            renderBoard();
        }

        return;
    }

    const move = chess.move({
        from:coordsToSquare(
            selectedSquare.row,
            selectedSquare.col
        ),
        to:clickedSquare,
        promotion:"q"
    });

    if(move){

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

function aiMove(){
    const moves = chess.moves({verbose:true});

    const randomMove =
        moves[Math.floor(Math.random()*moves.length)];

    chess.move(randomMove);

    renderBoard();
}

function coachPlayer(){
    const history = chess.history();

    for(let line of openingLines){

        let partial = line.slice(0,history.length);

        if(JSON.stringify(history)===JSON.stringify(partial)){

            document.getElementById("coach").innerText =
                "Excellent. You are following theory.";

            return;
        }
    }

    document.getElementById("coach").innerText =
        "You have deviated from your opening prep.";
}

function adaptiveCoach(){
    let advice =
        "Balanced play detected. Keep developing your style.";

    if(playerProfile.earlyQueenMoves>3){
        advice =
            "You often move your queen early. Focus on developing knights and bishops first.";
    }

    else if(playerProfile.earlyAttacks>5){
        advice =
            "You tend to attack before full development. Build your position before striking.";
    }

    else if(playerProfile.pawnRushes>10){
        advice =
            "You push many pawns aggressively. Be careful not to weaken your structure.";
    }

    document.getElementById("adaptiveCoach").innerText =
        advice;
}

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

function updateUI(){

    document.getElementById("status").innerText =
        chess.turn()==="w"
        ? "White to Move"
        : "Black to Move";

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");

    adaptiveCoach();

    detectPositionPlan();
}

function coordsToSquare(row,col){
    return "abcdefgh"[col] + (8-row);
}

function resetGame(){
    chess.reset();

    selectedSquare = null;

    document.getElementById("coach").innerText =
        "Ready for battle.";

    renderBoard();
}

function changeMode(){

    currentMode =
        document.getElementById("gameMode").value;

    resetGame();

    if(currentMode==="computer"){
        document.getElementById("coach").innerText =
            "Computer battle mode activated.";
    }

    if(currentMode==="theory"){
        document.getElementById("coach").innerText =
            "Opening theory mode activated.";
    }

    if(currentMode==="analysis"){
        document.getElementById("coach").innerText =
            "Analysis board active.";
    }
}

renderBoard();
