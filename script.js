const chess = new Chess();

const pieceMap = {
    p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚",
    P:"♙", R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔"
};

let selectedSquare = null;

/*
========================
RENDER BOARD
========================
*/
function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";

    const currentBoard = chess.board();

    for(let row=0; row<8; row++){
        for(let col=0; col<8; col++){

            const square = document.createElement("div");

            square.classList.add("square");
            square.classList.add((row+col)%2===0?"light":"dark");

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

                const moves = chess.moves({
                    square: coordsToSquare(
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

    selectedSquare=null;

    if(!move){

        renderBoard();
        return;
    }

    renderBoard();

    if(!chess.game_over()){

        document.getElementById("status").innerText =
            "Black Thinking...";

        setTimeout(aiMove,500);
    }
}

/*
========================
SMART AI MOVE
========================
*/
function aiMove(){

    const moves = chess.moves({verbose:true});

    if(moves.length===0) return;

    let bestMoves = [];

    let highestValue = -999;

    moves.forEach(move=>{

        let score = 0;

        if(move.captured){

            const values = {
                p:1,
                n:3,
                b:3,
                r:5,
                q:9,
                k:100
            };

            score += values[move.captured];
        }

        if(move.san.includes("+")) score += 2;

        if(score>highestValue){

            highestValue=score;

            bestMoves=[move];

        }else if(score===highestValue){

            bestMoves.push(move);
        }

    });

    const chosenMove =
        bestMoves[
            Math.floor(Math.random()*bestMoves.length)
        ];

    chess.move(chosenMove);

    renderBoard();
}

/*
========================
UPDATE UI
========================
*/
function updateUI(){

    let statusText="";

    if(chess.in_checkmate()){

        statusText=
            chess.turn()==="w"
            ?"Checkmate! Black Wins"
            :"Checkmate! White Wins";

    }else if(chess.in_draw()){

        statusText="Draw";

    }else if(chess.in_check()){

        statusText=
            chess.turn()==="w"
            ?"White in Check"
            :"Black in Check";

    }else{

        statusText=
            chess.turn()==="w"
            ?"White to Move"
            :"Black to Move";
    }

    document.getElementById("status").innerText =
        statusText;

    document.getElementById("history").innerHTML =
        chess.history().join("<br>");
}

/*
========================
HELPERS
========================
*/
function coordsToSquare(row,col){

    return "abcdefgh"[col]+(8-row);
}

/*
========================
RESET
========================
*/
function resetGame(){

    chess.reset();

    selectedSquare=null;

    renderBoard();
}

/*
========================
START
========================
*/
renderBoard();
