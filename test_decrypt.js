/**
 * Test with response decryption
 * Server returns encrypted data when ecy:1 header is present
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

// Play URL key from /version endpoint
const PLAY_URL_KEY = 'dlwsih6ut350l3j5ivee9ilvnupdhbjf';

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

function buildHeaders(signature, deviceId) {
    return {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'okhttp/4.12.0',
        'Connection': 'Keep-Alive',
        'clientType': 'android_gargan',
        'versionCode': '218',
        'deviceId': deviceId,
        'adId': crypto.randomUUID(),
        'lang': 'en',
        'timezone': 'WIB',
        'keke': 'true',
        'mcc': '510',
        'geoLatitude': '-6.2088',
        'geoLongitude': '106.8456',
        'geoIsoCode': 'ID',
        'geoIsoName': 'Indonesia',
        'geoReliable': 'true',
        'sign': signature.sign,
        'aesKey': signature.aesKey,
        'usertype': signature.usertype,
        'currentTime': String(signature.time)
    };
}

/**
 * Decrypt response data when ecy:1 header is present
 */
function decryptResponse(encryptedData, key) {
    try {
        // Key is base64 decoded
        const keyBuffer = Buffer.from(key, 'base64');
        const dataBuffer = Buffer.from(encryptedData, 'base64');

        const decipher = crypto.createDecipheriv('aes-128-ecb', keyBuffer, null);
        decipher.setAutoPadding(true);

        let decrypted = decipher.update(dataBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        console.log('Decryption error:', error.message);
        return null;
    }
}

async function testWithDecryption() {
    const timestamp = Date.now();
    const deviceId = crypto.randomBytes(8).toString('hex');

    // First get the version to confirm key
    console.log('=== Getting Version Config ===\n');

    const versionParams = {};
    const versionSig = generateSignature(versionParams, timestamp);
    const headers = buildHeaders(versionSig, deviceId);

    try {
        const versionResponse = await axios.get('https://api.gargan.video/gargan/config/version/info/get', {
            params: versionParams,
            headers
        });

        if (versionResponse.data.code === '00000') {
            const config = versionResponse.data.data.configInfo;
            console.log('Play URL Key:', config?.play_url_key);
            console.log('Check Secret:', config?.check_secret);
            console.log('Channel Signature:', config?.chanel_signature);
            console.log('ecy header:', versionResponse.headers['ecy']);
        }
    } catch (e) {
        console.log('Version error:', e.message);
    }

    // Now test playInfo
    console.log('\n=== Testing Play Info ===\n');

    const playParams = {
        category: 0,
        contentId: 27466,
        definition: 'GROOT_LD',
        projection: false,
        adComplete: false,
        advanced: false,
        tryCode: 0,
        reliableDef: 0
    };

    const playSig = generateSignature(playParams, Date.now());
    const playHeaders = buildHeaders(playSig, deviceId);

    try {
        const playResponse = await axios.get('https://api.gargan.video/gargan/media/playInfo', {
            params: playParams,
            headers: playHeaders
        });

        console.log('Status:', playResponse.status);
        console.log('ecy header:', playResponse.headers['ecy']);
        console.log('lc header:', playResponse.headers['lc']);

        const data = playResponse.data;
        console.log('\nResponse code:', data.code);

        if (data.code === '00000' && data.data) {
            // Check if data is encrypted string
            if (typeof data.data === 'string') {
                console.log('Data appears encrypted, attempting decryption...');
                const decrypted = decryptResponse(data.data, PLAY_URL_KEY);
                if (decrypted) {
                    console.log('\n=== Decrypted Data ===');
                    console.log(decrypted.substring(0, 500));
                }
            } else if (data.data.playUrl) {
                console.log('\n✅ Play URL found!');
                console.log('URL:', data.data.playUrl.substring(0, 100));
            } else {
                console.log('Data:', JSON.stringify(data.data).substring(0, 300));
            }
        } else {
            console.log('Data:', JSON.stringify(data).substring(0, 300));
        }

    } catch (e) {
        console.log('Play error:', e.response?.status, e.response?.data);
    }
}

testWithDecryption();
