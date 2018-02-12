var alexa = require('alexa-app');
var request = require('request-promise');
var express = require('express');
var nodecache = require('node-cache');

// Create instance of express
var express_app = express();
// Create a 1 hour cache for storing user devices
var cache = new nodecache({ stdTTL: 3600, checkperiod: 120 });
// Create instance of alexa-app
var app = new alexa.app('connect');
// Bind alexa-app to express instance
app.express({ expressApp: express_app });

// Run every time the skill is accessed
app.pre = function (req, res, type) {
    // Error if the application ID of the request is not for this skill
    if (req.applicationId != "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0" &&
        req.getSession().details.application.applicationId != "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0") {
        throw "Invalid applicationId";
    }
    // Check that the user has an access token, if they have linked their account
    if (!req.getSession().details.user.accessToken) {
        res.say("Du hast kein Spotify-Konto hinterlegt. Um dein Konto mit Alexa zu verknüpfen, gehe in die Alexa App");
        res.linkAccount();
    }
};

// Run after every request
app.post = function (req, res, type, exception) {
    if (exception) {
        return res.clear().say("Es ist ein Fehler aufgetreten: " + exception).send();
    }
};

// Function for when skill is invoked without intent
app.launch(function (req, res) {
    res.say("Hey! Ich kann deine Spotify Connect Geräte steuern. Frag mich einfach nach deinen Geräten");
    res.reprompt("Frag mich doch einfach nach deinen Geräten!");
    // Keep session open
    res.shouldEndSession(false);
});

// Handle default Amazon help intent
// No slots or utterances required
app.intent("AMAZON.HelpIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    res.say("Du kannst mich nach deinen Spotify Connect Geräten fragen, um sie zu steuern.")
    res.say("Sag' zum Beispiel, Spiele Musik auf dem Gerät, und der Geräte-Nummer, nachdem alle Geräte aufgelistet sind.");
    res.reprompt("Was möchtest du machen?");
    // Keep session open
    res.shouldEndSession(false);
});

// Handle default Amazon stop intent
// No slots or utterances required
app.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    return;
});

// Handle default Amazon cancel intent
// No slots or utterances required
app.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
}, function (req, res) {
    return;
});

// Handle play intent
// No slots required
app.intent('PlayIntent', {
    "utterances": [
        "play",
        "wiedergabe"
    ]
},
    function (req, res) {
        // PUT to Spotify REST API
        var statusCode;
        return request.put("https://api.spotify.com/v1/me/player/play", {
            resolveWithFullResponse: true
        }).auth(null, null, true, req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
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
        return request.put("https://api.spotify.com/v1/me/player/pause", {
            resolveWithFullResponse: true
        }).auth(null, null, true, req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
            });
    }
);

// Handle skip next intent
// No slots required
app.intent('SkipNextIntent', {
    "utterances": [
        "weiter",
        "{nächster|nächstes} {song|track|lied}",
        "forwärts"
    ]
},
    function (req, res) {
        // POST to Spotify REST API
        return request.post("https://api.spotify.com/v1/me/player/next", {
            resolveWithFullResponse: true
        }).auth(null, null, true, req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
            });
    }
);

// Handle skip previous intent
// No slots required
app.intent('SkipPreviousIntent', {
    "utterances": [
        "zurück",
        "{letzter|letztes} {song|track|lied}",
        "rückwärts"
    ]
},
    function (req, res) {
        // POST to Spotify REST API
        return request.post("https://api.spotify.com/v1/me/player/previous", {
            resolveWithFullResponse: true
        }).auth(null, null, true, req.getSession().details.user.accessToken)
            .then((r) => {
                req.getSession().set("statusCode", r.statusCode);
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
        "{ändere die|ändere|} Lautstärke auf {-|VOLUMELEVEL}",
        "Lautstärke {-|VOLUMELEVEL}"
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
                        // PUT to Spotify REST API
                        request.put({
                            // Send new volume * 10 (convert to percentage)
                            url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + 10 * volumeLevel,
                            // Send access token as bearer auth
                            auth: {
                                "bearer": req.getSession().details.user.accessToken
                            },
                            // Handle sending as JSON
                            json: true
                        });
                    }
                    else {
                        // If not valid volume
                        res.say("Ich kann die Lautstärke nur auf 0 bis 10 ändern");
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                }
                else {
                    // Not a number
                    res.say("Versuche eine Zahl von 0 bis 10.");
                    res.reprompt("Was möchtest du machen?");
                    // Keep session open
                    res.shouldEndSession(false);
                }
            }
            else {
                // No slot value
                res.say("Du hast keine Lautstärke angegeben.")
                res.say("Versuche eine Zahl von 0 bis 10.");
                res.reprompt("Was möchtest du machen?");
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
        "geräte",
        "liste",
        "suche",
        "finde",
        "{liste|suche|finde|} {alle geräte|alle gerät-nummern} {auf|}"
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
                    res.say("Ich habe folgende Geräte gefunden: ");
                    res.say([deviceNames.slice(0, -1).join(', '), deviceNames.slice(-1)[0]].join(deviceNames.length < 2 ? '' : ', and ') + ". ");
                    res.say("Was möchtest du auf diesen Geräten {tun|machen}?").reprompt("Was möchtest du machen?");
                    // Keep session open
                    res.shouldEndSession(false);
                }
                else {
                    // No devices found
                    res.say("Ich konnte keine Spotify Connect Geräte finden. Für weitere Informationen zum Verbinden deines Gerätes, gehe in der Alexa App");
                    res.card({
                        type: "Simple",
                        title: "Ein Gerät mit Spotify Connect verbinden",
                        content: "Um ein Gerät mit Spotify Connect zu verbinden,"
                            + " melde dich zuerst mit deinem Spotify-Konto auf dem unterstützen Gerät"
                            + "wie zum Beispiel einem Amazon Echo, deinem Smartphone, oder einem Computer an"
                            + "\nhttps://www.spotify.com/de/connect/"
                    });
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
        "{spiel|starte|} {musik|spotify} auf {dem gerät|der nummer} {-|DEVICENUMBER}"
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
                    // Check if session is new
                    if (req.getSession().isNew()) {
                        // If new session try to use cache
                        var devices = cache.get(req.getSession().details.user.userId + ":devices") || [];
                    }
                    else {
                        // If existing session use session data
                        var devices = req.getSession().get("devices") || [];
                    }
                    var deviceId, deviceName;
                    // Iterate through devices to find ID and name by number
                    for (var i = 0; i < devices.length; i++) {
                        if (devices[i].number == deviceNumber) {
                            deviceId = devices[i].id;
                            deviceName = devices[i].name;
                        }
                    }
                    // Check that the device for the number was found
                    if (deviceId) {
                        // PUT to Spotify REST API
                        request.put({
                            url: "https://api.spotify.com/v1/me/player",
                            // Send access token as bearer auth
                            auth: {
                                "bearer": req.getSession().details.user.accessToken
                            },
                            body: {
                                // Send device ID
                                "device_ids": [
                                    deviceId
                                ],
                                // Make sure that music plays
                                "play": true
                            },
                            // Handle sending as JSON
                            json: true
                        });
                        res.say("Musik wird auf " + deviceNumber + ": " + deviceName + " abgespielt");
                    }
                    else {
                        // If device for number not found
                        res.say("Ich konnte das Gerät " + deviceNumber + " nicht finden.");
                        res.say("Frage mich zuerst, nach allen Geräten");
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                }
                else {
                    // Not a number
                    res.say("Ich konnte dein Gerät nicht finden.");
                    res.say("Versuche, die Geräte-Nummer zu nennen.");
                    res.reprompt("Was möchtest du machen?");
                    // Keep session open
                    res.shouldEndSession(false);
                }
            }
            else {
                // No slot value
                res.say("Ich konnte dein Gerät nicht finden.");
                res.say("Versuche, die Geräte-Nummer zu nennen.");
                res.reprompt("Was möchtest du machen?");
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
        "{übertrage|ändere} die {musikwiedergabe|wiedergabe} auf {das gerät|die nummer} {-|DEVICENUMBER}"
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
                    // Check if session is new
                    if (req.getSession().isNew()) {
                        // If new session try to use cache
                        var devices = cache.get(req.getSession().details.user.userId + ":devices") || [];
                    }
                    else {
                        // If existing session use session data
                        var devices = req.getSession().get("devices") || [];
                    }
                    var deviceId, deviceName;
                    // Iterate through devices to find ID and name by number
                    for (var i = 0; i < devices.length; i++) {
                        if (devices[i].number == deviceNumber) {
                            deviceId = devices[i].id;
                            deviceName = devices[i].name;
                        }
                    }
                    // Check that the device for the number was found
                    if (deviceId) {
                        // PUT to Spotify REST API
                        request.put({
                            url: "https://api.spotify.com/v1/me/player",
                            // Send access token as bearer auth
                            auth: {
                                "bearer": req.getSession().details.user.accessToken
                            },
                            body: {
                                // Send device ID
                                "device_ids": [
                                    deviceId
                                ]
                            },
                            // Handle sending as JSON
                            json: true
                        });
                        res.say("Musikwiedergabe wird auf " + deviceNumber + ": " + deviceName + " übertragen");
                    }
                    else {
                        // If device for number not found
                        res.say("Ich konnte das Gerät " + deviceNumber + " nicht finden.");
                        res.say("Frage mich zuerst, nach allen Geräten");
                        // Keep session open
                        res.shouldEndSession(false);
                    }
                }
                else {
                    // Not a number
                    res.say("Ich konnte dein Gerät zur Übertragung der Musikwiedergabe nicht finden.");
                    res.say("Versuche, die Geräte-Nummer zu nennen.");
                    res.reprompt("Was möchtest du machen?");
                    // Keep session open
                    res.shouldEndSession(false);
                }
            }
            else {
                // No slot value
                res.say("Ich konnte dein Gerät zur Übertragung der Musikwiedergabe nicht finden.");
                res.say("Versuche, die Geräte-Nummer zu nennen.");
                res.reprompt("Was möchtest du machen?");
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
        "Was wird gespielt",
        "Was ist {der Song|der Track|das Lied}",
        "{welcher|welches} {song|track|lied} ist das"
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
                    res.say("Das ist " + body.item.name + " von " + body.item.artists[0].name);
                }
                else {
                    if (body.item.name) {
                        // If not playing but last track known
                        res.say("Das war " + body.item.name + " von " + body.item.artists[0].name);
                    }
                    else {
                        // If unknown
                        res.say("Aktuell wird nichts gespielt");
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
express_app.get('/', function (req, res) {
    res.redirect('https://github.com/thorpelawrence/alexa-spotify-connect');
});

/* istanbul ignore if */
// Only listen if run directly, not if required as a module
if (require.main === module) {
    var port = process.env.PORT || 8888;
    console.log("Listening on port " + port);
    express_app.listen(port);
}

// Export alexa-app instance for skill.js
module.exports = app;
