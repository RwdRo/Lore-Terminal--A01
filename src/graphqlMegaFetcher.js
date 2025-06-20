export const API_URL = 'https://api.alienworlds.io/graphql/graphql';

async function graphqlRequest(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (!json || !json.data) throw new Error('Invalid GraphQL response');
  return json;
}

export async function fetchWalletDetails(account) {
  const query = `query($account:String!){ wallet_details(account:$account){ account stake votes last_vote_time } }`;
  const response = await graphqlRequest(query, { account });
  return response.data?.wallet_details;
}

export async function fetchPlanetDetails() {
  const query = `{ planet_details { name population reward_pool active_users } }`;
  const response = await graphqlRequest(query);
  const planetDetails = response?.data?.planet_details?.[0];
  if (!planetDetails) throw new Error('No data received from planet_details');
  return response.data.planet_details;
}

export async function fetchDaoInfo() {
  const query = `query{ dao_wallet_details { name token_balance } TokeLore { proposals { id title status yes_votes no_votes } } }`;
  const response = await graphqlRequest(query);
  return response.data;
}

export { graphqlRequest };
