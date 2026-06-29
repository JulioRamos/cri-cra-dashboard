#!/usr/bin/env node

const https = require('https');

const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const token = 'DVQ33L5ToNIs';
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1] || 'ApCRBHcKCobX';
const apiUrl = 'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario';

console.log('🔐 Testando token ativo na API ANBIMA...\n');
console.log('Token:', token);
console.log('Client ID:', clientId);
console.log('Endpoint:', apiUrl);
console.log('');

const url = new URL(apiUrl);

const req = https.get(url, {
  headers: {
    'access_token': token,
    'Accept': 'application/json',
    'client_id': clientId
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status HTTP:', res.statusCode);
    console.log('\nResposta:');
    
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ Token VÁLIDO e FUNCIONANDO!');
      } else {
        console.log('\n❌ Falhou! Status:', res.statusCode);
        console.log('   Erro:', data.substring(0, 200));
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Erro:', err.message);
});

req.setTimeout(10000, () => {
  console.log('⏰ Timeout');
  req.destroy();
});