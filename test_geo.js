/**
 * Test dengan geo headers Indonesia lengkap
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

async function testWithIndonesiaGeo() {
    const timestamp = Date.now();
    const deviceId = crypto.randomBytes(8).toString('hex');

    const params = {
        page: 1,
        size: 20,
        navigationId: 0
    };

    const signature = generateSignature(params, timestamp);

    // Full Indonesia geo headers
    const headers = {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'okhttp/4.12.0',
        'Connection': 'Keep-Alive',
        'clientType': 'android_gargan',
        'versionCode': '218',
        'deviceId': deviceId,
        'adId': crypto.randomUUID(),
        'lang': 'in_ID',           // Indonesian
        'timezone': 'WIB',         // Indonesia timezone
        'keke': 'true',
        'mcc': '510',              // Indonesia MCC
        'geoLatitude': '-6.2088',  // Jakarta latitude
        'geoLongitude': '106.8456', // Jakarta longitude
        'geoIsoCode': 'ID',
        'geoIsoName': 'Indonesia',
        'geoReliable': 'true',
        'sign': signature.sign,
        'aesKey': signature.aesKey,
        'usertype': signature.usertype,
        'currentTime': String(signature.time)
    };

    console.log('Testing with Indonesia geo headers...\n');
    console.log('Headers:', JSON.stringify({
        lang: headers.lang,
        timezone: headers.timezone,
        mcc: headers.mcc,
        geoIsoCode: headers.geoIsoCode,
        geoLatitude: headers.geoLatitude
    }, null, 2));

    try {
        const response = await axios.get('https://api.gargan.video/gargan/homePage/getHome', {
            params,
            headers
        });

        console.log('\n=== Home Response ===');
        console.log('Status:', response.status);

        const data = response.data;
        if (data.code === '00000') {
            const homeData = data.data;
            console.log('\nPage:', homeData.page);
            console.log('Recommend Items Count:', homeData.recommendItems?.length || 0);
            console.log('Search Keywords:', homeData.searchNewKeyWords?.length || 0);

            if (homeData.recommendItems && homeData.recommendItems.length > 0) {
                console.log('\n=== Sample Content ===');
                for (let i = 0; i < Math.min(3, homeData.recommendItems.length); i++) {
                    const item = homeData.recommendItems[i];
                    console.log(`\n${i + 1}. ${item.title || item.name || 'Unknown'}`);
                    console.log('   ID:', item.id || item.contentId);
                    console.log('   Category:', item.category);
                }
            } else {
                console.log('\nNo recommend items found');
            }
        } else {
            console.log('Response:', JSON.stringify(data).substring(0, 500));
        }

    } catch (error) {
        console.log('Error:', error.response?.status, error.response?.data);
    }

    // Also test navigation
    console.log('\n\n=== Testing Navigation ===');
    const navParams = {};
    const navSig = generateSignature(navParams, Date.now());

    const navHeaders = { ...headers, sign: navSig.sign, currentTime: String(navSig.time) };

    try {
        const navResponse = await axios.get('https://api.gargan.video/gargan/homePage/navigationBar', {
            params: navParams,
            headers: navHeaders
        });

        if (navResponse.data.code === '00000') {
            const navItems = navResponse.data.data.navigationBarItemList || [];
            console.log('Navigation items:', navItems.map(n => n.name).join(', '));
        }
    } catch (e) {
        console.log('Nav error:', e.message);
    }
}

testWithIndonesiaGeo();
