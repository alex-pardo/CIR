#ifndef KINECTREADER_H
#define KINECTREADER_H

#include <node.h>



class KinectReader : public node::ObjectWrap {
 public:
  static void Init(v8::Handle<v8::Object> target);

 private:
  KinectReader();
  ~KinectReader();

  static v8::Handle<v8::Value> New(const v8::Arguments& args);
  static v8::Handle<v8::Value> getValue(const v8::Arguments& args);
  static v8::Handle<v8::Value> close(const v8::Arguments& args);
  double counter_;
  

  int initDev();
  int getVal();

};

#endif
