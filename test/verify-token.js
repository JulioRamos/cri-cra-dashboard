#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const token = 'DVQ33L5ToNIs';
const clientId = '6fd3QWzwKRUe';
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

console.log('Testando endpoint ANBIMA com token de produção...');
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('verify-token-result.txt', JSON.stringify({ status: res.statusCode, body: data.substring(0, 200) }, null, 2));
  });
});

req.on('error', err => {
  fs.writeFileSync('verify-token-result.txt', JSON.stringify({ error: err.message }, null, 2));
});
req.setTimeout(10000, () => {
  req.destroy();
  fs.writeFileSync('verify-token-result.txt', JSON.stringify({ status: 'timeout' }, null, 2));
});
req.end();