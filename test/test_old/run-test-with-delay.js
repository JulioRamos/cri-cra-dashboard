#!/usr/bin/env node
const { spawn } = require('child_process');

console.log('Executando teste em 3 segundos...\n');
setTimeout(() => {
  const child = spawn('node', ['test-original-creds.js'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    console.log(`\nProcesso finalizado com código: ${code}`);
  });
}, 3000);