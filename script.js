const chess = new Chess();

const pieces = {
  'p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚',
  'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔'
};

let selected = null;
let trainerMode = false;
let trainerStep = 0;
let trainerLine = [];

let currentOpeningName = "";

let openingStats = JSON.parse(localStorage.getItem("openingStats")) || {
  "Four Knights Scotch": {correct:0,mistakes:0},
  "Halloween Gambit": {correct:0,mistakes:0},
  "King's Indian Defense": {correct:0,mistakes:0},
  "Alekhine Defense": {correct:0,mistakes:0}
};

const openings = {
  1:{
    name:"Four Knights Scotch",
    line:[
      ["e4"],["e5"],["Nf3"],["Nc6"],["Nc3"],["Nf6"],
      ["d4"],["exd4"],["Nxd4"],["Bb4"],["Nxc6"]
    ]
  },

  2:{
    name:"Halloween Gambit",
    line:[
      ["e4"],["e5"],["Nf3"],["Nc6"],["Nc3"],["Nf6"],
      ["Nxe5"],["Nxe5"],["d4"]
    ]
  },

  3:{
    name:"King's Indian Defense",
    line:[
      ["d4"],["Nf6"],["c4"],["g6"],["Nc3"],["Bg7"]
    ]
  },

  4:{
    name:"Alekhine Defense",
    line:[
      ["e4"],["Nf6"],["e5"],["Nd5"],["d4"]
    ]
  }
};

function saveStats(){
  localStorage.setItem("openingStats", JSON.stringify(openingStats));
}

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
          piece.color==="w" ? "white" : "black"
        );
      }

      if(selected && selected.r===r && selected.c===c){
        square.classList.add("selected");
      }

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

  updateStatus();
  updateProgress();

  document.getElementById("history").innerHTML =
    chess.history().join("<br>");
}

function updateProgress(){

  if(!currentOpeningName){
    document.getElementById("progress").innerHTML = "No opening selected.";
    return;
  }

  let stats = openingStats[currentOpeningName];

  let total = stats.correct + stats.mistakes;

  let accuracy =
    total===0 ? 100 :
    Math.round((stats.correct/total)*100);

  document.getElementById("progress").innerHTML = `
    Opening: ${currentOpeningName}<br>
    Correct: ${stats.correct}<br>
    Mistakes: ${stats.mistakes}<br>
    Accuracy: ${accuracy}%
  `;
}

function toSquare(r,c){
  return "abcdefgh"[c] + (8-r);
}

function handleClick(r,c){

  const clickedSquare = toSquare(r,c);

  if(selected===null){

    const piece = chess.get(clickedSquare);

    if(piece && piece.color==="w"){
      selected = {r,c};
      renderBoard();
      return;
    }

  } else {

    const move = chess.move({
      from: toSquare(selected.r,selected.c),
      to: clickedSquare,
      promotion:'q'
    });

    selected = null;

    if(move){

      if(trainerMode){
        handleTrainer(move);
      } else {

        if(!chess.game_over()){
          setTimeout(aiMove,500);
        }

      }

    }

    renderBoard();
  }

}

function handleTrainer(move){

  let allowedMoves = trainerLine[trainerStep];

  if(!allowedMoves.includes(move.san)){

    openingStats[currentOpeningName].mistakes++;

    document.getElementById("coach").innerText =
      "Wrong move. Expected: " + allowedMoves.join(" / ");

    chess.undo();

    saveStats();
    updateProgress();

    return;
  }

  openingStats[currentOpeningName].correct++;

  document.getElementById("coach").innerText =
    "Correct! " + move.san;

  saveStats();

  trainerStep++;

  if(trainerStep>=trainerLine.length){

    document.getElementById("coach").innerText =
      "Training Complete!";

    trainerMode=false;

    return;
  }

  setTimeout(()=>{

    let enemyMove = trainerLine[trainerStep][0];

    chess.move(enemyMove);

    trainerStep++;

    renderBoard();

  },500);

}

function aiMove(){

  const moves = chess.moves();

  if(moves.length===0) return;

  const move =
    moves[Math.floor(Math.random()*moves.length)];

  chess.move(move);

  renderBoard();
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
      ?"White to Move"
      :"Black Thinking";
  }

  document.getElementById("status").innerText = status;
}

function resetGame(){

  chess.reset();

  selected=null;
  trainerMode=false;
  trainerStep=0;

  document.getElementById("coach").innerText = "Reset.";

  renderBoard();
}

function clearStats(){

  openingStats = {
    "Four Knights Scotch": {correct:0,mistakes:0},
    "Halloween Gambit": {correct:0,mistakes:0},
    "King's Indian Defense": {correct:0,mistakes:0},
    "Alekhine Defense": {correct:0,mistakes:0}
  };

  saveStats();

  updateProgress();
}

function startOpeningTrainer(){

  resetGame();

  let choice = prompt(
    "Choose Opening:\n\n1 = Four Knights Scotch\n2 = Halloween Gambit\n3 = King's Indian Defense\n4 = Alekhine Defense"
  );

  if(!openings[choice]) return;

  trainerLine = openings[choice].line;

  currentOpeningName = openings[choice].name;

  trainerMode = true;

  trainerStep = 0;

  document.getElementById("coach").innerText =
    "Trainer Started: " + currentOpeningName;

  renderBoard();
}

renderBoard();
