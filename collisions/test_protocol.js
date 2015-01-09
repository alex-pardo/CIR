var io = require('socket.io'),
socket = io.connect('localhost', {
    port: 8000
});
socket.on('connect', function () { console.log("socket connected"); });

//socket.emit('private message', { user: 'me', msg: 'ACTUAR' });