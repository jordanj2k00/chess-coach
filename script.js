const chess = new Chess();

/*
STOCKFISH ENGINE
*/
const engine = new Worker("stockfish.js");

engine.onmessage = function(event){

  console.log("ENGINE:", event.data);

  if(typeof event.data === "string" && event.data.startsWith("bestmove")){

    const bestMove = event.data.split(" ")[1];

    if(bestMove === "(none)") return;

    chess.move({
      from: bestMove.substring(0,2),
      to: bestMove.substring(2,4),
      promotion: 'q'
    });

    renderBoard();
  }

};

/*
PIECE DISPLAY
*/
const pieces = {
  'p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚',
  'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔'
};

/*
STATE
*/
let selected = null;

/*
RENDER BOARD
*/
function renderBoard(){

  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  const currentBoard = chess.board();

  for(let r=0;r<8;r++){

    for(let c=0;c<8;c++){

      const square = document.createElement("div");

      square.classList.add("square");
      square.classList.add((r+c)%2===0 ? "light" : "dark");

      const piece = currentBoard[r][c];

      if(piece){

        square.textContent =
          pieces[
            piece.color==="w"
            ? piece.type.toUpperCase()
            : piece.type
          ];

        square.classList.add(
          piece.color==="w"
          ? "white"
          : "black"
        );

      }

      /*
      SELECTED HIGHLIGHT
      */
      if(selected && selected.r===r && selected.c===c){

        square.classList.add("selected");

      }

      /*
      LEGAL MOVE DOTS
      */
      if(selected){

        const moves = chess.moves({
          square: toSquare(selected.r,selected.c),
          verbose:true
        });

        if(moves.some(m=>m.to===toSquare(r,c))){

          square.classList.add("legal");

        }

      }

      square.onclick = ()=>handleClick(r,c);

      boardDiv.appendChild(square);

    }

  }

  /*
  HISTORY
  */
  document.getElementById("history").innerHTML =
    chess.history().join("<br>");

  updateStatus();

}

/*
CONVERT ROW/COL TO CHESS SQUARE
*/
function toSquare(r,c){

  return "abcdefgh"[c] + (8-r);

}

/*
CLICK HANDLER
*/
function handleClick(r,c){

  const clickedSquare = toSquare(r,c);

  /*
  FIRST CLICK
  */
  if(selected===null){

    const piece = chess.get(clickedSquare);

    if(piece && piece.color==="w"){

      selected = {r,c};

      renderBoard();

      return;

    }

  }

  /*
  SECOND CLICK
  */
  else{

    const move = chess.move({

      from: toSquare(selected.r,selected.c),
      to: clickedSquare,
      promotion:'q'

    });

    selected = null;

    /*
    VALID MOVE
    */
    if(move){

      renderBoard();

      if(!chess.game_over()){

        setTimeout(stockfishMove,500);

      }

      return;

    }

    renderBoard();

  }

}

/*
STOCKFISH MOVE
*/
function stockfishMove(){

  engine.postMessage("position fen " + chess.fen());

  engine.postMessage("go depth 12");

}

/*
STATUS
*/
function updateStatus(){

  let status="";

  if(chess.in_checkmate()){

    status="CHECKMATE";

  }

  else if(chess.in_check()){

    status="CHECK";

  }

  else{

    status =
      chess.turn()==="w"
      ? "Your Turn"
      : "🤖 Stockfish Thinking...";

  }

  document.getElementById("status").innerText = status;

}

/*
RESET GAME
*/
function resetGame(){

  chess.reset();

  selected = null;

  renderBoard();

}

/*
INITIAL LOAD
*/
renderBoard();
