export const API_URL = 'https://api.alienworlds.io/graphql/graphql';

async function graphqlRequest(query, variables = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('[GraphQL] Request failed:', res.status, text);
      throw new Error(`HTTP ${res.status}`);
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error('[GraphQL] Failed parsing response:', text);
      throw e;
    }

    if (json.errors) {
      console.error('[GraphQL] Errors:', json.errors);
      const message = json.errors.map(e => e.message).join('; ');
      throw new Error(message);
    }

    return json.data;
  } catch (error) {
    console.error('[GraphQL] Error fetching data:', error);
    throw error;
  }
}

export async function fetchWalletDetails(account) {
  const query = `query($account:String!){ wallet_details(account:$account){ account stake votes last_vote_time } }`;
  const data = await graphqlRequest(query, { account });
  return data.wallet_details;
}

export async function fetchPlanetDetails() {
  const query = `{ planet_details { name population reward_pool active_users } }`;
  const data = await graphqlRequest(query);
  return data.planet_details;
}

export async function fetchDaoInfo() {
  const query = `query{ dao_wallet_details { name token_balance } TokeLore { proposals { id title status yes_votes no_votes } } }`;
  const data = await graphqlRequest(query);
  return data;
}

export { graphqlRequest };
