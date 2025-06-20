# A-01 Canon Terminal

This project is a web application for exploring **Alien Worlds** lore.
It is built with [Vite](https://vitejs.dev/) for the frontend and an
[Express](https://expressjs.com/) server for backend API routes. The
application fetches canon lore and proposed additions from GitHub and
provides a terminal-style interface for users.

## Features

- **Lore Library** – browse canon and proposed lore pulled from GitHub
- **WAX Wallet Login** – authentication handled via WharfKit
- **Interactive Maps** – view planet information and details
- **Voting** – displays DAO proposals and allows simple voting (stub)
- **Formatting Assistant** – convert text into markdown for pull requests

## Requirements

- Node.js 18 or later
- npm

## Installation

1. Clone this repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file to configure runtime options (see below).

## Environment Variables

The server reads several variables from the environment:

- `PORT` – Port to run the Express server (defaults to `5174`).
- `GITHUB_TOKEN` – Personal token used to fetch lore from GitHub.
- `HTTPS_PROXY` – Optional proxy URL if outbound HTTPS requires it.

## Development

Run the development server which starts Vite and the API server:

```bash
npm run dev
```

The frontend is served from `public/` and hot reloaded by Vite. The
Express server runs from `server.js` and proxies API requests.

## Building

Create a production build of the frontend:

```bash
npm run build
```

Then start the server:

```bash
npm start
```

## Project Structure

- `server.js` – Express API server
- `src/` – frontend JavaScript modules and styles
- `public/` – static assets and built files
- `index.html` – application entry point for Vite

## Contributing

1. Fork this repository and create a feature branch.
2. Make your changes and commit with descriptive messages.
3. Open a pull request for review.

Issues and feature requests are welcome!

