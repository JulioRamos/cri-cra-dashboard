# ⚡ Quick Start Guide

## 📋 Requisitos

- **Node.js** 14.0 ou superior
- **npm** 6.0 ou superior (vem com Node.js)
- **Git**
- Conta GitHub (opcional, para deploy)

## 🎯 Em 5 Minutos

### 1. Baixar o Projeto

```bash
# Clone do GitHub (quando estiver lá)
git clone https://github.com/seu-usuario/cri-cra-dashboard.git
cd cri-cra-dashboard

# Ou use os arquivos locais se estiver desenvolvendo
cd cri-cra-dashboard
```

### 2. Instalar Dependências

```bash
npm install
```

Isso instalará todas as bibliotecas necessárias em `node_modules/`

### 3. Iniciar Servidor Local

```bash
npm start
```

A aplicação abrirá automaticamente em `http://localhost:3000`

### 4. Fazer Mudanças

Edite os arquivos em `src/` e veja as mudanças em tempo real!

### 5. Build para Produção

```bash
npm run build
```

Cria a versão otimizada em `build/`

## 📁 Estrutura de Arquivos Explicada

```
cri-cra-dashboard/
├── public/
│   └── index.html              ← Página HTML principal
├── src/
│   ├── components/
│   │   └── CRICRADashboard.jsx ← Componente principal (aqui está a lógica!)
│   ├── App.js                  ← Wrapper da app
│   ├── App.css                 ← Estilos globais
│   └── index.js                ← Entrada do React
├── package.json                ← Lista de dependências
├── README.md                   ← Documentação principal
└── GITHUB_DEPLOYMENT.md        ← Guia de deploy
```

## 🔧 Desenvolvendo

### Adicionar Uma Coluna à Tabela

Em `src/components/CRICRADashboard.jsx`, procure por `<table>` e adicione:

```jsx
<th style={{ textAlign: 'right', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
  Nova Coluna
</th>
```

Na linha de dados:

```jsx
<td style={{ padding: '12px', textAlign: 'right' }}>
  {item.sua_propriedade}
</td>
```

### Adicionar Um Novo Filtro

Procure por `Filters` e adicione um novo `select` ou `input`:

```jsx
<div>
  <label>Novo Filtro</label>
  <select
    value={filters.novoFiltro}
    onChange={(e) => setFilters({...filters, novoFiltro: e.target.value})}
  >
    <option>Opção 1</option>
  </select>
</div>
```

Depois atualize a função `applyFilters()`:

```jsx
if (filters.novoFiltro !== 'all') {
  filtered = filtered.filter(item => /* sua lógica */);
}
```

### Integrar Nova API

```javascript
const fetchNewData = async () => {
  try {
    const response = await fetch('sua-api-url');
    const json = await response.json();
    // processar dados
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

## 🐛 Debug

### Ver erros no console

```bash
# Terminal que executa npm start mostrará erros
# Ou abra DevTools no navegador: F12 > Console
```

### Inspecionar componentes React

Instale extensão Chrome: "React Developer Tools"

## 📤 Deploy Rápido

### Vercel (30 segundos)

```bash
npm i -g vercel
vercel
```

### Netlify (2 minutos)

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=build
```

### GitHub Pages

```bash
npm install --save-dev gh-pages
# Adicione ao package.json:
# "homepage": "https://seu-usuario.github.io/cri-cra-dashboard"
# "scripts": { "deploy": "npm run build && gh-pages -d build" }
npm run deploy
```

## 📚 Recursos Úteis

- **React Docs**: https://react.dev
- **MDN JavaScript**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **ANBIMA API**: https://developers.anbima.com.br
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/--*

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| `npm: command not found` | Instale Node.js em https://nodejs.org |
| `Port 3000 already in use` | Use outra porta: `PORT=3001 npm start` |
| `Module not found` | Execute `npm install` novamente |
| `Git not found` | Instale Git em https://git-scm.com |

## ✨ Próximos Aprendizados

1. **React Hooks**: useState, useEffect, useContext
2. **Fetch API**: Como buscar dados
3. **CSS Flexbox/Grid**: Layout responsivo
4. **Git Workflow**: Branches e Pull Requests
5. **TypeScript**: Tipagem estática

## 🚀 Deploy Checklist

- [ ] Testes locais (`npm start`)
- [ ] Build passou (`npm run build`)
- [ ] Git commitado (`git add . && git commit -m "..."`)
- [ ] Push para GitHub (`git push origin main`)
- [ ] Deploy automático executou
- [ ] Verificar aplicação online

## 💬 Perguntas?

- Leia o README.md completo
- Verifique GITHUB_DEPLOYMENT.md para deploy
- Procure por exemplos online
- Abra uma issue no GitHub

---

**Happy coding!** 🎉
