#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

console.log('\n' + '='.repeat(60));
console.log('🔍 TESTANDO MÚLTIPLOS ENDPOINTS ANBIMA');
console.log('='.repeat(60) + '\n');

const envContent = fs.readFileSync('.env', 'utf8');
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const clientSecret = envContent.match(/REACT_APP_ANBIMA_CLIENT_SECRET=(.+)/)?.[1];

console.log('📋 Credenciais:');
console.log('   Client ID:', clientId);
console.log('   Client Secret:', '****' + (clientSecret || '').slice(-4));
console.log('');

const endpoints = [
  'https://api.anbima.com.br/oauth/v2/oauth/token',
  'https://api.anbima.com.br/oauth/v2/token',
  'https://api.anbima.com.br/oauth/token',
  'https://api.anbima.com.br/sandbox/oauth/v2/oauth/token',
  'https://api.anbima.com.br/sandbox/oauth/v2/token',
  'https://api.anbima.com.br/sandbox/oauth/token',
  'https://api.anbima.com.br/auth/oauth/v2/oauth/token',
  'https://api.anbima.com.br/auth/oauth/token'
];

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const postData = 'grant_type=client_credentials';

let tested = 0;
let found = false;

function testEndpoint(url, index) {
  return new Promise((resolve) => {
    console.log(`[${index + 1}/${endpoints.length}] Testando: ${url}`);
    
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        tested++;
        
        if (res.statusCode === 200) {
          console.log('   ✅ SUCESSO! Status:', res.statusCode);
          try {
            const json = JSON.parse(data);
            if (json.access_token) {
              console.log('   🔑 Token obtido:', json.access_token.substring(0, 30) + '...');
              console.log('   ⏰ Expira em:', json.expires_in, 's');
              found = true;
            }
          } catch (e) {}
        } else if (res.statusCode === 404) {
          console.log('   ❌ 404 Not Found');
        } else if (res.statusCode === 401) {
          console.log('   ⚠️ 401 Unauthorized (credenciais rejeitadas)');
          try {
            const json = JSON.parse(data);
            console.log('   Erro:', json.error_description || json.error);
          } catch (e) {}
        } else {
          console.log('   ⚠️ Status:', res.statusCode);
        }
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      tested++;
      console.log('   ❌ Erro:', err.message);
      console.log('');
      resolve();
    });
    
    req.on('timeout', () => {
      tested++;
      console.log('   ⏰ Timeout');
      console.log('');
      req.destroy();
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  for (let i = 0; i < endpoints.length; i++) {
    await testEndpoint(endpoints[i], i);
    if (found) break;
  }
  
  console.log('='.repeat(60));
  console.log(`Testados: ${tested}/${endpoints.length}`);
  
  if (found) {
    console.log('✅ PELO MENOS UM ENDPOINT FUNCIONOU!');
  } else {
    console.log('❌ NENHUM ENDPOINT FUNCIONOU');
    console.log('\n💡 Verifique:');
    console.log('   - Client ID e Secret estão corretos');
    console.log('   - Credenciais foram aprovadas pela ANBIMA');
    console.log('   - Documentação oficial: https://developers.anbima.com.br');
  }
  console.log('='.repeat(60) + '\n');
}

runTests();