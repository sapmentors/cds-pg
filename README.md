![npm version](https://img.shields.io/npm/v/cds-pg)
![Package Build](https://github.com/sapmentors/cds-pg/workflows/Node.js%20Package/badge.svg)

# cds-pg - PostgreSQL adapter for SAP CDS (CAP)

This node module provides an adapter to the PostgreSQL database.

## Current status

This is a first alpha version! It can connect to a PostgreSQL database and execute basic CRUD statements.

Please see [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for how to contribute additional capabilities!

### TODO

[X] implement basic `SELECT|READ`(~ OData `GET`)  
[X] implement basic `INSERT|CREATE`(~ OData `POST`)  
[X] implement basic `UPDATE`(~ OData `PUT|PATCH`)  
[X] implement basic `DELETE`(~ OData `DELETE`)  
[X] map OData to PostgreSQL vocabulary  
[X] implement basic cds deployment  
[ ] use default query builders for UPDATE/DELETE  
[ ] add support for full OData vocabulary  
[ ] add advanced deployment model that supports delta handling/migrations  
[ ] maybe add some PostgreSQL specific data type support  
[ ] add more tests

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

### CDS deployment

With the command:

`npx cds-pg deploy srv --to db`

you can deploy all tables and views defined in your CDS model to the PostgreSQL DB specified in `default-env.json`. Initial data will also be filled from the provided .csv files following the approach described in [Providing Initial Data](https://cap.cloud.sap/docs/guides/databases#providing-initial-data). Be aware that the existing tables and views are deleted and then re-created according the CDS model.

## Projects using cds-pg

Example project [pg-beershop](https://github.com/gregorwolf/pg-beershop)
