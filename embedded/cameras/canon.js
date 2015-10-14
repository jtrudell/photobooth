'use strict';

var promise = require('bluebird'),
    _ = require('lodash'),
    tmp = require('tmp'),
    util = require('util'),
    debug = require('debug')('camera'),
    child_process = require('child_process'),
    exec = child_process.exec,
    spawn = child_process.spawn,
    spawnSync = child_process.spawnSync,
    Camera = require('./camera'),
    PreviewHandle = require('./previewHandle');

var gphoto = '/opt/local/bin/gphoto2';

var Canon = function() {};
util.inherits(Canon, Camera);

// Static
Canon.isPresent = function() {
  var output = spawnSync(gphoto, ['--summary']);
  var stderr = output.stderr.toString('utf8');
  if (output.error) {
    console.trace(output.error);
    return false;
  } else if (output.status == 0) {
    // TODO: Check for camera capabilities.
    return true;
  } else if (_.contains(stderr, 'Error: No camera found.')) {
    return false;
  } else {
    debug(stderr);
    return false;
  }
};

Canon.prototype.takePhotoImpl = function() {
  var deferred = promise.pending();
  tmp.tmpName(function(err, path) {
    var dest = path + '.jpg';
    debug('Taking photo: ' + dest);
    // TODO: Handle failures properly...this doesn't reset when half-press
    // fails like on Amanda's Camera with the borken flash.
    exec(gphoto + ' --capture-image-and-download --filename=' + dest,
        function(err, stdout, stderr) {
          debug(stdout);
          debug(stderr);
          if (err) {
            console.trace(err);
            deferred.reject(err);
          } else {
            deferred.resolve(dest);
          }
        });
  });
  return deferred.promise;
};

Canon.prototype.openPreviewImpl = function() {
  debug('Opening preview stream.');
  var movie = spawn(gphoto, ['--capture-movie', '--stdout']);
  return new PreviewHandle(movie.stdout, movie);
};

module.exports = Canon;

