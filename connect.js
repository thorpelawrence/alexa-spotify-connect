var alexa = require('alexa-app');
var request = require('request-promise');
var express = require('express');
var nodecache = require('node-cache');

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

app.launch(function (request, response) {
    response.say("Try asking me to control your devices, to start, ask me to list your devices");
    response.shouldEndSession(false);
});

app.intent("AMAZON.HelpIntent", {
    "slots": {},
    "utterances": []
}, function (request, response) {
    response.say("You can ask me to list your connect devices and then control them")
        .reprompt("What would you like to do?");
    response.shouldEndSession(false);
    return;
});

app.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": []
}, function (request, response) {
    return;
});

app.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
}, function (request, response) {
    return
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
                var deviceNames = [];
                for (var i = 0; i < devices.length; i++) {
                    //Number each device
                    deviceNames.push((i + 1) + ". " + devices[i].name);
                    //Add the device number to JSON
                    devices[i].number = (i + 1);
                }
                req.getSession().set("devices", devices);
                cache.set(req.getSession().details.user.userId + ":devices", devices);
                if (devices.length > 0) {
                    //Comma separated list of device names
                    res.say("I found these connect devices: "
                        + [deviceNames.slice(0, -1).join(', '), deviceNames.slice(-1)[0]].join(deviceNames.length < 2 ? '' : ', and '))
                        .shouldEndSession(false);
                }
                else {
                    res.say("I did not find any connect devices, check that you have connected some Spotify Connect devices. "
                        + "Check your Alexa app for instructions.");
                    res.card({
                        type: "Simple",
                        title: "Connecting to a device using Spotify Connect",
                        content: "https://support.spotify.com/uk/article/spotify-connect/"
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
        "DEVICENUMBER": "AMAZON.NUMBER"
    },
    "utterances": [
        "play on {number|device|device number|} {-|DEVICENUMBER}"
    ]
},
    function (req, res) {
        if (req.hasSession()) {
            if (req.slot("DEVICENUMBER")) {
                var deviceNumber = req.slot("DEVICENUMBER");
                if (req.getSession().isNew()) {
                    //If new session try to use cache
                    var devices = cache.get(req.getSession().details.user.userId + ":devices") || [];
                }
                else {
                    var devices = req.getSession().get("devices") || [];
                }
                var deviceId, deviceName;
                for (var i = 0; i < devices.length; i++) {
                    if (devices[i].number == deviceNumber) {
                        deviceId = devices[i].id;
                        deviceName = devices[i].name;
                    }
                }
                if (deviceId) {
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
                    res.say("Playing on device " + deviceNumber + ": " + deviceName);
                }
                else {
                    res.say("I couldn't find device " + deviceNumber +
                        ". Try asking me to list devices first").shouldEndSession(false);
                }
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
        "DEVICENUMBER": "AMAZON.NUMBER"
    },
    "utterances": [
        "transfer to {number|device|device number|} {-|DEVICENUMBER}"
    ]
},
    function (req, res) {
        if (req.hasSession()) {
            if (req.slot("DEVICENUMBER")) {
                var deviceNumber = req.slot("DEVICENUMBER");
                if (req.getSession().isNew()) {
                    //If new session try to use cache
                    var devices = cache.get(req.getSession().details.user.userId + ":devices") || [];
                }
                else {
                    var devices = req.getSession().get("devices") || [];
                }
                var deviceId, deviceName;
                for (var i = 0; i < devices.length; i++) {
                    if (devices[i].number == deviceNumber) {
                        deviceId = devices[i].id;
                        deviceName = devices[i].name;
                    }
                }
                if (deviceId) {
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
                    res.say("Transferring to device " + deviceNumber + ": " + deviceName);
                }
                else {
                    res.say("I couldn't find device " + deviceNumber +
                        ". Try asking me to list devices first").shouldEndSession(false);
                }
            }
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
