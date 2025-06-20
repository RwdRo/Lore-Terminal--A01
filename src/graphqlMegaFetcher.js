export const API_URL = 'https://api.alienworlds.io/graphql/graphql';

async function graphqlRequest(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    const message = json.errors.map(e => e.message).join('; ');
    throw new Error(message);
  }
  return json.data;
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
