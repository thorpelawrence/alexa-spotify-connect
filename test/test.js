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

describe('Pre and post handling', function () {
    it('should give error if invalid applicationId', function () {
        var req = {
            "session": {
                "application": {
                    "applicationId": "example"
                },
                "user": {}
            },
            "request": {
                "type": "IntentRequest"
            }
        };
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech.ssml;
        });
        return expect(res).to.eventually.contain("An error occured: Invalid applicationId");
    });
});

describe('Launch handling', function () {
    it('should handle launch of skill', function () {
        var req = {
            "session": {
                "application": {
                    "applicationId": "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0"
                },
                "user": {}
            },
            "request": {
                "type": "LaunchRequest"
            }
        }
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include('I can control your Spotify Connect devices');
    });
});

describe('PlayIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .put("/v1/me/player/play")
            .reply(204);
    });

    it('should PUT to Spotify play endpoint and recieve 204', function () {
        var req = generateRequest('PlayIntent');
        var res = connect.request(req).then(function (r) {
            return r.sessionAttributes.statusCode;
        });
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
        var req = generateRequest('PauseIntent');
        var res = connect.request(req).then(function (r) {
            return r.sessionAttributes.statusCode;
        });
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
        var req = generateRequest('SkipNextIntent');
        var res = connect.request(req).then(function (r) {
            return r.sessionAttributes.statusCode;
        });
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
        var req = generateRequest('SkipPreviousIntent');
        var res = connect.request(req).then(function (r) {
            return r.sessionAttributes.statusCode;
        });
        return expect(res).to.eventually.equal(204);
    });
});

describe('VolumeLevelIntent', function () {
    it('should warn if no slot value', function () {
        var req = generateRequest('VolumeLevelIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't work out the volume to use");
    });

    it('should warn if not a number', function () {
        var req = generateRequest('VolumeLevelIntent', {
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
                n.cleanAll();
            });
        var req = generateRequest('VolumeLevelIntent', {
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
            var req = generateRequest('VolumeLevelIntent', slots);
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

    it('should warn if no Spotify account linked', function () {
        var req = generateRequest('GetDevicesIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("You have not linked your Spotify account");
    });

    it('should find no devices', function () {
        var req = generateRequest('GetDevicesIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("couldn't find any connect devices");
    });

    it('should find 1 device', function () {
        // Change reply to include a device
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(200, {
                "devices": [{
                    "id": "0",
                    "is_active": false,
                    "is_restricted": false,
                    "name": "My device",
                    "type": "Computer",
                    "volume_percent": 100
                }]
            });
        var req = generateRequest('GetDevicesIntent');
        var res = getRequestSSML(req);
        return expect(res).to.eventually.include("My device");
    });

    it('should handle errors with request', function () {
        nock.cleanAll();
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(503);
        var req = generateRequest('GetDevicesIntent');
        var res = connect.request(req).then(function (r) {
            return r.sessionAttributes.statusCode;
        });
        expect(res).to.eventually.equal(503);
    });
});

describe('AMAZON.HelpIntent', function () {
    it('should give correct help information', function () {
        var req = generateRequest('AMAZON.HelpIntent');
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech;
        });
        return expect(res).to.eventually.have.property("type", "SSML");
    });
});

describe('AMAZON.StopIntent', function () {
    it('should return nothing', function () {
        var req = generateRequest('AMAZON.StopIntent', null, "example-access-token");
        var res = connect.request(req).then(function (r) {
            return r.response;
        });
        return expect(res).to.eventually.not.have.property("outputSpeech");
    });
});

describe('AMAZON.CancelIntent', function () {
    it('should return nothing', function () {
        var req = generateRequest('AMAZON.CancelIntent', null, "example-access-token")
        var res = connect.request(req).then(function (r) {
            return r.response;
        });
        return expect(res).to.eventually.not.have.property("outputSpeech");
    });
});
