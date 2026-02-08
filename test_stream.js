/**
 * Test video streaming endpoint with various content IDs
 */

import axios from 'axios';
import crypto from 'crypto';
import forge from 'node-forge';

const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCQZSK95u6frUySB1bNwfh8B69R
G0pJtVP7W0S37xqzTPhPKABdPfP/yKUiLaJSXaKfgnpHki7gTaxNiVjQsPSxNpSb
Bd7m0K2dv8UkwFxJQWWWTx6XbD7hlBiFEH17PAtdYhuFTqd8FhZmUPKcFFqu/oFL
ouiXIpJmJgfiQNzoLQIDAQAB
-----END PUBLIC KEY-----`;

function generateSignature(params, timestamp) {
    const sortedKeys = Object.keys(params).sort();
    const values = sortedKeys.map(k => String(params[k]));
    const strToSign = values.join('') + timestamp;

    let encoded = encodeURIComponent(strToSign);
    encoded = encoded.replace(/\+/g, '%20').replace(/'/g, '%27').replace(/%21/g, '!')
        .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/~/g, '%7E');

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let aesKeyOrigin = '';
    for (let i = 0; i < 16; i++) {
        aesKeyOrigin += chars[Math.floor(Math.random() * chars.length)];
    }

    const publicKey = forge.pki.publicKeyFromPem(RSA_PUBLIC_KEY);
    const aesKey = forge.util.encode64(publicKey.encrypt(aesKeyOrigin, 'RSAES-PKCS1-V1_5'));
    const usertype = crypto.createHash('sha256').update(aesKeyOrigin).digest('hex');

    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(aesKeyOrigin), null);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(encoded, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const sign = crypto.createHash('md5').update(encrypted.toString('base64').trim()).digest('hex').toLowerCase();

    return { sign, aesKey, usertype, time: timestamp };
}

function buildHeaders(signature) {
    const deviceId = crypto.randomBytes(8).toString('hex');
    return {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'okhttp/4.12.0',
        'Connection': 'Keep-Alive',
        'clientType': 'android_gargan',
        'versionCode': '218',
        'deviceId': deviceId,
        'adId': crypto.randomUUID(),
        'lang': 'en',
        'timezone': 'UTC',
        'keke': 'true',
        'geoLatitude': '',
        'geoLongitude': '',
        'geoIsoCode': '',
        'geoIsoName': '',
        'geoReliable': '',
        'sign': signature.sign,
        'aesKey': signature.aesKey,
        'usertype': signature.usertype,
        'currentTime': String(signature.time)
    };
}

async function testPlayInfo(contentId, episodeId = null) {
    const timestamp = Date.now();

    const params = {
        category: 0,
        contentId: contentId,
        definition: 'GROOT_LD',
        projection: false,
        adComplete: false,
        advanced: false,
        tryCode: 0,
        reliableDef: 0
    };

    if (episodeId) {
        params.episodeId = episodeId;
    }

    const signature = generateSignature(params, timestamp);
    const headers = buildHeaders(signature);

    try {
        const response = await axios.get('https://api.gargan.video/gargan/media/playInfo', {
            params,
            headers
        });

        console.log(`\n=== Content ID: ${contentId} ===`);
        console.log('Status:', response.status);

        const data = response.data;
        if (data.code === '00000' && data.data) {
            if (data.data.playUrl) {
                console.log('✅ VIDEO URL FOUND!');
                console.log('Play URL:', data.data.playUrl.substring(0, 100) + '...');
                return data.data;
            } else if (data.data.msg) {
                console.log('⚠️', data.data.msg);
            } else {
                console.log('Data:', JSON.stringify(data.data).substring(0, 200));
            }
        } else {
            console.log('Response:', JSON.stringify(data).substring(0, 200));
        }
    } catch (error) {
        console.log(`\n=== Content ID: ${contentId} ===`);
        console.log('❌ Error:', error.response?.status, error.response?.data?.msg || error.message);
    }
}

async function testPreviewInfo(contentId) {
    const timestamp = Date.now();

    const params = {
        category: 0,
        contentId: contentId,
        definition: 'GROOT_LD',
        projection: false,
        adComplete: false,
        advanced: false,
        tryCode: 0,
        reliableDef: 0
    };

    const signature = generateSignature(params, timestamp);
    const headers = buildHeaders(signature);

    try {
        const response = await axios.get('https://api.gargan.video/gargan/media/previewInfo', {
            params,
            headers
        });

        console.log(`\n=== Preview - Content ID: ${contentId} ===`);
        const data = response.data;
        if (data.code === '00000' && data.data) {
            if (data.data.playUrl || data.data.previewUrl) {
                console.log('✅ PREVIEW URL FOUND!');
                console.log('URL:', (data.data.playUrl || data.data.previewUrl).substring(0, 100) + '...');
                return data.data;
            } else {
                console.log('Data keys:', Object.keys(data.data));
                console.log('Data:', JSON.stringify(data.data).substring(0, 300));
            }
        }
    } catch (error) {
        console.log('Preview error:', error.response?.status);
    }
}

// Test with various content IDs
async function main() {
    console.log('Testing video stream endpoints...\n');

    // Test content IDs (from intercept and common patterns)
    const contentIds = [27466, 1, 100, 1000, 10000, 20000, 25000, 26000];

    for (const id of contentIds) {
        await testPlayInfo(id);
        await testPreviewInfo(id);
    }
}

main();
