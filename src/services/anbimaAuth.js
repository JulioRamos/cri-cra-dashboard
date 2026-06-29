/**
 * ANBIMA API Authentication Service
 * 
 * Authentication: OAuth 2.0 Client Credentials flow
 * 
 * Priority for credentials:
 * 1. REACT_APP_ANBIMA_ACCESS_TOKEN (.env) - Direct token (quickest)
 * 2. REACT_APP_ANBIMA_CLIENT_ID + CLIENT_SECRET (.env) - Auto-refresh
 * 3. localStorage (via Dashboard UI)
 * 
 * Reference: https://developers.anbima.com.br/en/documentacao/visao-geral/autenticacao/
 */

const AUTH_URLS = {
  PRODUCTION: 'https://api.anbima.com.br/oauth/access-token',
  SANDBOX: 'https://api.anbima.com.br/sandbox/oauth/access-token'
};

const TOKEN_KEY = 'anbima_access_token';
const TOKEN_EXPIRY_KEY = 'anbima_token_expiry';
const CLIENT_ID_KEY = 'anbima_client_id_stored';
const CLIENT_SECRET_KEY = 'anbima_client_secret_stored';

const CORS_PROXIES = [
  process.env.REACT_APP_CORS_PROXY_1 || 'https://corsproxy.io/?',
  process.env.REACT_APP_CORS_PROXY_2 || 'https://api.allorigins.win/raw?url='
];

/**
 * Gets a token from environment variables (.env) with highest priority
 */
const getTokenFromEnv = () => {
  const token = process.env.REACT_APP_ANBIMA_ACCESS_TOKEN;
  console.log('📋 Checking .env for token...');
  if (token && token.trim()) {
    console.log('✅ Token found in .env! Length:', token.length, 'chars');
    console.log('🔑 First 20 chars:', token.trim().substring(0, 20) + '...');
    return token.trim();
  }
  console.log('❌ No REACT_APP_ANBIMA_ACCESS_TOKEN found in .env');
  console.log('📋 Available .env vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_ANBIMA')));
  return null;
};

/**
 * Gets Client ID from environment variables (.env)
 */
const getClientIdFromEnv = () => {
  return process.env.REACT_APP_ANBIMA_CLIENT_ID || '';
};

/**
 * Gets Client Secret from environment variables (.env)
 */
const getClientSecretFromEnv = () => {
  return process.env.REACT_APP_ANBIMA_CLIENT_SECRET || '';
};

/**
 * Gets a cached token if still valid
 * Priority: .env > localStorage
 */
export const getCachedToken = () => {
  // Priority 1: .env direct token
  const envToken = getTokenFromEnv();
  if (envToken) {
    cacheToken(envToken, 3600); // Cache it for 1 hour
    return envToken;
  }
  
  // Priority 2: localStorage cached token
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return token;
      }
    }
  } catch (e) {
    console.error('Token cache read error:', e);
  }
  return null;
};

/**
 * Caches the token with expiry
 */
const cacheToken = (token, expiresIn) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
    console.log(`🔑 Token cached, expires in ${expiresIn}s`);
  } catch (e) {
    console.error('Token cache write error:', e);
  }
};

/**
 * Exchanges Client ID + Client Secret for an access token
 * Uses OAuth 2.0 Client Credentials flow
 * POST /oauth/v2/oauth/token
 * Authorization: Basic base64(clientId:clientSecret)
 * Body: grant_type=client_credentials
 * 
 * Response: { access_token, token_type, expires_in }
 */
export const getTokenFromCredentials = async (clientId, clientSecret, useSandbox = false) => {
  if (!clientId || !clientSecret) {
    throw new Error('ANBIMA Client ID and Client Secret are required');
  }

  const authUrl = useSandbox ? AUTH_URLS.SANDBOX : AUTH_URLS.PRODUCTION;
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  console.log(`🔑 Requesting ANBIMA token from OAuth endpoint...`);

  const bodyParams = JSON.stringify({ grant_type: 'client_credentials' });
  
  // Try direct first
  for (const attemptUrl of [authUrl, ...CORS_PROXIES.map(p => `${p}${encodeURIComponent(authUrl)}`)]) {
    try {
      console.log(`📡 Trying OAuth at: ${attemptUrl.substring(0, 60)}...`);
      const response = await fetch(attemptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: bodyParams
      });
      
      let data;
      if (response.ok) {
        data = await response.json();
      } else if (response.headers.get('content-type')?.includes('json')) {
        data = await response.json();
        if (data.error) {
          console.log(`❌ OAuth error at ${attemptUrl.substring(0,40)}:`, data.error_description || data.error);
          continue;
        }
      } else {
        console.log(`❌ HTTP ${response.status} at ${attemptUrl.substring(0,40)}`);
        continue;
      }
      
      const token = data.access_token;
      const expiresIn = data.expires_in || 3600;
      
      if (token) {
        console.log(`✅ Token received! Expires in ${expiresIn}s`);
        cacheToken(token, expiresIn);
        return token;
      }
    } catch (e) {
      console.log(`❌ Attempt failed: ${e.message.substring(0, 80)}`);
      continue;
    }
  }
  
  throw new Error('ANBIMA Auth Error: Could not obtain token. Try getting one manually via terminal.');
};

/**
 * Gets a valid token - from cache (.env > localStorage) or by exchanging credentials
 */
export const getValidToken = async () => {
  // Try cache first (includes .env direct token check)
  const cachedToken = getCachedToken();
  if (cachedToken) {
    return cachedToken;
  }
  
  // Try .env Client ID + Secret
  const envClientId = getClientIdFromEnv();
  const envClientSecret = getClientSecretFromEnv();
  if (envClientId && envClientSecret) {
    try {
      console.log('🔑 Using Client ID from .env to get token');
      return await getTokenFromCredentials(envClientId, envClientSecret);
    } catch (err) {
      console.error('Failed to get token from .env credentials:', err.message);
    }
  }
  
  // Try localStorage stored credentials
  const credentials = getStoredCredentials();
  if (credentials) {
    try {
      return await getTokenFromCredentials(credentials.clientId, credentials.clientSecret);
    } catch (err) {
      console.error('Failed to refresh token from stored credentials:', err.message);
      clearAuthData();
      throw err;
    }
  }
  
  throw new Error('No ANBIMA credentials found. Configure in .env or click 🔑 API Key.');
};

/**
 * Stores ANBIMA credentials in localStorage
 */
export const saveCredentials = (clientId, clientSecret) => {
  if (!clientId || !clientSecret) {
    throw new Error('Client ID and Client Secret are required');
  }
  try {
    localStorage.setItem(CLIENT_ID_KEY, clientId);
    localStorage.setItem(CLIENT_SECRET_KEY, clientSecret);
    // Clear old tokens so they get refreshed
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    console.log('✅ ANBIMA credentials saved');
  } catch (e) {
    console.error('Credentials save error:', e);
    throw e;
  }
};

/**
 * Gets stored credentials
 */
export const getStoredCredentials = () => {
  try {
    const clientId = localStorage.getItem(CLIENT_ID_KEY);
    const clientSecret = localStorage.getItem(CLIENT_SECRET_KEY);
    if (clientId && clientSecret) {
      return { clientId, clientSecret };
    }
  } catch (e) {
    console.error('Credentials read error:', e);
  }
  return null;
};

/**
 * Checks if credentials are configured
 */
export const hasCredentials = () => {
  return !!getStoredCredentials();
};

/**
 * Clears all authentication data
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(CLIENT_ID_KEY);
    localStorage.removeItem(CLIENT_SECRET_KEY);
    console.log('🗑️ ANBIMA auth data cleared');
  } catch (e) {
    console.error('Auth clear error:', e);
  }
};

/**
 * Gets authorization headers for API requests
 * Priority: .env token > .env credentials > localStorage > no auth
 */
export const getAuthHeaders = async () => {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const clientId = getClientIdFromEnv();
  if (clientId) {
    headers['client_id'] = clientId;
  }
  
  try {
    const token = await getValidToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['access_token'] = token;
      console.log('🔐 Using Bearer + access_token from .env');
    }
  } catch (err) {
    console.log('⚠️ No auth token available, trying without auth:', err.message);
  }
  
  return headers;
};

export default {
  getTokenFromCredentials,
  getValidToken,
  saveCredentials,
  getStoredCredentials,
  hasCredentials,
  clearAuthData,
  getAuthHeaders,
  getCachedToken
};