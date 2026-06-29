#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const clientSecret = envContent.match(/REACT_APP_ANBIMA_CLIENT_SECRET=(.+)/)?.[1];
const authUrl = envContent.match(/REACT_APP_ANBIMA_AUTH_URL=(.+)/)?.[1];
const sandboxAuthUrl = envContent.match(/REACT_APP_ANBIMA_AUTH_URL_SANDBOX=(.+)/)?.[1];

if (!clientId || !clientSecret) {
  console.log('❌ Client ID ou Secret não encontrados no .env');
  process.exit(1);
}

console.log('\n🔑 OBTENDO TOKEN DE PRODUÇÃO VIA OAUTH\n');
console.log('Client ID:', clientId);
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

console.log('⏳ Solicitando token...\n');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status HTTP:', res.statusCode);
    console.log('\nResposta:', data);
    console.log('');

    try {
      const json = JSON.parse(data);
      if (json.access_token) {
        console.log('✅ TOKEN OBTIDO!');
        console.log('Token:', json.access_token);
        console.log('Expira em:', json.expires_in, 's');
        console.log('\nCopie esse token para REACT_APP_ANBIMA_ACCESS_TOKEN no .env');
      } else if (json.error) {
        console.log('❌ Erro:', json.error_description || json.error);
      }
    } catch (e) {
      console.log('❌ Resposta inválida');
    }
  });
});

req.on('error', err => console.log('❌ Erro:', err.message));
req.write(bodyParams);
req.end();
