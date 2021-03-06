#include "ofMain.h"
#include "ofApp.h"
#include <iostream>
#include <stdlib.h>

int main(int argc, char* argv[]){
    if (argc < 2) {
        cerr << "Usage: interface <socket path>";
        exit(1);
        return 0;
    } else {
        ofSetupOpenGL(1024,768,OF_FULLSCREEN);
        ofRunApp(new ofApp(argv[1]));
    }
}
