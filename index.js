//2/12/
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let rooms = 0;
var pusernames = [];
var tornamentArray=[];


class Tournament{
    constructor(name){
    this.name=name;
    this.participants=[];
    }
    setParticipants(player){
          this.participants.push(player)
    }
    getParticipants(){
        return this.participants;
    }
    getTournamentName(){
        return this.name;
    }
}

app.use(express.static('.'));

app.get('/',function (req, res)  {
    res.sendFile(path.join(__dirname, 'game.html'));
});

            io.on('connection', function(socket)  {
    //..................................................................
         // login
               socket.on('logInuser', function(userName) {
               socket.emit('logedIn', userName);
        });
    //....................................................................    
    // Create a new game room and notify the creator of game.
                    socket.on('createTournament',function (data) {//{name:userName})
                    var username=data.name;                 
                    console.log("....passed data ..in createTournament")
                    console.log(data)           
                    socket.username = username;
                    //usernames[username] =username;
                    socket.room = `Tournament-${++rooms}`;
                    pusernames.push(socket.username )
                    socket.join(socket.room) 

                   var torObj=new Tournament( socket.room);
            
      
                    participantsId = io.sockets.adapter.rooms[ socket.room ].sockets
                    torObj.setParticipants(data.name);
                    tornamentArray.push(torObj);
                    console.log("....participant one in creat tournament")
                    console.log(socket.username)
                    console.log(participantsId)
              

                   io.in(socket.room ).emit('updateusers',  torObj.getParticipants() , socket.room )
                  //change
                  socket.emit('newTournament', { name: data.name, room: `Tournament-${rooms}` });
                  io.in(data.room).emit('newTournament', { name: data.name, room: `Tournament-${rooms}` });
    
    });
    //.............................................................................................
                    //add to the list of tournament
                    socket.on('createTournamentList', (tournamentName) => {//`Tournament-${rooms}`
                    socket.emit('updateTournamentList', tournamentName);
                    io.emit('updateTournamentList',tournamentName);
    });
    //...........................................................................................
   
    //// Connect the other player to the tornament he requested. Show error if the tornament is full.
              socket.on('joinTournament', function (data) {//{ name, room: roomID }
              var room = io.nsps['/'].adapter.rooms[data.room];
              var  username=data.name
                console.log("this is the data.room passed to jointornament")
                console.log(data.name)
                console.log("this is the data.room passed to jointornament")
                console.log(data.room)
                console.log("......this is the room. made in join tournament........")
                console.log(room);
           
                if (room && room.length< 4) {
                    socket.join(data.room);
                    socket.userName=username;
            
                        tornamentArray.forEach(function(tournamentObj){//to display all participants
                        if(tournamentObj.getTournamentName()===data.room){
                                console.log("testing")
                                console.log(tournamentObj.getTournamentName())
                                console.log(data.room)
                                tournamentObj.setParticipants(username)
                                io.sockets.in(data.room).emit('updateusers',tournamentObj.getParticipants(), data.room);
                           }
                         })
                        participants = io.sockets.adapter.rooms[data.room].sockets//each socket id in the room
                        console.log("....participants....")
                        console.log(participants)
           
                   io.in(data.room).emit('player', { name: data.name, room: data.room })
               } else {
                  socket.emit('err', { message: 'Sorry, The room is full!' });
        }
       
    });
    //........................................................................................................

                        socket.on("createBracket",function(data){ //data={room:tornamentName}
                        tornamentArray.forEach(function(tournamentObj){//to display all participants
                          if(tournamentObj.getTournamentName()===data.room){                              
                            tournamentObj.getParticipants()
                            io.in(data.room).emit('showBracket', tournamentObj.getParticipants())                               }
                             })                       
                    })
  //.................................................................................................. 
//send the game for the players
    socket.on('startGame', function (data) {
    participants = io.sockets.adapter.rooms[data.room].sockets       
    io.in(data.room).emit('sendGame', participants)
   
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