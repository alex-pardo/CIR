
#include "KinectReader.h"


using namespace v8;


#include <stdio.h>
#include "C:/Program Files/OpenNI2/Include/OpenNI.h"

#include "OniSampleUtilities.h"

#include <assert.h>
#include <stdio.h>
#include <string>

#define SAMPLE_READ_WAIT_TIMEOUT 2000 //2000ms

#define STOP_TH 400

#define WARN_TH 800

using namespace openni;

Status rc_;
Device device_;
VideoStream depth_;
VideoFrameRef frame_;


KinectReader::KinectReader() {};
KinectReader::~KinectReader() {};

void KinectReader::Init(Handle<Object> target) {
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("KinectReader"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  // Prototype
  tpl->PrototypeTemplate()->Set(String::NewSymbol("getValue"),
      FunctionTemplate::New(getValue)->GetFunction());

  Persistent<Function> constructor = Persistent<Function>::New(tpl->GetFunction());
  target->Set(String::NewSymbol("KinectReader"), constructor);
}

Handle<Value> KinectReader::New(const Arguments& args) {
  HandleScope scope;

  KinectReader* obj = new KinectReader();
  obj->initDev();
  //obj->counter_ = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
  obj->Wrap(args.This());



  return args.This();
}

Handle<Value> KinectReader::getValue(const Arguments& args) {
  HandleScope scope;

  KinectReader* obj = ObjectWrap::Unwrap<KinectReader>(args.This());
  obj->counter_ += 1;

  return scope.Close(Number::New(obj->getVal()));
}

Handle<Value> KinectReader::close(const Arguments& args) {
  HandleScope scope;

  KinectReader* obj = ObjectWrap::Unwrap<KinectReader>(args.This());
  obj->counter_ += 1;

  return scope.Close(Number::New(obj->counter_));
}


int KinectReader::initDev(){
	rc_ = OpenNI::initialize();
	if (rc_ != STATUS_OK)
	{
		printf("Initialize failed\n%s\n", OpenNI::getExtendedError());
		return 1;
	}

	
	rc_ = device_.open(ANY_DEVICE);
	if (rc_ != STATUS_OK)
	{
		printf("Couldn't open device\n%s\n", OpenNI::getExtendedError());
		return 2;
	}


	

	if (device_.getSensorInfo(SENSOR_DEPTH) != NULL)
	{
		rc_ = depth_.create(device_, SENSOR_DEPTH);
		if (rc_ != STATUS_OK)
		{
			printf("Couldn't create depth stream\n%s\n", OpenNI::getExtendedError());
			return 3;
		}
	}

	rc_ = depth_.start();
	if (rc_ != STATUS_OK)
	{
		printf("Couldn't start the depth stream\n%s\n", OpenNI::getExtendedError());
		return 4;
	}

}
int KinectReader::getVal() {
	int changedStreamDummy;
	VideoStream* pStream = &depth_;
	rc_ = OpenNI::waitForAnyStream(&pStream, 1, &changedStreamDummy, SAMPLE_READ_WAIT_TIMEOUT);
	if (rc_ != STATUS_OK)
	{
		printf("Wait failed! (timeout is %d ms)\n%s\n", SAMPLE_READ_WAIT_TIMEOUT, OpenNI::getExtendedError());
		return -1;
	}

	rc_ = depth_.readFrame(&frame_);
	if (rc_ != STATUS_OK)
	{
		printf("Read failed!\n%s\n", OpenNI::getExtendedError());
		return -1;
	}

	if (frame_.getVideoMode().getPixelFormat() != PIXEL_FORMAT_DEPTH_1_MM && frame_.getVideoMode().getPixelFormat() != PIXEL_FORMAT_DEPTH_100_UM)
	{
		printf("Unexpected frame format\n");
		return -1;
	}

	DepthPixel* pDepth = (DepthPixel*)frame_.getData();

		
	int size_patch = 100;
	int jump_path = 30;
	int min_points = 30*30;
  
		
	int width = frame_.getWidth();
	int height = frame_.getHeight();
  
		
	float min_val = FLT_MAX;
	float max_val = FLT_MIN;
	for(int i = 0; i < width; i += jump_path){
		for(int j = 0; j < height; j += jump_path){
			float total = 0.f;
			int count = 0;
			int ik = i;
			while(ik < width && ik < i+size_patch){
				int jk = j;
				while(jk < height && jk < j+size_patch){
					total += pDepth[jk*width+ik];
					count++;
					jk++;
				}
				ik++; 
			}
			if(count >= min_points){
				if(min_val > total/count){
					min_val = total/count;
				}

				if(max_val < total/count){
					max_val = total/count;
				}
			}
		}
	}



	if(min_val <= WARN_TH){
		if(min_val <= STOP_TH){
			//printf(">>>>>>>>>>STOP!!\n");
			return 10;
		} else{
			//printf("WARNING!!\n");
			return 5;
		}
	}

	return 0;
}

