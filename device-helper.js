const request = require('request-promise-native');

async function getDevices(req, cache) {
    // Check if session is new
    if (req.getSession().isNew()) {
        // If new session try to use cache
        var devices = cache.get(req.getSession().details.user.userId + ":devices");
        // Otherwise refresh by requesting
        if (devices == undefined) {
            try {
                devices = await requestDevices(req, cache);
            } catch (err) {
                req.getSession().set("statusCode", err.statusCode);
                devices = [];
            }
        }
        return devices;
    }
    else {
        // If existing session use session data
        return req.getSession().get("devices") || [];
    }
}

async function findDeviceByNumber(req, cache, deviceNumber) {
    var devices = await getDevices(req, cache);

    var deviceId, deviceName;

    // Iterate through devices to find ID and name by number
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].number == deviceNumber) {
            deviceId = devices[i].id;
            deviceName = devices[i].name;
        }
    }

    return { id: deviceId, name: deviceName };
}

function requestDevices(req, cache) {
    return new Promise(function (resolve, reject) {
        request.get({
            url: "https://api.spotify.com/v1/me/player/devices",
            // Send access token as bearer auth
            auth: {
                "bearer": req.getSession().details.user.accessToken
            },
            // Parse results as JSON
            json: true
        })
        .then(function(body) {
            var devices = body.devices || [];
            for (var i = 0; i < devices.length; i++) {
                // Add the device number to JSON
                devices[i].number = (i + 1);
            }
            req.getSession().set("devices", devices);
            cache.set(req.getSession().details.user.userId + ":devices", devices);
            resolve(devices);
        })
        .catch(reject);
    });
}

module.exports = {
    getDevices,
    findDeviceByNumber,
    requestDevices
};
