![npm version](https://img.shields.io/npm/v/cds-pg)
![Package Build](https://github.com/sapmentors/cds-pg/workflows/Node.js%20Package/badge.svg)

# cds-pg - PostgreSQL adapter for SAP CDS (CAP)

This node module provides an adapter to the PostgreSQL database.

## Current status

This is a first alpha version! It can connect to a PostgreSQL database and execute a simple SELECT statement. Please help us to improve by your contribution.

## Installation

Add this package to your [SAP Cloud Application Programming Model](https://cap.cloud.sap/docs/) project by running:

```bash
npm install cds-pg
```

Then add this configuration to the cds section of your package.json:

```JSON
  "cds": {
    "requires": {
      "db": {
        "kind": "postgres"
      },
      "postgres": {
        "impl": "cds-pg",
        "model": [
          "srv"
        ]
      }
    }
  }
```

For local development you can provide the credentials in the file `default-env.json`:

```JSON
{
  "VCAP_SERVICES": {
    "postgres": [
      {
        "name": "postgres",
        "label": "postgres",
        "tags": [
          "postgres"
        ],
        "credentials": {
          "host": "localhost",
          "port": "5432",
          "database": "dbname",
          "user": "postgres",
          "password": "postgres"
        }
      }
    ]
  }
}
```

[pg-beershop](https://github.com/gregorwolf/pg-beershop) provides an example project.

## Development environment

- `jest` is the test-runner and -framework (see folder `test`)
- `prettier` is used for code styling, configured in `package.json` -> please adhere to the formatting rules :)
- `eslint` is is responsible for static code checks, see `.eslintrc.json`
- git commit messages are linted: they need to adhere to the "[conventional changelog](https://www.conventionalcommits.org/en/v1.0.0/)" rules that are based on the [angular commit guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)  
  this makes it easier for us maintaining a changelog

## Collaboration

do. make. plenty. PRs :)  
Don't forget to run `npm test` frequently (or even keeping the watch on via `node_modules/.bin/jest --watch`) to make sure all tests remain "green"
and we're not shooting as in the foot regression-ally, so to speak.
