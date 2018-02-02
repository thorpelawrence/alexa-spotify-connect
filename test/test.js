const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const expect = chai.expect;
const connect = require('../connect');
const generateRequest = require('./generate-request');

chai.use(chaiAsPromised);

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
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech.ssml;
        });
        return expect(res).to.eventually.include('I can control your Spotify Connect devices');
    });
});

describe('PlayIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .put("/v1/me/player/play")
            .reply(204);
    });

    it('should PUT to spotify play endpoint and recieve 204', function () {
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

    it('should PUT to spotify pause endpoint and recieve 204', function () {
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

    it('should POST to spotify next endpoint and recieve 204', function () {
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

    it('should POST to spotify previous endpoint and recieve 204', function () {
        var req = generateRequest('SkipPreviousIntent');
        var res = connect.request(req).then(function (r) {
            return r.sessionAttributes.statusCode;
        });
        return expect(res).to.eventually.equal(204);
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
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech.ssml;
        });
        return expect(res).to.eventually.include("You have not linked your Spotify account");
    });

    it('should find no devices', function () {
        var req = generateRequest('GetDevicesIntent');
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech.ssml;
        });
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
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech.ssml;
        });
        return expect(res).to.eventually.include("My device");
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
