/**
 * ========================================
 * MovieBox HD (Gargan) API - HTTP Client
 * ========================================
 * 
 * Configured axios client with proper headers for Gargan API.
 * Based on intercepted traffic from actual app.
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

// Persistent device context
let deviceContext = null;

/**
 * Get or create device context
 */
function getDeviceContext() {
    if (!deviceContext) {
        deviceContext = {
            deviceId: process.env.DEVICE_ID || generateDeviceId(),
            adId: process.env.AD_ID || generateAdId(),
            language: process.env.LANGUAGE || 'en',
            timezone: process.env.TIMEZONE || getTimezoneString(),
            mcc: process.env.MCC || ''
        };
    }
    return deviceContext;
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

        // Geo headers (empty when not available)
        'geoLatitude': '',
        'geoLongitude': '',
        'geoIsoCode': '',
        'geoIsoName': '',
        'geoReliable': '',

        // Signature headers
        'sign': signature.sign,
        'aesKey': signature.aesKey,
        'usertype': signature.usertype,
        'currentTime': String(signature.time)
    };

    if (context.mcc) {
        headers['mcc'] = context.mcc;
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

export default {
    get,
    post,
    getContext,
    resetContext,
    setContext,
    BASE_URL,
    H5_BASE_URL,
    STATIC_URL
};
