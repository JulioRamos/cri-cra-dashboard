# 📊 Dashboard CRI/CRA - ANBIMA

Uma aplicação web interativa para análise, filtragem e visualização de dados de Certificados de Recebíveis Imobiliários (CRI) e Agribusiness (CRA) com integração à API ANBIMA.

## 🎯 Funcionalidades

- **Integração com API ANBIMA**: Acesso em tempo real aos dados de mercado secundário de CRI/CRA
  - ✨ **NOVO**: Múltiplos endpoints com CORS proxy para maior confiabilidade
  - ✨ **NOVO**: Fallback automático se a API principal falhar
  - ✨ **NOVO**: Cache local (1 hora) para reduzir chamadas à API
- **Filtros Avançados**: Filtre por tipo, range de taxa, emissor, originador
- **Ordenação Dinâmica**: Ordene por taxa indicativa, duration, PU ou volatilidade
- **Exportação de Dados**: 
  - ✨ **NOVO**: Exportar dados filtrados para CSV
  - ✨ **NOVO**: Exportar dados filtrados para JSON
- **Paginação Inteligente**: 
  - ✨ **NOVO**: 25 itens por página para melhor performance
  - ✨ **NOVO**: Navegação entre páginas otimizada
- **Análise Financeira Expandida**:
  - Taxa de Compra/Venda
  - Preço Unitário (PU)
  - Duration
  - Data de Vencimento
  - Liquidez
  - Volatilidade
  - Rating de Crédito
  - Classificação de Risco
  - Status de Empresa Pública
  - Tipo de Remuneração

- **Dashboard com Sumários**: Visualize métricas-chave no topo da página
- **Modo Escuro**: Suporte automático para preferência de cor do sistema
- **Responsivo**: Design adaptado para desktop e tablets

## 🚀 Quick Start

### Pré-requisitos

- Node.js 14+ 
- npm ou yarn
- Git

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/cri-cra-dashboard.git
cd cri-cra-dashboard

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start
```

A aplicação estará disponível em `http://localhost:3000`

## 🌐 Deployment

### GitHub Pages (Estático - Gratuito)

```bash
# 1. Instale gh-pages
npm install --save-dev gh-pages

# 2. Adicione ao package.json
{
  "homepage": "https://seu-usuario.github.io/cri-cra-dashboard",
  "scripts": {
    "deploy": "npm run build && gh-pages -d build"
  }
}

# 3. Deploy
npm run deploy
```

### Vercel (Recomendado - Gratuito e Fácil)

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Ou conecte seu repositório GitHub direto no [Vercel](https://vercel.com)

### Netlify (Alternativa - Gratuito)

```bash
# Instale Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

Ou use a interface web em [Netlify](https://netlify.com)

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync build/ s3://seu-bucket-name/

# Invalidar cache CloudFront (opcional)
aws cloudfront create-invalidation --distribution-id DISTRIBUICAO_ID --paths "/*"
```

### Heroku (Dynos pagos)

```bash
# Instale Heroku CLI
npm i -g heroku

# Login
heroku login

# Crie um Procfile
echo "web: npm start" > Procfile

# Deploy
git push heroku main
```

## 📋 Estrutura do Projeto

```
cri-cra-dashboard/
├── public/
│   └── index.html           # HTML principal
├── src/
│   ├── components/
│   │   └── CRICRADashboard.jsx  # Componente principal
│   ├── App.js              # Wrapper da aplicação
│   ├── App.css             # Estilos globais
│   └── index.js            # Entry point React
├── package.json            # Dependências e scripts
├── .gitignore             # Exclusões Git
└── README.md              # Este arquivo
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
REACT_APP_ANBIMA_API=https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario
REACT_APP_CACHE_TIME=3600000
```

## 📊 Dados e APIs

### ANBIMA

A aplicação consome dados de:
- **Endpoint**: `https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario`
- **Atualização**: Diária (após 20h)
- **Documentação**: https://developers.anbima.com.br/pt/documentacao/precos-indices/apis-de-precos/cri-cra/

### Dados Complementares (Simulados)

Atualmente, os seguintes dados são simulados e devem ser integrados com fontes reais em produção:

- **Liquidez**: B3, B3i ou bases de trading
- **Volatilidade**: Cálculos históricos ou APIs de dados
- **Rating**: Moody's, S&P, Fitch
- **Status Público**: CVM, B3, Bovespa
- **Taxa de Mercado**: Agregadores de dados financeiros

## 🔐 Segurança

- Sem armazenamento de dados sensíveis
- CORS habilitado apenas para ANBIMA
- Sanitização de inputs de busca
- Sem cookies ou tracking

## 📱 Responsividade

Testado em:
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667)

## 🎨 Tema e Customização

Modifique as variáveis CSS em `public/index.html` ou `src/App.css`:

```css
:root {
  --surface-0: #f9f8f7;
  --surface-1: #f0eeeb;
  --text-primary: #1a1a1a;
  --text-accent: #2563eb;
  /* ... mais variáveis */
}
```

## 🐛 Troubleshooting

### CORS Error na API ANBIMA
✅ **RESOLVIDO!** O dashboard agora usa múltiplos CORS proxies:
1. Tenta conexão direta com ANBIMA
2. Fallback para `corsproxy.io`
3. Fallback para `allorigins.win`
4. Se todos falharem, usa dados mock de demonstração

O sistema também mantém cache local de 1 hora, reduzindo necessidade de chamadas à API.

### Performance Lenta
✅ **RESOLVIDO!** Implementações realizadas:
- ✓ Paginação (25 itens por página)
- ✓ Cache local para evitar refetching desnecessário
- ✓ Loading states otimizados
- ✓ Filtros aplicados antes da renderização

### Dados Não Atualizam
- Verifique a disponibilidade da API ANBIMA (após 20h)
- Limpe cache do navegador (Ctrl+Shift+Delete)
- Verifique conexão com Internet

## 📈 Roadmap

### ✅ Concluído
- [x] ~~Exportação de dados (CSV/JSON)~~ ✅ v1.1.0
- [x] ~~CORS proxy para API ANBIMA~~ ✅ v1.1.0
- [x] ~~Paginação para performance~~ ✅ v1.1.0
- [x] ~~Cache local de dados~~ ✅ v1.1.0

### 🚧 Próximas Features
- [ ] Gráficos de histórico de taxas (Chart.js/D3.js)
- [ ] Comparação entre ativos (side-by-side)
- [ ] Alertas de preço (email/push notifications)
- [ ] Carteira simulada com tracking
- [ ] Integração com B3 e dados de trading
- [ ] Autenticação e perfis de usuário
- [ ] Dashboard personalizado (drag & drop widgets)
- [ ] Mobile app (React Native)
- [ ] Exportação para Excel com gráficos

## 🤝 Contribuindo

1. Faça um Fork
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 📞 Suporte

Para dúvidas ou issues:
- Abra uma issue no GitHub
- Consulte a documentação ANBIMA: https://developers.anbima.com.br

## 🙏 Agradecimentos

- ANBIMA pela API de dados

---

**Última atualização**: Junho 2026
**Versão**: 1.1.0

## 🆕 Changelog

### v1.1.0 (Junho 2026)
- ✨ Implementado CORS proxy com múltiplos fallbacks para API ANBIMA
- ✨ Adicionado cache local (localStorage) com validade de 1 hora
- ✨ Exportação de dados para CSV e JSON
- ✨ Paginação inteligente (25 itens por página)
- ✨ Indicador de fonte de dados
- ✨ Botão de atualização/refresh manual
- 🐛 Correção de performance com grandes volumes de dados
- 🎨 Melhorias na UI e feedback visual

### v1.0.0 (Janeiro 2026)
- 🎉 Lançamento inicial
- Dashboard interativo CRI/CRA
- Integração com API ANBIMA
- Filtros e ordenação dinâmica
- Modo escuro automático


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com/JulioRamos/cri-cra-dashboard)