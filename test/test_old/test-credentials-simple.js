#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

console.log('\n' + '='.repeat(60));
console.log('🔍 TESTE DE CREDENCIAIS ANBIMA');
console.log('='.repeat(60) + '\n');

// Read .env
const envContent = fs.readFileSync('.env', 'utf8');
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const clientSecret = envContent.match(/REACT_APP_ANBIMA_CLIENT_SECRET=(.+)/)?.[1];
const accessToken = envContent.match(/REACT_APP_ANBIMA_ACCESS_TOKEN=(.+)/)?.[1];
const authUrl = envContent.match(/REACT_APP_ANBIMA_AUTH_URL=(.+)/)?.[1];

console.log('📋 Verificando .env...\n');

if (accessToken && accessToken.trim()) {
  console.log('✅ TOKEN DIRETO ENCONTRADO!');
  console.log('   Tamanho:', accessToken.length, 'caracteres');
  console.log('   Token:', accessToken.substring(0, 30) + '...');
  console.log('\nℹ️  Credenciais estão OK (token direto no .env)');
  process.exit(0);
}

console.log('❌ Nenhum token direto encontrado\n');

if (!clientId) {
  console.log('❌ ERRO: REACT_APP_ANBIMA_CLIENT_ID não encontrado');
  process.exit(1);
}

console.log('✅ Client ID:', clientId);

if (!clientSecret) {
  console.log('❌ ERRO: REACT_APP_ANBIMA_CLIENT_SECRET não encontrado');
  process.exit(1);
}

console.log('✅ Client Secret:', '****' + clientSecret.slice(-4));
console.log('\n🔑 Testando autenticação OAuth...');
console.log('📡 URL:', authUrl);
console.log('');

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const postData = 'grant_type=client_credentials';

const options = {
  hostname: new URL(authUrl).hostname,
  path: new URL(authUrl).pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('⏳ Enviando requisição...\n');

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('📡 Status HTTP:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Resposta da API:\n');
    
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.access_token) {
        console.log('\n' + '='.repeat(60));
        console.log('✅ SUCESSO! CREDENCIAIS VÁLIDAS!');
        console.log('='.repeat(60));
        console.log('🔑 Token:', json.access_token.substring(0, 30) + '...');
        console.log('⏰ Expira em:', json.expires_in, 'segundos');
        process.exit(0);
      } else if (json.error) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ FALHA NA AUTENTICAÇÃO');
        console.log('='.repeat(60));
        console.log('Erro:', json.error);
        console.log('Descrição:', json.error_description);
        process.exit(1);
      }
    } catch (e) {
      console.log('Resposta bruta:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('\n❌ ERRO DE CONEXÃO:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();