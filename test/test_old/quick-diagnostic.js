#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

console.log('🔍 Diagnóstico Rápido\n' + '='.repeat(60) + '\n');

// Load credentials
const envContent = fs.readFileSync('.env', 'utf8');
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const clientSecret = envContent.match(/REACT_APP_ANBIMA_CLIENT_SECRET=(.+)/)?.[1];
const authUrl = envContent.match(/REACT_APP_ANBIMA_AUTH_URL=(.+)/)?.[1];

console.log('1. Verificando credenciais...\n');
console.log('   Client ID:', clientId ? '✅ Presente' : '❌ Ausente');
console.log('   Client Secret:', clientSecret ? '✅ Presente' : '❌ Ausente');
console.log('   Auth URL:', authUrl || '❌ Ausente');

if (!clientId || !clientSecret || !authUrl) {
  console.log('\n❌ Credenciais incompletas no .env');
  process.exit(1);
}

console.log('\n2. Testando conexão com ANBIMA (timeout: 10s)...\n');

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const postData = 'grant_type=client_credentials';

const url = new URL(authUrl);

// Use a direct request with explicit timeout
const req = https.request({
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`,
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 10000
}, (res) => {
  console.log('   ✅ Conexão estabelecida!');
  console.log('   Status HTTP:', res.statusCode);
  console.log('   Content-Type:', res.headers['content-type']);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n3. Resposta:\n');
    
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.access_token) {
        console.log('\n' + '='.repeat(60));
        console.log('✅ SUCESSO: Autenticação funcionando!');
        console.log('🔑 Token obtido com sucesso');
        console.log('⏰ Expira em:', json.expires_in, 'segundos');
        console.log('='.repeat(60));
        process.exit(0);
      } else {
        console.log('\n❌ Resposta sem token de acesso');
        process.exit(1);
      }
    } catch (e) {
      console.log('Resposta bruta:', data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.log('   ❌ Erro de conexão:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('   ⏰ Timeout após 10 segundos');
  req.destroy();
  process.exit(1);
});

console.log('   → Enviando POST para:', url.hostname + url.pathname);
console.log('   → Aguardando resposta...\n');

req.write(postData);
req.end();