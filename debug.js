/**
 * Debug script to test signature generation
 */

import { generateSignature } from './src/lib/signatureGenerator.js';
import crypto from 'crypto';

console.log('=== Testing Signature Generation ===\n');

// Test 1: Empty params (home page request)
const timestamp = Date.now();
const sig = generateSignature([], timestamp);

console.log('Generated Signature:');
console.log('  sign:', sig.sign);
console.log('  aesKey (first 50 chars):', sig.aesKey?.substring(0, 50) + '...');
console.log('  aesKeyOrigin:', sig.aesKeyOrigin);
console.log('  usertype:', sig.usertype);
console.log('  time:', sig.time);

// Verify usertype is SHA256 of aesKeyOrigin
const expectedUsertype = crypto.createHash('sha256').update(sig.aesKeyOrigin, 'utf8').digest('hex');
console.log('\n  Expected usertype (SHA256):', expectedUsertype);
console.log('  Usertype matches:', sig.usertype === expectedUsertype);

// Test with query params like intercepted request
console.log('\n--- Testing with query params ---');
const params = {
    category: 0,
    contentId: 27466,
    definition: 'GROOT_LD',
    projection: false,
    adComplete: false,
    advanced: false,
    tryCode: 0,
    reliableDef: 0
};

const values = Object.values(params).map(v => String(v));
console.log('Values to sign:', values);

const strToSign = values.join('') + timestamp;
console.log('String to sign:', strToSign);

// URL encode  
const encoded = encodeURIComponent(strToSign)
    .replace(/\+/g, '%20')
    .replace(/'/g, '%27')
    .replace(/%21/g, '!')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
console.log('URL encoded:', encoded);

const sig2 = generateSignature(values, timestamp);
console.log('\nSignature with params:');
console.log('  sign:', sig2.sign);
console.log('  aesKeyOrigin:', sig2.aesKeyOrigin);
