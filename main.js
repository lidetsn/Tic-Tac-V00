//
(function init() {
  const P1 = 'X';
  const P2 = 'O';
  
  let player;
  let game;
  //let name;
  let userName
  const socket = io.connect('http://localhost:8080');

  class Player {
    constructor(name, type) {
      this.name = name;
      this.type = type;
      this.currentTurn = true;
      this.playsArr = 0;
    }

    static get wins() {
      return [7, 56, 448, 73, 146, 292, 273, 84];
    }
    updatePlaysArr(tileValue) {
      this.playsArr += tileValue;
    }

    getPlaysArr() {
      return this.playsArr;
    }

    // Set the currentTurn for player to turn and update UI to reflect the same.
    setCurrentTurn(turn) {
      this.currentTurn = turn;
      const message = turn ? 'Your turn' : 'Waiting for Opponent';
      $('#turn').text(message);
    }

    getPlayerName() {
      return this.name;
    }

    getPlayerType() {
      return this.type;
    }

    getCurrentTurn() {
      return this.currentTurn;
    }
  }

  // roomId Id of the room in which the game is running on the server.
  class Game {
    constructor(roomId) {
      this.roomId = roomId;
      this.board = [];
      this.moves = 0;
      this.player={}
    }
    setplayer(player){}
    // Create the Game board by attaching event listeners to the buttons.
    createGameBoard() {
      function tileClickHandler() {
        const row = parseInt(this.id.split('_')[1][0], 10);
        const col = parseInt(this.id.split('_')[1][1], 10);
        if (!player.getCurrentTurn() || !game) {
          alert('Its not your turn!');
          return;
        }

        if ($(this).prop('disabled')) {
          alert('This tile has already been played on!');
          return;
        }
        // Update board after your turn.
        game.playTurn(this);
        game.updateBoard(player.getPlayerType(), row, col, this.id);

        player.setCurrentTurn(false);
        player.updatePlaysArr(1 << ((row * 3) + col));

        game.checkWinner();
      }
      for (let i = 0; i < 3; i++) {
        this.board.push(['', '', '']);
        for (let j = 0; j < 3; j++) {
          $(`#button_${i}${j}`).on('click', tileClickHandler);
        }
      }
    }
       
    displayBoard(message) {
      $('.menu').css('display', 'none');
      $('.gameBoard').css('display', 'block');
      $('#user').html(message);
      this.createGameBoard();
    }

    updateBoard(type, row, col, tile) {
      $(`#${tile}`).text(type).prop('disabled', true);
      this.board[row][col] = type;
      this.moves++;
    }
    //insert the created game in the list
    UpdateList(gameId){
    $("#test").text(gameId);

    }
// here try to update the combo box with the game id
  
    getRoomId() {
      return this.roomId;
    }
    // Send an update to the opponent to update their UI's tile
    playTurn(tile) {
      const clickedTile = $(tile).attr('id');
      // Emit an event to update other player that you've played your turn.
      socket.emit('playTurn', {
        tile: clickedTile,
        room: this.getRoomId(),
      });
    }
      
    checkWinner() {
        const currentPlayerPositions = player.getPlaysArr();

        Player.wins.forEach((winningPosition) => {
            if ((winningPosition & currentPlayerPositions) === winningPosition) {
                  game.announceWinner();
                }
              });

        const tieMessage = 'Game Tied :(';
        if (this.checkTie()) {
          socket.emit('gameEnded', { room: this.getRoomId(), message: tieMessage,});
          alert(tieMessage);
          location.reload();//???????????????????????????????????????????????????????
        }
     }


    checkTie() {
      return this.moves >= 9;
    }

    announceWinner() {
      const message = `${player.getPlayerName()} wins!`;
      socket.emit('gameEnded', {room: this.getRoomId(), message,});
      alert(message);
      location.reload();//???????????????????????????????????????????????????????????????
    }

    
    // End the game if the other player won.
    endGame(message) {
      alert(message);
      location.reload();//???????????????????????????????????????????????????????????????????????
    }

  }
//...........................................................
//....................................................

//login clicked , modify it
$('#logIn').on('click', function()  {
  userName = $('#userName').val();
  if (!userName) {
    alert('Please enter your name.');
    return;
  }
  socket.emit('logInuser',userName);//see the event listiner on index
  // player = new Player(name, P1);
});
//................................................................................................

// user loged In  logedIn
socket.on('logedIn', function(userName)  {//event listner for event logedIn from index
  const message =
    `Hello, ${userName}. welcome`;
  // game = new Game(data.room);
  displayPage(message);
});

//.................................................................
  // Create a new tournament. Emit  event.
  $('#new').on('click', function()  {
    socket.emit('createTournament',{name:userName});//see the event listiner on index
    //player = new Player(name, P1);
  });
//...............................................................................
// New Game created by current client. Update the UI and create new Game var.
socket.on('newTournament', function(data) {// { name: data.name, room: `Tournament-${rooms}` }
       const message =
            `Hello, ${data.name}. you created a tournament with  ID: 
             ${data.room}. Waiting for player 2...`;
            socket.emit('createTournamentList', data.room);  
            displayTornamentPage(data)
});

socket.on('enterToTornamentPage', function(data) {
  // const message = `Hello, ${data.name}`;
  // tornament = new Tornament(data.room); 
  displayTornamentPage(data) 
});
socket.on('updateusers', function(paricipant,tournamentName) {
    //  $('#playersDiv').empty();
       $("#tornamentName").text(tournamentName);
        var  html="";
     for (var i=0;i<paricipant.length;i++) {
            var div=$("<div>")
            div.attr("id",paricipant).attr("class","text-white").text(paricipant);
            html+='<li class="list-group-item">'+paricipant[i]+'</li>'
  }
  $('#playersList').html(html)
  });
 

//update List .....................................
socket.on('updateTournamentList', function(gameName) {
  // $('#test').append($('<li>').text(gameName));
          $('#listOfTornaments')
                    .append($("<option></option>")
                    .attr("value",gameName)
                    .text(gameName));   
});

//.........................................................................................
  // Join an existing game on the entered roomId. Emit the joinGame event.
  $('#join').on('click', function()  {
      // const name = $('#nameJoin').val();
      const roomID = $('#listOfTornaments').val();
      // if (!name || !roomID) {
        if ( !roomID) {
        alert('Please enter your name and game ID.');
        return;
      }
      //socket.emit("getParticipants")
      socket.emit('joinTournament', { name: userName, room: roomID });
      //player = new Player( userName, P2);
  });
  

  //..............................................................................................
  
  $('#makeBracket').on('click',function () {
    var players=[];
  var tornamentName=  $("#tornamentName").text();
    socket.emit('createBracket',{room:tornamentName} );//see the event listiner on index
    // player = new Player(name, P1);
  });

  socket.on("showBracket", function(players){//array of players
     
     $("#bracketOne").text( players[0] +"\t\t\t\t"+"vs"+"\t\t\t\t"+ players[1]);
     $("#bracketTwo").text( players[2] +"\t\t\t\t\t\t"+"vs"+"\t\t\t\t"+ players[3]);
     $('#makeBracket').attr("disabled","true")    
    })

//.................................................................................
  $('#startTournament').on('click', function()  {
      var tornament=  $("#tornamentName").text();
      socket.emit('startGame',{room:tornament} );//see the event listiner on index
    
  });

  //...............................................................................
  socket.on("sendGame", function(players,tornamentName){//players array of participant name      
    for(var i=0;i<players.length;i++){
        console.log("sending index")
        console.log(i)
        if(i%2===0){//pairing participants
          console.log("sending index after filter")
          console.log(i)
          player = new Player(players[i], P1);
          console.log("p0 or p2")
          console.log(player.getPlayerName());
          socket.emit('createGame', { name:players[i],index:i,torName:tornamentName })
          socket.emit('joinGame', { name:players[i+1],index:i+1,torName:tornamentName });
          player = new Player(players[i+1], P2); 
          console.log("p1 or p3")
          console.log(player.getPlayerName());
         
          }    
    }
  });
    socket.on('newGame', (data) => {         
            const message =
            `Hello, ${data.name}. welcome to play station: 
            ${data.room}. you are playing with.....`;  //add name of opponent
              // Create game for player 1
              game = new Game(data.room);
              game.displayBoard(message);
              console.log("......................>>>>>>>>>>>>>>>")    
              console.log(player.getPlayerName()) 
    })   
//........................................................................ 
  socket.on('player1',function (data)  {
          const message = `Hello, ${player.getPlayerName()}`;
          $('#userHello').html(message);
          player.setCurrentTurn(true);
  });

  socket.on('player2', function(data)  {
          const message = `Hello, ${data.name}`; //playing with
          // Create game for player 2
          game = new Game(data.room);
          game.displayBoard(message);
          player.setCurrentTurn(false);
  });

  socket.on('turnPlayed', function(data) {
        const row = data.tile.split('_')[1][0];
        const col = data.tile.split('_')[1][1];
        const opponentType = player.getPlayerType() === P1 ? P2 : P1;

        game.updateBoard(opponentType, row, col, data.tile);
        player.setCurrentTurn(true);
  });

  //?????????????????????????????????????????????????????????????????????????????????????????
  // If the other player wins, this event is received. Notify user game has ended.
  socket.on('gameEnd',function (data) {
      game.endGame(data.message);
      socket.leave(data.room);
  });
  socket.on('err',function(data)  {
      game.endGame(data.message);
  });


  
  function displayTornamentPage(data) {
      // $('#playersList').append($('<li>').text(name));
      var html="Hello"+" "+data.name+" "+"you are in"+" " +data.room
      $('.menu').css('display', 'none');
      $('#eachTornamentPage').css('display', 'block');
       $('#user').html(html);
       
    }

// function to display player page after login
  function  displayPage(message) {
        $('.logIn').css('display', 'none');
        $('.menu').css('display', 'block');
        $('#userHello').html(message);
  
  }

}());
