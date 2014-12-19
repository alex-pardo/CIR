/*****************************************************************************
*                                                                            *
*  OpenNI 2.x Alpha                                                          *
*  Copyright (C) 2012 PrimeSense Ltd.                                        *
*                                                                            *
*  This file is part of OpenNI.                                              *
*                                                                            *
*  Licensed under the Apache License, Version 2.0 (the "License");           *
*  you may not use this file except in compliance with the License.          *
*  You may obtain a copy of the License at                                   *
*                                                                            *
*      http://www.apache.org/licenses/LICENSE-2.0                            *
*                                                                            *
*  Unless required by applicable law or agreed to in writing, software       *
*  distributed under the License is distributed on an "AS IS" BASIS,         *
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
*  See the License for the specific language governing permissions and       *
*  limitations under the License.                                            *
*                                                                            *
*****************************************************************************/
#include <stdio.h>
#include <OpenNI.h>

#include "OniSampleUtilities.h"



#define SAMPLE_READ_WAIT_TIMEOUT 2000 //2000ms

#define STOP_TH 0

#define WARN_TH 500

using namespace openni;


#include "stdafx.h"
//#include "lib/socket_io_client.hpp"

//using namespace socketio;



int main()
{
	/*
	std::string uri = "ws://localhost:8080/";

	socketio_client_handler_ptr handler(new socketio_client_handler());
    client::connection_ptr con;
    client endpoint(handler);

	std::string socket_io_uri = handler->perform_handshake(uri);
    con = endpoint.get_connection(socket_io_uri);


	endpoint.connect(con);

    boost::thread t(boost::bind(&client::run, &endpoint, false));

    // Wait for a sec before sending stuff
    while (!handler->connected()) {
        Sleep(1);
    }

    handler->bind_event("example", &socketio_events::example);

    // After connecting, send a connect message if using an endpoint
    handler->connect_endpoint("/robotRoom");

    std::getchar();

    std::getchar();

    handler->emit("test", "hello!");
	handler->emit("create or join", "robotRoom");
	*/

	Status rc = OpenNI::initialize();
	if (rc != STATUS_OK)
	{
		printf("Initialize failed\n%s\n", OpenNI::getExtendedError());
		return 1;
	}

	Device device;
	rc = device.open(ANY_DEVICE);
	if (rc != STATUS_OK)
	{
		printf("Couldn't open device\n%s\n", OpenNI::getExtendedError());
		return 2;
	}

	VideoStream depth;

	

	if (device.getSensorInfo(SENSOR_DEPTH) != NULL)
	{
		rc = depth.create(device, SENSOR_DEPTH);
		if (rc != STATUS_OK)
		{
			printf("Couldn't create depth stream\n%s\n", OpenNI::getExtendedError());
			return 3;
		}
	}

	rc = depth.start();
	if (rc != STATUS_OK)
	{
		printf("Couldn't start the depth stream\n%s\n", OpenNI::getExtendedError());
		return 4;
	}

	VideoFrameRef frame;

	

	//while (!wasKeyboardHit())
	//{
		int changedStreamDummy;
		VideoStream* pStream = &depth;
		rc = OpenNI::waitForAnyStream(&pStream, 1, &changedStreamDummy, SAMPLE_READ_WAIT_TIMEOUT);
		if (rc != STATUS_OK)
		{
			printf("Wait failed! (timeout is %d ms)\n%s\n", SAMPLE_READ_WAIT_TIMEOUT, OpenNI::getExtendedError());
			//continue;
		}

		rc = depth.readFrame(&frame);
		if (rc != STATUS_OK)
		{
			printf("Read failed!\n%s\n", OpenNI::getExtendedError());
			//continue;
		}

		if (frame.getVideoMode().getPixelFormat() != PIXEL_FORMAT_DEPTH_1_MM && frame.getVideoMode().getPixelFormat() != PIXEL_FORMAT_DEPTH_100_UM)
		{
			printf("Unexpected frame format\n");
			//continue;
		}

		DepthPixel* pDepth = (DepthPixel*)frame.getData();

		
		int size_patch = 150;
		int jump_path = 30;
		int min_points = 100*100;
  
		
		int width = frame.getWidth();
		int height = frame.getHeight();
  
		
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
					min_val = min(min_val, total/count);
					max_val = max(max_val, total/count);
				}
			}
		}


		//int middleIndex = (frame.getHeight()+1)*frame.getWidth()/2;
		if(min_val <= WARN_TH){
			if(min_val <= STOP_TH){
				printf(">>>>>>>>>>STOP!!\n");
			} else{
				printf("WARNING!!\n");
			}
		}else{
			printf("ALL OK!!!");
		}
		//printf("[%08llu] %f, %f \n", (long long)frame.getTimestamp(), min_val, max_val);//pDepth[middleIndex]);
	//}

	depth.stop();
	depth.destroy();
	device.close();
	OpenNI::shutdown();

	return 0;
}
