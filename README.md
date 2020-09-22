![npm version](https://img.shields.io/npm/v/cds-pg)
![Package Build](https://github.com/sapmentors/cds-pg/workflows/Node.js%20Package/badge.svg)

# cds-pg - PostgreSQL adapter for SAP CDS (CAP)

This node module provides an adapter to the PostgreSQL database.

## Current status

This is a first alpha version! It can connect to a PostgreSQL database and execute statements, currently `SELECT` for entitysets and entites only.

Please see [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for how to constribute additional capabilites!

### TODO

[ ] refactor SQL "compiler" to produce prepared statement syntax à la https://node-postgres.com/features/queries ("Prepared Statements") in `lib/cqn2pgsql.js`  
[ ] extend `SELECT|READ`(~ OData `GET`)  
[ ] start `INSERT|CREATE`(~ OData `POST`)  
[ ] start `UPDATE`(~ OData `PUT|PATCH`)  
[ ] start `DELETE`(~ OData `DELETE`)

## usage in your CAP project

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

For local development you can provide the credentials in the file `default-env.json` in the root folder of your project:

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
