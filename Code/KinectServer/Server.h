
#ifndef SERVER_H
#define SERVER_H

#include <node.h>

#undef UNICODE

#define WIN32_LEAN_AND_MEAN

#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <stdlib.h>
#include <stdio.h>

// Need to link with Ws2_32.lib
#pragma comment (lib, "Ws2_32.lib")
// #pragma comment (lib, "Mswsock.lib")

#define DEFAULT_BUFLEN 512
#define DEFAULT_PORT "27015"

class Server : public node::ObjectWrap {

public:
	static void Init(v8::Handle<v8::Object> target);

 private:
	Server(void);
	~Server(void);

	static v8::Handle<v8::Value> New(const v8::Arguments& args);
	static v8::Handle<v8::Value> getGesture(const v8::Arguments& args);
	static v8::Handle<v8::Value> close(const v8::Arguments& args);
	double counter_;
	int last_gesture;
  

	int initDev();
	int getLastGesture();

	
};

#endif