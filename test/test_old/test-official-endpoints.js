#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const clientSecret = envContent.match(/REACT_APP_ANBIMA_CLIENT_SECRET=(.+)/)?.[1];
const authUrl = envContent.match(/REACT_APP_ANBIMA_AUTH_URL=(.+)/)?.[1];

console.log('🔍 Testando endpoints oficiais ANBIMA\n');
console.log('Client ID:', clientId);
console.log('Auth URL:', authUrl);
console.log('');

// Primeiro obter token
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const bodyParams = JSON.stringify({ grant_type: 'client_credentials' });
const url = new URL(authUrl);

const req = https.request({
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(bodyParams)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.access_token) {
        console.log('✅ Token obtido:', json.access_token);
        testEndpoints(json.access_token, clientId);
      } else {
        console.log('❌ Erro ao obter token:', json);
      }
    } catch(e) {}
  });
});

req.on('error', err => console.log('Erro:', err.message));
req.write(bodyParams);
req.end();

function testEndpoints(token, clientId) {
  // Endpoints da documentação oficial
  const endpoints = [
    { name: 'Indicadores CRI', url: 'https://api.anbima.com.br/feed/precos-indices/v1/indices' },
    { name: 'Mercado Secundário', url: 'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario' },
    { name: 'Características', url: 'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/caracteristicas' }
  ];
  
  let completed = 0;
  
  endpoints.forEach((ep, idx) => {
    const url = new URL(ep.url);
    https.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'client_id': clientId,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        completed++;
        console.log(`\n[${idx+1}/${endpoints.length}] ${ep.name}`);
        console.log(`URL: ${ep.url}`);
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ SUCESSO!');
          try {
            const json = JSON.parse(data);
            console.log('Response sample:', JSON.stringify(json).substring(0, 150));
          } catch(e) {}
        } else {
          console.log('❌ Falhou');
          console.log('Body:', data.substring(0, 150));
        }
        
        if (completed === endpoints.length) {
          console.log('\n\nTeste concluído.');
          fs.writeFileSync('endpoints-test-result.txt', JSON.stringify({ tested: endpoints.length, completed }, null, 2));
        }
      });
    }).on('error', err => {
      completed++;
      console.log(`\n[${idx+1}/${endpoints.length}] ${ep.name}`);
      console.log('Erro:', err.message);
      
      if (completed === endpoints.length) {
        console.log('\n\nTeste concluído com erros.');
      }
    });
  });
}