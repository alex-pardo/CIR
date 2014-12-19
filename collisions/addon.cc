#include <node.h>
#include "KinectReader.h"

using namespace v8;

void InitAll(Handle<Object> exports) {
  KinectReader::Init(exports);
}

NODE_MODULE(addon, InitAll)
