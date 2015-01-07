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
var serialPortArduino = new SerialPortArduino("COM8", {baudrate: 115200}, false); // this is the openImmediately flag [default is true]
/*
var SerialPortROBOTIS = require("serialport").SerialPort
var serialPortROBOTIS = new SerialPortROBOTIS("COM5", {baudrate: 9600}, false); // this is the openImmediately flag [default is true]
*/

//Buffer to send values through serialport
var bufferHeadSize = 4;
var bufferBaseSize = 3;
bufferHead = new Buffer(bufferHeadSize);
bufferBase = new Buffer(bufferBaseSize);

// Thresholds for detecting if the robot is too close
var STOP_TH = 400;
var WARN_TH = 1200;

// Velocity command HEX codes
var STOP = 	0X00;
var VELO =	0X01;
var offset = 100;
var is_moving_fw = 0;

//console.log('Corriendo en https://localhost:8000');

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
	////console.log(current_dist);
	distances[distances.length] = current_dist;
	
	if(distances.length > BUFFER_LEN){
		dist_new = []
		for(var i = 1; i < distances.length; i++){
			dist_new[dist_new.length] = distances[i]
		}
		distances = dist_new;
	}
	////console.log(distances.average());
	////console.log(distances);
	if(current_dist < 0){ // error
		//console.log("Distance error", current_dist);
	}else if(distances.average() > WARN_TH){ // safe
		//console.log("Safe to move");
		STATE = 1;
		speed = 1;
		if(is_moving_fw){
			baseCommand (VELO, 100*speed + offset , 100*speed + offset );
		}
	}else if(distances.average() > STOP_TH && distances.average() <= WARN_TH){ // warning
		//console.log("YOU ARE GETTING CLOSER!");
		speed = (distances.average()-STOP_TH)/(WARN_TH-STOP_TH+1);
		if(is_moving_fw){
			//console.log("Speed = "+speed);
			baseCommand (VELO, 100*speed + offset , 100*speed + offset );
		}
		STATE = 1;
	}else if(distances.average() <= STOP_TH){ // stop
		if(STATE == 1 && is_moving_fw){
			robotStop();
			STATE = 0; //Robot can rotate but not move forward
			//console.log("STATE = 0");
			is_moving_fw = 0;
		}
		speed = 1;
		//console.log("TOO CLOSE!!!");
	}
	
}, 200);

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
		//console.log("socket.getDistance");
		socket.emit("distance", current_dist);
	});

	socket.on('ACTUAR', function (message) {
		//console.log('socket.on ACTUAR: ', message);
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
	is_moving_fw = 1;
    baseCommand (VELO, 100 + offset , 100 + offset );
}

var robotReverse = function () {
    console.log('robotReverse');
	is_moving_fw = 0;
    baseCommand (VELO, -50 + offset, -50 + offset);
}

var robotLeft = function () {
    console.log('robotLeft');
	is_moving_fw = 0;
    baseCommand (VELO, -40 + offset, 40 + offset);  
}
var robotRight = function () {
    console.log('robotRight');
	is_moving_fw = 0;
    baseCommand (VELO, 40 + offset, -40 + offset);
}
var robotStop = function () {
    console.log('robotStop');
	is_moving_fw = 0;
    baseCommand (VELO, 0 + offset, 0 + offset);
}



var headMovement = function(varPitch , varYaw , varRoll ) {
    idOp = 0x02; //operation 0x02
    bufferHead[0] = idOp;
    bufferHead[1] = varPitch;
    bufferHead[2] = varYaw;
    bufferHead[3] = varRoll;
    //console.log('headMovement = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
    
}

var baseCommand = function(var1 , var2 , var3 ) {
    bufferBase[0] = var1;
    bufferBase[1] = var2;
    bufferBase[2] = var3;
    //console.log('baseCommand = ',bufferBase);
    serialPortArduino.write(bufferBase);
}

///////////////////////////////////////////
// KEYPRESS
///////////////////////////////////////////
keypress(process.stdin);
var keys = {
    'w': function () {
        if (STATE == 1){
			//console.log('Forward!');
			is_moving_fw = 1;
			baseCommand (VELO, 100*speed + offset , 100*speed + offset );
		} else{
			//console.log('Not allowed to move forward!');
		}

    },
    's': function () {
        //console.log('Reverse!');
		is_moving_fw = 0;
        baseCommand (VELO, -50 + offset, -50 + offset);

    },
    'a': function () {
        //console.log('Turn left!');
		is_moving_fw = 0;
        baseCommand (VELO, -40 + offset, 40 + offset);    
	},
    'd': function () {
        //console.log('Turn right!');
		is_moving_fw = 0;
        baseCommand (VELO, 40 + offset, -40 + offset);
	},
    'space': function () {
        //console.log('STOP!');
		is_moving_fw = 0;
        baseCommand (VELO, 0 + offset, 0 + offset);
    },
	///////////////////////////////////////
	// HEAD MOTION
	///////////////////////////////////////
  	// PITCH
    'u': function () {
        //console.log('SERVER KEY PITCHUP');
        pitchUp();
    },
    'm': function () {
        //console.log('SERVER KEY PITCHDOWN');
		pitchDown();
    },
	// YAW
    'h': function () {
        //console.log('SERVER KEY YAWLEFT');
		yawLeft();
    },
    'k': function () {
        //console.log('SERVER KEY YAWRIGHT');
		yawRight();
    },
	// ROLL
    'y': function () {
        //console.log('SERVER KEY ROLLLEFT');
		rollLeft();
    },
    'i': function () {
        //console.log('SERVER KEY ROLLRIGHT');
		rollRight();
    },
    'j': function () {
        //console.log('HEADZERO');
		headZero();
    }
}

/////////////////////////////////////////////////////
// BASE COMMAND FUNCTIONS
/////////////////////////////////////////////////////
var ledOn = function () {
    //console.log('ledOn');
    serialPortArduino.write("6");
}

var ledOff = function () {
    //console.log('ledOff');
    serialPortArduino.write("7");
}


var ledBlink = function () {
    //console.log('ledBlink');
    serialPortArduino.write("8");
}

var socialMotionTrue = function () {
    //console.log('ledBlink');
    serialPortArduino.write("9");
}
var socialMotionFalse = function () {
    //console.log('ledBlink');
    serialPortArduino.write("10");
}

/////////////////////////////////////////////////////
// HEAD MOTION FUNCTIONS
/////////////////////////////////////////////////////
var pitchUp = function (varPitch, varYaw, varRoll) {
    idOp = 0x02; //operation 0x02
	varPitch = 100;
	varYaw = 50;
	varRoll = 50;
    bufferHead[0] = idOp;
    bufferHead[1] = varPitch;
    bufferHead[2] = varYaw;
    bufferHead[3] = varRoll;
    //console.log('PITCHUP = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
}
var pitchDown = function (varPitch, varYaw, varRoll) {
    idOp = 0x02; //operation 0x02
	varPitch = 0;
	varYaw = 50;
	varRoll = 50;
    bufferHead[0] = idOp;
    bufferHead[1] = varPitch;
    bufferHead[2] = varYaw;
    bufferHead[3] = varRoll;
    //console.log('PITCHUP = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
}

var yawLeft = function (varPitch, varYaw, varRoll) {
    idOp = 0x02; //operation 0x02
	varPitch = 50;
	varYaw = 100;
	varRoll = 50;
    bufferHead[0] = idOp;
    bufferHead[1] = varPitch;
    bufferHead[2] = varYaw;
    bufferHead[3] = varRoll;
    //console.log('PITCHUP = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
}
var yawRight = function (varPitch, varYaw, varRoll) {
    idOp = 0x02; //operation 0x02
	varPitch = 50;
	varYaw = 0;
	varRoll = 50;
    bufferHead[0] = idOp;
    bufferHead[1] = varPitch;
    bufferHead[2] = varYaw;
    bufferHead[3] = varRoll;
    //console.log('PITCHUP = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
}

var rollLeft = function (varPitch, varYaw, varRoll) {
    idOp = 0x02; //operation 0x02
	varPitch = 50;
	varYaw = 50;
	varRoll = 100;
    bufferHead[0] = idOp;
    bufferHead[1] = varPitch;
    bufferHead[2] = varYaw;
    bufferHead[3] = varRoll;
    //console.log('PITCHUP = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
}
var rollRight = function (varPitch, varYaw, varRoll) {
    idOp = 0x02; //operation 0x02
	varPitch = 50;
	varYaw = 50;
	varRoll = 0;
    bufferHead[0] = idOp;
    bufferHead[1] = varPitch;
    bufferHead[2] = varYaw;
    bufferHead[3] = varRoll;
    //console.log('PITCHUP = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
}

var headZero = function (varPitch, varYaw, varRoll) {
	idOp = 0x01; //Zero operation
	varPitch = 50;
	varYaw = 50;
	varRoll = 50;
	bufferHead[0] = idOp;
	bufferHead[1] = varPitch;
	bufferHead[2] = varYaw;
	bufferHead[3] = varRoll;
	//console.log('HEADZERO = ',bufferHead);
    serialPortROBOTIS.write(bufferHead);
}


//console.log("Iniciando keypress...");

process.stdin.on('keypress', function (ch, key) {
	//console.log(key);
    if (key && keys[key.name]) { keys[key.name](); }
    if (key && key.ctrl && key.name == 'c') { quit(); }
});

process.stdin.setRawMode(true);
process.stdin.resume();

// abriendo puerto serial

serialPortArduino.open(function () {
    //console.log('Server: serialport.open');
    serialPortArduino.on('data', function (data) {
        //console.log('Server: dato recibido: ' + data);
    });
});
/*
serialPortROBOTIS.open(function () {
    //console.log('Server: serialportROTOBIS.open');
    serialPortROBOTIS.on('data', function (data) {
        //console.log('Server: dato recibido: ' + data);
    });
});
*/
var quit = function () {
    //console.log('Server: Saliendo de keypress y serialport...');
    serialPortArduino.close();
    //serialPortROBOTIS.close();
    process.stdin.pause();
    process.exit();
}

