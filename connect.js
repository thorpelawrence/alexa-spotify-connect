const alexa = require('alexa-app');
const request = require('request-promise-native');
const express = require('express');
const nodecache = require('node-cache');
const i18n = require('i18n');

const rq = require('./request-helper');
const { findDeviceByNumber } = require('./device-helper');

// Create instance of express
var express_app = express();
// Create a 1 hour cache for storing user devices
var cache = new nodecache({ stdTTL: 3600, checkperiod: 120 });
// Create instance of alexa-app
var app = new alexa.app('connect');
// Bind alexa-app to express instance
app.express({ expressApp: express_app });

const successSound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_02'/>";
const connectDeviceCard = (req) => ({
    type: "Simple",
    title: req.__("Connecting to a device using Spotify Connect"),
    content: req.__("To add a device to Spotify Connect,"
        + " log in to your Spotify account on a supported device"
        + " such as an Echo, phone, or computer"
        + "\nhttps://support.spotify.com/uk/article/spotify-connect/")
});
const applicationId = require('./package.json').alexa.applicationId;

// Run every time the skill is accessed
app.pre = function (req, res, _type) {
    i18n.configure({
        directory: __dirname + '/locales',
        defaultLocale: 'en-GB',
        register: req
    });
    if (req.data.request.locale) {
        i18n.setLocale(req.data.request.locale);
    }
    // Error if the application ID of the request is not for this skill
    if (req.applicationId != applicationId &&
        req.getSession().details.application.applicationId != applicationId) {
        throw "Invalid applicationId";
    }
    // Check that the user has an access token, if they have linked their account
    if (!(req.context.System.user.accessToken || req.getSession().details.user.accessToken)) {
        res.say(req.__("You have not linked your Spotify account, check your Alexa app to link the account"));
        res.linkAccount();
    }
};

// Run after every request
app.post = function (req, res, _type, exception) {
    if (exception) {
        return res.clear().say(req.__("An error occured: ") + exception).send();
    }
};

// Function for when skill is invoked without intent
app.launch(function (req, res) {
    res.say(req.__("I can control your Spotify Connect devices, to start, ask me to list your devices"))
        .reprompt(req.__("To start, ask me to list your devices"));
    // Keep session open
    res.shouldEndSession(false);
});

// Handle default Amazon help intent
// No slots or utterances required
app.intent("AMAZON.HelpIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    res.say(req.__("You can ask me to list your connect devices and then control them. "))
        .say(req.__("For example, tell me to play on a device number after listing devices"))
        .reprompt(req.__("What would you like to do?"));
    // Keep session open
    res.shouldEndSession(false);
});

// Handle default Amazon stop intent
// No slots or utterances required
app.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": []
}, function (_req, _res) {
    return;
});

// Handle default Amazon cancel intent
// No slots or utterances required
app.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
}, function (_req, _res) {
    return;
});

// Handle play intent
// No slots required
app.intent('PlayIntent', {
    "utterances": [
        "play",
        "resume",
        "continue"
    ]
},
    function (req, res) {
        // PUT to Spotify REST API
        return rq.put("https://api.spotify.com/v1/me/player/play", req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
                res.say(successSound);
            }).catch((err) => {
                if (err.statusCode === 403) res.say(req.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(req));
                }
            });
    }
);

// Handle pause intent
// No slots required
app.intent('PauseIntent', {
    "utterances": [
        "pause"
    ]
},
    function (req, res) {
        // PUT to Spotify REST API
        return rq.put("https://api.spotify.com/v1/me/player/pause", req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
                res.say(successSound);
            }).catch((err) => {
                if (err.statusCode === 403) res.say(req.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(req));
                }
            });
    }
);

// Handle skip next intent
// No slots required
app.intent('SkipNextIntent', {
    "utterances": [
        "skip",
        "next",
        "forwards"
    ]
},
    function (req, res) {
        // POST to Spotify REST API
        return rq.post("https://api.spotify.com/v1/me/player/next", req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
                res.say(successSound);
            }).catch((err) => {
                if (err.statusCode === 403) res.say(req.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(req));
                }
            });
    }
);

// Handle skip previous intent
// No slots required
app.intent('SkipPreviousIntent', {
    "utterances": [
        "previous",
        "last",
        "back",
        "backwards"
    ]
},
    function (req, res) {
        // POST to Spotify REST API
        return rq.post("https://api.spotify.com/v1/me/player/previous", req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
                res.say(successSound);
            }).catch((err) => {
                if (err.statusCode === 403) res.say(req.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(req));
                }
            });
    }
);

// Handle volume level intent
// Slot for new volume
app.intent('VolumeLevelIntent', {
    "slots": {
        "VOLUMELEVEL": "AMAZON.NUMBER"
    },
    "utterances": [
        "{set the|set|} volume {level|} {to|} {-|VOLUMELEVEL}"
    ]
},
    function (req, res) {
        // Check that request contains session
        if (req.hasSession()) {
            // Check that the slot has a value
            if (req.slot("VOLUMELEVEL")) {
                // Check if the slot is a number
                if (!isNaN(req.slot("VOLUMELEVEL"))) {
                    var volumeLevel = req.slot("VOLUMELEVEL");
                    // Check that the volume is valid
                    if (volumeLevel >= 0 && volumeLevel <= 10) {
                        res.say(successSound);
                        // PUT to Spotify REST API
                        return request.put({
                            // Send new volume * 10 (convert to percentage)
                            url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + 10 * volumeLevel,
                            // Send access token as bearer auth
                            auth: {
                                "bearer": req.getSession().details.user.accessToken
                            },
                            // Handle sending as JSON
                            json: true
                        }).catch((err) => {
                            if (err.statusCode === 403) res.say(req.__("Make sure your Spotify account is premium"));
                            if (err.statusCode === 404) {
                                res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                                res.card(connectDeviceCard(req));
                            }
                        });
                    }
                    else {
                        // If not valid volume
                        res.say(req.__("You can only set the volume between 0 and 10"));
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                }
                else {
                    // Not a number
                    res.say(req.__("Try setting a volume between 0 and 10"))
                        .reprompt(req.__("What would you like to do?"));
                    // Keep session open
                    res.shouldEndSession(false);
                }
            }
            else {
                // No slot value
                res.say(req.__("I couldn't work out the volume to use."))
                    .say(req.__("Try setting a volume between 0 and 10"))
                    .reprompt(req.__("What would you like to do?"));
                // Keep session open
                res.shouldEndSession(false);
            }
        }
    }
);

// Handle get devices intent
// No slots required
app.intent('GetDevicesIntent', {
    "utterances": [
        "devices",
        "list",
        "search",
        "find"
    ]
},
    function (req, res) {
        // GET from Spotify REST API
        return request.get({
            url: "https://api.spotify.com/v1/me/player/devices",
            // Send access token as bearer auth
            auth: {
                "bearer": req.getSession().details.user.accessToken
            },
            // Parse results as JSON
            json: true
        })
            .then(function (body) {
                var devices = body.devices || [];
                var deviceNames = [];
                for (var i = 0; i < devices.length; i++) {
                    // Number each device
                    deviceNames.push((i + 1) + ". " + devices[i].name);
                    // Add the device number to JSON
                    devices[i].number = (i + 1);
                }
                req.getSession().set("devices", devices);
                cache.set(req.getSession().details.user.userId + ":devices", devices);
                // Check if user has devices
                if (devices.length > 0) {
                    // Comma separated list of device names
                    res.say(req.__("I found these connect devices: "))
                        .say([deviceNames.slice(0, -1).join(', '), deviceNames.slice(-1)[0]].join(deviceNames.length < 2 ? '' : ',' + req.__(' and ')) + ". ")
                        .say(req.__("What would you like to do with these devices?")).reprompt(req.__("What would you like to do?"));
                    // Keep session open
                    res.shouldEndSession(false);
                }
                else {
                    // No devices found
                    res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(req));
                }
            })
            // Handle errors
            .catch(function (err) {
                req.getSession().set("statusCode", err.statusCode);
            });
    }
);

// Handle device play intent
// Slot for device number
app.intent('DevicePlayIntent', {
    "slots": {
        "DEVICENUMBER": "AMAZON.NUMBER"
    },
    "utterances": [
        "play on {number|device|device number|} {-|DEVICENUMBER}"
    ]
},
    function (req, res) {
        // Check that request contains session
        if (req.hasSession()) {
            // Check that the slot has a value
            if (req.slot("DEVICENUMBER")) {
                // Check if the slot is a number
                if (!isNaN(req.slot("DEVICENUMBER"))) {
                    var deviceNumber = req.slot("DEVICENUMBER");
                    var device = findDeviceByNumber(req, cache, deviceNumber);
                    // Check that the device for the number was found
                    if (device.id) {
                        // PUT to Spotify REST API
                        return request.put({
                            url: "https://api.spotify.com/v1/me/player",
                            // Send access token as bearer auth
                            auth: {
                                "bearer": req.getSession().details.user.accessToken
                            },
                            body: {
                                // Send device ID
                                "device_ids": [
                                    device.id
                                ],
                                // Make sure that music plays
                                "play": true
                            },
                            // Handle sending as JSON
                            json: true
                        }).then((_r) => {
                            res.say(req.__("Playing on device {{deviceNumber}}: {{deviceName}}", { deviceNumber, deviceName: device.name }));
                        }).catch((err) => {
                            if (err.statusCode === 403) res.say(req.__("Make sure your Spotify account is premium"));
                            if (err.statusCode === 404) {
                                res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                                res.card(connectDeviceCard(req));
                            }
                        });
                    }
                    else {
                        // If device for number not found
                        res.say(req.__("I couldn't find device {{deviceNumber}}. ", { deviceNumber }))
                            .say(req.__("Try asking me to list devices first"));
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                }
                else {
                    // Not a number
                    res.say(req.__("I couldn't work out which device to play on, make sure you refer to the device by number."))
                        .say(req.__("Try asking me to play on a device number"))
                        .reprompt(req.__("What would you like to do?"));
                    // Keep session open
                    res.shouldEndSession(false);
                }
            }
            else {
                // No slot value
                res.say(req.__("I couldn't work out which device number to play on."))
                    .say(req.__("Try asking me to play on a device number"))
                    .reprompt(req.__("What would you like to do?"));
                // Keep session open
                res.shouldEndSession(false);
            }
        }
    }
);

// Handle track queue intent
// Slot for device number
app.intent(
  "QueueTrackIntent",
  {
    slots: {
      TRACKNAME: "AMAZON.MusicRecording",
    },
    utterances: [
      "Queue {the song|} {-|TRACKNAME}",
      "Add {the song|} {-|TRACKNAME} to {my|the} queue",
    ],
  },
  function (req, res) {
    // Check that request contains session
    if (req.hasSession()) {
      // Check that the slot has a value
      if (req.slot("TRACKNAME")) {
        var trackSearchQuery = req.slot("TRACKNAME");
        if (trackSearchQuery != "") {
          return request
            .get({
              url: `https://api.spotify.com/v1/search`,
              // Send access token as bearer auth
              auth: {
                bearer: req.getSession().details.user.accessToken,
              },
              qs: {
                q: trackSearchQuery,
                type: "track",
                offset: "0",
              },
              // Handle sending as JSON
              json: true,
            })
            .then((body) => {
            
              var trackId = body.tracks.items[0].uri;
              trackName = body.tracks.items[0].name;

              return request.post(
                {
                  url: "https://api.spotify.com/v1/me/player/queue",
                  auth: {
                    "bearer": req.getSession().details.user.accessToken,
                  },
                  qs: {
                    // Send track ID
                    "uri": trackId,
                  },
                  // Handle sending as JSON
                  json: true,
                }
              )
              .then((response) => {
                res.say(req.__("Queued track {{trackName}}", {
                    trackName,
                  }));
              })
              .catch((err) => {
                  res
                    .say(req.__("Sorry, I couldn't queue that song."))
                    .reprompt(req.__("What would you like to do?"));
        })
            });
        } else {
          // If track name was not recognised
          res.say(
            req.__("I dont recognize the song {{trackName}}.", {
              trackName: trackSearchQuery,
            })
          );
          // Keep session open
          res.shouldEndSession(false);
        }
      } else {
        // No slot value
        res
          .say(req.__("I couldn't work out which song you want to queue."))
          .reprompt(req.__("What would you like to do?"));
        // Keep session open
        res.shouldEndSession(false);
      }
    }
  }
);

// Handle device transfer intent
// Slot for device number
app.intent('DeviceTransferIntent', {
    "slots": {
        "DEVICENUMBER": "AMAZON.NUMBER"
    },
    "utterances": [
        "transfer to {number|device|device number|} {-|DEVICENUMBER}"
    ]
},
    function (req, res) {
        // Check that request contains session
        if (req.hasSession()) {
            // Check that the slot has a value
            if (req.slot("DEVICENUMBER")) {
                // Check if the slot is a number
                if (!isNaN(req.slot("DEVICENUMBER"))) {
                    var deviceNumber = req.slot("DEVICENUMBER");
                    var device = findDeviceByNumber(req, cache, deviceNumber);
                    // Check that the device for the number was found
                    if (device.id) {
                        // PUT to Spotify REST API
                        return request.put({
                            url: "https://api.spotify.com/v1/me/player",
                            // Send access token as bearer auth
                            auth: {
                                "bearer": req.getSession().details.user.accessToken
                            },
                            body: {
                                // Send device ID
                                "device_ids": [
                                    device.id
                                ]
                            },
                            // Handle sending as JSON
                            json: true
                        }).then((_r) => {
                            res.say(req.__("Transferring to device {{deviceNumber}}: {{deviceName}}", { deviceNumber, deviceName: device.name }));
                        }).catch((err) => {
                            if (err.statusCode === 403) res.say(req.__("Make sure your Spotify account is premium"));
                            if (err.statusCode === 404) {
                                res.say(req.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                                res.card(connectDeviceCard(req));
                            }
                        });
                    }
                    else {
                        // If device for number not found
                        res.say(req.__("I couldn't find device {{deviceNumber}}. ", { deviceNumber }))
                            .say(req.__("Try asking me to list devices first"));
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                }
                else {
                    // Not a number
                    res.say(req.__("I couldn't work out which device to transfer to, make sure you refer to the device by number."))
                        .say(req.__("Try asking me to transfer to a device number"))
                        .reprompt(req.__("What would you like to do?"));
                    // Keep session open
                    res.shouldEndSession(false);
                }
            }
            else {
                // No slot value
                res.say(req.__("I couldn't work out which device number to transfer to."))
                    .say(req.__("Try asking me to transfer to a device number"))
                    .reprompt(req.__("What would you like to do?"));
                // Keep session open
                res.shouldEndSession(false);
            }
        }
    }
);

// Handle get track intent
// No slots required
app.intent('GetTrackIntent', {
    "utterances": [
        "{what is|what's} {playing|this song}",
        "what {song|track|} is this"
    ]
},
    function (req, res) {
        // GET from Spotify REST API
        return request.get({
            url: "https://api.spotify.com/v1/me/player/currently-playing",
            // Send access token as bearer auth
            auth: {
                "bearer": req.getSession().details.user.accessToken
            },
            // Parse results as JSON
            json: true
        })
            .then(function (body) {
                if (body.is_playing) {
                    res.say(req.__("This is {{name}} by {{artist}}", { name: body.item.name, artist: body.item.artists[0].name }));
                }
                else {
                    if (body.item.name) {
                        // If not playing but last track known
                        res.say(req.__("That was {{name}} by {{artist}}", { name: body.item.name, artist: body.item.artists[0].name }));
                    }
                    else {
                        // If unknown
                        res.say(req.__("Nothing is playing"));
                    }
                }
            })
            // Handle errors
            .catch(function (err) {
                req.getSession().set("statusCode", err.statusCode);
            });
    }
);

// Set up redirect to project page
express_app.use(express.static(__dirname));

/* istanbul ignore next */
express_app.get('/', function (_, res) {
    res.redirect('https://github.com/thorpelawrence/alexa-spotify-connect');
});

/* istanbul ignore if */
// Only listen if run directly, not if required as a module
if (require.main === module) {
    var port = process.env.PORT || 8888;
    console.log("Listening on port " + port);
    express_app.listen(port);
}

/* istanbul ignore next */
express_app.get('/skill', function (_, res) {
    const skill = require('./skill/skill.js');
    skill.forEach(locale => {
        res.write(locale.name + '\n');
        res.write(JSON.stringify(locale.data, null, 2) + '\n');
        res.write('='.repeat(80) + '\n');
    });
    res.end();
});

// Export alexa-app instance for skill.js
module.exports = app;
