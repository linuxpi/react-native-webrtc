'use strict';

import {
  Platform,
  NativeModules
} from 'react-native';

import * as RTCUtil from './RTCUtil';

import MediaStream from './MediaStream';
import MediaStreamError from './MediaStreamError';

let getDisplayMedia;

console.log(`running for ${Platform.OS}`);
if (Platform.OS  === 'ios') {
  getDisplayMedia = function (constraints = {}) {
    if (typeof constraints !== 'object') {
      return Promise.reject(new TypeError('constraints is not a dictionary'));
    }

    if ((typeof constraints.video === 'undefined' || !constraints.video)) {
      return Promise.reject(new TypeError('video is required'));
    }

    // Normalize constraints.
    constraints = RTCUtil.normalizeConstraints(constraints);
    console.log(constraints);
    return new Promise((resolve, reject) => {
        NativeModules.WebRTCModule.getDisplayMedia("").then((response) => {
          console.log("response from native code");
          let id = response[0];
          let tracks = response[1];
          console.log(tracks)
          let stream = new MediaStream({
            streamId: id,
            streamReactTag: id,
            tracks
          });
          stream._tracks.forEach(track => {
            track.applyConstraints = function () {
              // FIXME: ScreenObtainer.obtainScreenFromGetDisplayMedia.
              return Promise.resolve();
            }.bind(track);
          })
          console.log("stream")
          console.log(stream)
          resolve(stream);
        }, (type, message) => {
          let error;
          switch (type) {
          case 'TypeError':
            error = new TypeError(message);
            break;
          }
          if (!error) {
            error = new MediaStreamError({ message, name: type });
          }
          reject(error);
        });
    });
  }
}

export default getDisplayMedia;