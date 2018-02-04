const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const expect = chai.expect;
const eventToPromise = require('event-to-promise');
const connect = require('../connect');
const generateRequest = require('./generate-request');

chai.use(chaiAsPromised);

function getRequestSSML(req) {
    return connect.request(req).then(function (r) {
        return r.response.outputSpeech.ssml;
    });
}

function getRequestAttribute(req, attribute) {
    return connect.request(req).then(function (r) {
        return r.sessionAttributes[attribute];
    });
}

const device0 = {
    "id": "0",
    "number": 1,
    "is_active": false,
    "is_restricted": false,
    "name": "My device",
    "type": "Computer",
    "volume_percent": 100
};

describe('Pre and post handling', function () {
    it('should give error if invalid applicationId', function () {
        var req = generateRequest.requestType(null, "example-application-id");
        var res = getRequestSSML(req);
        return expect(res).to.eventually.contain("An error occured: Invalid applicationId");
    });

    it('should warn if no Spotify account linked', function () {
        var req = generateRequest.requestType('LaunchRequest');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("You have not linked your Spotify account");
    });
});

describe('Launch handling', function () {
    it('should handle launch of skill', function () {
        var req = generateRequest.requestType('LaunchRequest');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include('I can control your Spotify Connect devices');
    });
});

describe('AMAZON.HelpIntent', function () {
    it('should give correct help information', function () {
        var req = generateRequest.intentRequest('AMAZON.HelpIntent');
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech;
        });
        return expect(res).to.eventually.have.property("type", "SSML");
    });
});

describe('AMAZON.StopIntent', function () {
    it('should return nothing', function () {
        var req = generateRequest.intentRequest('AMAZON.StopIntent', null, "example-access-token");
        var res = connect.request(req).then(function (r) {
            return r.response;
        });
        return expect(res).to.eventually.not.have.property("outputSpeech");
    });
});

describe('AMAZON.CancelIntent', function () {
    it('should return nothing', function () {
        var req = generateRequest.intentRequest('AMAZON.CancelIntent', null, "example-access-token")
        var res = connect.request(req).then(function (r) {
            return r.response;
        });
        return expect(res).to.eventually.not.have.property("outputSpeech");
    });
});

describe('PlayIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .put("/v1/me/player/play")
            .reply(204);
    });

    it('should PUT to Spotify play endpoint and recieve 204', function () {
        var req = generateRequest.intentRequest('PlayIntent');
        var res = getRequestAttribute(req, 'statusCode');
        return expect(res).to.eventually.equal(204);
    });
});

describe('PauseIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .put("/v1/me/player/pause")
            .reply(204);
    });

    it('should PUT to Spotify pause endpoint and recieve 204', function () {
        var req = generateRequest.intentRequest('PauseIntent');
        var res = getRequestAttribute(req, 'statusCode');
        return expect(res).to.eventually.equal(204);
    });
});

describe('SkipNextIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .post("/v1/me/player/next")
            .reply(204);
    });

    it('should POST to Spotify next endpoint and recieve 204', function () {
        var req = generateRequest.intentRequest('SkipNextIntent');
        var res = getRequestAttribute(req, 'statusCode');
        return expect(res).to.eventually.equal(204);
    });
});

describe('SkipPreviousIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .post("/v1/me/player/previous")
            .reply(204);
    });

    it('should POST to Spotify previous endpoint and recieve 204', function () {
        var req = generateRequest.intentRequest('SkipPreviousIntent');
        var res = getRequestAttribute(req, 'statusCode');
        return expect(res).to.eventually.equal(204);
    });
});

describe('VolumeLevelIntent', function () {
    it('should warn if no slot value', function () {
        var req = generateRequest.intentRequest('VolumeLevelIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't work out the volume to use");
    });

    it('should warn if not a number', function () {
        var req = generateRequest.intentRequest('VolumeLevelIntent', {
            "VOLUMELEVEL": {
                "name": "VOLUMELEVEL",
                "value": "NaN"
            }
        });
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("Try setting a volume between 0 and 10");
    });

    it('should PUT correct volume to Spotify endpoint', function () {
        var vol = Math.floor(Math.random() * 10);
        var api = nock("https://api.spotify.com")
            .put("/v1/me/player/volume")
            .query({ "volume_percent": vol * 10 })
            .reply(204);
        var requested = eventToPromise(api, 'request')
            .then(() => {
                return true;
                api.cleanAll();
            });
        var req = generateRequest.intentRequest('VolumeLevelIntent', {
            "VOLUMELEVEL": {
                "name": "VOLUMELEVEL",
                "value": vol
            }
        });
        connect.request(req);
        return expect(requested).to.eventually.be.true;
    });

    it('should warn if volume outside of range', function () {
        [-10, -5, 15].forEach(function (vol) {
            var slots = {
                "VOLUMELEVEL": {
                    "name": "VOLUMELEVEL",
                    "value": vol
                }
            };
            var req = generateRequest.intentRequest('VolumeLevelIntent', slots);
            var res = getRequestSSML(req);
            if (vol < 0 || vol > 10)
                return expect(res).to.eventually.include("You can only set the volume between 0 and 10");
        });
    });
});

describe('GetDevicesIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(200, { "devices": [] });
    });

    it('should find no devices', function () {
        var req = generateRequest.intentRequest('GetDevicesIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't find any connect devices");
    });

    it('should find 1 device', function () {
        // Change reply to include a device
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(200, {
                "devices": [device0]
            });
        var req = generateRequest.intentRequest('GetDevicesIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("My device");
    });

    it('should handle errors with request', function () {
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(503);
        var req = generateRequest.intentRequest('GetDevicesIntent');
        var res = getRequestAttribute(req, 'statusCode');
        expect(res).to.eventually.equal(503);
    });
});

describe('DevicePlayIntent', function () {
    it('should warn if no slot value', function () {
        var req = generateRequest.intentRequest('DevicePlayIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't work out which device number to play on");
    });

    it('should warn if not a number', function () {
        var req = generateRequest.intentRequest('DevicePlayIntent', {
            "DEVICENUMBER": {
                "name": "DEVICENUMBER",
                "value": "NaN"
            }
        });
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("refer to the device by number");
    });

    it('should PUT to Spotify endpoint with device in body', function () {
        var api = nock("https://api.spotify.com", {
            reqheaders: {
                "Authorization": "Bearer example-access-token"
            }
        })
            .put("/v1/me/player", {
                "device_ids": [device0.id],
                "play": true
            })
            .reply(204);
        var requested = eventToPromise(api, 'request')
            .then(() => {
                return true;
                api.cleanAll();
            });
        var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent',
            { "devices": [device0] },
            {
                "DEVICENUMBER": {
                    "name": "DEVICENUMBER",
                    "value": 1
                }
            }, "example-access-token");
        connect.request(req);
        return expect(requested).to.eventually.be.true;
    });

    it('should warn if device not found', function () {
        var deviceNumber = Math.floor(Math.random() * 10) + 2;
        var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent',
            { "devices": [device0] },
            {
                "DEVICENUMBER": {
                    "name": "DEVICENUMBER",
                    "value": deviceNumber
                }
            }, "example-access-token");
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't find device " + deviceNumber);
    });

    it('should use (empty) cache if new session', function () {
        var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent', null, {
            "DEVICENUMBER": {
                "name": "DEVICENUMBER",
                "value": 10
            }
        }, null, true);
        var res = getRequestSSML(req);
        return expect(res).to.eventually.contain("couldn't find device");
    });
});

describe('DeviceTransferIntent', function () {
    it('should warn if no slot value', function () {
        var req = generateRequest.intentRequest('DeviceTransferIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't work out which device number to transfer to");
    });

    it('should warn if not a number', function () {
        var req = generateRequest.intentRequest('DeviceTransferIntent', {
            "DEVICENUMBER": {
                "name": "DEVICENUMBER",
                "value": "NaN"
            }
        });
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("Try asking me to to transfer a device number");
    });

    it('should PUT to Spotify endpoint with device in body', function () {
        var api = nock("https://api.spotify.com", {
            reqheaders: {
                "Authorization": "Bearer example-access-token"
            }
        })
            .put("/v1/me/player", {
                "device_ids": [device0.id]
            })
            .reply(204);
        var requested = eventToPromise(api, 'request')
            .then(() => {
                return true;
                api.cleanAll();
            });
        var req = generateRequest.intentRequestSessionAttributes('DeviceTransferIntent',
            { "devices": [device0] },
            {
                "DEVICENUMBER": {
                    "name": "DEVICENUMBER",
                    "value": 1
                }
            }, "example-access-token");
        connect.request(req);
        return expect(requested).to.eventually.be.true;
    });

    it('should warn if device not found', function () {
        var deviceNumber = Math.floor(Math.random() * 10) + 2;
        var req = generateRequest.intentRequestSessionAttributes('DeviceTransferIntent',
            { "devices": [device0] },
            {
                "DEVICENUMBER": {
                    "name": "DEVICENUMBER",
                    "value": deviceNumber
                }
            }, "example-access-token");
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't find device " + deviceNumber);
    });

    it('should use (empty) cache if new session', function () {
        var req = generateRequest.intentRequestSessionAttributes('DeviceTransferIntent', null, {
            "DEVICENUMBER": {
                "name": "DEVICENUMBER",
                "value": 10
            }
        }, null, true);
        var res = getRequestSSML(req);
        return expect(res).to.eventually.contain("couldn't find device");
    });
});

describe('GetTrackIntent', function () {
    it('should give current playing track', function () {
        var trackName = "Example track";
        var artistName = "Example artist";
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/currently-playing")
            .reply(204, {
                "is_playing": true,
                "item": {
                    "name": trackName,
                    "artists": [{ "name": artistName }]
                }
            });
        var req = generateRequest.intentRequest('GetTrackIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.contain("This is " + trackName + " by " + artistName);
    });

    it('should give last played track', function () {
        var trackName = "Example track";
        var artistName = "Example artist";
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/currently-playing")
            .reply(204, {
                "is_playing": false,
                "item": {
                    "name": trackName,
                    "artists": [{ "name": artistName }]
                }
            });
        var req = generateRequest.intentRequest('GetTrackIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.contain("That was " + trackName + " by " + artistName);
    });

    it('should say if nothing is playing', function () {
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/currently-playing")
            .reply(204, {
                "is_playing": false,
                "item": {}
            });
        var req = generateRequest.intentRequest('GetTrackIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("Nothing is playing");
    });

    it('should handle errors with request', function () {
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/currently-playing")
            .reply(503);
        var req = generateRequest.intentRequest('GetTrackIntent');
        var res = getRequestAttribute(req, 'statusCode');
        expect(res).to.eventually.equal(503);
    });
});
