# 🚀 GitHub Deployment Guide - CRI/CRA Dashboard

## Passo 1: Criar Repositório no GitHub

1. Vá para https://github.com/new
2. Faça login em sua conta GitHub (ou crie uma se não tiver)
3. Preencha os dados:
   - **Repository name**: `cri-cra-dashboard`
   - **Description**: `Interactive CRI/CRA financial dashboard with ANBIMA API integration`
   - **Public** (recomendado para portfólio) ou **Private**
   - Deixe todas as outras opções desmarcadas (não inicie com README)
   
4. Clique em **Create repository**

## Passo 2: Adicionar Remote ao Git Local

Copie os comandos mostrados na página do GitHub (opção "...or push an existing repository from the command line"):

```bash
cd ~/cri-cra-dashboard

# Renomear branch para main (se estiver em master)
git branch -M main

# Adicionar remote do GitHub
git remote add origin https://github.com/seu-usuario/cri-cra-dashboard.git

# Fazer push para GitHub
git push -u origin main
```

**Substitua `seu-usuario` pelo seu usuário GitHub real**

## Passo 3: Configurar Deploy Automático

### Opção A: Vercel (RECOMENDADO - Mais Fácil)

1. Vá para https://vercel.com
2. Clique em "Sign Up" e escolha "Continue with GitHub"
3. Autorize Vercel a acessar seus repositórios
4. Clique em "Import Project"
5. Selecione `cri-cra-dashboard`
6. Vercel detectará automaticamente que é um projeto React
7. Clique em "Deploy"

**Sua aplicação estará online em**: https://cri-cra-dashboard.vercel.app (ou similar)

### Opção B: Netlify

1. Vá para https://app.netlify.com
2. Clique em "Connect to Git"
3. Escolha "GitHub"
4. Autorize Netlify
5. Selecione o repositório `cri-cra-dashboard`
6. Configurações automáticas estarão corretas
7. Clique em "Deploy site"

**Sua aplicação estará online em**: https://cri-cra-dashboard.netlify.app (ou similar)

### Opção C: GitHub Pages (Gratuito)

1. No repositório do GitHub, vá para **Settings** > **Pages**
2. Em "Source", selecione "Deploy from a branch"
3. Selecione branch "main" e pasta "/ (root)"
4. Clique em "Save"

Depois rode no seu terminal:

```bash
npm install --save-dev gh-pages

# Adicione ao package.json:
# "homepage": "https://seu-usuario.github.io/cri-cra-dashboard",
# "scripts": { "deploy": "npm run build && gh-pages -d build" }

npm run deploy
```

## Passo 4: Ativar GitHub Actions (CI/CD)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Passo 5: Configurar Secrets (se usar GitHub Actions)

1. No GitHub, vá para **Settings** > **Secrets and variables** > **Actions**
2. Clique em "New repository secret"
3. Adicione seus tokens (obtenha em Vercel dashboard):
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

## Passo 6: Fazer Atualizações

Quando fizer mudanças locais:

```bash
# Fazer as alterações nos arquivos...

# Adicionar mudanças
git add .

# Fazer commit com mensagem descritiva
git commit -m "Adicionar filtro de liquidez mínima"

# Enviar para GitHub
git push origin main

# Deploy automático ocorre em segundos!
```

## Comandos Úteis

```bash
# Ver status dos arquivos
git status

# Ver histórico de commits
git log --oneline

# Desfazer último commit (mas manter mudanças)
git reset --soft HEAD~1

# Desfazer mudanças em um arquivo
git checkout -- src/App.js

# Ver configuração do git
git config --list
```

## URLs Importantes

- 📝 **Seu Repositório**: https://github.com/seu-usuario/cri-cra-dashboard
- 🌐 **Aplicação Live (Vercel)**: https://cri-cra-dashboard.vercel.app
- 🌐 **Aplicação Live (Netlify)**: https://cri-cra-dashboard.netlify.app
- 🔧 **Vercel Dashboard**: https://vercel.com/dashboard
- 🔧 **Netlify Dashboard**: https://app.netlify.com

## Troubleshooting

### Erro: "fatal: could not read Username for 'github.com'"

```bash
# Use HTTPS com token pessoal:
git remote set-url origin https://seu-token@github.com/seu-usuario/cri-cra-dashboard.git

# Ou use SSH:
# 1. Gere chave SSH: ssh-keygen -t ed25519
# 2. Adicione em GitHub Settings > SSH Keys
# 3. git remote set-url origin git@github.com:seu-usuario/cri-cra-dashboard.git
```

### Erro de Push Rejected

```bash
# Puxar mudanças remotas primeiro
git pull origin main

# Resolver conflitos se houver
# Depois fazer push novamente
git push origin main
```

### Verificar Conexão SSH

```bash
ssh -T git@github.com
# Deve retornar: "Hi seu-usuario! You've successfully authenticated..."
```

## Próximos Passos

1. ✅ Repositório criado
2. ✅ Código no GitHub
3. ✅ Deploy automático ativo
4. 📝 Adicionar badge de status ao README
5. 🚀 Compartilhar com colegas
6. 💡 Implementar features do roadmap

## Badges para README

Adicione ao seu README.md para mostrar status do projeto:

```markdown
[![Deploy Status](https://img.shields.io/github/actions/workflow/status/seu-usuario/cri-cra-dashboard/deploy.yml?branch=main)](https://github.com/seu-usuario/cri-cra-dashboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com/seu-usuario/cri-cra-dashboard)
```

## Suporte

- Documentação GitHub: https://docs.github.com
- Documentação Vercel: https://vercel.com/docs
- Documentação Netlify: https://docs.netlify.com

---

**Pronto para o mundo!** 🎉 Sua aplicação está no GitHub e online.
