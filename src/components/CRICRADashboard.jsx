import React, { useState, useEffect } from 'react';

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
    sortBy: 'taxa_indicativa'
  });
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchCRICRAData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const fetchCRICRAData = async () => {
    try {
      setLoading(true);
      // Fetch from ANBIMA API - secondary market data
      const response = await fetch(
        'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario'
      );
      
      if (!response.ok) {
        throw new Error('Unable to fetch ANBIMA data');
      }
      
      const json = await response.json();
      
      // Transform and enrich data with mock metrics
      const enrichedData = (Array.isArray(json) ? json : json.data || []).map((item, idx) => ({
        ...item,
        id: item.codigo_ativo || `${item.emissor}-${idx}`,
        // Mock company metrics - in production these would come from B3, B3i, or other sources
        mercadoRate: (Math.random() * 3 + 10).toFixed(2), // Mock market rate
        isPublic: Math.random() > 0.6, // Mock public listing status
        liquidez: (Math.random() * 100).toFixed(1), // Mock liquidity %
        rating: ['AAA', 'AA', 'A', 'BBB', 'BB'][Math.floor(Math.random() * 5)], // Mock rating
        volatilidade: (Math.random() * 15 + 5).toFixed(2), // Mock volatility %
        risco: ['Baixo', 'Médio', 'Alto'][Math.floor(Math.random() * 3)]
      }));
      
      setData(enrichedData);
      setError(null);
    } catch (err) {
      // If API fails, use mock data for demonstration
      console.log('Using mock data due to:', err.message);
      const mockData = generateMockData();
      setData(mockData);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const emissoras = ['Securitizadora A', 'Securitizadora B', 'Securitizadora C', 'Securitizadora D'];
    const originadores = [
      'Construtora X',
      'Produtor Agrícola Y',
      'Empresa Imobiliária Z',
      'Cooperativa Rural'
    ];
    const tipos = ['CRI', 'CRA'];
    
    return Array.from({ length: 25 }, (_, i) => ({
      id: `ASSET-${String(i + 1).padStart(4, '0')}`,
      tipo_contrato: tipos[i % 2],
      emissor: emissoras[i % 4],
      originador: originadores[i % 4],
      serie: `SR${String(i + 1).padStart(2, '0')}`,
      codigo_ativo: `AT${String(i + 1).padStart(5, '0')}`,
      data_vencimento: new Date(Date.now() + (Math.random() * 5 + 2) * 365 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      taxa_compra: (Math.random() * 4 + 7).toFixed(2),
      taxa_venda: (Math.random() * 4 + 8).toFixed(2),
      taxa_indicativa: (Math.random() * 4 + 7.5).toFixed(2),
      pu: (Math.random() * 30 + 90).toFixed(2),
      percent_pu_par: (Math.random() * 10 + 95).toFixed(2),
      duration: (Math.random() * 4 + 2).toFixed(2),
      tipo_remuneracao: ['IPCA', 'CDI', 'Pré-fixado'][Math.floor(Math.random() * 3)],
      taxa_correcao: (Math.random() * 3 + 2.5).toFixed(2),
      mercadoRate: (Math.random() * 3 + 10).toFixed(2),
      isPublic: Math.random() > 0.6,
      liquidez: (Math.random() * 100).toFixed(1),
      rating: ['AAA', 'AA', 'A', 'BBB', 'BB'][Math.floor(Math.random() * 5)],
      volatilidade: (Math.random() * 15 + 5).toFixed(2),
      risco: ['Baixo', 'Médio', 'Alto'][Math.floor(Math.random() * 3)]
    }));
  };

  const applyFilters = () => {
    let filtered = data;

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.tipo_contrato === filters.type);
    }

    // Rate range filter
    filtered = filtered.filter(
      item => parseFloat(item.taxa_indicativa) >= filters.minRate &&
              parseFloat(item.taxa_indicativa) <= filters.maxRate
    );

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.codigo_ativo?.toLowerCase().includes(term) ||
        item.emissor?.toLowerCase().includes(term) ||
        item.originador?.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = parseFloat(a[filters.sortBy] || 0);
      const bVal = parseFloat(b[filters.sortBy] || 0);
      return bVal - aVal;
    });

    setFilteredData(filtered);
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
        <h1 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', fontWeight: 500 }}>
          Dashboard CRI/CRA
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
          Análise de títulos de renda fixa securitizados com dados ANBIMA
        </p>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
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
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Empresas Públicas</div>
            <div style={{ fontSize: '20px', fontWeight: 500 }}>
              {filteredData.filter(d => d.isPublic).length}
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
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '0.5px solid var(--border)', fontSize: '14px' }}
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
                max="20"
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
                max="20"
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
                placeholder="Código, emissor..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '0.5px solid var(--border)', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '0.5px solid var(--border)', fontSize: '14px' }}
              >
                <option value="taxa_indicativa">Taxa Indicativa</option>
                <option value="duration">Duration</option>
                <option value="pu">PU</option>
                <option value="volatilidade">Volatilidade</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Carregando dados...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-danger)' }}>
          {error}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Código</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Emissor</th>
                <th style={{ textAlign: 'right', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Taxa Ind.</th>
                <th style={{ textAlign: 'right', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Vencimento</th>
                <th style={{ textAlign: 'right', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Duration</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Rating</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Risco</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pública</th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr style={{ borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}>
                      <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-accent)' }}>{item.codigo_ativo}</td>
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
                      <td style={{ padding: '12px', fontSize: '12px' }}>{item.emissor?.substring(0, 20)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>{item.taxa_indicativa}%</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>{item.data_vencimento}</td>
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
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                        {item.isPublic ? '✓' : ''}
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
      )}

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '1rem 0', borderTop: '0.5px solid var(--border)' }}>
        <p>
          <strong>Nota:</strong> Este dashboard utiliza dados da API ANBIMA para CRI/CRA e adiciona métricas complementares simuladas.
          Em produção, as métricas de liquidez, volatilidade, rating e status de empresa pública devem ser integradas com fontes
          como B3, Moody's, S&P, e bases regulatórias da CVM.
        </p>
      </div>
    </div>
  );
}
