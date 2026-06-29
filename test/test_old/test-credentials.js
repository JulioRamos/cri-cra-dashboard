#!/usr/bin/env node

/**
 * Script para testar credenciais ANBIMA
 * Uso: node test-credentials.js [--sandbox]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

// Check for sandbox mode
const useSandbox = process.argv.includes('--sandbox');

const AUTH_URL = useSandbox 
  ? envVars.REACT_APP_ANBIMA_AUTH_URL_SANDBOX 
  : envVars.REACT_APP_ANBIMA_AUTH_URL;

const CLIENT_ID = envVars.REACT_APP_ANBIMA_CLIENT_ID;
const CLIENT_SECRET = envVars.REACT_APP_ANBIMA_CLIENT_SECRET;
const ACCESS_TOKEN = envVars.REACT_APP_ANBIMA_ACCESS_TOKEN;

console.log('\n🔍 Testando credenciais ANBIMA...\n');
console.log('Ambiente:', useSandbox ? 'SANDBOX' : 'PRODUÇÃO');
console.log('Auth URL:', AUTH_URL);
console.log('');

// Test 1: Check if direct token exists
if (ACCESS_TOKEN && ACCESS_TOKEN.trim()) {
  console.log('✅ REACT_APP_ANBIMA_ACCESS_TOKEN encontrado no .env');
  console.log('   Tamanho:', ACCESS_TOKEN.length, 'caracteres');
  console.log('   Primeiros 20 chars:', ACCESS_TOKEN.substring(0, 20) + '...');
  console.log('\n⚠️  Token direto encontrado. Pulando teste OAuth...');
  console.log('   Para testar o token, use test-token.js\n');
  process.exit(0);
}

// Test 2: Check Client ID and Secret
console.log('📋 Verificando Client Credentials...\n');

if (!CLIENT_ID) {
  console.log('❌ REACT_APP_ANBIMA_CLIENT_ID não encontrado no .env');
  process.exit(1);
}

console.log('✅ REACT_APP_ANBIMA_CLIENT_ID:', CLIENT_ID);

if (!CLIENT_SECRET) {
  console.log('❌ REACT_APP_ANBIMA_CLIENT_SECRET não encontrado no .env');
  process.exit(1);
}

console.log('✅ REACT_APP_ANBIMA_CLIENT_SECRET: ****' + CLIENT_SECRET.slice(-4));

// Test 3: Try to get token via OAuth 2.0
console.log('\n🔑 Tentando obter token via OAuth 2.0...\n');

const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const bodyParams = new URLSearchParams({ grant_type: 'client_credentials' });

const options = {
  hostname: new URL(AUTH_URL).hostname,
  path: new URL(AUTH_URL).pathname + new URL(AUTH_URL).search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
      console.log('📡 Status HTTP:', res.statusCode);
      console.log('📋 Headers:', JSON.stringify(res.headers));
      console.log('📄 Resposta:', data);
    console.log('');

    try {
      const jsonData = JSON.parse(data);
      
      if (jsonData.access_token) {
        console.log('✅ SUCESSO! Token obtido com sucesso!');
        console.log('🔑 Token:', jsonData.access_token.substring(0, 30) + '...');
        console.log('⏰ Expira em:', jsonData.expires_in, 'segundos');
        console.log('🎉 Credenciais VÁLIDAS!\n');
        process.exit(0);
      } else if (jsonData.error) {
        console.log('❌ ERRO na autenticação:');
        console.log('   Erro:', jsonData.error);
        console.log('   Descrição:', jsonData.error_description);
        console.log('\n💡 Possíveis causas:');
        console.log('   - Client ID ou Secret incorretos');
        console.log('   - Credenciais não aprovadas pela ANBIMA');
        console.log('   - Ambiente incorreto (sandbox vs produção)');
        console.log('   - Serviço ANBIMA indisponível\n');
        process.exit(1);
      } else {
        console.log('⚠️ Resposta inesperada:', jsonData);
        process.exit(1);
      }
    } catch (e) {
      console.log('⚠️ Resposta não é JSON válido:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Erro na requisição:', error.message);
  console.log('\n💡 Verifique:');
  console.log('   - Conexão com internet');
  console.log('   - URL do endpoint OAuth');
  console.log('   - Firewall/proxy\n');
  process.exit(1);
});

req.write(bodyParams.toString());
req.end();