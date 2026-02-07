/**
 * ========================================
 * MovieBox HD (Gargan) API - Signature Generator
 * ========================================
 * 
 * Generates required signature headers for Gargan API requests.
 * Based on decompiled APK + intercepted traffic analysis.
 * 
 * Key Headers:
 * - sign: MD5 of AES-encrypted params (32 hex lowercase)
 * - aesKey: RSA-encrypted AES key (base64)
 * - usertype: SHA256 hash of AES key origin (64 hex lowercase)
 * - currentTime: Timestamp in milliseconds
 * 
 * IMPORTANT: Query parameter names must be sorted alphabetically!
 */

import crypto from 'crypto';
import forge from 'node-forge';

// RSA Public Key for encrypting AES key (from decompiled APK)
const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCQZSK95u6frUySB1bNwfh8B69R
G0pJtVP7W0S37xqzTPhPKABdPfP/yKUiLaJSXaKfgnpHki7gTaxNiVjQsPSxNpSb
Bd7m0K2dv8UkwFxJQWWWTx6XbD7hlBiFEH17PAtdYhuFTqd8FhZmUPKcFFqu/oFL
ouiXIpJmJgfiQNzoLQIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Generate random 16-character AES key
 * Characters: 0-9, A-Z, a-z
 */
function generateAesKey() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let key = '';
    for (let i = 0; i < 16; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
}

/**
 * RSA encrypt the AES key using public key
 * RSA/ECB/PKCS1Padding
 */
function rsaEncrypt(plaintext) {
    try {
        const publicKey = forge.pki.publicKeyFromPem(RSA_PUBLIC_KEY);
        const encrypted = publicKey.encrypt(plaintext, 'RSAES-PKCS1-V1_5');
        return forge.util.encode64(encrypted);
    } catch (error) {
        console.error('RSA encryption error:', error);
        return null;
    }
}

/**
 * MD5 hash of string (returns 32 hex lowercase)
 */
function md5(str) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toLowerCase();
}

/**
 * SHA256 hash of string (returns 64 hex lowercase)
 * Used for usertype header
 */
function sha256(str) {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex').toLowerCase();
}

/**
 * URL encode with special character handling (same as APK)
 */
function specialUrlEncode(str) {
    let encoded = encodeURIComponent(str);
    encoded = encoded.replace(/\+/g, '%20');
    encoded = encoded.replace(/'/g, '%27');
    encoded = encoded.replace(/%21/g, '!');
    encoded = encoded.replace(/\(/g, '%28');
    encoded = encoded.replace(/\)/g, '%29');
    encoded = encoded.replace(/\r/g, '%0D');
    encoded = encoded.replace(/\n/g, '%0A');
    encoded = encoded.replace(/~/g, '%7E');
    return encoded;
}

/**
 * Generate signature from request params
 * 
 * IMPORTANT: For GET requests, params object keys must be sorted alphabetically
 * before extracting values!
 * 
 * @param {Object} params - Query parameters (keys will be sorted)
 * @param {number} timestamp - Request timestamp
 * @returns {Object} - { sign, aesKey, aesKeyOrigin, usertype, time }
 */
export function generateSignature(params = {}, timestamp = Date.now()) {
    try {
        // Sort parameter names alphabetically and get values
        const sortedKeys = Object.keys(params).sort();
        const values = sortedKeys.map(k => String(params[k]));

        // String to sign: concatenate values + timestamp
        const strToSign = values.join('') + timestamp;

        // URL encode
        const encodedStr = specialUrlEncode(strToSign);

        // Generate AES key
        const aesKeyOrigin = generateAesKey();

        // RSA encrypt AES key for aesKey header
        const aesKey = rsaEncrypt(aesKeyOrigin);

        // SHA256 of AES key for usertype header
        const usertype = sha256(aesKeyOrigin);

        // AES/ECB encrypt the encoded string
        const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(aesKeyOrigin, 'utf8'), null);
        cipher.setAutoPadding(true);
        let encrypted = cipher.update(encodedStr, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Base64 encode
        const base64Encrypted = encrypted.toString('base64');

        // MD5 hash → lowercase = sign
        const sign = md5(base64Encrypted.trim());

        return {
            sign,
            aesKey,
            aesKeyOrigin,
            usertype,
            time: timestamp
        };
    } catch (error) {
        console.error('Signature generation error:', error);
        throw error;
    }
}

/**
 * Generate signature from POST body (JSON)
 * Values are extracted recursively and alphabetically
 * 
 * @param {Object} body - POST body object
 * @param {number} timestamp - Request timestamp
 * @returns {Object} - { sign, aesKey, aesKeyOrigin, usertype, time }
 */
export function generateSignatureFromBody(body = {}, timestamp = Date.now()) {
    try {
        // Extract all values from body recursively
        const values = [];
        extractValues(body, values);

        // String to sign: concatenate values + timestamp
        const strToSign = values.join('') + timestamp;

        // URL encode
        const encodedStr = specialUrlEncode(strToSign);

        // Generate AES key
        const aesKeyOrigin = generateAesKey();

        // RSA encrypt AES key
        const aesKey = rsaEncrypt(aesKeyOrigin);

        // SHA256 of AES key for usertype
        const usertype = sha256(aesKeyOrigin);

        // AES/ECB encrypt
        const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(aesKeyOrigin, 'utf8'), null);
        cipher.setAutoPadding(true);
        let encrypted = cipher.update(encodedStr, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const base64Encrypted = encrypted.toString('base64');
        const sign = md5(base64Encrypted.trim());

        return {
            sign,
            aesKey,
            aesKeyOrigin,
            usertype,
            time: timestamp
        };
    } catch (error) {
        console.error('Signature generation error:', error);
        throw error;
    }
}

/**
 * Extract all primitive values from object recursively
 * Keys are sorted alphabetically at each level
 */
function extractValues(obj, values) {
    if (obj === null || obj === undefined) return;

    if (Array.isArray(obj)) {
        for (const item of obj) {
            extractValues(item, values);
        }
    } else if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            extractValues(obj[key], values);
        }
    } else {
        values.push(String(obj));
    }
}

export default {
    generateSignature,
    generateSignatureFromBody,
    generateAesKey,
    rsaEncrypt,
    md5,
    sha256
};
