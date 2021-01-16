'use strict';

import {
  Platform,
  NativeModules
} from 'react-native';

import * as RTCUtil from './RTCUtil';

import MediaStream from './MediaStream';
import MediaStreamError from './MediaStreamError';


console.log(`running for ${Platform.OS}`);
if (Platform.OS  === 'ios') {
  let getDisplayMedia;
  // remove this when react-native-webrtc implements getDisplayMedia for ios
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
  export default getDisplayMedia;
  // remove this when react-native-webrtc implements getDisplayMedia for ios
} else {
  const { WebRTCModule } = NativeModules;
  export default function getDisplayMedia(constraints) {
    if (Platform.OS !== 'android') {
        return Promise.reject(new Error('Unsupported platform'));
    }

    if (!constraints || !constraints.video) {
        return Promise.reject(new TypeError());
    }

    return new Promise((resolve, reject) => {
        WebRTCModule.getDisplayMedia()
            .then(data => {
                const { streamId, track } = data;

                const info = {
                    streamId: streamId,
                    streamReactTag: streamId,
                    tracks: [track]
                };

                const stream = new MediaStream(info);

                resolve(stream);
            }, error => {
                reject(new MediaStreamError(error));
            });
    });
  }
}

