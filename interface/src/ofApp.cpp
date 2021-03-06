#include "ofApp.h"
#include "positions.h"
#include <string>
#include <vector>
#include <algorithm>    // std::copy

ofApp::ofApp(const char* socket)
: ofBaseApp(),
socket_(socket),
images_(3, Image()),
previewVideo_(socket_),
loadingAnimation_(
    PREVIEW_PHOTO_WIDTH/2 + PREVIEW_X - LOADING_W/2,
    PREVIEW_PHOTO_HEIGHT/2 + PREVIEW_Y - LOADING_H/2),
preview_(&previewVideo_),
pending_(&photoBar_, &previewVideo_, &loadingAnimation_),
processing_(&photoBar_, &loadingAnimation_) {};

//--------------------------------------------------------------
void ofApp::setup(){
    ofBackground(255);
    ofSetColor(255);
    ofTrueTypeFont::setGlobalDpi(72);
    ofSetVerticalSync(true);
    inputThread_.startThread();
    previewVideo_.connect();
    previewVideo_.startThread();
    ofAddListener(inputThread_.onCommandReceived, this, &ofApp::commandReceived);
}

//--------------------------------------------------------------
void ofApp::update(){
    photoBar_.update(images_);
    loadingAnimation_.setVisible(false);
    loadingAnimation_.update();
    switch (mode_) {
        case PENDING:
            previewVideo_.update();
            pending_.update(timeRemaining_);
            break;
        case FINISHED:
            finished_.update(finalImage_, shareUrl_);
            break;
        case PREVIEW:
            previewVideo_.update();
            break;
        case IDLE:
        case PROCESSING:
        case ERROR:
        case UNKNOWN:
        default:
            break;
    }
}

//--------------------------------------------------------------
void ofApp::draw(){
    heading_.draw();
    switch (mode_) {
        case IDLE:
            idle_.draw();
            break;
        case PREVIEW:
            preview_.draw();
            break;
        case PENDING:
            pending_.draw();
            break;
        case PROCESSING:
            processing_.draw();
            break;
        case FINISHED:
            finished_.draw();
            break;
        case ERROR:
        case UNKNOWN:
            error_.draw();
            break;
    }
    loadingAnimation_.draw();
}

void updateImageIfChanged(const string& newPath,
                          const Image& current,
                          int width,
                          int height,
                          Image* newImg) {
    newImg->path = newPath;
    if (newPath.size() && current.path != newPath) {
        newImg->preLoad(newPath);
        if (width > 0 && height > 0) {
          newImg->image->resize(width, height);
        } else if (width > 0) {
          float ratio = width / newImg->image->getWidth(); 
          float newHeight = ratio * newImg->image->getHeight();
          newImg->image->resize(width, newHeight);
        } else if (height > 0) {
          float ratio = height / newImg->image->getHeight(); 
          float newWidth = ratio * newImg->image->getWidth();
          newImg->image->resize(newWidth, height);
        }
    }
}

void swapImageIfChanged(Image* current, Image* newImg) {
    if (current->path != newImg->path) {
        current->swap(newImg);
    }
}

void ofApp::commandReceived(Command& cmd) {
    vector<string> imgPaths(3, "");
    string timeRemaining, finalPath, finalUrl;
    switch(cmd.mode) {
        case PENDING:
            if (cmd.args.size() > 0) {
                timeRemaining = cmd.args[0];
            }

            std::copy(cmd.args.begin() + 1,
                      cmd.args.end(), imgPaths.begin());
            break;
        case PROCESSING:
            std::copy(cmd.args.begin(), cmd.args.end(),
                      imgPaths.begin());
        case FINISHED:
            if (cmd.args.size() > 0) {
                finalPath = cmd.args[0];
            }
            if (cmd.args.size() > 1) {
                finalUrl = cmd.args[1];
            }
        case IDLE:
        case PREVIEW:
        case ERROR:
        case UNKNOWN:
            break;
    }

    Image newFinalImage;
    newFinalImage.image->setUseTexture(false);
    vector<Image> newImages(3);
    for (Image i : newImages) {
        i.image->setUseTexture(false);
    }

    // Load any new images.
    for (int i = 0; i < 3; ++i) {
        updateImageIfChanged(imgPaths[i], images_[i],
                                PHOTOBAR_PHOTO_WIDTH,
                                PHOTOBAR_PHOTO_HEIGHT,
                                &(newImages[i]));
    }
    updateImageIfChanged(finalPath, finalImage_,
                         FINAL_PHOTO_WIDTH, 0, &newFinalImage);
    // TODO: grab a mutex

    // Apply any changes to images.
    for (int i = 0; i < 3; ++i) {
        swapImageIfChanged(&images_[i], &newImages[i]);
    }
    swapImageIfChanged(&finalImage_, &newFinalImage);
    mode_ = cmd.mode;
    timeRemaining_ = timeRemaining;
    shareUrl_ = finalUrl;

    // TODO: release mutex
}

//--------------------------------------------------------------
void ofApp::keyPressed(int key){

}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){

}

//--------------------------------------------------------------
void ofApp::mouseMoved(int x, int y ){

}

//--------------------------------------------------------------
void ofApp::mouseDragged(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mousePressed(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mouseReleased(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){

}

//--------------------------------------------------------------
void ofApp::gotMessage(ofMessage msg){

}

//--------------------------------------------------------------
void ofApp::dragEvent(ofDragInfo dragInfo){

}
