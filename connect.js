const alexa = require('alexa-app');
const request = require('request-promise-native');
const express = require('express');
const nodecache = require('node-cache');
const i18n = require('i18n');

const rq = require('./request-helper');
const { findDeviceByName, requestDevices } = require('./device-helper');

// Create instance of express
var express_app = express();
// Create a 1 hour cache for storing user devices
var cache = new nodecache({ stdTTL: 3600, checkperiod: 120 });
// Create instance of alexa-app
var app = new alexa.app('connect');
// Bind alexa-app to express instance
app.express({ expressApp: express_app });

const successSound = "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_02'/>";
const connectDeviceCard = (res) => ({
    type: "Simple",
    title: res.__("Connecting to a device using Spotify Connect"),
    content: res.__("To add a device to Spotify Connect,"
        + " log in to your Spotify account on a supported device"
        + " such as an Echo, phone, or computer"
        + "\nhttps://support.spotify.com/uk/article/spotify-connect/")
});
const applicationId = require('./package.json').alexa.applicationId;

i18n.configure({
    directory: __dirname + '/locales',
    defaultLocale: 'en-GB',
    register: req
});

// Run every time the skill is accessed
app.pre = function (req, res, _type) {
    if (req.data.request.locale) {
        i18n.setLocale(res, req.data.request.locale);
    }
    // Error if the application ID of the request is not for this skill
    if (req.applicationId != applicationId &&
        req.getSession().details.application.applicationId != applicationId) {
        throw "Invalid applicationId";
    }
    // Check that the user has an access token, if they have linked their account
    if (!(req.context.System.user.accessToken || req.getSession().details.user.accessToken)) {
        res.say(res.__("You have not linked your Spotify account, check your Alexa app to link the account"));
        res.linkAccount();
    }
};

// Run after every request
app.post = function (req, res, _type, exception) {
    if (exception) {
        return res.clear().say(res.__("An error occured: ") + exception).send();
    }
};

// Function for when skill is invoked without intent
app.launch(function (req, res) {
    res.say(res.__("I can control your Spotify Connect devices, to start, ask me to list your devices"))
        .reprompt(res.__("To start, ask me to list your devices"));
    // Keep session open
    res.shouldEndSession(false);
});

// Handle default Amazon help intent
// No slots or utterances required
app.intent("AMAZON.HelpIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    res.say(res.__("You can ask me to list your connect devices and then control them. "))
        .say(res.__("For example, tell me to play on a device after listing devices"))
        .reprompt(res.__("What would you like to do?"));
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
                if (err.statusCode === 403) res.say(res.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(res));
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
                if (err.statusCode === 403) res.say(res.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(res));
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
                if (err.statusCode === 403) res.say(res.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(res));
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
                if (err.statusCode === 403) res.say(res.__("Make sure your Spotify account is premium"));
                if (err.statusCode === 404) {
                    res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(res));
                }
            });
    }
);

// PUT to Spotify REST API
const setVolume = (volumePercent, req, res) => {
    return request.put({
        // Send new volume * 10 (convert to percentage)
        url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + volumePercent,
        // Send access token as bearer auth
        auth: {
            "bearer": req.getSession().details.user.accessToken
        },
        // Handle sending as JSON
        json: true
    }).catch((err) => {
        if (err.statusCode === 403) res.say(res.__("Make sure your Spotify account is premium"));
        if (err.statusCode === 404) {
            res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
            res.card(connectDeviceCard(res));
        }
    });
};

const getAndValidateVolumePercentFromSlot = (req, res, isPercentIntent) => {
    const slotName = isPercentIntent ? "VOLUMEPERCENT" : "VOLUMELEVEL"
    // Check that the slot has a value
    if (req.slot(slotName)) {
        // Check if the slot is a number
        if (!isNaN(req.slot(slotName))) {
            var volumeValue = req.slot(slotName);
            // Check that the volume is valid
            if (volumeValue >= 0 && volumeValue <= (isPercentIntent ? 100 : 10)) {
                return (isPercentIntent ? 1 : 10) * volumeValue;
            }
            else {
                // If not valid volume
                res.say(res.__(isPercentIntent
                    ? "You can only set the volume percent between 0 and 100"
                    : "You can only set the volume between 0 and 10"));
                // Keep session open
                res.shouldEndSession(false);
                return null;
            }
        }
        else {
            // Not a number
            res.say(res.__(isPercentIntent
                ? "Try setting a volume percent between 0 and 100"
                : "Try setting a volume between 0 and 10"))
                .reprompt(res.__("What would you like to do?"));
            // Keep session open
            res.shouldEndSession(false);
            return null;
        }
    }
    else {
        // No slot value
        res.say(res.__("I couldn't work out the volume to use."))
            .say(res.__(isPercentIntent
                ? "Try setting a volume percent between 0 and 100"
                : "Try setting a volume between 0 and 10"))
            .reprompt(res.__("What would you like to do?"));
        // Keep session open
        res.shouldEndSession(false);
        return null;
    }
};

// Handle 0-10 volume level intent
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
            const volumePercent = getAndValidateVolumePercentFromSlot(req, res, false);
            if (volumePercent !== null) {
                return setVolume(volumePercent, req, res);
            }
        }
    }
);

// Handle volume percent intent
// Slot for new volume
app.intent('VolumePercentIntent', {
    "slots": {
        "VOLUMEPERCENT": "AMAZON.NUMBER"
    },
    "utterances": [
        "{set the|set|} volume {level|} {to|} {-|VOLUMEPERCENT} percent"
    ]
},
    function (req, res) {
        // Check that request contains session
        if (req.hasSession()) {
            const volumePercent = getAndValidateVolumePercentFromSlot(req, res, true);
            if (volumePercent !== null) {
                return setVolume(volumePercent, req, res);
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
        return requestDevices(req, cache)
            .then(function (devices) {
                var deviceNames = devices.map(d => d.name);
                // Check if user has devices
                if (devices.length > 0) {
                    // Comma separated list of device names
                    res.say(res.__("I found these connect devices: "))
                        .say([deviceNames.slice(0, -1).join(', '), deviceNames.slice(-1)[0]].join(deviceNames.length < 2 ? '' : ',' + res.__(' and ')) + ". ")
                        .say(res.__("What would you like to do with these devices?")).reprompt(res.__("What would you like to do?"));
                    // Keep session open
                    res.shouldEndSession(false);
                }
                else {
                    // No devices found
                    res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                    res.card(connectDeviceCard(res));
                }
            })
            // Handle errors
            .catch(function (err) {
                req.getSession().set("statusCode", err.statusCode);
            });
    }
);

// Handle device play intent
// Slot for device name
app.intent('DevicePlayIntent', {
    "slots": {
        "DEVICE": "AMAZON.SearchQuery"
    },
    "utterances": [
        "play on {my|device|} {-|DEVICE}"
    ]
},
    function (req, res) {
        // Check that request contains session
        if (req.hasSession()) {
            // Check that the slot has a value
            var DEVICE = req.slot("DEVICE");
            if (DEVICE) {
                return findDeviceByName(req, cache, DEVICE).then(async (device) => {
                    // Check that the device was found
                    if (device.id) {
                        // PUT to Spotify REST API
                        await request.put({
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
                            res.say(res.__("Playing on device {{deviceName}}", { deviceName: device.name }));
                        }).catch((err) => {
                            if (err.statusCode === 403) res.say(res.__("Make sure your Spotify account is premium"));
                            if (err.statusCode === 404) {
                                res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                                res.card(connectDeviceCard(res));
                            }
                        });
                    }
                    else {
                        // If device not found
                        res.say(res.__("I couldn't find a device named {{DEVICE}}.", { DEVICE }))
                            .say(res.__("Try asking me to list devices first"));
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                });
            }
            else {
                // No slot value
                res.say(res.__("I couldn't work out which device to play on."))
                    .say(res.__("Try asking me to list devices first"))
                    .reprompt(res.__("What would you like to do?"));
                // Keep session open
                res.shouldEndSession(false);
            }
        }
    }
);

// Handle track queue intent
// Slot for track name
app.intent(
    "QueueTrackIntent",
    {
        slots: {
            TRACKNAME: "AMAZON.MusicRecording",
        },
        utterances: [
            "queue {the song|} {-|TRACKNAME}",
            "add {the song|} {-|TRACKNAME} to {my|the} queue",
        ],
    },
    function (req, res) {
        // Check that request contains session
        if (!req.hasSession()) {
          return;
        }

        // Check that the slot has a value
        if (!req.slot("TRACKNAME")) {
            // No slot value
            res
            .say(res.__("I couldn't work out which song you want to queue."))
            .reprompt(res.__("What would you like to do?"));
            // Keep session open
            res.shouldEndSession(false);
        }

        var trackSearchQuery = req.slot("TRACKNAME");
        return request.get({
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

            if (!body.tracks || !body.tracks.items[0] || !body.tracks.items[0].uri || !body.tracks.items[0].name) {
                throw "bad response";
            }

            var trackId = body.tracks.items[0].uri;
            var trackName = body.tracks.items[0].name;

            return request.post({
                url: "https://api.spotify.com/v1/me/player/queue",
                auth: {
                bearer: req.getSession().details.user.accessToken,
                },
                qs: {
                // Send track ID
                uri: trackId,
                },
                // Handle sending as JSON
                json: true,
            })
            .then((response) => {
                res.say(
                    res.__("Queued track {{trackName}}", {
                        trackName,
                    })
                );
            })
            .catch((err) => {
                res
                  .say(res.__("Sorry, I couldn't queue that song."))
                  .reprompt(res.__("What would you like to do?"));
            });
        })
        .catch((err) => {
            res
              .say(res.__("Sorry, I couldn't queue that song."))
              .reprompt(res.__("What would you like to do?"));
        });
    }
);
// Handle device transfer intent
// Slot for device name
app.intent('DeviceTransferIntent', {
    "slots": {
        "DEVICE": "AMAZON.SearchQuery"
    },
    "utterances": [
        "{transfer|switch|swap|move} to {my|device|} {-|DEVICE}",
        "use {my|device|} {-|DEVICE}"
    ]
},
    function (req, res) {
        // Check that request contains session
        if (req.hasSession()) {
            // Check that the slot has a value
            var DEVICE = req.slot("DEVICE");
            if (DEVICE) {
                return findDeviceByName(req, cache, DEVICE).then(async (device) => {
                    // Check that the device was found
                    if (device.id) {
                        // PUT to Spotify REST API
                        await request.put({
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
                            res.say(res.__("Transferring to {{deviceName}}", {deviceName: device.name }));
                        }).catch((err) => {
                            if (err.statusCode === 403) res.say(res.__("Make sure your Spotify account is premium"));
                            if (err.statusCode === 404) {
                                res.say(res.__("I couldn't find any connect devices, check your Alexa app for information on connecting a device"));
                                res.card(connectDeviceCard(res));
                            }
                        });
                    }
                    else {
                        // If device not found
                        res.say(res.__("I couldn't find a device named {{DEVICE}}.", { DEVICE }))
                            .say(res.__("Try asking me to list devices first"));
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                });
            }
            else {
                // No slot value
                res.say(res.__("I couldn't work out which device to transfer to."))
                    .say(res.__("Try asking me to list devices first"))
                    .reprompt(res.__("What would you like to do?"));
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
                    res.say(res.__("This is {{name}} by {{artist}}", { name: body.item.name, artist: body.item.artists[0].name }));
                }
                else {
                    if (body.item.name) {
                        // If not playing but last track known
                        res.say(res.__("That was {{name}} by {{artist}}", { name: body.item.name, artist: body.item.artists[0].name }));
                    }
                    else {
                        // If unknown
                        res.say(res.__("Nothing is playing"));
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
