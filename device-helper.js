const request = require('request-promise-native');
const Fuse = require('fuse.js');

async function getDevices(req, cache) {
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

async function findDeviceByName(req, cache, nameQuery) {
  var devices = await getDevices(req, cache);
  const results = (new Fuse(devices, {
    keys: ['name'],
    threshold: 0.4, //TODO needs fine-tuning
  })).search(nameQuery);
  return (results.length) ? results[0].item : {};
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
            req.getSession().set("devices", devices);
            cache.set(req.getSession().details.user.userId + ":devices", devices);
            resolve(devices);
        })
        .catch(reject);
    });
}

module.exports = {
    getDevices,
    findDeviceByName,
    requestDevices
};
