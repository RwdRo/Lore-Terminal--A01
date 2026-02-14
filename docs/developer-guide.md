# Developer Guide

This document provides extra information for contributors and maintainers of the A-01 Canon Terminal.

## Prerequisites

- Node.js 18+ (required for built-in `fetch` support)
- npm

Install dependencies after cloning:

```bash
npm install
```

## Scripts

- `npm run dev` – Start Vite and the Express server concurrently.
- `npm run build` – Build the frontend for production.
- `npm start` – Launch the API server using the contents of `public/`.

## Linting and Tests

Run `npm run lint` before submitting changes.

Unit tests are currently limited; prioritize endpoint validation and manual verification for UI flows.

## Environment Configuration

Create a `.env` file in the project root to override any defaults.
`GITHUB_TOKEN` is strongly recommended to avoid GitHub API rate limits.

```ini
PORT=5174
GITHUB_TOKEN=ghp_your_token_here
HTTPS_PROXY=http://proxy.example:8080
WAX_RPC_ENDPOINTS=https://wax.greymass.com,https://wax.pink.gg,https://api.waxsweden.org
AW_GRAPHQL_ENDPOINTS=https://api.alienworlds.io/graphql,https://graphql.mainnet.alienworlds.io/graphql
DAO_GRAPHQL_ENDPOINTS=https://dao.alienworlds.io/graphql
```

## Folder Overview

```
├── server.js          Express server
├── index.html         Entry point
├── src/               Frontend modules and CSS
└── public/            Static assets / build output
```

## Contributing Workflow

1. Fork the repository and create a new branch.
2. Commit changes with clear messages.
3. Open a pull request describing your changes.
4. Ensure the application runs locally before requesting review.

