export const API_URL = 'https://api.alienworlds.io/graphql/graphql';

async function graphqlRequest(query, variables = {}) {
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });
  } catch (err) {
    throw new Error('Network error: ' + err.message);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error('Non-JSON response:', text);
    throw new Error('Invalid JSON response');
  }

  if (json.errors) {
    const message = json.errors.map(e => e.message).join(', ');
    throw new Error(message);
  }
  return json.data;
}

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
      planet_details{
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
