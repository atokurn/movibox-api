/**
 * ========================================
 * MovieBox HD (Gargan) API - Device Generator  
 * ========================================
 * 
 * Generates device identifiers for API requests.
 * Based on intercepted traffic analysis.
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a device ID (16 hex characters like real app)
 * Example from intercepted: 6e4e81ec362f7630
 * @returns {string} - Device ID
 */
export function generateDeviceId() {
    return crypto.randomBytes(8).toString('hex');
}

/**
 * Generate advertising ID (UUID format)
 * Example: 4071e87a-08cc-4ee3-9922-0577f83c73b2
 * @returns {string} - Ad ID
 */
export function generateAdId() {
    return uuidv4();
}

/**
 * Get timezone string (like WIB, PST, etc)
 * @returns {string} - Timezone abbreviation
 */
export function getTimezoneString() {
    // Get timezone abbreviation
    const date = new Date();
    const tzString = date.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ').pop();
    return tzString || 'UTC';
}

/**
 * Get timezone offset in hours
 * @returns {number} - Timezone offset
 */
export function getTimezoneOffset() {
    return -Math.floor(new Date().getTimezoneOffset() / 60);
}

/**
 * Get supported languages
 * @returns {Array} - Array of language codes
 */
export function getSupportedLanguages() {
    return [
        'en',      // English
        'zh_CN',   // Chinese Simplified
        'zh_TW',   // Chinese Traditional  
        'in_ID',   // Indonesian
        'th',      // Thai
        'vi',      // Vietnamese
        'ms',      // Malay
        'ar',      // Arabic
        'es',      // Spanish
        'fr',      // French
        'pt',      // Portuguese
        'ru'       // Russian
    ];
}

/**
 * Validate and normalize language code
 * @param {string} lang - Language code
 * @returns {string} - Normalized language code
 */
export function normalizeLanguage(lang) {
    if (!lang) return 'en';

    const langLower = lang.toLowerCase();

    // Handle special cases (based on intercepted: in_ID)
    if (langLower === 'id' || langLower === 'in' || langLower === 'id_id') return 'in_ID';
    if (langLower === 'zh' || langLower === 'zh-cn' || langLower === 'zh_cn') return 'zh_CN';
    if (langLower === 'zh-tw' || langLower === 'zh_tw') return 'zh_TW';

    // Check if supported
    const supported = getSupportedLanguages();
    for (const s of supported) {
        if (s.toLowerCase() === langLower) return s;
    }

    // Default
    return 'en';
}

export default {
    generateDeviceId,
    generateAdId,
    getTimezoneString,
    getTimezoneOffset,
    getSupportedLanguages,
    normalizeLanguage
};
