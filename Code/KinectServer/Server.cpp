#include "Server.h"


WSADATA wsaData;
int iResult;

SOCKET ListenSocket = INVALID_SOCKET;
SOCKET ClientSocket = INVALID_SOCKET;

struct addrinfo *result = NULL;
struct addrinfo hints;

int iSendResult;
char recvbuf[DEFAULT_BUFLEN];
int recvbuflen = DEFAULT_BUFLEN;

#define fwd "forward"
#define bwd "backward"
#define left "left"
#define right "right"
#define stop "stop"

#define FWD 1
#define BWD 2
#define LEFT 3
#define RIGHT 4
#define STOP 5


Server::Server(void){};
Server::~Server(void){};


using namespace v8;

void Server::Init(Handle<Object> target) {
// Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("Server"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  // Prototype
  tpl->PrototypeTemplate()->Set(String::NewSymbol("getGesture"),
      FunctionTemplate::New(getGesture)->GetFunction());

  Persistent<Function> constructor = Persistent<Function>::New(tpl->GetFunction());
  target->Set(String::NewSymbol("Server"), constructor);
}


Handle<Value> Server::New(const Arguments& args) {
  HandleScope scope;

  Server* obj = new Server();
  obj->initDev();
  //obj->counter_ = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
  obj->Wrap(args.This());

  return args.This();
}


Handle<Value> Server::getGesture(const Arguments& args) {
  HandleScope scope;

  Server* obj = ObjectWrap::Unwrap<Server>(args.This());
  obj->counter_ += 1;

  return scope.Close(Number::New(obj->getLastGesture()));
}



Handle<Value> Server::close(const Arguments& args) {
  HandleScope scope;

  Server* obj = ObjectWrap::Unwrap<Server>(args.This());
  obj->counter_ += 1;

  
	// shutdown the connection since we're done
	iResult = shutdown(ClientSocket, SD_SEND);
	if (iResult == SOCKET_ERROR) {
		printf("shutdown failed with error: %d\n", WSAGetLastError());
		closesocket(ClientSocket);
		WSACleanup();
	} else{

		// cleanup
		closesocket(ClientSocket);
		WSACleanup();
	}

  return scope.Close(Number::New(obj->counter_));
}



int Server::initDev(){
	
    
    // Initialize Winsock
    iResult = WSAStartup(MAKEWORD(2,2), &wsaData);
    if (iResult != 0) {
        printf("WSAStartup failed with error: %d\n", iResult);
        return 1;
    }

    ZeroMemory(&hints, sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_protocol = IPPROTO_TCP;
    hints.ai_flags = AI_PASSIVE;

    // Resolve the server address and port
    iResult = getaddrinfo(NULL, DEFAULT_PORT, &hints, &result);
    if ( iResult != 0 ) {
        printf("getaddrinfo failed with error: %d\n", iResult);
        WSACleanup();
        return 1;
    }

    // Create a SOCKET for connecting to server
    ListenSocket = socket(result->ai_family, result->ai_socktype, result->ai_protocol);
    if (ListenSocket == INVALID_SOCKET) {
        printf("socket failed with error: %ld\n", WSAGetLastError());
        freeaddrinfo(result);
        WSACleanup();
        return 1;
    }

    // Setup the TCP listening socket
    iResult = bind( ListenSocket, result->ai_addr, (int)result->ai_addrlen);
    if (iResult == SOCKET_ERROR) {
        printf("bind failed with error: %d\n", WSAGetLastError());
        freeaddrinfo(result);
        closesocket(ListenSocket);
        WSACleanup();
        return 1;
    }

    freeaddrinfo(result);

    iResult = listen(ListenSocket, SOMAXCONN);
    if (iResult == SOCKET_ERROR) {
        printf("listen failed with error: %d\n", WSAGetLastError());
        closesocket(ListenSocket);
        WSACleanup();
        return 1;
    }

    // Accept a client socket
    ClientSocket = accept(ListenSocket, NULL, NULL);
    if (ClientSocket == INVALID_SOCKET) {
        printf("accept failed with error: %d\n", WSAGetLastError());
        closesocket(ListenSocket);
        WSACleanup();
        return 1;
    }

    // No longer need server socket
    closesocket(ListenSocket);

}


int Server::getLastGesture(){
	
	int intVariable = 100;
	char* charVariable = (char*)(&intVariable);

	//send(ClientSocket, charVariable, sizeof(charVariable), 0);
	
	if (iSendResult == SOCKET_ERROR) {
		printf("send failed with error: %d\n", WSAGetLastError());
		closesocket(ClientSocket);
		WSACleanup();
		return -10;
	} else{
		iResult = recv(ClientSocket, recvbuf, recvbuflen, 0);
		if(iResult > 0){
			recvbuf[iResult] = '\0';
			if(strcmpi(recvbuf, fwd) == 0){		return FWD; }
			else if(strcmpi(recvbuf, bwd) == 0){return BWD;}
			else if(strcmpi(recvbuf, left) == 0){return LEFT;}
			else if(strcmpi(recvbuf, right) == 0){return RIGHT;}
			else if(strcmpi(recvbuf, stop) == 0){return STOP;}
		} else{
			return -9;
		}
	}
	return -11;




}



