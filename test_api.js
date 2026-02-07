/**
 * Test with query params properly sorted and included in sign
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

async function testApi() {
    const deviceId = crypto.randomBytes(8).toString('hex');
    const adId = crypto.randomUUID();
    const timestamp = Date.now();

    // Query params for home request
    const params = {
        page: 1,
        size: 10,
        navigationId: 0
    };

    // Sort parameter names alphabetically and get values
    const sortedKeys = Object.keys(params).sort();
    const values = sortedKeys.map(k => String(params[k]));

    console.log('Sorted keys:', sortedKeys);
    console.log('Values:', values);

    // Generate 16-char AES key
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let aesKeyOrigin = '';
    for (let i = 0; i < 16; i++) {
        aesKeyOrigin += chars[Math.floor(Math.random() * chars.length)];
    }
    console.log('AES Key Origin:', aesKeyOrigin);

    // RSA encrypt AES key
    const publicKey = forge.pki.publicKeyFromPem(RSA_PUBLIC_KEY);
    const encrypted = publicKey.encrypt(aesKeyOrigin, 'RSAES-PKCS1-V1_5');
    const aesKey = forge.util.encode64(encrypted);

    // SHA256 of AES key for usertype
    const usertype = crypto.createHash('sha256').update(aesKeyOrigin).digest('hex');

    // String to sign: concatenate values + timestamp
    const strToSign = values.join('') + timestamp;
    console.log('String to sign:', strToSign);

    // URL encode (same as APK's OooO0Oo function)
    let encoded = encodeURIComponent(strToSign);
    encoded = encoded.replace(/\+/g, '%20');
    encoded = encoded.replace(/'/g, '%27');
    encoded = encoded.replace(/%21/g, '!');
    encoded = encoded.replace(/\(/g, '%28');
    encoded = encoded.replace(/\)/g, '%29');
    encoded = encoded.replace(/\r/g, '%0D');
    encoded = encoded.replace(/\n/g, '%0A');
    encoded = encoded.replace(/~/g, '%7E');
    console.log('URL encoded:', encoded);

    // AES encrypt using ECB mode
    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(aesKeyOrigin), null);
    cipher.setAutoPadding(true);
    let encryptedData = cipher.update(encoded, 'utf8');
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    const base64 = encryptedData.toString('base64');
    console.log('AES encrypted (base64):', base64);

    // MD5 of base64 (trimmed, lowercase)
    const sign = crypto.createHash('md5').update(base64.trim()).digest('hex').toLowerCase();
    console.log('Sign (MD5):', sign);

    // Build headers
    const headers = {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'okhttp/4.12.0',
        'Connection': 'Keep-Alive',
        'clientType': 'android_gargan',
        'versionCode': '218',
        'deviceId': deviceId,
        'adId': adId,
        'lang': 'en',
        'timezone': 'UTC',
        'keke': 'true',
        'geoLatitude': '',
        'geoLongitude': '',
        'geoIsoCode': '',
        'geoIsoName': '',
        'geoReliable': '',
        'sign': sign,
        'aesKey': aesKey,
        'usertype': usertype,
        'currentTime': String(timestamp)
    };

    console.log('\n=== Making Request ===');
    console.log('URL: https://api.gargan.video/gargan/homePage/getHome');
    console.log('Params:', params);

    try {
        const response = await axios.get('https://api.gargan.video/gargan/homePage/getHome', {
            params,
            headers
        });

        console.log('\n✅ Success!');
        console.log('Status:', response.status);
        console.log('Data preview:', JSON.stringify(response.data).substring(0, 500));
    } catch (error) {
        console.log('\n❌ Error:', error.response?.status);
        console.log('Error data:', error.response?.data);
    }
}

testApi();
