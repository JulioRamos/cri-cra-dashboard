#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

console.log('\n' + '='.repeat(60));
console.log('🔍 SIMULANDO FLUXO DO DASHBOARD');
console.log('='.repeat(60) + '\n');

// Ler .env igual ao dashboard
const envContent = fs.readFileSync('.env', 'utf8');
const token = envContent.match(/REACT_APP_ANBIMA_ACCESS_TOKEN=(.+)/)?.[1];
const endpoint = envContent.match(/REACT_APP_ANBIMA_SEC_MARKET=(.+)/)?.[1];

console.log('1. Verificando token no .env...\n');
console.log('   Token:', token ? '✅ Presente' : '❌ Ausente');

if (!token) {
  console.log('\n❌ Nenhum token configurado');
  process.exit(1);
}

console.log('   Valor:', token.substring(0, 20) + '...');
console.log('\n2. Testando chamada à API igual ao dashboard...\n');

// Testar diferentes formatos de URL que o dashboard pode usar
const urlsToTest = [
  endpoint,
  endpoint + '?$top=50',
  endpoint + '?top=50',
  endpoint + '?limit=50'
];

let currentIndex = 0;

function testUrl(url, index) {
  return new Promise((resolve) => {
    console.log(`[${index + 1}/${urlsToTest.length}] GET ${url}`);
    
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('   Status:', res.statusCode);
        
        if (res.statusCode === 200) {
          console.log('   ✅ SUCESSO!\n');
          try {
            const json = JSON.parse(data);
            const items = json.value || json.data || json.resultados || json.content || (Array.isArray(json) ? json : []);
            if (Array.isArray(items) && items.length > 0) {
              console.log('   📊 Dados recebidos:', items.length, 'itens');
              console.log('   Primeiro item:', JSON.stringify(items[0], null, 2).substring(0, 200) + '...');
              resolve({ success: true, url, items });
              return;
            }
          } catch (e) {}
          console.log('   ⚠️ Resposta vazia ou formato inesperado');
        } else if (res.statusCode === 401) {
          console.log('   ❌ Token inválido ou expirado');
        } else if (res.statusCode === 403) {
          console.log('   ❌ Acesso negado');
        } else if (res.statusCode === 404) {
          console.log('   ❌ Endpoint não encontrado');
        } else {
          console.log('   ⚠️ Status inesperado');
        }
        console.log('');
        resolve({ success: false, url });
      });
    });
    
    req.on('error', (err) => {
      console.log('   ❌ Erro:', err.message);
      console.log('');
      resolve({ success: false, url, error: err.message });
    });
    
    req.on('timeout', () => {
      console.log('   ⏰ Timeout (15s)');
      console.log('');
      req.destroy();
      resolve({ success: false, url, timeout: true });
    });
    
    req.end();
  });
}

async function runTests() {
  for (let i = 0; i < urlsToTest.length; i++) {
    const result = await testUrl(urlsToTest[i], i);
    if (result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ DASHBOARD FUNCIONARIA COM ESTA CONFIGURAÇÃO!');
      console.log('='.repeat(60));
      console.log('Token: OK');
      console.log('Endpoint:', result.url);
      console.log('Dados:', result.items.length, 'registros');
      process.exit(0);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('❌ NENHUMA CONFIGURAÇÃO FUNCIONOU');
  console.log('='.repeat(60));
  console.log('\n💡 Possíveis causas:');
  console.log('   1. CORS bloqueando requisições do navegador');
  console.log('   2. Token sem permissão para este endpoint');
  console.log('   3. API ANBIMA temporariamente indisponível');
  console.log('   4. Necessário usar CORS proxy');
  console.log('\n🔧 Soluções:');
  console.log('   - Teste no navegador com DevTools aberto (F12)');
  console.log('   - Verifique se o proxy CORS está configurado');
  console.log('   - Documentação: https://developers.anbima.com.br');
  console.log('='.repeat(60) + '\n');
  
  process.exit(1);
}

runTests();