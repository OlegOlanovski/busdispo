# BusDispo

BusDispo is an Angular prototype for bus dispatching and weekly planning. It includes vehicle, driver, duty-plan, absence, special-trip and message management views plus a compact driver portal.

> **Demo data:** All people, contacts, vehicle identifiers, locations, schedules and messages in this repository are synthetic examples. They do not describe real employees, customers or transport operations.

## Local development

Requirements: Node.js 24 and npm.

```bash
npm install
npm start
```

Open `http://localhost:4200/` in your browser.

## Tests

```bash
npm test -- --watch=false
```

## Production build

```bash
npm run build
```

The generated files are written to `dist/`.

## Security and privacy

- Never commit `.env` files, API keys, access tokens, private keys or service-account credentials.
- Keep real employee, customer, route and operational data outside this demo repository.
- Use environment variables and a backend secret store if external services are added later.
- Run a secret scanner before publishing releases or accepting contributions.
