
var addon = require('bindings')('addon');
var Kinect_obj = new addon.Server(10);



setInterval(function readGesture(){
var val = Kinect_obj.getGesture();
if(val != -9){
	console.log(val);
}
},100);

