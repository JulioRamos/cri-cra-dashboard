#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const token = envContent.match(/REACT_APP_ANBIMA_ACCESS_TOKEN=(.+)/)?.[1];
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const endpoint = envContent.match(/REACT_APP_ANBIMA_SEC_MARKET=(.+)/)?.[1];

console.log('\n🔐 Testando token + CLIENT_ID no header (formato API ANBIMA)\n');
console.log('Token:', token);
console.log('Client ID:', clientId);
console.log('Endpoint:', endpoint);
console.log('');

const url = new URL(endpoint);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'client_id': clientId || 'ApCRBHcKCobX',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status HTTP:', res.statusCode);
    console.log('\nResposta:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ SUCESSO com header client_id!');
    } else if (res.statusCode === 401) {
      console.log('\n❌ Ainda 401 mesmo com client_id no header.');
      console.log('Provavelmente o token não é um OAuth Bearer válido.');
    }
  });
});

req.on('error', err => console.log('Erro:', err.message));
req.end();