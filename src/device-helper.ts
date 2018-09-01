import { NodeCache } from 'node-cache';
import * as alexa from '../node_modules/alexa-app/types/index';

export interface Device {
    id: number,
    name: string,
    number: number
}

/**
 * Get all devices contained in the given session, using cache as a fallback.
 * @param session The session.
 * @param cache Fallback cache to look for the device in.
 * @return The array of devices.
 */
export function getDevices(session: alexa.session, cache: NodeCache): Device[] {
    if (session.isNew()) {
        // If new session (not containing devices) try to use cache
        return cache.get(session.details.user.userId + ":devices") || [];
    }
    else {
        // If existing session, use session data
        return session.get("devices") || [];
    }
}

/**
 * Get a single device by its number.
 * @param session The session.
 * @param cache Fallback cache to look for device in.
 * @param deviceNumber The number of the device.
 * @return The device if found, or null otherwise.
 */
export function findDeviceByNumber(session: alexa.session, cache: NodeCache, deviceNumber: number): Device | undefined {
    return getDevices(session, cache).find((device) => {
        return device.number == deviceNumber;
    });
}

/**
 * Convert JSON array of devices into a `Device` array.
 * Maps each device to an index number and prepends that number to its name.
 * @param devices The JSON array.
 * @return The array of the devices after mapping.
 */
export function jsonToDevices(devices: any): Device[] {
    return devices.map((device: any, index: number) => {
        // Number each device
        device.number = (index + 1);
        // Update the name to include the number
        device.name = `${index + 1}. ${device.name}`
        return device;
    });
}
