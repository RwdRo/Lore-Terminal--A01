# Developer Guide

This document provides extra information for contributors and maintainers of the A-01 Canon Terminal.

## Prerequisites

- Node.js 18+
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

There are currently no automated lint or test scripts. Please ensure code
is formatted consistently and tested manually before submitting a pull request.

## Environment Configuration

Create a `.env` file in the project root to override any defaults.
Only `GITHUB_TOKEN` is required for full functionality. Example:

```ini
PORT=5174
GITHUB_TOKEN=ghp_your_token_here
HTTPS_PROXY=http://proxy.example:8080
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

