const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const expect = chai.expect;
const connect = require('../connect');
const generateRequest = require('./generate-request');

chai.use(chaiAsPromised);

describe('PlayIntent', function () {
    beforeEach(function () {
        nock("https://api.spotify.com")
            .put("/v1/me/player/play")
            .reply(204, {});
    })
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
            .reply(204, {});
    })
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
            .reply(204, {});
    })
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
            .reply(204, {});
    })
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
            .reply(200, {
                "devices": [{
                    "id": "5fbb3ba6aa454b5534c4ba43a8c7e8e45a63ad0e",
                    "is_active": false,
                    "is_restricted": false,
                    "name": "My device",
                    "type": "Computer",
                    "volume_percent": 100
                }]
            });
    });

    it('should warn if no Spotify account linked', function () {
        var req = generateRequest('GetDevicesIntent');
        var res = connect.request(req).then(function (r) {
            return r.response.outputSpeech.ssml;
        });
        return expect(res).to.eventually.include("You have not linked your Spotify account, check your Alexa app to link the account");
    });

    it('should return 1 device', function () {
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
