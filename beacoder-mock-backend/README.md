# beacoder-mock-backend

Node.js and Express backend for the Beacoder mock assessment application.

## Requirements

- Node.js 18 or newer
- npm

## Install dependencies

From this directory, run:

```bash
npm install
```

## Start the backend

Development mode with automatic restart:

```bash
npm run dev
```

Normal start:

```bash
npm start
```

The backend runs on:

```text
http://localhost:3010
```

## Available endpoints

Get a test configuration:

```text
GET /api/v1/mock/tests/TEST_MERN_001
```

Register a candidate:

```text
POST /api/v1/mock/registrations
```

## Data files

- `data/tests.json` contains test configurations.
- `data/candidates.json` contains registered candidates.

If `data/candidates.json` is missing, the backend creates it automatically with an empty candidate list.

## Example test URLs

```text
TEST_MERN_001
TEST_JAVA_001
```
