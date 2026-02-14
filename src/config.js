const DEFAULTS = {
  waxChainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
  waxRpcEndpoints: [
    'https://wax.greymass.com',
    'https://wax.pink.gg',
    'https://api.waxsweden.org'
  ],
  alienWorldsGraphqlEndpoints: [
    'https://api.alienworlds.io/graphql',
    'https://graphql.mainnet.alienworlds.io/graphql'
  ],
  daoGraphqlEndpoints: [
    'https://dao.alienworlds.io/graphql'
  ]
};

function splitCsv(value, fallback) {
  if (!value) return fallback;
  const list = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length > 0 ? list : fallback;
}

export const appConfig = {
  waxChainId: import.meta.env.VITE_WAX_CHAIN_ID || DEFAULTS.waxChainId,
  waxRpcEndpoints: splitCsv(import.meta.env.VITE_WAX_RPC_ENDPOINTS, DEFAULTS.waxRpcEndpoints),
  alienWorldsGraphqlEndpoints: splitCsv(
    import.meta.env.VITE_AW_GRAPHQL_ENDPOINTS,
    DEFAULTS.alienWorldsGraphqlEndpoints
  ),
  daoGraphqlEndpoints: splitCsv(import.meta.env.VITE_DAO_GRAPHQL_ENDPOINTS, DEFAULTS.daoGraphqlEndpoints)
};
