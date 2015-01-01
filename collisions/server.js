var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');

var privateKey = fs.readFileSync('fakekeys/privatekey.pem').toString();
var certificate = fs.readFileSync('fakekeys/certificate.pem').toString();

var app = express();

app.use(express.static(__dirname));

var server = https.createServer({key: privateKey, cert: certificate}, app).listen(8000);

var keypress = require('keypress');
/*
var SerialPortArduino = require("serialport").SerialPort
var serialPortArduino = new SerialPortArduino("COM4", {baudrate: 9600}, false); // this is the openImmediately flag [default is true]

var SerialPortROBOTIS = require("serialport").SerialPort
var serialPortROBOTIS = new SerialPortROBOTIS("COM5", {baudrate: 9600}, false); // this is the openImmediately flag [default is true]
*/
// Thresholds for detecting if the robot is too close
var STOP_TH = 400;
var WARN_TH = 800;

// Velocity command HEX code
var VELO =	0X01;
var offset = 100;

console.log('Corriendo en https://localhost:8000');

var addon = require('bindings')('addon');
var Kinect_obj = new addon.KinectReader(10);
var last_;

Array.prototype.average=function(){
    var sum=0;
    var j=0;
    for(var i=0;i<this.length;i++){
        if(isFinite(this[i])){
          sum=sum+parseFloat(this[i]);
           j++;
        }
    }
    if(j===0){
        return 0;
    }else{
        return sum/j;
    }

}
var BUFFER_LEN = 4;
var STATE = 1; // by default the robot can move (1)
var distances = [];
var current_dist;
var speed = 1;
setInterval(function checkDistance(){
	current_dist = Kinect_obj.getValue();
	//console.log(current_dist);
	distances[distances.length] = current_dist;
	
	if(distances.length > BUFFER_LEN){
		dist_new = []
		for(var i = 1; i < distances.length; i++){
			dist_new[dist_new.length] = distances[i]
		}
		distances = dist_new;
	}
	//console.log(distances.average());
	//console.log(distances);
	if(current_dist < 0){ // error
		console.log("Distance error", current_dist);
	}else if(distances.average() > WARN_TH){ // safe
		console.log("Safe to move");
		STATE = 1;
		speed = 1;
	}else if(distances.average() > STOP_TH && distances.average() <= WARN_TH){ // warning
		console.log("YOU ARE GETTING CLOSER!");
		speed = (distances.average()-STOP_TH)/(WARN_TH-STOP_TH+1);
		STATE = 1;
	}else if(distances.average() <= STOP_TH){ // stop
		if(STATE == 1){
			robotStop();
			STATE = 0; //Robot can rotate but not move forward
		}
		speed = 1;
		console.log("TOO CLOSE!!!");
	}
	
}, 300);

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket){

	function log(){
		var array = [">>> Mensaje desde el servidor: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		log('socket.on message: ', message);
    // For a real app, should be room only (not broadcast)
		socket.broadcast.emit('message', message);
        io.sockets.in('robotRoom').emit('message', message);
	});

	socket.on('create or join', function (room) {
		var numClients = io.sockets.clients(room).length;

		log('Cuarto ' + room + ' tiene ' + numClients + ' cliente(s)');
		log('Requerimiento para crear o participar en el cuarto', room);

		if (numClients == 0){
			socket.join(room); // el primero que ingresa crea el cuarto 
			socket.emit('created', room);
		} else if (numClients == 1) {
			io.sockets.in(room).emit('join', room); //esta accediendo al grupo
			socket.join(room); 
			socket.emit('joined', room); // se ha unido al grupo
		} else { // max two clients
			socket.emit('full', room);
		}
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

	});
	
	// The client is asking for the current distance to the closest obstacle
	socket.on("getDistance", function(){
		console.log("socket.getDistance");
		socket.emit("distance", current_dist);
	});

	socket.on('ACTUAR', function (message) {
		console.log('socket.on ACTUAR: ', message);
		if (message=='forward' && STATE == 1)
			robotForward();
		else if (message=='left') 
			robotLeft();
		else if (message=='stop') 
			robotStop();
		else if (message=='right') 
			robotRight();
		else if (message=='reverse') 
			robotReverse();
		else if (message=='PITCHUP') 
			pitchUp();
		else if (message=='PITCHDOWN') 
			pitchDown();
		else if (message=='YAWLEFT') 
			yawLeft();
		else if (message=='YAWRIGHT') 
			yawRight();
		else if (message=='ROLLLEFT') 
			rollLeft();
		else if (message=='ROLLRIGHT') 
			rollRight();
		else if (message=='HEADZERO') 
			headZero();
	});
});

/////////////////////////////////////////////////////
// BASE MOTION
/////////////////////////////////////////////////////


var robotForward = function () {
    console.log('robotForward');
    serialPortArduino.write("1");
}

var robotReverse = function () {
    console.log('robotReverse');
    serialPortArduino.write("2");
}

var robotLeft = function () {
    console.log('robotLeft');
    serialPortArduino.write("3");
}
var robotRight = function () {
    console.log('robotRight');
    serialPortArduino.write("4");
}
var robotStop = function () {
    console.log('robotStop');
    serialPortArduino.write("5");
}


var ledOn = function () {
    console.log('ledOn');
    serialPortArduino.write("6");
}

var ledOff = function () {
    console.log('ledOff');
    serialPortArduino.write("7");
}


var ledBlink = function () {
    console.log('ledBlink');
    serialPortArduino.write("8");
}

var socialMotionTrue = function () {
    console.log('ledBlink');
    serialPortArduino.write("9");
}
var socialMotionFalse = function () {
    console.log('ledBlink');
    serialPortArduino.write("10");
}

/////////////////////////////////////////////////////
// HEAD MOTION
/////////////////////////////////////////////////////
var pitchUp = function () {
    console.log('pitchUp');
    serialPortROBOTIS.write("1");
}
var pitchDown = function () {
    console.log('pitchDown');
    serialPortROBOTIS.write("2");
}

var yawLeft = function () {
    console.log('yawLeft');
    serialPortROBOTIS.write("3");
}
var yawRight = function () {
    console.log('yawRight');
    serialPortROBOTIS.write("4");
}

var rollLeft = function () {
    console.log('rollLeft');
    serialPortROBOTIS.write("5");
}
var rollRight = function () {
    console.log('rollRight');
    serialPortROBOTIS.write("6");
}

var headZero = function () {
    console.log('headZero');
    serialPortROBOTIS.write("7");
}




///////////////////////////////////////////
// KEYPRESS
///////////////////////////////////////////

var baseCommand = function(var1 , var2 , var3 ) {
    bufferBase[0] = var1;
    bufferBase[1] = var2;
    bufferBase[2] = var3;
    console.log('baseCommand = ',bufferBase);
    serialPortArduino.write(bufferBase);
}

keypress(process.stdin);

var keys = {
    'w': function () {
        
		if (STATE == 1){
			console.log('Forward!');
			// Un comment next line to have a fixed speed
			//serialPortArduino.write("1");
			// Comment next line to have a fixed speed
			baseCommand (VELO, 100*speed + offset , 100*speed + offset );
		} else{
			console.log('Not allowed to move forward!');
		}

    },
    's': function () {
        console.log('Reverse!');
        serialPortArduino.write("2");

    },
    'a': function () {
        console.log('Turn left!');
        serialPortArduino.write("3");
    },
    'd': function () {
        console.log('Turn right!');
        serialPortArduino.write("4");
    },
    'space': function () {
        console.log('STOP!');
        serialPortArduino.write("5");
    },
	///////////////////////////////////////
	// HEAD MOTION
	///////////////////////////////////////
  	// PITCH
    'u': function () {
        console.log('SERVER KEY PITCHUP');
        serialPortROBOTIS.write("1");

    },
    'm': function () {
        console.log('SERVER KEY PITCHDOWN');
        serialPortROBOTIS.write("2");

    },
	// YAW
    'h': function () {
        console.log('SERVER KEY YAWLEFT');
        serialPortROBOTIS.write("3");

    },
    'k': function () {
        console.log('SERVER KEY YAWRIGHT');
        serialPortROBOTIS.write("4");

    },
	// ROLL
    'y': function () {
        console.log('SERVER KEY ROLLLEFT');
        serialPortROBOTIS.write("5");

    },
    'i': function () {
        console.log('SERVER KEY ROLLRIGHT');
        serialPortROBOTIS.write("6");

    },
    'j': function () {
        console.log('HEADZERO');
        serialPortROBOTIS.write("7");

    }
}


console.log("Iniciando keypress...");

process.stdin.on('keypress', function (ch, key) {
	console.log(key);
    if (key && keys[key.name]) { keys[key.name](); }
    if (key && key.ctrl && key.name == 'c') { quit(); }
});

process.stdin.setRawMode(true);
process.stdin.resume();

// abriendo puerto serial

serialPortArduino.open(function () {
    console.log('Server: serialport.open');
    serialPortArduino.on('data', function (data) {
        console.log('Server: dato recibido: ' + data);
    });
});

serialPortROBOTIS.open(function () {
    console.log('Server: serialportROTOBIS.open');
    serialPortROBOTIS.on('data', function (data) {
        console.log('Server: dato recibido: ' + data);
    });
});

var quit = function () {
    console.log('Server: Saliendo de keypress y serialport...');
    serialPortArduino.close();
    serialPortROBOTIS.close();
    process.stdin.pause();
    process.exit();
}

