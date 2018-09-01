import * as request from 'request-promise-native';
import * as alexa from 'alexa-app'

/**
 * PUT a given URL with full response and auth.
 * @param url 
 * @param accessToken Token to use for authorisation.
 * @return The request promise.
 */
export function put(url: string, accessToken: string): request.RequestPromise {
    return request.put(url, {
        // Full response to include status code
        resolveWithFullResponse: true
    }).auth("", "", true, accessToken) as request.RequestPromise;
}

/**
 * POST a given URL with full response and auth.
 * @param url
 * @param accessToken Token to use for authorisation.
 * @return The request promise.
 */
export function post(url: string, accessToken: string): request.RequestPromise {
    return request.post(url, {
        // Full response to include status code
        resolveWithFullResponse: true
    }).auth("", "", true, accessToken) as request.RequestPromise;
}
