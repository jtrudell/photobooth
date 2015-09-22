'use strict';

var configInit = require('./config/init')(),
    config = require('./config/config'),
    promise = require('bluebird'),
    debug = require('debug')('main'),
    config = require('./config/config'),
    fs = require('fs'),
    gcloud = require('gcloud')({
      projectId: config.google.project,
      keyFilename: config.google.keyFilename,
    }),
    gm = require('gm'),
    request = require('request-promise'),
    tmp = require('tmp'),
    util = require('util'),
    getCamera = require('./cameras/factory'),
    Panel = require('./panel');

promise.longStackTraces();

var camera,
    pendingTimeout,
    pendingPromise,
    photos = []

exports.strip = null;
exports.state = '';

// Emits 'reset' and 'activate' when buttons are pressed.
var panel = new Panel();
var camera = getCamera();

function transition(state) {
  console.info('Transitioning: ' + exports.state + ' -> ' + state);
  pendingTimeout && clearTimeout(pendingTimeout);
  pendingPromise && pendingPromise.cancel();
  panel.removeAllListeners('activate');
  exports.state = state;
}

function idle() {
  transition('idle');
  photos = [];

  // TODO: Show idle screen.
  // "Press button to begin"
  panel.on('activate', preview);
}

function preview() {
  transition('preview');

  // TODO: Show preview screen.
  // "Press button to start countdown"
  panel.on('activate', pending);
  var pendingTimeout = setTimeout(idle, 1000*60*2);  // 2 minutes.
}

function pending() {
  transition('pending');
  var secondsRemaining = config.countdown.initial;
  if (photos.length) {
    secondsRemaining = config.countdown.others;
    // TODO: Show last photo.
  }
  function updateCountdown() {
    // TODO: Update countdown.
    console.info(secondsRemaining + ' seconds remaining.');
  }
  updateCountdown();

  // Count down to 0.
  function tick() {
    --secondsRemaining;
    if (secondsRemaining) {
      updateCountdown();
      pendingTimeout = setTimeout(tick, 1000);
    } else {
      capture();
    }
  }
  pendingTimeout = setTimeout(tick, 1000);
}

function capture() {
  transition('capture');
  // TODO: Take the picture
  pendingPromise = camera.takePhoto().then(function(photo) {
    photos.push(photo);
    if (photos.length == 3) {
      postProcess();
    } else {
      pending();
    }
  });  // TODO: error handler
}

function joinImages(photos) {
  var deferred = promise.pending();
  var tmpfile = tmp.tmpName(function(err, path) {
    var destPath = path + '.jpg';
    console.info('Writing montage to ' + destPath);

    // Join them together in a vertical strip with 10px padding and resize to
    // max width of 1024.  I had to use the manually constructed command because
    // otherwise .geometry() is added after input arguments and doesn't actually
    // set the maximum tile size.
    var cmd = gm(photos[2])
      .command('montage')
      .in('-geometry')
      .in('+10+10')
      .in('-tile')
      .in('1x')
      .in(photos[0])
      .in(photos[1])
      .resize('1024')
      .write(destPath, function() {
        fs.unlink(photos[0]);
        fs.unlink(photos[1]);
        fs.unlink(photos[2]);
        deferred.resolve(destPath);
      });
  });
  return deferred.promise;
}

function uploadToStorage(path) {
  var deferred = promise.pending();
  var gcs = gcloud.storage();
  var bucket = gcs.bucket(config.google.storageBucket);
  // TODO: Enable gzip
  //       Better file name (no tmp in name)
  //       Better bucket name (no bmt in bucket name)
  bucket.upload(path, function(err, file) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve({bucket: file.metadata.bucket,
                        name: file.metadata.name});
    }
    // Clean up the temp file.
    fs.unlink(path);
  });
  return deferred.promise;
}

function recordInFrontend(storageInfo) {
  console.info(util.inspect(storageInfo));
  return request.post(config.frontend.host + '/photos').form(storageInfo)
    .then(JSON.parse, function(err) {
      console.trace(err);
      error();
    });
}

function printReceipt(photo) {
  console.info('Photo available at: ' + config.frontend.host +
      '#!/photo/' + photo._id);

  // TODO: Print receipt
  return promise.resolve();
}

function postProcess() {
  transition('postProcess');
  joinImages(photos)
    .then(uploadToStorage)
    .then(recordInFrontend)
    .then(printReceipt)
    .then(finished)
    .then(null, function(err) {
      console.trace(err);
      // TODO: Handle errors. Email?
      error();
    });
}

function error() {
  transition('error');
  // TODO: Show error page.
  pendingTimeout = setTimeout(idle, 1000*60*1);
}

function finished() {
  transition('finished');
  // TODO: Show finished strip.
  pendingTimeout = setTimeout(idle, 1000*60*1);
}

function init() {
  transition('init');
  panel.on('reset', idle);
  setImmediate(idle);
}
exports.init = init;

function forever() {
  setTimeout(forever, 1000);
}

if (require.main === module) {
  init();
  forever();
}
