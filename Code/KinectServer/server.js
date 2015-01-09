var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');

var app = express();
/*
var privateKey = fs.readFileSync('fakekeys/privatekey.pem').toString();
var certificate = fs.readFileSync('fakekeys/certificate.pem').toString();
*/



///// START SOCKET SERVER
var server = app.listen(1234);




//var server  = https.createServer({key: privateKey, cert: certificate}, app).listen(7000);


console.log('S2 running on http://localhost:1234');

var io = require('socket.io').listen(server);

io.set('heartbeat interval', 500);
io.set('heartbeat timeout', 1100);

io.sockets.on('connection', function (socket){

	function log(){
		var array = [">>> Mensaje desde el servidor: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}
	
	socket.on('create or join', function (room) {
		
		console.log('create or join');
		io.sockets.in(room).emit('join', room); //esta accediendo al grupo
		socket.join(room); 
		socket.emit('joined', room); // se ha unido al grupo
		
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
		
		//socket.emit('gesture', -11);
		///// START KINECT SERVER
		var addon = require('bindings')('addon');
		var Kinect_obj = new addon.Server(10);

		setInterval(function readGesture(){
		var val = Kinect_obj.getGesture();
		if(val != -9){
			console.log(val);
			socket.emit('gesture', val);
		}
		},300);


	});
});

