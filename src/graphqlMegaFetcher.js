// GraphQL endpoint routed through Vite dev proxy
export const API_URL = '/aw-graphql';

// === CACHING UTILITIES ===
function getCacheKey(query, variables) {
  return `gql:${query}-${JSON.stringify(variables)}`;
}

function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > 60 * 60 * 1000) return null; // 1 hour expiry
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    console.warn('[GraphQL] Cache save failed:', e);
  }
}

// === MAIN FETCHER ===
async function graphqlRequest(query, variables = {}) {
  const key = getCacheKey(query, variables);
  const cached = loadCache(key);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (response.status !== 200) {
      throw new Error(`${API_URL} HTTP ${response.status}`);
    }

    if (contentType.includes('text/html') || text.trim().startsWith('<')) {
      throw new Error('Unexpected HTML response');
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON response');
    }

    if (json.errors) {
      const message = json.errors.map(e => e.message).join(', ');
      throw new Error(message);
    }

    saveCache(key, json.data);
    return json.data;

  } catch (err) {
    if (cached) return cached;
    console.error('[GraphQL] Request failed:', err);
    throw err;
  }
}

// === CUSTOM FETCHERS ===
export async function fetchWalletDetails(account) {
  const query = `
    query($account:String!){
      wallet_details(account:$account){
        account
        stake
        votes
        last_vote_time
      }
    }`;
  const data = await graphqlRequest(query, { account });
  return data?.wallet_details;
}

export async function fetchPlanetDetails() {
  const query = `
    query{
      planet_details {
        name
        population
        reward_pool
        active_users
      }
    }`;
  const data = await graphqlRequest(query);
  const planetDetails = data?.planet_details?.[0];
  if (!planetDetails) throw new Error('No data received from planet_details');
  return data.planet_details;
}

export async function fetchDaoInfo() {
  const query = `
    query{
      dao_wallet_details {
        name
        token_balance
      }
      TokeLore {
        proposals {
          id
          title
          status
          yes_votes
          no_votes
        }
      }
    }`;
  const data = await graphqlRequest(query);
  return data;
}

export { graphqlRequest };
