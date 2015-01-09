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
var SerialPortArduino = require("serialport").SerialPort
var serialPortArduino = new SerialPortArduino("COM6", {baudrate: 9600}, false); // this is the openImmediately flag [default is true]

var SerialPortROBOTIS = require("serialport").SerialPort
var serialPortROBOTIS = new SerialPortROBOTIS("COM5", {baudrate: 9600}, false); // this is the openImmediately flag [default is true]


console.log('Corriendo en https://localhost:8000');

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
        //io.sockets.in('robotRoom').emit('message', message);
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

	socket.on('ACTUAR', function (message) {
		console.log('socket.on ACTUAR: ', message);
		if (message=='forward')
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


var quit = function () {
    console.log('Server: Saliendo de keypress y serialport...');
    serialPortArduino.close();
    serialPortROBOTIS.close();
    process.stdin.pause();
    process.exit();
}


///////////////////////////////////////////
// KEYPRESS
///////////////////////////////////////////
keypress(process.stdin);

var keys = {
    'w': function () {
        console.log('Forward!');
        serialPortArduino.write("1");

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
		serialPortROBOTIS.write(" ");
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
	//console.log(key);
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

