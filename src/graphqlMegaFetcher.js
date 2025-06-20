export const API_URL = 'https://api.alienworlds.io/graphql/graphql';

async function graphqlRequest(query, variables = {}) {
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
