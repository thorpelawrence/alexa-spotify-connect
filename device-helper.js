function getDevices(req, cache) {
    // Check if session is new
    if (req.getSession().isNew()) {
        // If new session try to use cache
        return cache.get(req.getSession().details.user.userId + ":devices") || [];
    }
    else {
        // If existing session use session data
        return req.getSession().get("devices") || [];
    }
}

function findDeviceByNumber(req, cache, deviceNumber) {
    var devices = getDevices(req, cache);

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

module.exports = {
    getDevices,
    findDeviceByNumber
};
