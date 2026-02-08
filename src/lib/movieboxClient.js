/**
 * ========================================
 * MovieBox HD (Gargan) API - HTTP Client
 * ========================================
 * 
 * Configured axios client with proper headers for Gargan API.
 * Supports geo-location headers for region-specific content.
 */

import axios from 'axios';
import crypto from 'crypto';
import { generateSignature, generateSignatureFromBody } from './signatureGenerator.js';
import { generateDeviceId, generateAdId, getTimezoneString, normalizeLanguage } from './deviceGenerator.js';

// API Configuration
export const BASE_URL = 'https://api.gargan.video';
export const H5_BASE_URL = 'https://h5.gargan.video';
export const STATIC_URL = 'https://static.gargan.video';

// App Configuration (from intercepted traffic)
const VERSION_CODE = 218;
const CLIENT_TYPE = 'android_gargan';
const USER_AGENT = 'okhttp/4.12.0';

// Indonesia geo data (for accessing full content)
const INDONESIA_GEO = {
    latitude: '-6.2088',      // Jakarta
    longitude: '106.8456',
    isoCode: 'ID',
    isoName: 'Indonesia',
    reliable: 'true',
    mcc: '510'                // Indonesia MCC
};

// Persistent device context
let deviceContext = null;

/**
 * Get or create device context
 */
function getDeviceContext() {
    if (!deviceContext) {
        // Default to FALSE - sending empty geo headers like APK does without GPS
        // Spoofed geo coordinates may trigger server-side geo-blocking detection
        const useIndonesiaGeo = process.env.USE_INDONESIA_GEO === 'true';

        deviceContext = {
            deviceId: process.env.DEVICE_ID || generateDeviceId(),
            adId: process.env.AD_ID || generateAdId(),
            language: process.env.LANGUAGE || 'in_ID',  // Indonesian by default
            timezone: process.env.TIMEZONE || 'WIB',    // Indonesia timezone
            mcc: process.env.MCC || '310',  // Default 310 from intercepted traffic
            geo: useIndonesiaGeo ? INDONESIA_GEO : null
        };
    }
    return deviceContext;
}

/**
 * Generate X-Request-Source header
 * XOR of sp_play_id_s with deviceId, base64 encoded
 */
function generateRequestSource(deviceId) {
    // This is derived from the APK - XOR of stored ID with device ID
    // For now, generate a simple encoded string
    const playId = process.env.PLAY_ID || crypto.randomBytes(12).toString('base64');
    try {
        const playIdBytes = Buffer.from(playId);
        const deviceIdBytes = Buffer.from(deviceId);
        const result = Buffer.alloc(playIdBytes.length);

        for (let i = 0; i < playIdBytes.length; i++) {
            result[i] = playIdBytes[i] ^ deviceIdBytes[i % deviceIdBytes.length];
        }

        // Base64 URL-safe encoding without padding
        return result.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (e) {
        return null;
    }
}

/**
 * Build headers for API request
 */
function buildHeaders(signature, options = {}) {
    const context = getDeviceContext();

    const headers = {
        'Accept-Encoding': 'gzip',
        'User-Agent': USER_AGENT,
        'Connection': 'Keep-Alive',

        // App headers
        'clientType': CLIENT_TYPE,
        'versionCode': String(VERSION_CODE),
        'deviceId': context.deviceId,
        'adId': context.adId,
        'lang': normalizeLanguage(options.language || context.language),
        'timezone': context.timezone,
        'keke': 'true',

        // Signature headers
        'sign': signature.sign,
        'aesKey': signature.aesKey,
        'usertype': signature.usertype,
        'currentTime': String(signature.time)
    };

    // Add geo headers
    if (context.geo) {
        headers['geoLatitude'] = context.geo.latitude;
        headers['geoLongitude'] = context.geo.longitude;
        headers['geoIsoCode'] = context.geo.isoCode;
        headers['geoIsoName'] = context.geo.isoName;
        headers['geoReliable'] = context.geo.reliable;
    } else {
        headers['geoLatitude'] = '';
        headers['geoLongitude'] = '';
        headers['geoIsoCode'] = '';
        headers['geoIsoName'] = '';
        headers['geoReliable'] = '';
    }

    // Add MCC if available
    if (context.mcc) {
        headers['mcc'] = context.mcc;
    }

    // Add X-Request-Source
    const requestSource = generateRequestSource(context.deviceId);
    if (requestSource) {
        headers['X-Request-Source'] = requestSource;
    }

    return headers;
}

/**
 * Create axios instance
 */
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    responseType: 'json'
});

// Response interceptor
client.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response) {
        console.error('API Error:', {
            status: error.response.status,
            data: error.response.data
        });
    }
    return Promise.reject(error);
});

/**
 * GET request with automatic signature
 */
export async function get(endpoint, params = {}, options = {}) {
    const timestamp = Date.now();
    const signature = generateSignature(params, timestamp);
    const headers = buildHeaders(signature, options);

    return client.get(endpoint, {
        params,
        headers,
        ...options
    });
}

/**
 * POST request with automatic signature
 */
export async function post(endpoint, data = {}, options = {}) {
    const timestamp = Date.now();
    const signature = generateSignatureFromBody(data, timestamp);
    const headers = buildHeaders(signature, options);

    return client.post(endpoint, data, {
        headers,
        ...options
    });
}

/**
 * Get current device context
 */
export function getContext() {
    return getDeviceContext();
}

/**
 * Reset device context
 */
export function resetContext() {
    deviceContext = null;
    return getDeviceContext();
}

/**
 * Set device context manually
 */
export function setContext(ctx) {
    deviceContext = { ...getDeviceContext(), ...ctx };
    return deviceContext;
}

/**
 * Set geo location
 */
export function setGeoLocation(geo) {
    const context = getDeviceContext();
    context.geo = geo;
    if (geo?.mcc) {
        context.mcc = geo.mcc;
    }
    return context;
}

export default {
    get,
    post,
    getContext,
    resetContext,
    setContext,
    setGeoLocation,
    BASE_URL,
    H5_BASE_URL,
    STATIC_URL,
    INDONESIA_GEO
};
