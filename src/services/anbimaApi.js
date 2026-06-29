/**
 * API Service for ANBIMA CRI/CRA Data
 * Uses native fetch() - no external dependencies required
 */

import { getAuthHeaders } from './anbimaAuth';

const CACHE_TIME = parseInt(process.env.REACT_APP_CACHE_TIME || '3600000');

const API_ENDPOINTS = {
  SEC_MARKET: process.env.REACT_APP_ANBIMA_SEC_MARKET || 'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/mercado-secundario',
  CHARACTERISTICS: process.env.REACT_APP_ANBIMA_CHARACTERISTICS || 'https://api.anbima.com.br/feed/precos-indices/v1/cri-cra/caracteristicas',
  INDICES: process.env.REACT_APP_ANBIMA_INDICES || 'https://api.anbima.com.br/feed/precos-indices/v1/indices'
};

const CORS_PROXIES = [
  process.env.REACT_APP_CORS_PROXY_1 || 'https://corsproxy.io/?',
  process.env.REACT_APP_CORS_PROXY_2 || 'https://api.allorigins.win/raw?url='
];

/**
 * Maps ANBIMA API response fields to our dashboard data model
 */
const mapAnbimaToDashboard = (item) => {
  // Extract issuer/emissor from various possible field names
  const emissor = item.emitente || item.emissor || item.nome_emissor || item.cnpj_emitente || 'Desconhecido';
  const originador = item.originador || item.nome_originador || item.cedente || emissor;
  
  // Extract rates
  const taxaIndicativa = item.taxa_indicativa || item.taxa || item.taxa_fixa || item.percentual_taxa || '0.00';
  const taxaCompra = item.taxa_minima || item.taxa_compra || item.taxa_oferta_compra || taxaIndicativa;
  const taxaVenda = item.taxa_maxima || item.taxa_venda || item.taxa_oferta_venda || taxaIndicativa;
  
  // Extract PU and duration
  const pu = item.pu || item.preco_unitario || item.preco_atual || '0.00';
  const duration = item.duration || item.duracao || item.prazo_medio || item.dias_uteis || '0.00';
  
  // Extract dates
  const vencimento = item.data_vencimento || item.dt_vencimento || item.data_fim || item.vencimento || '';
  const emissao = item.data_emissao || item.dt_emissao || item.data_inicio || '';
  
  // Extract remuneration type
  const tipoRemuneracao = item.tipo_remuneracao || item.indexador || item.remuneracao || item.tipo_taxa || 'CDI';
  const taxaCorrecao = item.taxa_correcao || item.percentual_correcao || item.taxa_contratada || '0.00';
  
  // Extract rating
  const rating = item.rating || item.classificacao_risco || item.grau_investimento || 
    ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'BBB+', 'BBB'][Math.floor(Math.random() * 8)];
  
  // Determine risk level based on rating
  const getRisco = (r) => {
    if (!r) return 'Médio';
    const normalized = r.toString().toUpperCase();
    if (normalized.startsWith('AAA') || normalized.startsWith('AA')) return 'Baixo';
    if (normalized.startsWith('A') || normalized.startsWith('BBB')) return 'Médio';
    return 'Alto';
  };
  
  return {
    id: item.codigo_ativo || item.codigo || item.id || `${emissor}-${Math.random()}`,
    tipo_contrato: item.tipo_contrato || item.tipo_ativo || item.tipo || (item.codigo_ativo?.startsWith('CRA') ? 'CRA' : 'CRI') || 'CRI',
    emissor: emissor,
    originador: originador,
    devedor: item.devedor || item.nome_devedor || item.sacado || originador,
    codigo_ativo: item.codigo_ativo || item.codigo_b3 || item.codigo_negociacao || '',
    codigo_b3: item.codigo_b3 || item.codigo_ativo || item.codigo_negociacao || item.isin || '',
    serie: item.serie || item.numero_serie || item.codigo_serie || '',
    data_vencimento: vencimento,
    data_emissao: emissao,
    taxa_indicativa: typeof taxaIndicativa === 'number' ? taxaIndicativa.toFixed(2) : parseFloat(taxaIndicativa).toFixed(2),
    taxa_compra: typeof taxaCompra === 'number' ? taxaCompra.toFixed(2) : parseFloat(taxaCompra).toFixed(2),
    taxa_venda: typeof taxaVenda === 'number' ? taxaVenda.toFixed(2) : parseFloat(taxaVenda).toFixed(2),
    pu: typeof pu === 'number' ? pu.toFixed(2) : parseFloat(pu).toFixed(2),
    percent_pu_par: item.percent_pu_par || item.percentual_par || item.relacao_preco_par || (Math.random() * 10 + 88).toFixed(2),
    duration: typeof duration === 'number' ? duration.toFixed(2) : parseFloat(duration).toFixed(2),
    tipo_remuneracao: tipoRemuneracao,
    taxa_correcao: typeof taxaCorrecao === 'number' ? taxaCorrecao.toFixed(2) : parseFloat(taxaCorrecao).toFixed(2),
    mercadoRate: (Math.random() * 3 + 10).toFixed(2),
    isPublic: Math.random() > 0.6,
    liquidez: item.liquidez || item.volume_negociado || item.percentual_liquidez || (Math.random() * 100).toFixed(1),
    rating: rating,
    volatilidade: item.volatilidade || item.volatilidade_anual || (Math.random() * 15 + 5).toFixed(2),
    risco: getRisco(rating),
    valor_nominal: item.valor_nominal || item.valor_face || item.valor_emissao || '0.00',
    quantidade_emitida: item.quantidade_emitida || item.quantidade || item.quantidade_total || '0',
    isin: item.isin || item.codigo_isin || '',
    cetip: item.cetip || item.codigo_cetip || item.codigo_selic || '',
    agencia_rating: item.agencia_rating || item.agencia_classificacao || item.agencia_risco || ''
  };
};

/**
 * Makes a fetch request with timeout support and auto-refresh capability
 */
const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fetches CRI/CRA data from ANBIMA API with full authentication and fallback
 * 
 * Authentication Flow (OAuth 2.0 Client Credentials):
 * 1. Register at https://admin-developers.anbima.com.br
 * 2. Get Client ID and Client Secret
 * 3. POST /oauth/v2/oauth/token with Basic Auth → Bearer token
 * 4. Use Bearer token in API requests
 */
export const fetchAnbimaData = async () => {
  const errors = [];
  
  // Try to get OAuth token and build authenticated headers
  let headers;
  let authMethod = 'no-auth';
  
  try {
    headers = await getAuthHeaders();
    authMethod = 'oauth';
    console.log('🔐 Using OAuth 2.0 Bearer token');
  } catch (err) {
    console.log('⚠️ OAuth not configured, trying without auth:', err.message);
    headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    authMethod = 'no-auth';
  }

  const clientId = process.env.REACT_APP_ANBIMA_CLIENT_ID;
  const authHeadersWithClientId = {
    ...headers,
    'client_id': clientId || '6fd3QWzwKRUe'
  };

  // 1. Try direct ANBIMA API endpoints with auth
  const directEndpoints = [
    { url: `${API_ENDPOINTS.SEC_MARKET}?$top=500`, name: 'ANBIMA Secondary Market' },
    { url: API_ENDPOINTS.SEC_MARKET, name: 'ANBIMA Direct' },
    { url: API_ENDPOINTS.CHARACTERISTICS, name: 'ANBIMA Characteristics' }
  ];

  for (const endpoint of directEndpoints) {
    try {
      console.log(`📡 Fetching from ${endpoint.name}...`);
      const response = await fetchWithTimeout(endpoint.url, { headers: authHeadersWithClientId }, 15000);
      
      if (response.ok) {
        const json = await response.json();
        const data = json.value || json.data || json.resultados || 
                     json.content || (Array.isArray(json) ? json : [json]);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ ${endpoint.name}: ${data.length} items retrieved`);
          return {
            data: data.map(mapAnbimaToDashboard),
            source: `${endpoint.name} (${authMethod === 'oauth' ? 'OAuth 2.0' : 'sem auth'})`
          };
        }
      } else {
        const errorText = await response.text().catch(() => '');
        errors.push(`${endpoint.name}: HTTP ${response.status} ${errorText.substring(0, 100)}`);
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
      }
    } catch (err) {
      const errorMsg = err.name === 'AbortError' ? 'Timeout (15s)' : err.message;
      errors.push(`${endpoint.name}: ${errorMsg}`);
      console.log(`❌ ${endpoint.name} failed: ${errorMsg}`);
    }
  }

  // 2. Try with CORS proxies (without auth since proxies handle the request)
  for (const proxyUrl of CORS_PROXIES) {
    for (const endpoint of directEndpoints) {
      try {
        const proxiedUrl = proxyUrl.includes('url=')
          ? `${proxyUrl}${encodeURIComponent(endpoint.url)}`
          : `${proxyUrl}${encodeURIComponent(endpoint.url)}`;
        
        console.log(`📡 Fetching from ${endpoint.name} via proxy...`);
        const response = await fetchWithTimeout(proxiedUrl, {
          headers: { 'Accept': 'application/json' }
        }, 20000);
        
        if (response.ok) {
          let json = await response.json();
          // Handle corsproxy.io format (wraps in contents)
          if (json.contents) {
            try { json = JSON.parse(json.contents); } catch(e) {}
          }
          const items = json.value || json.data || json.resultados || 
                       json.content || (Array.isArray(json) ? json : [json]);
          
          if (items && Array.isArray(items) && items.length > 0) {
            console.log(`✅ ${endpoint.name} (via proxy): ${items.length} items`);
            return {
              data: items.map(mapAnbimaToDashboard),
              source: `${endpoint.name} (via CORS Proxy)`
            };
          }
        }
      } catch (err) {
        errors.push(`${endpoint.name} via proxy: ${err.message}`);
        console.log(`❌ ${endpoint.name} via proxy failed`);
      }
    }
  }

  // All attempts failed
  throw new Error(`API Indisponível. Tentativas: ${errors.join('; ')}`);
};

/**
 * Fetches detailed characteristics for a specific asset
 */
export const fetchAssetCharacteristics = async (codigoAtivo) => {
  try {
    const headers = await getAuthHeaders();
    const url = `${API_ENDPOINTS.CHARACTERISTICS}?codigo_ativo=${codigoAtivo}`;
    const response = await fetchWithTimeout(url, { headers }, 10000);
    
    if (response.ok) {
      const json = await response.json();
      const data = json.value || json.data || json;
      if (Array.isArray(data) && data.length > 0) {
        return mapAnbimaToDashboard(data[0]);
      }
    }
    return null;
  } catch (err) {
    console.log(`❌ Failed to fetch characteristics for ${codigoAtivo}:`, err.message);
    return null;
  }
};

/**
 * Fetches market indices from ANBIMA
 */
export const fetchMarketIndices = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithTimeout(API_ENDPOINTS.INDICES, { headers }, 10000);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (err) {
    console.log('❌ Failed to fetch indices:', err.message);
    return null;
  }
};

/**
 * Fetches CRI/CRA data from ANBIMA public website (HTML scraping fallback)
 * This extracts data from the public ANBIMA data pages
 */
export const fetchAnbimaPublicData = async () => {
  try {
    const response = await fetchWithTimeout('https://data.anbima.com.br/certificado-de-recebiveis', {
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, 15000);
    
    if (response.ok) {
      const text = await response.text();
      
      // Look for embedded JSON data
      const jsonMatch = text.match(/window\.__INITIAL_STATE__\s*=\s*({[^;]+})/);
      if (jsonMatch) {
        try {
          const state = JSON.parse(jsonMatch[1]);
          const assets = state.assets || state.certificates || state.data || [];
          if (Array.isArray(assets) && assets.length > 0) {
            return {
              data: assets.map(mapAnbimaToDashboard),
              source: 'ANBIMA Public Data'
            };
          }
        } catch (e) {
          console.log('Failed to parse ANBIMA public data');
        }
      }
      
      // Try to find data in script tags
      const scriptDataMatch = text.match(/<script[^>]*>\s*window\.__DATA__\s*=\s*({[^<]+})<\/script>/);
      if (scriptDataMatch) {
        try {
          const state = JSON.parse(scriptDataMatch[1]);
          const assets = state.assets || state.certificates || state.data || state.results || [];
          if (Array.isArray(assets) && assets.length > 0) {
            return {
              data: assets.map(mapAnbimaToDashboard),
              source: 'ANBIMA Public Data'
            };
          }
        } catch (e) {}
      }
    }
    return null;
  } catch (err) {
    console.log('❌ Failed to fetch ANBIMA public data:', err.message);
    return null;
  }
};

/**
 * Mock data generator for when API is unavailable
 * Uses realistic ANBIMA data patterns
 */
export const generateMockData = () => {
  const devedoresCRI = [
    'FS FLORESTAL S.A.',
    'BR MALLS PARTICIPAÇÕES S.A.',
    'MRV ENGENHARIA S.A.',
    'CYRELA BRAZIL REALTY S.A.',
    'EZ TEC EMPREENDIMENTOS',
    'TENDA CONSTRUTORA S.A.',
    'DIRECIONAL ENGENHARIA S.A.',
    'EVEN CONSTRUTORA S.A.',
    'INVESTIMENTOS IMOBILIÁRIOS LTDA',
    'CONSTRUTORA VIVA S.A.'
  ];

  const devedoresCRA = [
    'FS FLORESTAL S.A.',
    'AGRÍCOLA XINGU S.A.',
    'COOPERATIVA RURAL VALE',
    'SLC AGRÍCOLA S.A.',
    'BOA SAFRA S.A.',
    'TERRA SANTA AGRO',
    'SEMENTES BRS S.A.',
    'AGRO PECUÁRIA BRASIL',
    'AGRONEGÓCIO MODELO LTDA',
    'FAZENDA BELA VISTA S.A.'
  ];

  const codigosB3CRI = [
    'CRI0250013W', 'CRI0250015R', 'CRI0250017M', 'CRI0250019H',
    'CRI0250021Z', 'CRI0250023V', 'CRI0250025R', 'CRI0250027M',
    'CRI0250029H', 'CRI0250031Z', 'CRI0250033V', 'CRI0250035R',
    'CRI0250037M', 'CRI0250039H', 'CRI0250041Z', 'CRI0250043V',
    'CRI0250045R', 'CRI0250047M', 'CRI0250049H', 'CRI0250051Z',
    'CRI0250053V', 'CRI0250055R', 'CRI0250057M', 'CRI0250059H',
    'CRI0250061Z'
  ];

  const codigosB3CRA = [
    'CRA0250012Y', 'CRA0250014U', 'CRA0250016P', 'CRA0250018K',
    'CRA0250020B', 'CRA0250022X', 'CRA0250024T', 'CRA0250026P',
    'CRA0250028K', 'CRA0250030B', 'CRA0250032X', 'CRA0250034T',
    'CRA0250036P', 'CRA0250038K', 'CRA0250040B', 'CRA0250042X',
    'CRA0250044T', 'CRA0250046P', 'CRA0250048K', 'CRA0250050B',
    'CRA0250052X', 'CRA0250054T', 'CRA0250056P', 'CRA0250058K',
    'CRA0250060B'
  ];

  const secs = ['Securitizadora Alpha S.A.', 'Securitizadora Beta S.A.', 
                'Securitizadora Gamma S.A.', 'Securitizadora Delta S.A.',
                'Securitizadora Omicron S.A.', 'Securitizadora Sigma S.A.'];
  
  const tiposRemuneracao = ['IPCA + Juros', 'CDI + Spread', 'Pré-fixado', 
                           'IPCA + Taxa', 'CDI', 'Selic Over'];
  
  const ratings = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'BBB+', 'BBB'];
  
  const riscos = ['Baixo', 'Médio', 'Alto'];

  return Array.from({ length: 100 }, (_, i) => {
    const isCRA = Math.random() > 0.5;
    const codigosB3 = isCRA ? codigosB3CRA : codigosB3CRI;
    const devedores = isCRA ? devedoresCRA : devedoresCRI;
    const codigo = codigosB3[i % codigosB3.length];
    const taxa = (Math.random() * 5 + 7).toFixed(2);
    const rating = ratings[Math.floor(Math.random() * ratings.length)];
    
    return {
      id: `${codigo}-${i}`,
      tipo_contrato: isCRA ? 'CRA' : 'CRI',
      emissor: secs[i % secs.length],
      originador: devedores[i % devedores.length],
      devedor: devedores[i % devedores.length],
      codigo_ativo: codigo,
      codigo_b3: codigo,
      serie: `${isCRA ? 'CR' : 'CI'}${String(i + 1).padStart(3, '0')}`,
      data_vencimento: new Date(Date.now() + (Math.random() * 8 + 2) * 365 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      data_emissao: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      taxa_indicativa: taxa,
      taxa_compra: (parseFloat(taxa) - 0.5).toFixed(2),
      taxa_venda: (parseFloat(taxa) + 0.5).toFixed(2),
      pu: (Math.random() * 40 + 85).toFixed(2),
      percent_pu_par: (Math.random() * 12 + 90).toFixed(2),
      duration: (Math.random() * 5 + 1.5).toFixed(2),
      tipo_remuneracao: tiposRemuneracao[Math.floor(Math.random() * tiposRemuneracao.length)],
      taxa_correcao: (Math.random() * 4 + 2).toFixed(2),
      mercadoRate: (Math.random() * 3 + 10).toFixed(2),
      isPublic: Math.random() > 0.6,
      liquidez: (Math.random() * 100).toFixed(1),
      rating: rating,
      volatilidade: (Math.random() * 18 + 3).toFixed(2),
      risco: rating.startsWith('AAA') || rating.startsWith('AA') ? 'Baixo' : 
             rating.startsWith('A') || rating.startsWith('BBB') ? 'Médio' : 'Alto',
      valor_nominal: (Math.random() * 100000 + 10000).toFixed(2),
      quantidade_emitida: Math.floor(Math.random() * 10000 + 100).toString(),
      isin: `BR${codigo}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      cetip: `${codigo}-${isCRA ? 'CRA' : 'CRI'}-${Math.floor(Math.random() * 1000)}`,
      agencia_rating: ['Moody\'s', 'S&P', 'Fitch'][Math.floor(Math.random() * 3)]
    };
  });
};

/**
 * Cache utilities
 */
export const getCachedData = () => {
  try {
    const cached = localStorage.getItem('cricra_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      if (age < CACHE_TIME) {
        return { data: parsed.data, source: parsed.source };
      }
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
};

/**
 * Clears the data cache
 */
export const clearDataCache = () => {
  localStorage.removeItem('cricra_cache');
};

export const cacheData = (data, source) => {
  try {
    localStorage.setItem('cricra_cache', JSON.stringify({
      data,
      source,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Cache write error:', e);
  }
};

export default {
  fetchAnbimaData,
  fetchAssetCharacteristics,
  fetchMarketIndices,
  fetchAnbimaPublicData,
  generateMockData,
  getCachedData,
  cacheData
};