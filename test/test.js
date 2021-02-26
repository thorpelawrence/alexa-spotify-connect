const nock = require('nock');
const pEvent = require('p-event');
const connect = require('../connect');
const generateRequest = require('./generate-request');

jest.retryTimes(3);

nock.disableNetConnect();

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

describe('Pre and post handling', () => {
    test('should give error if invalid applicationId', () => {
        var req = generateRequest.requestType(null, "example-application-id");
        return getRequestSSML(req).then(res => {
            expect(res).toContain("An error occured: Invalid applicationId");
        });
    });

    test('should warn if no Spotify account linked', () => {
        var req = generateRequest.requestType('LaunchRequest');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("You have not linked your Spotify account");
        });
    });
});

describe('Launch handling', () => {
    test('should handle launch of skill', () => {
        var req = generateRequest.requestType('LaunchRequest');
        return getRequestSSML(req).then(res => {
            expect(res).toContain('I can control your Spotify Connect devices');
        });
    });
});

describe('AMAZON.HelpIntent', () => {
    test('should give correct help information', () => {
        var req = generateRequest.intentRequest('AMAZON.HelpIntent');
        return connect.request(req).then(function (r) {
            return r.response.outputSpeech;
        }).then(res => {
            expect(res).toHaveProperty("type", "SSML");
        });
    });
});

describe('AMAZON.StopIntent', () => {
    test('should return nothing', () => {
        var req = generateRequest.intentRequest('AMAZON.StopIntent', null, "example-access-token");
        return connect.request(req).then(function (r) {
            return r.response;
        }).then(res => {
            expect(res).not.toHaveProperty("outputSpeech");
        });
    });
});

describe('AMAZON.CancelIntent', () => {
    test('should return nothing', () => {
        var req = generateRequest.intentRequest('AMAZON.CancelIntent', null, "example-access-token");
        return connect.request(req).then(function (r) {
            return r.response;
        }).then(res => {
            expect(res).not.toHaveProperty("outputSpeech");
        });
    });
});

describe('PlayIntent', () => {
    test('should PUT to Spotify play endpoint and recieve 204', () => {
        nock("https://api.spotify.com")
            .put("/v1/me/player/play")
            .reply(204);
        var req = generateRequest.intentRequest('PlayIntent');
        return getRequestAttribute(req, 'statusCode').then(res => {
            expect(res).toBe(204);
        });
    });

    test('should warn if not premium', () => {
        nock("https://api.spotify.com")
            .put("/v1/me/player/play")
            .reply(403);
        var req = generateRequest.intentRequest('PlayIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('PauseIntent', () => {
    test('should PUT to Spotify pause endpoint and recieve 204', () => {
        nock("https://api.spotify.com")
            .put("/v1/me/player/pause")
            .reply(204);
        var req = generateRequest.intentRequest('PauseIntent');
        return getRequestAttribute(req, 'statusCode').then(res => {
            expect(res).toBe(204);
        });
    });

    test('should warn if not premium', () => {
        nock("https://api.spotify.com")
            .put("/v1/me/player/pause")
            .reply(403);
        var req = generateRequest.intentRequest('PauseIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('SkipNextIntent', () => {
    test('should POST to Spotify next endpoint and recieve 204', () => {
        nock("https://api.spotify.com")
            .post("/v1/me/player/next")
            .reply(204);
        var req = generateRequest.intentRequest('SkipNextIntent');
        return getRequestAttribute(req, 'statusCode').then(res => {
            expect(res).toBe(204);
        });
    });

    test('should warn if not premium', () => {
        nock("https://api.spotify.com")
            .post("/v1/me/player/next")
            .reply(403);
        var req = generateRequest.intentRequest('SkipNextIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('SkipPreviousIntent', () => {
    test('should POST to Spotify previous endpoint and recieve 204', () => {
        nock("https://api.spotify.com")
            .post("/v1/me/player/previous")
            .reply(204);
        var req = generateRequest.intentRequest('SkipPreviousIntent');
        return getRequestAttribute(req, 'statusCode').then(res => {
            expect(res).toBe(204);
        });
    });

    test('should warn if not premium', () => {
        nock("https://api.spotify.com")
            .post("/v1/me/player/previous")
            .reply(403);
        var req = generateRequest.intentRequest('SkipPreviousIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('VolumeLevelIntent', () => {
    test('should warn if no slot value', () => {
        var req = generateRequest.intentRequest('VolumeLevelIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("couldn't work out the volume to use");
        });
    });

    test('should warn if not a number', () => {
        var req = generateRequest.intentRequest('VolumeLevelIntent', {
            "VOLUMELEVEL": {
                "name": "VOLUMELEVEL",
                "value": "NaN"
            }
        });
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Try setting a volume between 0 and 10");
        });
    });

    test('should PUT correct volume to Spotify endpoint', () => {
        var vol = Math.floor(Math.random() * 10);
        var api = nock("https://api.spotify.com")
            .put("/v1/me/player/volume")
            .query({ "volume_percent": vol * 10 })
            .reply(204);
        var requested = pEvent(api, 'request')
            .then(() => {
                return api.isDone();
            });
        var req = generateRequest.intentRequest('VolumeLevelIntent', {
            "VOLUMELEVEL": {
                "name": "VOLUMELEVEL",
                "value": vol
            }
        });
        connect.request(req);
        return requested.then(res => {
            expect(res).toBe(true);
        });
    });

    test('should warn if volume outside of range', () => {
        var slots = {
            "VOLUMELEVEL": {
                "name": "VOLUMELEVEL",
                "value": 15
            }
        };
        var req = generateRequest.intentRequest('VolumeLevelIntent', slots);
        return getRequestSSML(req).then(res => {
            expect(res).toContain("You can only set the volume between 0 and 10");
        });
    });

    test('should return nothing if no session', () => {
        var req = generateRequest.intentRequestNoSession('VolumeLevelIntent');
        return connect.request(req).then(function (r) {
            return r.response;
        }).then(res => {
            expect(res).not.toHaveProperty("outputSpeech");
        });
    });

    test('should warn if not premium', () => {
        var vol = Math.floor(Math.random() * 10);
        nock("https://api.spotify.com")
            .put("/v1/me/player/volume")
            .query({ "volume_percent": vol * 10 })
            .reply(403);
        var req = generateRequest.intentRequest('VolumeLevelIntent', {
            "VOLUMELEVEL": {
                "name": "VOLUMELEVEL",
                "value": vol
            }
        });
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('VolumePercentIntent', () => {
    test('should warn if no slot value', () => {
        var req = generateRequest.intentRequest('VolumePercentIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("couldn't work out the volume to use");
        });
    });

    test('should warn if not a number', () => {
        var req = generateRequest.intentRequest('VolumePercentIntent', {
            "VOLUMEPERCENT": {
                "name": "VOLUMEPERCENT",
                "value": "NaN"
            }
        });
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Try setting a volume percent between 0 and 100");
        });
    });

    test('should PUT correct volume to Spotify endpoint', () => {
        var vol = Math.floor(Math.random() * 100);
        var api = nock("https://api.spotify.com")
          .put("/v1/me/player/volume")
          .query({ "volume_percent": vol })
          .reply(204);
        var requested = pEvent(api, 'request')
          .then(() => {
              return api.isDone();
          });
        var req = generateRequest.intentRequest('VolumePercentIntent', {
            "VOLUMEPERCENT": {
                "name": "VOLUMEPERCENT",
                "value": vol
            }
        });
        connect.request(req);
        return requested.then(res => {
            expect(res).toBe(true);
        });
    });

    test('should warn if volume outside of range', () => {
        var slots = {
            "VOLUMEPERCENT": {
                "name": "VOLUMEPERCENT",
                "value": 101
            }
        };
        var req = generateRequest.intentRequest('VolumePercentIntent', slots);
        return getRequestSSML(req).then(res => {
            expect(res).toContain("You can only set the volume percent between 0 and 100");
        });
    });

    test('should return nothing if no session', () => {
        var req = generateRequest.intentRequestNoSession('VolumePercentIntent');
        return connect.request(req).then(function (r) {
            return r.response;
        }).then(res => {
            expect(res).not.toHaveProperty("outputSpeech");
        });
    });

    test('should warn if not premium', () => {
        var vol = Math.floor(Math.random() * 100);
        nock("https://api.spotify.com")
          .put("/v1/me/player/volume")
          .query({ "volume_percent": vol })
          .reply(403);
        var req = generateRequest.intentRequest('VolumePercentIntent', {
            "VOLUMEPERCENT": {
                "name": "VOLUMEPERCENT",
                "value": vol
            }
        });
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('GetDevicesIntent', () => {
    test('should find no devices', () => {
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(200, { "devices": [] });
        var req = generateRequest.intentRequest('GetDevicesIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("couldn't find any connect devices");
        });
    });

    test('should find 1 device', () => {
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(200, {
                "devices": [device0]
            });
        var req = generateRequest.intentRequest('GetDevicesIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("My device");
        });
    });

    test('should handle errors with request', () => {
        nock("https://api.spotify.com")
            .get("/v1/me/player/devices")
            .reply(503);
        var req = generateRequest.intentRequest('GetDevicesIntent');
        return getRequestAttribute(req, 'statusCode').then(res => {
            expect(res).toBe(503);
        });
    });
});

describe('DevicePlayIntent', () => {
    test('should warn if no slot value', () => {
        var req = generateRequest.intentRequest('DevicePlayIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("couldn't work out which device to play on");
        });
    });

    test('should PUT to Spotify endpoint with device in body', () => {
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
        var requested = pEvent(api, 'request')
            .then(() => {
                return api.isDone();
            });
        var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent',
            { "devices": [device0] },
            {
                "DEVICE": {
                    "name": "DEVICE",
                    "value": device0.name
                }
            }, "example-access-token");
        connect.request(req);
        return requested.then(res => {
            expect(res).toBe(true);
        });
    });

    test('should warn if device not found', () => {
      const deviceName = "Nonexistent Device";
        var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent',
            { "devices": [device0] },
            {
                "DEVICE": {
                    "name": "DEVICE",
                    "value": deviceName
                }
            }, "example-access-token");
        return getRequestSSML(req).then(res => {
            expect(res).toContain("couldn't find a device named " + deviceName);
        });
    });

    test('should return nothing if no session', () => {
        var req = generateRequest.intentRequestNoSession('DevicePlayIntent');
        return connect.request(req).then(function (r) {
            return r.response;
        }).then(res => {
            expect(res).not.toHaveProperty("outputSpeech");
        });
    });

    test('should warn if not premium', () => {
        nock("https://api.spotify.com")
            .put("/v1/me/player")
            .reply(403);
        var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent',
            { "devices": [device0] },
            {
                "DEVICE": {
                    "name": "DEVICE",
                    "value": device0.name
                }
            }, "example-access-token");
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('DeviceTransferIntent', () => {
    test('should warn if no slot value', () => {
        var req = generateRequest.intentRequest('DeviceTransferIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("couldn't work out which device to transfer to");
        });
    });

    test('should PUT to Spotify endpoint with device in body', () => {
        var api = nock("https://api.spotify.com", {
            reqheaders: {
                "Authorization": "Bearer example-access-token"
            }
        })
            .put("/v1/me/player", {
                "device_ids": [device0.id]
            })
            .reply(204);
        var requested = pEvent(api, 'request')
            .then(() => {
                return api.isDone();
            });
        var req = generateRequest.intentRequestSessionAttributes('DeviceTransferIntent',
            { "devices": [device0] },
            {
                "DEVICE": {
                    "name": "DEVICE",
                    "value": device0.name
                }
            }, "example-access-token");
        connect.request(req);
        return requested.then(res => {
            expect(res).toBe(true);
        });
    });

    test('should warn if device not found', () => {
        const deviceName = "Nonexistent Device";
        var req = generateRequest.intentRequestSessionAttributes('DeviceTransferIntent',
            { "devices": [device0] },
            {
                "DEVICE": {
                    "name": "DEVICE",
                    "value": deviceName
                }
            }, "example-access-token");
        return getRequestSSML(req).then(res => {
            expect(res).toContain("couldn't find a device named " + deviceName);
        });
    });

    test('should return nothing if no session', () => {
        var req = generateRequest.intentRequestNoSession('DeviceTransferIntent');
        return connect.request(req).then(function (r) {
            return r.response;
        }).then(res => {
            expect(res).not.toHaveProperty("outputSpeech");
        });
    });

    test('should warn if not premium', () => {
        nock("https://api.spotify.com")
            .put("/v1/me/player")
            .reply(403);
        var req = generateRequest.intentRequestSessionAttributes('DeviceTransferIntent',
            { "devices": [device0] },
            {
                "DEVICE": {
                    "name": "DEVICE",
                    "value": device0.name
                }
            }, "example-access-token");
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Make sure your Spotify account is premium");
        });
    });
});

describe('GetTrackIntent', () => {
    test('should give current playing track', () => {
        var trackName = "Example track";
        var artistName = "Example artist";
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
        return getRequestSSML(req).then(res => {
            expect(res).toContain("This is " + trackName + " by " + artistName);
        });
    });

    test('should give last played track', () => {
        var trackName = "Example track";
        var artistName = "Example artist";
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
        return getRequestSSML(req).then(res => {
            expect(res).toContain("That was " + trackName + " by " + artistName);
        });
    });

    test('should say if nothing is playing', () => {
        nock("https://api.spotify.com")
            .get("/v1/me/player/currently-playing")
            .reply(204, {
                "is_playing": false,
                "item": {}
            });
        var req = generateRequest.intentRequest('GetTrackIntent');
        return getRequestSSML(req).then(res => {
            expect(res).toContain("Nothing is playing");
        });
    });

    test('should handle errors with request', () => {
        nock("https://api.spotify.com")
            .get("/v1/me/player/currently-playing")
            .reply(503);
        var req = generateRequest.intentRequest('GetTrackIntent');
        return getRequestAttribute(req, 'statusCode').then(res => {
            expect(res).toBe(503);
        });
    });
});

describe('i18n', () => {
    describe('de-DE', () => {
        test('give correct language response for launch intent', () => {
            var req = generateRequest.requestType('LaunchRequest', null, "de-DE");
            return getRequestSSML(req).then(res => {
                expect(res).toContain("Hey! Ich kann deine Spotify Connect Geräte steuern");
            });
        });

        test('use i18n substitution for device name when not found', () => {
            const deviceName = "Nonexistent Device";
            var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent',
                { "devices": [device0] },
                {
                    "DEVICE": {
                        "name": "DEVICE",
                        "value": deviceName
                    }
                }, "example-access-token", null, "de-DE");
            return getRequestSSML(req).then(res => {
                expect(res).toContain("Ich konnte kein Gerät mit dem Namen „" + deviceName + "“ finden");
            });
        });

        test('use i18n substitution for device name', () => {
            nock("https://api.spotify.com")
                .put("/v1/me/player")
                .reply(204);
            var req = generateRequest.intentRequestSessionAttributes('DevicePlayIntent',
                { "devices": [device0] },
                {
                    "DEVICE": {
                        "name": "DEVICE",
                        "value": device0.name
                    }
                }, "example-access-token", null, "de-DE");
            return getRequestSSML(req).then(res => {
                expect(res).toContain("Musik wird auf " + device0.name + " abgespielt");
            });
        });
    });
});
