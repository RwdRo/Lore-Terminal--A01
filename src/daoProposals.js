const DAO_GRAPHQL_ENDPOINT = '/api/dao/graphql';

export async function fetchDaoProposals() {
  const query = `
    query {
      proposals(limit: 50) {
        id
        title
        author
        created_at
        status
      }
    }`;

  const response = await fetch(DAO_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`);
  }

  const json = JSON.parse(text);

  if (json.errors) {
    const message = json.errors.map((e) => e.message).join(', ');
    throw new Error(message);
  }

  return json.data;
}
