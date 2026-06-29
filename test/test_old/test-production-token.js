#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const token = envContent.match(/REACT_APP_ANBIMA_ACCESS_TOKEN=(.+)/)?.[1];
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const apiUrl = 'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario';

console.log('🔐 Testando token de produção na API...\n');
console.log('Token:', token);
console.log('Client ID:', clientId);
console.log('Endpoint:', apiUrl);
console.log('');

const url = new URL(apiUrl);
const body = JSON.stringify({ test: true });

// Teste 1: Com access_token header + client_id
const req1 = https.get(url, {
  headers: {
    'access_token': token,
    'client_id': clientId,
    'Accept': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Test 1 - Header access_token:');
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 200));
    console.log('');
    
    if (res.statusCode === 200) {
      console.log('✅ Token de produção VÁLIDO!');
      fs.writeFileSync('test-result.txt', 'SUCCESS');
    } else {
      console.log('❌ Falhou com status:', res.statusCode);
      fs.writeFileSync('test-result.txt', 'FAILED: ' + res.statusCode);
    }
  });
});

req1.on('error', (err) => {
  console.log('❌ Erro:', err.message);
  fs.writeFileSync('test-result.txt', 'ERROR: ' + err.message);
});

req1.setTimeout(10000, () => {
  console.log('⏰ Timeout');
  req1.destroy();
  fs.writeFileSync('test-result.txt', 'TIMEOUT');
});