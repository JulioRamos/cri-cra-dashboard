#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('../.env', 'utf8');
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const clientSecret = envContent.match(/REACT_APP_ANBIMA_CLIENT_SECRET=(.+)/)?.[1];
const authUrl = envContent.match(/REACT_APP_ANBIMA_AUTH_URL=(.+)/)?.[1];

console.log('🔑 Testando credenciais ORIGINAIS do .env:');
console.log('Client ID:', clientId);
console.log('Client Secret:', clientSecret ? '****' + clientSecret.slice(-4) : '');
console.log('Auth URL:', authUrl);
console.log('');

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const bodyParams = JSON.stringify({ grant_type: 'client_credentials' });
const url = new URL(authUrl);

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(bodyParams)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Resposta:', data);
    try {
      const json = JSON.parse(data);
      if (json.access_token) {
        console.log('\n✅ Token obtido:', json.access_token);
        console.log('Agora testando esse token nos endpoints de dados...\n');
        // Testar o token obtido
        testToken(json.access_token, clientId);
      } else if (json.error) {
        console.log('❌ Erro:', json.error_description || json.error);
      }
    } catch(e) {}
  });
});

req.on('error', err => console.log('Erro:', err.message));
req.write(bodyParams);
req.end();

function testToken(token, clientId) {
  const testUrls = [
    'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario',
    'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/caracteristicas',
    'https://api.anbima.com.br/feed/precos-indices/v1/indices'
  ];
  
  let tested = 0;
  
  testUrls.forEach((endpoint, idx) => {
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
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        tested++;
        console.log(`[${idx+1}/${testUrls.length}] ${endpoint.split('/').pop()}`);
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('   ✅ SUCESSO!');
        } else {
          console.log('   ❌ Falhou');
        }
        console.log('');
        
        if (tested === testUrls.length) {
          console.log('Teste concluído.');
        }
      });
    });
    
    req.on('error', err => {
      tested++;
      console.log(`[${idx+1}/${testUrls.length}] Erro:`, err.message);
    });
    
    req.setTimeout(10000, () => req.destroy());
    req.end();
  });
}