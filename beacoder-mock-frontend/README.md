# beacoder-mock-frontend

React frontend for the Beacoder mock assessment application.

## Requirements

- Node.js 18 or newer
- npm
- The mock backend running on `http://localhost:3010`

## Install dependencies

From this directory, run:

```bash
npm install
```

## Start the frontend

```bash
npm run dev
```

Vite will print the local development URL in the terminal, normally:

```text
http://localhost:5173
```

## Open the registration page

Use a configured test ID in the URL:

```text
http://localhost:5173/test/TEST_MERN_001
```

Or:

```text
http://localhost:5173/test/TEST_JAVA_001
```

The page loads the selected test configuration from the backend before displaying the registration form.

## Create a production build

```bash
npm run build
```

The generated `dist` directory is ignored by Git.

## Run order

1. Start the backend from `beacoder-mock-backend`.
2. Start the frontend from `beacoder-mock-frontend`.
3. Open a test URL in the browser.
