var alexa = require('alexa-app');
var request = require('request-promise');
var express = require('express');

var express_app = express();

var app = new alexa.app('connect');
app.express({ expressApp: express_app });

app.intent('PlayIntent', {
    "utterances": [
        "play",
        "resume",
        "continue"
    ]
},
    function (req, res) {
        request.put("https://api.spotify.com/v1/me/player/play").auth(null, null, true, req.sessionDetails.accessToken);
        res.say('Playing');
    }
);

app.intent('PauseIntent', {
    "utterances": [
        "pause"
    ]
},
    function (req, res) {
        request.put("https://api.spotify.com/v1/me/player/pause").auth(null, null, true, req.sessionDetails.accessToken);
        res.say('Paused');
    }
);

app.intent('GetDevicesIntent', {
    "utterances": [
        "devices",
        "list"
    ]
},
    function (req, res) {
        return request.get({
            url: "https://api.spotify.com/v1/me/player/devices",
            auth: {
                "bearer": req.sessionDetails.accessToken
            },
            json: true
        })
            .then(function (body) {
                var devices = body.devices || [];
                var deviceNames = [];
                res.say("I found these devices:");
                for (var i = 0; i < devices.length; i++) {
                    deviceNames.push((i + 1) + ". " + devices[i].name);
                    devices[i].number = (i + 1);
                }
                res.say(deviceNames.slice(0, deviceNames.length - 1).join(', ') + ", and " + deviceNames.slice(-1));
                req.getSession().set("devices", devices);
            })
            .catch(function (err) {
                console.error('error:', err.message);
            });
    }
);

app.intent('DevicePlayIntent', {
    "slots": {
        "NUMBER": "AMAZON.NUMBER"
    },
    "utterances": [
        "play on {NUMBER}",
        "play on number {NUMBER}",
        "play on device {NUMBER}",
        "play on device number {NUMBER}"
    ]
},
    function (req, res) {
        if (req.slot("NUMBER")) {
            var number = req.slot("NUMBER");
            var devices = req.getSession().get("devices");
            res.say("Device " + number + ": " + devices);
        }
    });

express_app.use(express.static(__dirname));
express_app.get('/', function (req, res) {
    res.redirect('https://github.com/thorpelawrence/alexa-spotify-connect');
});

var port = process.env.PORT || 8888;
console.log("Listening on port " + port);
express_app.listen(port);

module.exports = app;
