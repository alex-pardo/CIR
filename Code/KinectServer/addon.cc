#include <node.h>
#include "Server.h"

using namespace v8;

void InitAll(Handle<Object> exports) {
  Server::Init(exports);
}

NODE_MODULE(addon, InitAll)
