

import SimpleOpenNI.*;

SimpleOpenNI  context;
final static int thres_stop = 0; // minimum distance for stopping in milimeters
final static int thres_warn = 500; // minimum distance for warning in milimeters

void setup()
{
  size(640, 480);
  //size(320, 240);
  
  context = new SimpleOpenNI(this);
  if (context.isInit() == false)
  {
    println("Can't init SimpleOpenNI, maybe the camera is not connected!"); 
    exit();
    return;
  }
  
  // mirror is by default enabled
  context.setMirror(true);

  // enable depthMap generation 
  context.enableDepth();

  // enable ir generation
  context.enableRGB();
  
}

void draw()
{
  // update the cam
  context.update();

  //background(300, 0, 0);
  
  int size_patch = 150;
  int jump_path = 30;
  int min_points = 100*100;
  
  int[] img = context.depthMap();
  int width = context.depthImage().width;
  int height = context.depthImage().height;
  
  int min_val = 99999999;
  int max_val = 0;
  for(int i = 0; i < width; i += jump_path){
    for(int j = 0; j < height; j += jump_path){
      float total = 0.f;
      int count = 0;
      int ik = i;
      while(ik < width && ik < i+size_patch){
        int jk = j;
        while(jk < height && jk < j+size_patch){
          total += img[jk*width+ik];
          count++;
          jk++;
        }
        ik++; 
      }
      if(count >= min_points){
        min_val = min(min_val, round(total/count));
        max_val = max(max_val, round(total/count));
      }
    }
  }
  //println(min_val);
  //println(max_val);

  if(min_val <= thres_stop){
    println("<<<<<<<<<<<< STOP! >>>>>>>>>>>>>");
  }else if(min_val <= thres_warn){
    println("WARNING!");
  }else{
    println("");
  }
  
  // draw depthImageMap
  image(context.depthImage(), 0, 0);

  // draw irImageMap
  //image(context.rgbImage(), context.depthWidth() + 10, 0);
}
