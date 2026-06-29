import React, { useState, useEffect } from 'react';
import {
  fetchAnbimaData,
  fetchAnbimaPublicData,
  fetchMarketIndices,
  generateMockData,
  getCachedData,
  cacheData,
  clearDataCache
} from '../services/anbimaApi';
import {
  saveCredentials,
  getStoredCredentials,
  hasCredentials,
  clearAuthData,
  getCachedToken
} from '../services/anbimaAuth';

export default function CRICRADashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    minRate: 0,
    maxRate: 20,
    searchTerm: '',
    devedorSearch: '',
    codigoB3Search: '',
    sortBy: 'taxa_indicativa'
  });
  const [expandedRow, setExpandedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [apiSource, setApiSource] = useState('loading');
  const storedCreds = getStoredCredentials();
  const [authConfig, setAuthConfig] = useState({
    show: false,
    clientId: storedCreds?.clientId || '',
    clientSecret: '',
    message: '',
    hasToken: !!getCachedToken()
  });

  useEffect(() => {
    fetchCRICRAData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const fetchCRICRAData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first (valid for 1 hour)
      const cachedData = getCachedData();
      if (cachedData) {
        console.log('Using cached data');
        setData(cachedData.data);
        setApiSource(cachedData.source);
        setLoading(false);
        return;
      }

      // Try ANBIMA API with all fallback strategies
      let result = null;

      // Strategy 1: Main ANBIMA API with multiple endpoints and CORS proxies
      try {
        result = await fetchAnbimaData();
      } catch (err) {
        console.log('Main API failed:', err.message);
      }

      // Strategy 2: Try to scrape ANBIMA public data website
      if (!result) {
        try {
          result = await fetchAnbimaPublicData();
        } catch (err) {
          console.log('Public data fetch failed:', err.message);
        }
      }

      // Strategy 3: Fetch market indices for additional context
      if (result) {
        try {
          const indices = await fetchMarketIndices();
          if (indices) {
            console.log('Market indices also retrieved successfully');
          }
        } catch (e) {
          // Indices are optional
        }
      }
      
      if (result && result.data && result.data.length > 0) {
        console.log(`✅ Data loaded from: ${result.source}`);
        setData(result.data);
        setApiSource(result.source);
        cacheData(result.data, result.source);
      } else {
        throw new Error('No data returned from any data source');
      }
      
    } catch (err) {
      console.log('Using mock data due to:', err.message);
      const mockData = generateMockData();
      setData(mockData);
      setApiSource('Dados Mock (Demo)');
      setError(
        '⚠️ API ANBIMA indisponível. Usando dados de demonstração. ' +
        'Para dados reais, cadastre-se em developers.anbima.com.br e adicione sua chave API abaixo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveCredentialsAction = () => {
    if (authConfig.clientId.trim() && authConfig.clientSecret.trim()) {
      try {
        saveCredentials(authConfig.clientId.trim(), authConfig.clientSecret.trim());
        setAuthConfig(prev => ({ ...prev, show: false, clientSecret: '', message: '✅ Credenciais salvas! Obtendo token de acesso...' }));
        clearDataCache();
        fetchCRICRAData();
      } catch (err) {
        setAuthConfig(prev => ({ ...prev, message: `❌ ${err.message}` }));
      }
    } else {
      setAuthConfig(prev => ({ ...prev, message: '❌ Preencha Client ID e Client Secret' }));
    }
  };

  const clearCredentialsAction = () => {
    clearAuthData();
    clearDataCache();
    setAuthConfig(prev => ({ ...prev, clientId: '', clientSecret: '', message: '🗑️ Credenciais removidas', hasToken: false }));
    fetchCRICRAData();
  };

  const clearCache = () => {
    clearDataCache();
    setApiSource('loading');
    fetchCRICRAData();
  };

  const applyFilters = () => {
    let filtered = data;

    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.tipo_contrato === filters.type);
    }

    filtered = filtered.filter(
      item => parseFloat(item.taxa_indicativa) >= filters.minRate &&
              parseFloat(item.taxa_indicativa) <= filters.maxRate
    );

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.codigo_ativo?.toLowerCase().includes(term) ||
        item.codigo_b3?.toLowerCase().includes(term) ||
        item.emissor?.toLowerCase().includes(term) ||
        item.originador?.toLowerCase().includes(term) ||
        item.devedor?.toLowerCase().includes(term) ||
        item.isin?.toLowerCase().includes(term) ||
        item.cetip?.toLowerCase().includes(term)
      );
    }

    if (filters.devedorSearch) {
      const term = filters.devedorSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.devedor?.toLowerCase().includes(term)
      );
    }

    if (filters.codigoB3Search) {
      const term = filters.codigoB3Search.toLowerCase();
      filtered = filtered.filter(item =>
        item.codigo_b3?.toLowerCase().includes(term) ||
        item.codigo_ativo?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      const aVal = parseFloat(a[filters.sortBy] || 0);
      const bVal = parseFloat(b[filters.sortBy] || 0);
      return bVal - aVal;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      'Código B3', 'Tipo', 'Devedor', 'Emissor', 'Originador',
      'Taxa Indicativa (%)', 'Taxa Compra', 'Taxa Venda',
      'Vencimento', 'Duration', 'PU', 'PU Par (%)',
      'Rating', 'Agência Rating', 'Risco',
      'Liquidez (%)', 'Volatilidade (%)',
      'Tipo Remuneração', 'Taxa Correção',
      'Valor Nominal', 'Quantidade Emitida',
      'ISIN', 'CETIP', 'Status'
    ];

    const rows = filteredData.map(item => [
      item.codigo_b3, item.tipo_contrato, item.devedor,
      item.emissor, item.originador,
      item.taxa_indicativa, item.taxa_compra, item.taxa_venda,
      item.data_vencimento, item.duration, item.pu, item.percent_pu_par,
      item.rating, item.agencia_rating, item.risco,
      item.liquidez, item.volatilidade,
      item.tipo_remuneracao, item.taxa_correcao,
      item.valor_nominal, item.quantidade_emitida,
      item.isin, item.cetip,
      item.isPublic ? 'Pública' : 'Privada'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `cri-cra-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `cri-cra-export-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Common styles for form elements
  const selectStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '0.5px solid var(--border)',
    fontSize: '14px',
    background: 'var(--surface-0)',
    color: 'var(--text-primary)',
    WebkitAppearance: 'menulist',
    MozAppearance: 'menulist',
    appearance: 'menulist'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '0.5px solid var(--border)',
    fontSize: '14px',
    background: 'var(--surface-0)',
    color: 'var(--text-primary)'
  };

  const RowDetails = ({ item }) => (
    <div style={{ 
      background: 'var(--surface-1)', 
      padding: '1rem', 
      marginTop: '0.5rem',
      borderRadius: '8px',
      fontSize: '13px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    }}>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Código B3</div>
        <div style={{ fontWeight: 500, color: 'var(--text-accent)' }}>{item.codigo_b3 || '-'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Devedor</div>
        <div style={{ fontWeight: 500 }}>{item.devedor || '-'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Tipo de Remuneração</div>
        <div style={{ fontWeight: 500 }}>{item.tipo_remuneracao || '-'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Taxa de Correção</div>
        <div style={{ fontWeight: 500 }}>{item.taxa_correcao}%</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>PU Par</div>
        <div style={{ fontWeight: 500 }}>{item.percent_pu_par}%</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>PU Atual</div>
        <div style={{ fontWeight: 500 }}>R$ {parseFloat(item.pu).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Liquidez</div>
        <div style={{ fontWeight: 500 }}>{item.liquidez}%</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Volatilidade</div>
        <div style={{ fontWeight: 500 }}>{item.volatilidade}%</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Risco</div>
        <div style={{ fontWeight: 500, color: item.risco === 'Alto' ? '#e34948' : item.risco === 'Médio' ? '#eda100' : '#0ca30c' }}>
          {item.risco}
        </div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Rating</div>
        <div style={{ fontWeight: 500, background: 'var(--bg-accent)', color: 'var(--text-accent)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
          {item.rating}
        </div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Agência Rating</div>
        <div style={{ fontWeight: 500 }}>{item.agencia_rating || '-'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>ISIN</div>
        <div style={{ fontWeight: 500, fontSize: '11px' }}>{item.isin || '-'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>CETIP</div>
        <div style={{ fontWeight: 500, fontSize: '11px' }}>{item.cetip || '-'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Valor Nominal</div>
        <div style={{ fontWeight: 500 }}>
          R$ {parseFloat(item.valor_nominal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Quantidade Emitida</div>
        <div style={{ fontWeight: 500 }}>
          {parseInt(item.quantidade_emitida || 0).toLocaleString('pt-BR')}
        </div>
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Status</div>
        <div style={{ fontWeight: 500 }}>
          {item.isPublic ? '✓ Pública' : 'Privada'}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '0 1rem', fontFamily: 'var(--font-sans)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', fontWeight: 500 }}>
              Dashboard CRI/CRA
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0' }}>
              Análise de títulos de renda fixa securitizados com dados ANBIMA
            </p>
            {apiSource !== 'loading' && (
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '12px' }}>
                📡 Fonte: {apiSource}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setAuthConfig(prev => ({ ...prev, show: !prev.show, message: '' }))}
              style={{
                padding: '8px 16px',
                background: 'var(--surface-1)',
                border: '0.5px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}
            >
              🔑 API Key
            </button>
            <button
              onClick={clearCache}
              style={{
                padding: '8px 16px',
                background: 'var(--surface-1)',
                border: '0.5px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}
            >
              🔄 Atualizar
            </button>
            <button
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-accent)',
                border: '0.5px solid var(--text-accent)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-accent)'
              }}
            >
              📥 CSV
            </button>
            <button
              onClick={exportToJSON}
              style={{
                padding: '8px 16px',
                background: 'var(--surface-1)',
                border: '0.5px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}
            >
              📥 JSON
            </button>
          </div>
        </div>

        {/* ANBIMA OAuth Configuration */}
        {authConfig.show && (
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--text-accent)',
            borderRadius: '8px',
            padding: '1rem',
            margin: '1rem 0'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', fontWeight: 500 }}>
              🔑 Configurar API ANBIMA (OAuth 2.0)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              Para acessar dados reais da ANBIMA, você precisa das credenciais OAuth 2.0:
              <br />
              1. Cadastre-se em <a href="https://admin-developers.anbima.com.br" target="_blank" rel="noreferrer" style={{ color: 'var(--text-accent)' }}>admin-developers.anbima.com.br</a>
              <br />
              2. Crie uma aplicação para obter o <strong>Client ID</strong> e <strong>Client Secret</strong>
              <br />
              3. O sistema automaticamente trocará essas credenciais por um token Bearer (válido por 1 hora)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={authConfig.clientId}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, clientId: e.target.value, message: '' }))}
                placeholder="Seu Client ID"
                style={{ ...inputStyle, width: '100%' }}
              />
              <input
                type="password"
                value={authConfig.clientSecret}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, clientSecret: e.target.value, message: '' }))}
                placeholder="Seu Client Secret"
                style={{ ...inputStyle, width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={saveCredentialsAction}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--text-accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  Salvar e Obter Token
                </button>
                {hasCredentials() && (
                  <button
                    onClick={clearCredentialsAction}
                    style={{
                      padding: '8px 16px',
                      background: '#e34948',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    Remover Credenciais
                  </button>
                )}
              </div>
            </div>
            {authConfig.message && (
              <p style={{ fontSize: '13px', marginTop: '0.5rem', color: 'var(--text-success)' }}>
                {authConfig.message}
              </p>
            )}
            {authConfig.hasToken && (
              <p style={{ fontSize: '11px', marginTop: '0.5rem', color: 'var(--text-success)' }}>
                ✅ Token de acesso ativo (válido por 1 hora)
              </p>
            )}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            color: '#856404',
            padding: '12px 16px',
            borderRadius: '6px',
            margin: '1rem 0',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', margin: '1.5rem 0 2rem 0' }}>
          <div style={{ background: 'var(--surface-1)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total de Ativos</div>
            <div style={{ fontSize: '20px', fontWeight: 500 }}>{filteredData.length}</div>
          </div>
          <div style={{ background: 'var(--surface-1)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Taxa Média</div>
            <div style={{ fontSize: '20px', fontWeight: 500 }}>
              {filteredData.length > 0
                ? (filteredData.reduce((sum, d) => sum + parseFloat(d.taxa_indicativa), 0) / filteredData.length).toFixed(2)
                : '0.00'}%
            </div>
          </div>
          <div style={{ background: 'var(--surface-1)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>CRI / CRA</div>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {filteredData.filter(d => d.tipo_contrato === 'CRI').length} / {filteredData.filter(d => d.tipo_contrato === 'CRA').length}
            </div>
          </div>
          <div style={{ background: 'var(--surface-1)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Duration Média</div>
            <div style={{ fontSize: '20px', fontWeight: 500 }}>
              {filteredData.length > 0
                ? (filteredData.reduce((sum, d) => sum + parseFloat(d.duration), 0) / filteredData.length).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--surface-1)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--border)', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '14px', fontWeight: 500 }}>Filtros</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                style={selectStyle}
              >
                <option value="all">Todos</option>
                <option value="CRI">CRI</option>
                <option value="CRA">CRA</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Taxa Min: {filters.minRate}%
              </label>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={filters.minRate}
                onChange={(e) => setFilters({...filters, minRate: parseFloat(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Taxa Máx: {filters.maxRate}%
              </label>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={filters.maxRate}
                onChange={(e) => setFilters({...filters, maxRate: parseFloat(e.target.value)})}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Pesquisar
              </label>
              <input
                type="text"
                placeholder="Código, devedor, emissor..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Código B3
              </label>
              <input
                type="text"
                placeholder="Ex: CRA0250012Y"
                value={filters.codigoB3Search}
                onChange={(e) => setFilters({...filters, codigoB3Search: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Nome do Devedor
              </label>
              <input
                type="text"
                placeholder="Ex: FS FLORESTAL"
                value={filters.devedorSearch}
                onChange={(e) => setFilters({...filters, devedorSearch: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                style={selectStyle}
              >
                <option value="taxa_indicativa">Taxa Indicativa</option>
                <option value="duration">Duration</option>
                <option value="pu">PU</option>
                <option value="volatilidade">Volatilidade</option>
                <option value="liquidez">Liquidez</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '32px', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontSize: '14px' }}>Carregando dados...</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-muted)' }}>
            Tentando API ANBIMA com múltiplas estratégias...
          </div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)', minWidth: '120px' }}>Código B3</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)', minWidth: '140px' }}>Devedor</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Emissor</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Taxa Ind.</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Vencimento</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Duration</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Rating</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Risco</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr style={{ borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}>
                        <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-accent)', fontSize: '12px' }}>
                          <a
                            href={`https://data.anbima.com.br/certificado-de-recebiveis/${item.codigo_b3}/caracteristicas`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--text-accent)', textDecoration: 'none' }}
                          >
                            {item.codigo_b3}
                          </a>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: item.tipo_contrato === 'CRI' ? 'var(--bg-accent)' : 'var(--bg-success)',
                            color: item.tipo_contrato === 'CRI' ? 'var(--text-accent)' : 'var(--text-success)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            {item.tipo_contrato}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.devedor}
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{item.emissor?.substring(0, 22)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>{item.taxa_indicativa}%</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>{item.data_vencimento?.substring(0, 10)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{item.duration}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            background: 'var(--bg-accent)',
                            color: 'var(--text-accent)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500
                          }}>
                            {item.rating}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: item.risco === 'Alto' ? '#e34948' : item.risco === 'Médio' ? '#eda100' : '#0ca30c', fontWeight: 500 }}>
                          {item.risco}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(expandedRow === item.id ? null : item.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-accent)',
                              fontSize: '14px',
                              padding: '4px'
                            }}
                          >
                            {expandedRow === item.id ? '▼' : '▶'}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === item.id && (
                        <tr>
                          <td colSpan="10">
                            <RowDetails item={item} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '1rem 0',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  background: currentPage === 1 ? 'var(--surface-1)' : 'var(--surface-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                ← Anterior
              </button>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      style={{
                        padding: '6px 12px',
                        background: currentPage === pageNum ? 'var(--text-accent)' : 'var(--surface-1)',
                        color: currentPage === pageNum ? 'white' : 'var(--text-primary)',
                        border: '0.5px solid var(--border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: currentPage === pageNum ? 500 : 400
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  background: currentPage === totalPages ? 'var(--surface-1)' : 'var(--surface-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Próximo →
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Página {currentPage} de {totalPages}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '0.5px solid var(--border)',
                    fontSize: '13px',
                    background: 'var(--surface-0)',
                    color: 'var(--text-primary)',
                    appearance: 'menulist'
                  }}
                >
                  <option value={10}>10 / pág</option>
                  <option value={25}>25 / pág</option>
                  <option value={50}>50 / pág</option>
                  <option value={100}>100 / pág</option>
                </select>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  ({filteredData.length} itens)
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '1rem 0', borderTop: '0.5px solid var(--border)', marginTop: '2rem' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>🔗 Integrações API:</strong>
        </p>
        <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
          <li><strong>ANBIMA API</strong>: Mercado secundário CRI/CRA (cadastro gratuito em developers.anbima.com.br)</li>
          <li><strong>ANBIMA Public Data</strong>: Dados públicos de certificates de recebíveis</li>
          <li><strong>ANBIMA Indices</strong>: Índices de mercado</li>
          <li><strong>Dados Mock</strong>: Fallback automático com 100+ ativos simulados realisticamente</li>
        </ul>
        <p style={{ margin: '8px 0 0 0' }}>
          <strong>Nota:</strong> Para acessar dados reais, clique em "🔑 API Key" e configure seu <strong>Client ID</strong> e <strong>Client Secret</strong> da ANBIMA.
          O sistema usa OAuth 2.0 Client Credentials (POST /oauth/v2/oauth/token com Basic Auth).
          Métricas complementares (liquidez, volatilidade) serão simuladas até integração com B3.
        </p>
      </div>
    </div>
  );
}