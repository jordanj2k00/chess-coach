const chess = new Chess();

/*
DIRECT STOCKFISH LOAD
*/
const engine = new Worker("https://cdn.jsdelivr.net/npm/stockfish/stockfish.js");

engine.onmessage = function(event){

    let line = event.data;

    console.log("ENGINE:", line);

    if(line.startsWith("bestmove")){

        let bestMove = line.split(" ")[1];

        if(bestMove === "(none)") return;

        chess.move({
            from: bestMove.substring(0,2),
            to: bestMove.substring(2,4),
            promotion: "q"
        });

        renderBoard();
    }
};

const pieces = {
'p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚',
'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔'
};

let selected = null;

function renderBoard(){

const boardDiv = document.getElementById("board");

boardDiv.innerHTML = "";

const currentBoard = chess.board();

for(let r=0;r<8;r++){

for(let c=0;c<8;c++){

const square = document.createElement("div");

square.classList.add("square");

square.classList.add((r+c)%2===0?"light":"dark");

const piece = currentBoard[r][c];

if(piece){

square.textContent =
pieces[
piece.color==="w"
?piece.type.toUpperCase()
:piece.type
];

square.classList.add(
piece.color==="w"
?"white"
:"black"
);

}

if(selected&&selected.r===r&&selected.c===c){

square.classList.add("selected");

}

if(selected){

const moves = chess.moves({
square:toSquare(selected.r,selected.c),
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

document.getElementById("history").innerHTML =
chess.history().join("<br>");

updateStatus();

}

function toSquare(r,c){

return "abcdefgh"[c]+(8-r);

}

function handleClick(r,c){

const clickedSquare = toSquare(r,c);

if(selected===null){

const piece = chess.get(clickedSquare);

if(piece&&piece.color==="w"){

selected={r,c};

renderBoard();

return;

}

}else{

const move = chess.move({

from:toSquare(selected.r,selected.c),

to:clickedSquare,

promotion:"q"

});

selected=null;

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

function stockfishMove(){

engine.postMessage("position fen " + chess.fen());

engine.postMessage("go depth 10");

}

function updateStatus(){

let status="";

if(chess.in_checkmate()){

status="CHECKMATE";

}

else if(chess.in_check()){

status="CHECK";

}

else{

status=
chess.turn()==="w"
?"Your Turn"
:"🤖 Stockfish Thinking...";

}

document.getElementById("status").innerText=status;

}

function resetGame(){

chess.reset();

selected=null;

renderBoard();

}

renderBoard();
