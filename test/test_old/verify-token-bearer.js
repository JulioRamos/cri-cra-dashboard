#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const token = 'pPsJY9YSJ2O8';
const clientId = 'ApCRBHcKCobX';
const endpoint = 'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario';

const url = new URL(endpoint);
const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'client_id': clientId,
    'Accept': 'application/json'
  }
};

console.log('Testando com Authorization Bearer...');
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 300));
    fs.writeFileSync('verify-bearer-result.txt', JSON.stringify({ status: res.statusCode, body: data.substring(0, 300) }, null, 2));
  });
});

req.on('error', err => console.log('Erro:', err.message));
req.setTimeout(10000, () => {
  console.log('Timeout');
  req.destroy();
});
req.end();