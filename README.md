# beacoder-mock

Simple online mock interview and technical assessment application.

## Project structure

- `beacoder-mock-backend` - Node.js and Express API with JSON file storage.
- `beacoder-mock-frontend` - React and Vite registration interface.

## Run the project

Open two terminals.

### Terminal 1: backend

```bash
cd beacoder-mock-backend
npm install
npm run dev
```

The backend runs on `http://localhost:3010`.

### Terminal 2: frontend

```bash
cd beacoder-mock-frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, followed by:

```text
/test/TEST_MERN_001
```

For example:

```text
http://localhost:5173/test/TEST_MERN_001
```

## Current implementation

The current slice implements the candidate registration page, test lookup, basic validation, duplicate registration prevention, Student ID generation, and JSON candidate storage. The question and result pages will be added next.
