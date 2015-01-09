var addon = require('bindings')('addon');
var io = require('socket.io');

var obj = new addon.KinectReader(10);

var user='kinect';
var socket = io.connect();
var room = 'robotRoom';
if (room !== '') {
  //console.log('Creando or join room', room);
  socket.emit('create or join', room);
}


var i = 1000;
while(i > 0){ 
console.log( obj.getValue() ); 
i--;
}