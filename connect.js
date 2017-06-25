var AlexaAppServer = require('alexa-app-server');
var alexa = require('alexa-app');
var SpotifyWebApi = require('spotify-web-api-node');
var request = require('request');
var randomstring = require('randomstring');
var express = require('express');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');

var server = new AlexaAppServer({
    httpsEnabled: true,
    port: process.env.PORT || 443
});

var app = new alexa.app('connect');

var spotifyApi = new SpotifyWebApi({
    clientId: '8f8e09d45e574e07b0a040bd70c95fb6',
    clientSecret: process.env.client_secret,
    redirectUri: 'https://alexa-spotify-connect.herokuapp.com/callback'
});

app.intent('playPauseIntent', {
    "utterances": [
        "play",
        "pause"
    ]
},
    function (req, res) {
        res.say('Play Pause');
    }
);

var express_app = express();
express_app.use(express.static(__dirname));

express_app.get('/login', function (req, res) {
    var scopes = ['user-read-playback-state', 'user-modify-playback-state'];
    var state = randomstring.generate(16);
    res.cookie('spotify_auth_state', state);
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
});

express_app.get('/callback', function (req, res) {

    var code = req.query.code;
    var state = req.query.state;

    spotifyApi.authorizationCodeGrant(code)
        .then(function (data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            res.cookie('access_token', data.body['access_token']);
            res.redirect('/#' + querystring.stringify({ access_token: data.body['access_token'], refresh_token: data.body['refresh_token'] }));
        }, function (err) {
            console.log('Something went wrong!', err);
        });
});

express_app.get('/refresh_token', function (req, res) {
    spotifyApi.refreshAccessToken()
        .then(function (data) {
            console.log('The access token has been refreshed!');
            console.log('The access token is ' + data.body['access_token']);

            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);
            res.redirect('/#' + querystring.stringify({ access_token: data.body['access_token'] }));
        }, function (err) {
            console.log('Could not refresh access token', err);
        });
});

express_app.post('/playpause', function (req, res) {
    console.log("PLAYPAUSE");
    //var playing = request.get("https://api.spotify.com/v1/me/player", { "auth":{"bearer":spotifyApi.getAccessToken()}, json: true });
    if (playing) {
        request.put("https://api.spotify.com/v1/me/player/pause").auth(null, null, true, spotifyApi.getAccessToken())
    }
    else {
        request.put("https://api.spotify.com/v1/me/player/play").auth(null, null, true, spotifyApi.getAccessToken())
    }
});

express_app.post('/getdevices', function (req, res) {
    spotifyApi.getMyDevices()
        .then(function (data) {
            var devices = data.body.devices;
            for (var i = 0; i < devices.length; i++) {
                console.log(devices[i].id + ":" + devices[i].name + ":" + devices[i].volume_percent);
            }
        }, function (err) {
            console.error(err);
        });
});

var port = process.env.PORT || 8888;
console.log('Listening on ' + port);
express_app.listen(port);

module.exports = app;
