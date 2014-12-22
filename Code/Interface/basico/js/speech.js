/*
 * Check for browser support
 */
var supportMsg = document.getElementById('msg');
var msg;

if ('speechSynthesis' in window) {
  supportMsg.innerHTML = 'Su browser <strong>sí soporta</strong> la sintesis de voz.';
} 
else{
  supportMsg.innerHTML = 'Lo siento <strong>no soporta</strong> la síntesis de voz.<br>Actualice su google Chrome';
  supportMsg.classList.add('not-supported');
}


// Get the 'speak' button
var buttonSpeak = document.getElementById('speak');
var buttonConfigSpeak = document.getElementById('configSpeak');

// Get the text input element.
var speechMsgInput = document.getElementById('speech-msg');

// Get the voice select element.
var voiceSelect = document.getElementById('voice');

// Get the attribute controls.
var volumeInput = document.getElementById('volume');
var rateInput = document.getElementById('rate');
var pitchInput = document.getElementById('pitch');


// Fetch the list of voices and populate the voice options.
function loadVoices() {
  // Fetch the available voices.
  var voices = speechSynthesis.getVoices();
  // Loop through each of the voices.
  voices.forEach(function(voice, i) {
    // Create a new option element.
    var option = document.createElement('option');
    
    // Set the options value and text.
    option.value = voice.name;
    option.innerHTML = voice.name;
      
    // Add the option to the voice selector.
    voiceSelect.appendChild(option);
  });
}

// Execute loadVoices.
loadVoices();

// Chrome loads voices asynchronously.
window.speechSynthesis.onvoiceschanged = function(e) {
  loadVoices();
};


// Create a new utterance for the specified text and add it to
// the queue.
function speak(text) {
//  console.log('entro a speak con dato ' + text);
  // Create a new instance of SpeechSynthesisUtterance
  
  // Set the text
//console.time('set text');
  msg.text = text;
 // console.timeEnd('set text');

  
  // Queue this utterance.
//console.time('speakAsinc');
  //window.speechSynthesis.speak(msg);
  window.speechSynthesis.speak(msg);
}

//console.timeEnd('speakAsinc');

//console.log('salgo de  speak aqui');

    /*var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    msg.voice = voices[10]; // Note: some voices don't support altering params
    msg.voiceURI = 'native';
    msg.volume = 1; // 0 to 1
    msg.rate = 1; // 0.1 to 10
    msg.pitch = 2; //0 to 2
    msg.text = 'Hello World';
    msg.lang = 'en-US';

    msg.onend = function(e) {
      console.log('Finished in ' + event.elapsedTime + ' seconds.');
    };

    speechSynthesis.speak(msg);
*/



	  


    /*// Set up an event listener for when the 'speak' button is clicked.
    buttonSpeak.addEventListener('click', function(e) {
      if (speechMsgInput.value.length > 0) {
        speak(speechMsgInput.value);
      }
    });
	*/


// Set up an event listener for when the 'speak' button is clicked.
buttonConfigSpeak.addEventListener('click', function(e) {
//console.time('speechsynthesisutterance');
  msg = new SpeechSynthesisUtterance();
//console.timeEnd('speechsynthesisutterance');

    // Set the attributes.
  console.time('volumen');
  msg.volume = parseFloat(volumeInput.value);
  console.timeEnd('volumen');
  console.time('rate');
  msg.rate = parseFloat(rateInput.value);
  console.timeEnd('rate');
  console.time('pitch');
  msg.pitch = parseFloat(pitchInput.value);
  console.time('pitch');
  // If a voice has been selected, find the voice and set the
  // utterance instance's voice attribute.
  console.time('voiceselect');
  if (voiceSelect.value) {
    msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == voiceSelect.value; })[0];
  }
  console.timeEnd('voiceselect');
});




