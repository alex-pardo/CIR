'use strict';
//var loveStream;
var context;
var carBarkingBuffer = null;
var loveBuffer = null;
var beatBarkingBuffer = null;

var pipes = new Array();

var numVideoStream = 1;
var data;
var sendChannel, receiveChannel, pcConstraint, dataConstraint;
//var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelSend = document.querySelector('input#dataChannelSend');
var keyControl = document.querySelector('input#keyControl');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var sctpSelect = document.querySelector('input#useSctp');
var rtpSelect = document.querySelector('input#useRtp');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

var forwardButton = document.querySelector('button#forward');
var leftButton = document.querySelector('button#left');
var stopButton = document.querySelector('button#stop');
var rightButton = document.querySelector('button#right');
var reverseButton = document.querySelector('button#reverse');

var CabezaArribaButton = document.querySelector('button#CabezaArriba');
var CabezaNormalButton = document.querySelector('button#CabezaNormal');
var CabezaAbajoButton = document.querySelector('button#CabezaAbajo');



var carButton = document.querySelector('button#carButton');
var beatButton = document.querySelector('button#beatButton');
var loveButton = document.querySelector('button#loveButton');
////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var vid1 = document.querySelector('#vid1');
//var remoteVideo = document.querySelector('#remoteVideo');
var remoteVideoFrontal = document.querySelector('#remoteVideoFrontal');
var remoteVideoOmni = document.querySelector('#remoteVideoOmni');


var audioTracks;
var webAudio;
var filteredStream;

////////////////////////////////////////////////////
//BOTONES CONTROL MOTORES
////////////////////////////////////////////////////
//startButton.onclick = createConnection;
sendButton.onclick = sendData;
forwardButton.onclick = sendDataForward;
leftButton.onclick = sendDataLeft;
stopButton.onclick = sendDataStop;
rightButton.onclick = sendDataRight;
reverseButton.onclick = sendDataReverse;

carButton.onclick = playSoundCar;
beatButton.onclick = playSoundBeat;
loveButton.onclick = playLove;

dataChannelSend.onkeypress = handleSendKeyPress;
keyControl.onkeypress = handleKeyControl;

////////////////////////////////////////////////////
//BOTONES CONTROL CABEZA
////////////////////////////////////////////////////
CabezaArribaButton.onclick = CabezaArriba;
CabezaNormalButton.onclick = CabezaNormal;
CabezaAbajoButton.onclick = CabezaAbajo;


/*closeButton.onclick = closeDataChannels;
rtpSelect.onclick = enableStartButton;
sctpSelect.onclick = enableStartButton;
*/

var user='dennys';
var isChannelReady;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var constraints;
var pc_config = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };
/*var pc_config = {
  'iceServers': [
    {
      'url': 'stun:stun.l.google.com:19302'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    }
  ]
}*/

//var pc_config = { 'iceServers': [{ 'url': 'http://signaling.simplewebrtc.com:8888' }] };

var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

/////////////////////////////////////////////

/*var room = location.pathname.substring(1);
if (room === '') {
  room = 'robotRoom'; //prompt('Enter room name:');
} else {
    //
   
}
*/


///////////////////////////////////
// Tomo las fuentes de video que existen en la compu. Las necesito para añadir las camaras fuente (frente y omnidireccional) en el robot
///////////////////////////////////
var videoSources = [];
MediaStreamTrack.getSources(function (media_sources) {
    //console.log('media sources: ' + media_sources);
    //alert('media_sources : '+media_sources);
    media_sources.forEach(function (media_source) {
        if (media_source.kind === 'video') {
            //console.log("media_source..." + media_source.label);
            videoSources.push(media_source);
        }
    });
    //console.log("llama a funcion getMediaSource...");
    //getMediaSource(videoSources);
    //console.log('video sources: ' + videoSources[2].label);
});

//////////////////////////////////////////////////////////////////////////////

var socket = io.connect();
var room = 'robotRoom';
if (room !== '') {
  //console.log('Creando or join room', room);
  socket.emit('create or join', room);
}

socket.on('created', function (room){
  // Aqui entra el iniciador de la conversacion ei robot
  //console.log('socket.on created');
  //isInitiator = true;
  user='dennys';
  console.log('Created: ' + user + ' isInitiator: ' + isInitiator);
    ////////////////////////////////////////////////
  // getUserMedia para 

  //basic constraints
  //constraints = { video: true, audio: true };
  //QVGA resultante : 176x144
  constraints = { audio: true, video: { mandatory: { maxWidth: 320, maxHeight: 180, googCpuOveruseDetection: true, googLeakyBucket: true } } };
  //VGA video Stream resultante: 352x288
  //constraints = { audio: true, video: { mandatory: { maxWidth: 640, maxHeight: 360, googCpuOveruseDetection: true, googLeakyBucket: true  } } };
  //HD video 1280x720
  //constraints = { audio: true, video: { mandatory: { minWidth: 1280, minHeight: 720, googCpuOveruseDetection: true, googLeakyBucket: true } } };

  console.log(user + ' getUserMedia, constraints', constraints);
  getUserMedia(constraints, handleUserMedia, handleUserMediaError);
  
});


socket.on('join', function (room){
  // aqui entra el robot
  console.log(user + ' join ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function (room){
  //aqui entra dennys
    console.log(user + ' joined ' + room);
    isChannelReady = true;
    //console.log('isChannelReady ' + isChannelReady);

    //QVGA resultante : 176x144
    constraints = { audio: true, video: { mandatory: { maxWidth: 320, maxHeight: 180, googCpuOveruseDetection: true, googLeakyBucket: true } } };
    //constraints = { audio: true, video: false};

    getUserMedia(constraints, handleUserMedia, handleUserMediaError);
    //console.log(user + ' getUserMedia con constraints', constraints);

});

socket.on('full', function (room){
  console.log('No hay cama pa tanta gente, el cuarto ' + room + ' esta lleno!');
});


socket.on('log', function (array){
  console.log.apply(console, array);
});


socket.on('message', function (message){
  console.log(user + ' recibe mensaje de server:', message);

  if (message === 'got user media') {
    console.log('entro a message->got user media');
    maybeStart();
  }
  else if (message.type === 'offer') {
    console.log(user + 'recibe mensaje de oferta');
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  }
  else if (message.type === 'answer' && isStarted) {
    console.log(user + ' recibe mensaje de respuesta');
    pc.setRemoteDescription(new RTCSessionDescription(message));
  }
  else if (message.type === 'candidate' && isStarted) {
    console.log(user + ' recibe mensaje de candidate');
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    console.log(user + ' AÑADE ICE CANDIDATE: ' + message.candidate);    
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});


////////////////////////////////////////////////

function sendMessage(message){
	console.log(user + ' envia mensaje al server: ', message);
  // if (typeof message === 'object') {
  //   message = JSON.stringify(message);
  // }
  socket.emit('message', message);
}



function handleUserMedia(stream) {
  console.log(user + ' handleUserMedia');
  localVideo.src = window.URL.createObjectURL(stream);
  //localStream = stream;
  audioTracks = stream.getAudioTracks();
  if (audioTracks.length == 1) {
      console.log('HANDLE USER MEDIA AUDIO TRACK == 1');
      

      filteredStream = applyFilter(stream);


      localStream = stream;
    } else {
      alert('The media stream contains an invalid amount of audio tracks.');
      stream.stop();
    }

  sendMessage('got user media');
  console.log('handleUserMedia: '+ user+ ' isInitiator: ' + isInitiator);
  if (isInitiator) {
    maybeStart();
  }
}

function handleUserMediaError(error){
  console.log('Error de getUserMedia: ', error);
}

//var constraints = {video: false };


//var constraints = { video: true };
//getUserMedia(constraints, handleUserMedia, handleUserMediaError);
//console.log('Getting user media with constraints', constraints);

/*dp
if (location.hostname != "localhost") {
  requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
}
*/

function maybeStart() {
  console.log('maybeStart ' + user);
  console.log('!isStarted=' + !isStarted + ' localStream: ' + localStream + ' isChannelReady ' + isChannelReady);
  if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
    console.log('maybeStart ' + user + ' entra al if');
    createPeerConnection();
    createDataChannel();

    pc.ondatachannel = receiveChannelCallback;

    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;
    //dp audio
	//pc.addStream(loveStream);
    pc.addStream(filteredStream);
    pc.addStream(localStream);

    isStarted = true;
    console.log('maybeStart ' + user + ' isInitiator ', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function(e){
	sendMessage('bye');


}

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log(user + ' RTCPeerConnectionnection creada');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
}

function createDataChannel(){
  dataChannelSend.placeholder = '';
  dataConstraint = null;
  try {
    // Data Channel api supported from Chrome M25.
    // You might need to start chrome with  --enable-data-channels flag.
    sendChannel = pc.createDataChannel('sendDataChannel', dataConstraint);
    trace(user + ' crea send data channel');
  } catch (e) {
    alert('Failed to create data channel. ' +
          'You need Chrome M25 or later with --enable-data-channels flag');
    trace('Create Data channel failed with exception: ' + e.message);
  }
}



function handleIceCandidate(event) {
  console.log(user + ' handleIceCandidate: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('Final de candidatos.');
  }
}


function handleCreateOfferError(event){
  console.log('createOffer() error: ', e);
}

function handleCreateAnswerError(event){
  console.log('createAnswer() error: ', e);
}

function doCall() {
  console.log(user + ' envia una oferta.');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log(user + 'Envia una respuesta.');
  pc.createAnswer(setLocalAndSendMessage, handleCreateAnswerError, sdpConstraints);
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  console.log(user + ' setLocalAndSendMessage sessionDescription: ' , sessionDescription);
  sendMessage(sessionDescription);
}

function requestTurn(turn_url) {
  console.log('Entro a requestTurn');
  var turnExists = false;
  for (var i in pc_config.iceServers) {
    console.log('Entro a var i in pc_config.iceServers: ' + pc_config.iceServers);
    if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
      console.log('entro a turnExists = true');
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turn_url);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
      	console.log('Got TURN server: ', turnServer);
        pc_config.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turn_url, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  if (numVideoStream==1){
    console.log(user + ' Remote stream added. event. MediaStream frontal : ' + event.stream.id);
    remoteVideoFrontal.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
  }
  else if (numVideoStream==2){
    console.log(user + ' Remote stream added. event. MediaStream omni: ' + event.stream.id);
    remoteVideoOmni.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
  }
  numVideoStream=numVideoStream+1;

}


/*function handleRemoteStreamAdded(event) {
  console.log(user + ' Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}
*/
function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
   stop();
   //isInitiator = false;
}

function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}


/*  function stop() {
    webAudio.stop();

    // pc1.close();
    // pc2.close();
    // pc1 = null;
    // pc2 = null;

     pc.close();
     pc = null;


    buttonStart.enabled = true;
    buttonStop.enabled = false;
    localStream.stop();
  }

*/

///////////////////////////////////////////
// Set Opus as the default audio codec if it's present.
///////////////////////////////////////////
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}

///////////////////////////////////////////
// Funciones datachannel
///////////////////////////////////////////
function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}


function onReceiveMessageCallback(event) {
  trace(user + ' recibe dato: ' + event.data);
  dataChannelReceive.value = event.data;
  // aqui viene la funcion para enviar el dato al servidor
  // Hay dos tipos de mensajes: ACTUAR y HABLAR
  if (dataChannelReceive.value.substr(0, 7) === 'HABLAR:'){
    console.log(user + ' HABLAR ' + dataChannelReceive.value.substr(7,dataChannelReceive.value.length))
    //speak(dataChannelReceive.value.substr(7,dataChannelReceive.value.length));
    //window.speechSynthesis.speak(msg);
    //speechSynthesis.speak(SpeechSynthesisUtterance('Hello World'));
    var msg = new SpeechSynthesisUtterance(dataChannelReceive.value.substr(7,dataChannelReceive.value.length));
    window.speechSynthesis.speak(msg);
    //window.speechSynthesis.speak(SpeechSynthesisUtterance(dataChannelReceive.value.substr(7,dataChannelReceive.value.length)));

  }
  
}






function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState == 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    //closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    //closeButton.disabled = true;
  }
}
  

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state readyState is: ' + readyState);
}


//funciones para enviar datos al robot mediante el datachannel
function handleSendKeyPress(event) {
  console.log ('entro a handleSendKeyPress...' + event.keyCode + ' '+ event.which);
  var key=event.keyCode || event.which;
  if (key==13){
    console.log('entro a key13..');
    sendData();
   
  }
}

function handleKeyControl(event) {
  console.log ('handleKeyControl...' + event.keyCode + ' event.which: '+ event.which);
  var key=event.keyCode || event.which;
  if (key==121 || key==117 || key==105 || key==104 || key==106 || key==107 || key==109 || key==32 || key==119 || key==97 || key==115 || key==100){
    console.log('One of keyControl..');
	if (key==32){
		data = 'ACTUAR:stop';
		}
	else if (key==119){
		data = 'ACTUAR:forward';
		}
	else if (key==115){
		data = 'ACTUAR:reverse';
		}
	else if (key==97){
		data = 'ACTUAR:left';
		}
	else if (key==100){
		data = 'ACTUAR:right';
		}
	else if (key==106){
		data = 'ACTUAR:HEADZERO';
		}
	else if (key==117){
		data = 'ACTUAR:PITCHUP';
		}
	else if (key==109){
		data = 'ACTUAR:PITCHDOWN';
		}
	else if (key==104){
		data = 'ACTUAR:YAWLEFT';
		}
	else if (key==107){
		data = 'ACTUAR:YAWRIGHT';
		}
	else if (key==121){
		data = 'ACTUAR:ROLLLEFT';
		}
	else if (key==105){
		data = 'ACTUAR:ROLLRIGHT';
		}
	trace(user + ' envia dato: ' + data);
	sendChannel.send(data);
	keyControl.value = null;
  }
}


function sendData() {
  var data = 'HABLAR:'+dataChannelSend.value;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
  dataChannelSend.value = null;
}

function sendDataForward() {
  var data = 'ACTUAR:forward';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}

function sendDataLeft() {
  var data = 'ACTUAR:left';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}

function sendDataStop() {
  var data = 'ACTUAR:stop';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}
function sendDataRight() {
  var data = 'ACTUAR:right';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}

function sendDataReverse() {
  var data = 'ACTUAR:reverse';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}


function CabezaArriba() {
  var data = 'ACTUAR:CABEZAARRIBA';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}

function CabezaNormal() {
  var data = 'ACTUAR:CABEZANORMAL';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}
function CabezaAbajo() {
  var data = 'ACTUAR:CABEZAABAJO';
  //dataChannelSend.value = data;
  sendChannel.send(data);
  trace(user + ' envia dato: ' + data);
}

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
//AUDIO INPUT
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////


window.addEventListener('load', init, false);

function init() {
  try {
    // Fix up for prefixing
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new AudioContext();
    window.filter = context.createBiquadFilter();
    window.filter.type = 0; // Low-pass filter. See BiquadFilterNode docs
    window.filter.frequency.value = 440; 
    //window.filter.type = filter.HIGHPASS;
    //window.filter.frequency.value = 1500;



  }
  catch(e) {
    alert('Web Audio API is not supported in this browser');
  }
}



// Fix up prefixing
/*window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
*/
function loadLoveSound(url) {
  console.log('entro loadLove..');
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      loveBuffer = buffer;
    }, onError);
  }
  request.send();
}


function loadCarSound(url) {
  console.log('entro loadDogSound..');
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      carBarkingBuffer = buffer;
    }, onError);
  }
  request.send();
}

function loadBeatSound(url) {
  console.log('entro loadDogSound..');
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      beatBarkingBuffer = buffer;
    }, onError);
  }
  request.send();
}

function playSound(buffer) {
  console.log('entro playSound..');
  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)
  source.start(0);                           // play the source now
                                             // note: on older systems, may have to use deprecated noteOn(time);
}

loadCarSound ('/audio/car01.mp3');
loadBeatSound ('/audio/beat01.mp3');
loadLoveSound ('/audio/love.mp3');

//loadDogSound ('/audio/beat01.mp3');
//loadDogSound ('/audio/Birkin.mp3');
//Birkin

function onError() {
  console.log('entro a onError');
}

function playSoundCar() {
//  webAudio.addEffect();
  //playSound (dogBarkingBuffer);
  console.log ('ENTRO A PLAYSOUNDSIRENA..');
    var effect = context.createBufferSource();
    effect.buffer = carBarkingBuffer;
    //window.peer = context.createMediaStreamDestination();

    if (window.peer) {
      console.log ('ENTRO A WINDOW.PEER..');
      effect.connect(window.peer);
      effect.start(0);
    }
}

function playLove() {
//  webAudio.addEffect();
  //playSound (dogBarkingBuffer);
  console.log ('ENTRO playLove..');
    var effect = context.createBufferSource();
    effect.buffer = loveBuffer;
    //window.peer = context.createMediaStreamDestination();

    if (window.peer) {
      console.log ('ENTRO A WINDOW.PEER..');
      effect.connect(window.peer);
      effect.start(0);
    }
}

function playSoundBeat() {
//  webAudio.addEffect();
  //playSound (dogBarkingBuffer);
  console.log ('ENTRO A PLAYSOUNDSIRENA..');
    var effect = context.createBufferSource();
    effect.buffer = beatBarkingBuffer;
    //window.peer = context.createMediaStreamDestination();

    if (window.peer) {
      console.log ('ENTRO A WINDOW.PEER..');
      effect.connect(window.peer);
      effect.start(0);
    }
}


  function applyFilter (stream) {
    console.log('ENTRO A APPLYFILTER...');
    //window.mic = context.createMediaStreamSource(stream);
    //window.mic.connect(window.filter);
    window.peer = context.createMediaStreamDestination();
    window.filter.connect(window.peer);
    return window.peer.stream;
  }

