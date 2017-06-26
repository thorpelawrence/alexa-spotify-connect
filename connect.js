var alexa = require('alexa-app');
var request = require('request');
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
        var devices = [];
        request.get({
            url: "https://api.spotify.com/v1/me/player/devices",
            auth: {
                "bearer": req.sessionDetails.accessToken
            },
            json: true
        },
            function (error, response, body) {
                if (error != null) console.log('error:', error);
                devices = body.devices;
            });
        res.say("I found these devices");
        for (var i = 0; i < devices.length; i++) {
            res.say(devices[i].name);
        }
    }
);

express_app.use(express.static(__dirname));
express_app.get('/', function(req, res) {
    res.redirect('https://github.com/thorpelawrence/alexa-spotify-connect');
});

var port = process.env.PORT || 8888;
console.log("Listening on port " + port);
express_app.listen(port);

module.exports = app;
