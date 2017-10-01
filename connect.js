var alexa = require('alexa-app');
var request = require('request-promise');
var express = require('express');
var nodecache = require('node-cache');
var fuzzy = require('fuzzy');

var express_app = express();
var cache = new nodecache({ stdTTL: 600, checkperiod: 120 });

var app = new alexa.app('connect');
app.express({ expressApp: express_app });

app.pre = function (req, res, type) {
    if (req.applicationId != "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0" &&
        req.getSession().details.application.applicationId != "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0") {
        throw "Invalid applicationId";
    }
    if (!req.getSession().details.user.accessToken) {
        res.say("You have not linked your Spotify account, check your Alexa app to link the account");
        res.linkAccount();
    }
};

app.launch(function (req, res) {
    res.say("I can control your Spotify Connect devices, to start, ask me to list your devices");
    res.reprompt("To start, ask me to list your devices");
    res.shouldEndSession(false);
});

app.intent("AMAZON.HelpIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    res.say("You can ask me to list your connect devices and then control them. ")
    res.say("For example, tell me to play on a device after listing devices");
    res.reprompt("What would you like to do?");
    res.shouldEndSession(false);
    return;
});

app.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    return;
});

app.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    return;
});

app.intent('PlayIntent', {
    "utterances": [
        "play",
        "resume",
        "continue"
    ]
},
    function (req, res) {
        request.put("https://api.spotify.com/v1/me/player/play").auth(null, null, true, req.getSession().details.user.accessToken);
    }
);

app.intent('PauseIntent', {
    "utterances": [
        "pause"
    ]
},
    function (req, res) {
        request.put("https://api.spotify.com/v1/me/player/pause").auth(null, null, true, req.getSession().details.user.accessToken);
    }
);

app.intent('SkipNextIntent', {
    "utterances": [
        "skip",
        "next",
        "forwards"
    ]
},
    function (req, res) {
        request.post("https://api.spotify.com/v1/me/player/next").auth(null, null, true, req.getSession().details.user.accessToken);
    }
);

app.intent('SkipPreviousIntent', {
    "utterances": [
        "previous",
        "last",
        "back",
        "backwards"
    ]
},
    function (req, res) {
        request.post("https://api.spotify.com/v1/me/player/previous").auth(null, null, true, req.getSession().details.user.accessToken);
    }
);

app.intent('GetDevicesIntent', {
    "utterances": [
        "devices",
        "list",
        "search",
        "find"
    ]
},
    function (req, res) {
        return request.get({
            url: "https://api.spotify.com/v1/me/player/devices",
            auth: {
                "bearer": req.getSession().details.user.accessToken
            },
            json: true
        })
            .then(function (body) {
                var devices = body.devices || [];
                // Map just device names to new array
                var deviceNames = devices.map((d) => { return d.name });
                req.getSession().set("devices", devices);
                cache.set(req.getSession().details.user.userId + ":devices", devices);
                if (devices.length > 0) {
                    //Comma separated list of device names
                    res.say("I found these connect devices: ");
                    res.say([deviceNames.slice(0, -1).join(', '), deviceNames.slice(-1)[0]].join(deviceNames.length < 2 ? '' : ', and ') + ". ");
                    res.say("What would you like to do with these devices?").reprompt("What would you like to do?");
                    res.shouldEndSession(false);
                }
                else {
                    res.say("I couldn't find any connect devices, check your Alexa app for information on connecting a device");
                    res.card({
                        type: "Simple",
                        title: "Connecting to a device using Spotify Connect",
                        content: "To add a device to Spotify Connect,"
                        + " log in to your Spotify account on a supported device"
                        + " such as an Echo, phone, or computer"
                        + "\nhttps://support.spotify.com/uk/article/spotify-connect/"
                    });
                }
            })
            .catch(function (err) {
                console.error('error:', err.message);
            });
    }
);

app.intent('DevicePlayIntent', {
    "slots": {
        "DEVICE": "DEVICES_ROOMS"
    },
    "utterances": [
        "play on {device|} {-|DEVICE}"
    ]
},
    function (req, res) {
        if (req.hasSession()) {
            if (req.slot("DEVICE")) {
                var device = req.slot("DEVICE");
                if (req.getSession().isNew()) {
                    //If new session try to use cache
                    var devices = cache.get(req.getSession().details.user.userId + ":devices") || [];
                }
                else {
                    var devices = req.getSession().get("devices") || [];
                }
                // Check for fuzzy matches of device name
                var matches = fuzzy.filter(device, devices, { extract: (e) => { return e.name } });
                // Check if matches were found
                if (matches.length > 0) {
                    var deviceId = matches[0].original.id;
                    var deviceName = matches[0].string;
                    request.put({
                        url: "https://api.spotify.com/v1/me/player",
                        auth: {
                            "bearer": req.getSession().details.user.accessToken
                        },
                        body: {
                            "device_ids": [
                                deviceId
                            ],
                            "play": true
                        },
                        json: true
                    });
                    res.say("Playing on device " + deviceName);
                }
                else {
                    res.say("I couldn't find device " + device + ". ");
                    res.say("Try asking me to list devices first");
                    res.shouldEndSession(false);
                }
            }
            else {
                //No slot value
                res.say("I couldn't work out which device to play on.");
                res.say("Try asking me to play on a device by name");
                res.reprompt("What would you like to do?");
                res.shouldEndSession(false);
            }
        }
    }
);

express_app.use(express.static(__dirname));
express_app.get('/', function (req, res) {
    res.redirect('https://github.com/thorpelawrence/alexa-spotify-connect');
});

app.intent('DeviceTransferIntent', {
    "slots": {
        "DEVICE": "DEVICES_ROOMS"
    },
    "utterances": [
        "transfer to {device|} {-|DEVICE}"
    ]
},
    function (req, res) {
        if (req.hasSession()) {
            if (req.slot("DEVICE")) {
                var device = req.slot("DEVICE");
                if (req.getSession().isNew()) {
                    //If new session try to use cache
                    var devices = cache.get(req.getSession().details.user.userId + ":devices") || [];
                }
                else {
                    var devices = req.getSession().get("devices") || [];
                }
                // Check for fuzzy matches of device name
                var matches = fuzzy.filter(device, devices, { extract: (e) => { return e.name } });
                // Check if matches were found
                if (matches.length > 0) {
                    var deviceId = matches[0].original.id;
                    var deviceName = matches[0].string;
                    request.put({
                        url: "https://api.spotify.com/v1/me/player",
                        auth: {
                            "bearer": req.getSession().details.user.accessToken
                        },
                        body: {
                            "device_ids": [
                                deviceId
                            ]
                        },
                        json: true
                    });
                    res.say("Transferring to device " + deviceName);
                }
                else {
                    res.say("I couldn't find device " + device + ". ");
                    res.say("Try asking me to list devices first");
                    res.shouldEndSession(false);
                }
            }
        }
        else {
            //No slot value
            res.say("I couldn't work out which device to transfer to.");
            res.say("Try asking me to transfer to a device by name");
            res.reprompt("What would you like to do?");
            res.shouldEndSession(false);
        }
    }
);

app.intent('GetTrackIntent', {
    "utterances": [
        "{what is|what's} {playing|this song}",
        "what {song|track|} is this"
    ]
},
    function (req, res) {
        return request.get({
            url: "https://api.spotify.com/v1/me/player/currently-playing",
            auth: {
                "bearer": req.getSession().details.user.accessToken
            },
            json: true
        })
            .then(function (body) {
                if (body.is_playing) {
                    res.say("This is " + body.item.name + " by " + body.item.artists[0].name);
                }
                else {
                    if (body.item.name) {
                        //If not playing but last track known
                        res.say("That was " + body.item.name + " by " + body.item.artists[0].name);
                    }
                    else {
                        //If unknown
                        res.say("Nothing is playing");
                    }
                }
            })
            .catch(function (err) {
                console.error('error:', err.message);
            });
    }
);

//Only listen if run directly, not if required as a module
if (require.main === module) {
    var port = process.env.PORT || 8888;
    console.log("Listening on port " + port);
    express_app.listen(port);
}

module.exports = app;
