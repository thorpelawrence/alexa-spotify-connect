const request = require('request-promise-native');

module.exports = {
    put: function(url, accessToken) {
        return request.put(url, {
            // Full response to include status code
            resolveWithFullResponse: true
        }).auth(null, null, true, accessToken);
    },
    post: function(url, accessToken) {
        return request.post(url, {
            // Full response to include status code
            resolveWithFullResponse: true
        }).auth(null, null, true, accessToken);
    }
};
