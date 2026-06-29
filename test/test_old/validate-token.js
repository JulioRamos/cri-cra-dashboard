#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Read .env
const envContent = fs.readFileSync('.env', 'utf8');
const clientId = envContent.match(/REACT_APP_ANBIMA_CLIENT_ID=(.+)/)?.[1];
const clientSecret = envContent.match(/REACT_APP_ANBIMA_CLIENT_SECRET=(.+)/)?.[1];
const accessToken = envContent.match(/REACT_APP_ANBIMA_ACCESS_TOKEN=(.+)/)?.[1];
const authUrl = envContent.match(/REACT_APP_ANBIMA_AUTH_URL=(.+)/)?.[1];
const apiUrl = envContent.match(/REACT_APP_ANBIMA_SEC_MARKET=(.+)/)?.[1];

console.log('\n' + '='.repeat(60));
console.log('🔐 VALIDAÇÃO DE TOKEN - ANBIMA API');
console.log('='.repeat(60) + '\n');

let token = null;

// Step 1: Get token
if (accessToken && accessToken.trim()) {
  token = accessToken.trim();
  console.log('✅ Token obtido do .env (direto)');
} else if (clientId && clientSecret) {
  console.log('🔑 Obtendo token via Client Credentials...\n');
  
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
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.access_token) {
          token = json.access_token;
          console.log('✅ Token obtido via OAuth:', token.substring(0, 30) + '...');
          console.log('⏰ Expira em:', json.expires_in, 'segundos\n');
          testApiCall(token, apiUrl);
        } else {
          console.log('❌ Falha ao obter token:', json);
          process.exit(1);
        }
      } catch (e) {
        console.log('❌ Erro:', e.message);
        process.exit(1);
      }
    });
  });
  req.on('error', (error) => {
    console.log('❌ Erro na autenticação:', error.message);
    process.exit(1);
  });
  req.write(postData);
  req.end();
  return;
} else {
  console.log('❌ Nenhuma credencial encontrada no .env');
  process.exit(1);
}

// Step 2: Test API call
testApiCall(token, apiUrl);

function testApiCall(token, apiUrl) {
  console.log('🌐 Testando chamada à API ANBIMA...\n');
  console.log('📡 Endpoint:', apiUrl);
  console.log('🔑 Usando token:', token.substring(0, 30) + '...\n');
  
  const url = new URL(apiUrl);
  
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    console.log('📡 Status HTTP:', res.statusCode);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📄 Resposta da API:\n');
      
      // Try to format JSON
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log(data);
      }
      
      console.log('\n' + '='.repeat(60));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ SUCESSO! Token funciona corretamente!');
        console.log('✅ API ANBIMA acessível com as credenciais!');
      } else if (res.statusCode === 401) {
        console.log('❌ TOKEN INVÁLIDO OU EXPIRADO!');
        console.log('   Status:', res.statusCode);
      } else if (res.statusCode === 403) {
        console.log('❌ ACESSO NEGADO!');
        console.log('   Verifique permissões da aplicação');
      } else {
        console.log('⚠️ Status inesperado:', res.statusCode);
      }
      console.log('='.repeat(60) + '\n');
      
      process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 1);
    });
  });
  
  req.on('error', (error) => {
    console.log('\n❌ ERRO NA REQUISIÇÃO:', error.message);
    console.log('\n💡 Possíveis causas:');
    console.log('   - CORS bloqueando requisição (normal em browser)');
    console.log('   - API indisponível ou sem dados');
    console.log('   - Problema de rede');
    process.exit(1);
  });
  
  req.end();
}