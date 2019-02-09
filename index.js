const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let rooms = 0;
app.use(express.static('.'));

app.get('/',function (req, res)  {
    res.sendFile(path.join(__dirname, 'game.html'));
});

io.on('connection', function(socket)  {
    //..................................................................
         // login
         socket.on('logInuser', function(data) {
               socket.emit('logedIn', { name: data.name });
        });
    //....................................................................    
    // Create a new game room and notify the creator of game.
        socket.on('createTournament',function (data) {
        console.log(data)
        
        socket.join(`Tournament-${++rooms}`);
        var roomm=`Tournament-${rooms}`
        clients = io.sockets.adapter.rooms[roomm].sockets
    
        io.in(roomm).emit('updateusers', clients,roomm)
        // io.in(roomm).emit('addUser', data.name);
        socket.emit('newTournament', { name: data.name, room: `Tournament-${rooms}` });
        io.in(data.room).emit('newTournament', { name: data.name, room: `Tournament-${rooms}` });
        usernames = {};
    });
    //.............................................................................................

    //add to the list of game
    socket.on('createGameList', (game) => {
       socket.emit('updateGameList', game);
        io.emit('updateGameList', game);
    });
    //...........................................................................................
    socket.on("createBracket",function(data){
        console.log(data)
        clients = io.sockets.adapter.rooms[data.room].sockets
       
        io.in(data.room).emit('showBracket', clients)
        console.log("players to break")
           console.log(clients)
    })
//........................................................................................................
    //// Connect the other player to the tornament he requested. Show error if the tornament is full.
    socket.on('joinTournament', function (data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        console.log(room);
      
        if (room && room.length< 4) {
            socket.join(data.room);
            socket.id=data.name;
            clients = io.sockets.adapter.rooms[data.room].sockets
            for (var clientId in clients ) {
               console.log(clientId) 
                //this is the socket of each client in the room.
                var clientSocket = io.sockets.connected[clientId];         
                
            }
            console.log("............................")
           // io.in(data.room).emit('updateusers', clients,data.room)
            io.in(data.room).emit('addUser', data.name);

            io.in(data.room).emit('player', { name: data.name, room: data.room })
        } else {
            socket.emit('err', { message: 'Sorry, The room is full!' });
        }
         usernames = {};
    });
  //.................................................................................................. 
//send the game for the players
socket.on('startGame', function (data) {
    clients = io.sockets.adapter.rooms[data.room].sockets       
    io.in(data.room).emit('sendGame', clients)
   
});
//...............................................................................................
    // Connect the Player 2 to the room he requested. Show error if room full.
    // socket.on('xjoinGame', function (data) {
    //     var room = io.nsps['/'].adapter.rooms[data.room];
    //     if (room && room.length === 1) {
    //         socket.join(data.room);
    //         socket.broadcast.to(data.room).emit('player1', {});
    //         socket.emit('player2', { name: data.name, room: data.room })
    //     } else {
    //         socket.emit('err', { message: 'Sorry, The room is full!' });
    //     }
    // });

    socket.on('playTurn',function (data){
        socket.broadcast.to(data.room).emit('turnPlayed', {
            tile: data.tile,
            room: data.room
        });
    });
  
    socket.on('gameEnded',function (data){
        socket.broadcast.to(data.room).emit('gameEnd', data);
    });
});

server.listen(process.env.PORT || 8080);