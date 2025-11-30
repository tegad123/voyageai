#!/usr/bin/env node

/**
 * Generate Apple Sign In JWT for Supabase
 * Run: node generate-apple-jwt.js
 */

const fs = require('fs');
const crypto = require('crypto');

// Your Apple credentials
const TEAM_ID = 'RX4AK5B292';
const KEY_ID = '2A478SPWD2';
const CLIENT_ID = 'com.jmotech.voyageai.signin'; // Your Services ID
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgOgqdOUBjKoCm2ejh
N1RtNBNPBdtAMP7fjMW3/Em9uBSgCgYIKoZIzj0DAQehRANCAATQoIOq8ZIqXxBL
ujB4GIrb1lNXkLuIOz0JRNLRqSPlWQkCgHHF3fwpp4I8kPxLyPH0EqW7BwJzQ1en
ftwtafA6
-----END PRIVATE KEY-----`;

function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  
  // JWT Header
  const header = {
    alg: 'ES256',
    kid: KEY_ID
  };
  
  // JWT Payload
  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: now + 15777000, // 6 months
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID
  };
  
  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const sign = crypto.createSign('SHA256');
  sign.update(signatureInput);
  sign.end();
  
  const signature = sign.sign(PRIVATE_KEY, 'base64');
  const encodedSignature = base64UrlEncode(Buffer.from(signature, 'base64'));
  
  // Combine to create JWT
  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  
  return jwt;
}

function base64UrlEncode(str) {
  const base64 = Buffer.isBuffer(str) 
    ? str.toString('base64')
    : Buffer.from(str).toString('base64');
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate and display JWT
console.log('\n=== Apple Sign In JWT for Supabase ===\n');
const jwt = generateJWT();
console.log(jwt);
console.log('\n=== Instructions ===');
console.log('1. Copy the JWT token above (the long string)');
console.log('2. Go to Supabase → Authentication → Providers → Apple');
console.log('3. Paste it into the "Secret Key (JWT)" field');
console.log('4. Click Save\n');

