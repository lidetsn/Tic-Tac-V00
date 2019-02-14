//2/
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let rooms = 0;
var pusernames = [];
var tornamentArray=[];
const playStationOne=1;
const playStationTwo=2;

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
                    // console.log("....passed data ..in createTournament")
                    // console.log(data)           
                    socket.username = username;
                    //usernames[username] =username;
                    socket.room = `Tournament-${++rooms}`;
                    pusernames.push(socket.username )
                    socket.join(socket.room) 

                var torObj=new Tournament( socket.room);     
                    participantsId = io.sockets.adapter.rooms[ socket.room ].sockets
                    torObj.setParticipants(data.name);
                    tornamentArray.push(torObj);
                    // console.log("....participant one in creat tournament")
                    // console.log(socket.username)
                    // console.log(participantsId)
                    //io.in(socket.room ).emit('updateusers',  torObj.getParticipants() , socket.room )
                  socket.emit('updateusers',  torObj.getParticipants() , socket.room )
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
          if (room && room.length< 4) {
             socket.join(data.room);
             socket.username=username;
             tornamentArray.forEach(function(tournamentObj){//to display all participants
               if(tournamentObj.getTournamentName()===data.room){
              // console.log("testing")
              // console.log(tournamentObj.getTournamentName())
              // console.log(data.room)
              tournamentObj.setParticipants(username)
              io.sockets.in(data.room).emit('updateusers',tournamentObj.getParticipants(), data.room);
              }
              })
              participants = io.sockets.adapter.rooms[data.room].sockets//each socket id in the room
             // console.log("....participants....")
             // console.log(participants)
             //io.in(data.room).emit('addParticipant', { name: data.name, room: data.room })
             socket.emit('enterToTornamentPage', { name: data.name, room: data.room })

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
  socket.on('startGame', function (data) {//{room:tornament}
   tornamentArray.forEach(function(tournamentObj){//to display all participants
     if(tournamentObj.getTournamentName()===data.room){
         console.log("the socket user name ")
         console.log(socket.id)                  
         //tournamentObj.setParticipants(username)
         //io.sockets.in( data.room).emit('sendGame',tournamentObj.getParticipants(), data.room);
          io.sockets.in( data.room).emit('sendGame',tournamentObj.getParticipants(), data.room);
        //participants = io.sockets.adapter.rooms[data.room].sockets       
        // io.in(data.room).emit('sendGame', participants)
        }
         return;
         })           
            });
            
socket.on('createGame', (data) => {//{ name:players[i],index:i,torName:tornamentName }
           
        if(data.index===0){
            socket.room=`${data.torName}-playstaion-${playStationOne}`;
            //test purpose log
            console.log("////////////index==0/////////////////////")
            console.log(data.index)
            console.log(data.name)
            console.log("socket user name")          
            console.log(socket.username)
            console.log("participants in the tornament")
            client = io.sockets.adapter.rooms[data.torName].sockets
            console.log(client)
            //................creating play station......................................
             if(socket.username===data.name){
            socket.join(`${data.torName}-playstaion-${playStationOne}`)            
           // socket.broadcast.to( socket.room).emit('newGame', { name: data.name,index:data.index, room: socket.room });
            socket.emit('newGame', { name: data.name,index:data.index, room: socket.room });
            //test purpose log
            console.log("the new room s1")
            console.log(socket.room)
            participants = io.sockets.adapter.rooms[`${data.torName}-playstaion-${playStationOne}`].sockets
            console.log("participants in sub room s1")
            console.log(participants)
            //.............................................................
             }          
        }
        else{
            console.log("////////////index==2/////////////////////")
            socket.room=`${data.torName}-playstaion-${playStationTwo}`;
           //test purpose log
            console.log(data.index)
            console.log(data.name)
            console.log("socketid")
            console.log(socket.username)
            console.log("participants in the tornament")
            client = io.sockets.adapter.rooms[data.torName].sockets
            console.log(client)
            if(socket.username===data.name){
            socket.join(`${data.torName}-playstaion-${playStationTwo}`)           
            // socket.broadcast.to( socket.room).emit('newGame', { name: data.name,index:data.index, room: socket.room });
             socket.emit('newGame', { name: data.name,index:data.index, room: socket.room });

             console.log("the new room")
             console.log(socket.room)
             participants = io.sockets.adapter.rooms[`${data.torName}-playstaion-${playStationTwo}`].sockets
             console.log("participants in sub s2")
             console.log(participants)
            }           
        }       
});

socket.on('joinGame', function (data) {//{ name:data.participants[3],room:data.room });   
       // socket.leave(data.room)
       // socket.join(data.room) 
       // socket.room=data.room;
     if(data.index===1){
        socket.room=`${data.torName}-playstaion-${playStationOne}`;
        //test purpose log
        console.log("ccccccccccindex==1==cccccccccccc")
        console.log(data)
        console.log(data.index)
        console.log("socketid")
        console.log(socket.username)
        //....................................................
        if(socket.username===data.name){
        socket.join(`${data.torName}-playstaion-${playStationOne}`)      
        socket.broadcast.to(socket.room).emit('player1', {});
        socket.emit('player2', { name: data.name, room: socket.room })
        participants = io.sockets.adapter.rooms[socket.room].sockets
        console.log("participants in teh new s2")
        console.log(participants)
        }     
     }
     else{
        socket.room=`${data.torName}-playstaion-${playStationTwo}`;
        //test purpose log
        console.log("ccccccccccindex==3==cccccccccccccc")
        console.log(data)
        console.log(data.index)
        console.log("socketid")
        console.log(socket.username)
        //...................................................
        if(socket.username===data.name){
        socket.join(`${data.torName}-playstaion-${playStationTwo}`)     
        socket.broadcast.to(socket.room).emit('player1', {});
        socket.emit('player2', { name: data.name, room: socket.room })
        participants = io.sockets.adapter.rooms[socket.room].sockets
        console.log("participants in teh new s1")
        console.log(participants)
        }     
     }
   
});
//...............................................................................................
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