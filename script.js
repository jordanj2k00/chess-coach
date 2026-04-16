let currentMode = "computer";
const chess = new Chess();

const pieceMap = {
    p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
    P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

let selectedSquare = null;

/*
OPENING THEORY DATABASE
*/
const openingLines = [
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","d4"], // Four Knights Scotch
    ["e4","e5","Nf3","Nc6","Nc3","Nf6","Nxe5"], // Halloween
    ["d4","Nf6","c4","g6"], // KID
    ["e4","Nf6"] // Alekhine
];

function renderBoard() {

    const boardDiv = document.getElementById("board");

    boardDiv.innerHTML = "";

    const currentBoard = chess.board();

    for(let row=0;row<8;row++){
        for(let col=0;col<8;col++){

            const square=document.createElement("div");

            square.classList.add("square");
            square.classList.add((row+col)%2===0?"light":"dark");

            const piece=currentBoard[row][col];

            if(piece){

                square.textContent=
                    pieceMap[
                        piece.color==="w"
                        ?piece.type.toUpperCase()
                        :piece.type
                    ];

                square.classList.add(
                    piece.color==="w"
                    ?"white-piece"
                    :"black-piece"
                );
            }

            if(
                selectedSquare &&
                selectedSquare.row===row &&
                selectedSquare.col===col
            ){
                square.classList.add("selected");
            }

            if(selectedSquare){

                const moves=chess.moves({
                    square:coordsToSquare(
                        selectedSquare.row,
                        selectedSquare.col
                    ),
                    verbose:true
                });

                if(
                    moves.some(
                        move=>move.to===coordsToSquare(row,col)
                    )
                ){
                    square.classList.add("legal");
                }
            }

            square.onclick=()=>handleClick(row,col);

            boardDiv.appendChild(square);
        }
    }

    updateUI();
}

function handleClick(row,col){

    const clickedSquare=coordsToSquare(row,col);

    if(!selectedSquare){

        const piece=chess.get(clickedSquare);

        if(piece&&piece.color==="w"){

            selectedSquare={row,col};

            renderBoard();
        }

        return;
    }

    const move=chess.move({
        from:coordsToSquare(
            selectedSquare.row,
            selectedSquare.col
        ),
        to:clickedSquare,
        promotion:"q"
    });

    selectedSquare=null;

    if(!move){

        renderBoard();
        return;
    }

    renderBoard();

    coachPlayer();

    if(!chess.game_over()){

        setTimeout(aiMove,500);
    }
}

function aiMove(){

    const moves=chess.moves({verbose:true});

    const randomMove=
        moves[Math.floor(Math.random()*moves.length)];

    chess.move(randomMove);

    renderBoard();
}

function coachPlayer(){

    const history=chess.history();

    let matched=false;

    for(let line of openingLines){

        let partial=line.slice(0,history.length);

        if(JSON.stringify(history)===JSON.stringify(partial)){

            matched=true;

            document.getElementById("coach").innerText=
                "Excellent. You are following theory.";

            return;
        }
    }

    if(!matched){

        document.getElementById("coach").innerText=
            "You have deviated from your opening prep.";
    }
}

function updateUI(){

    document.getElementById("status").innerText=
        chess.turn()==="w"
        ?"White to Move"
        :"Black to Move";

    document.getElementById("history").innerHTML=
        chess.history().join("<br>");
}

function coordsToSquare(row,col){

    return "abcdefgh"[col]+(8-row);
}

function resetGame(){

    chess.reset();

    selectedSquare=null;

    document.getElementById("coach").innerText=
        "Ready for battle.";

    renderBoard();
}

renderBoard();
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
