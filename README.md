![npm version](https://img.shields.io/npm/v/cds-pg)
![Package Build](https://github.com/sapmentors/cds-pg/workflows/Node.js%20Package/badge.svg)

# cds-pg - PostgreSQL adapter for SAP CDS (CAP)

This node module provides an adapter to the PostgreSQL database.

For a short introduction on the background of this project you can check out [a short video](https://www.youtube.com/watch?v=b9sPczwYN5Q&t=2310s) that has been captured as part of the SAP devtoberfest.

## Current status

**_cds-pg_ is ready to be used!**  
Still, there's some gaps left to fill - note the list below and  
please see [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for how to contribute additional capabilities!

### TODO

- [x] implement basic `SELECT|READ`(~ OData `GET`)
- [x] implement basic `INSERT|CREATE`(~ OData `POST`)
- [x] implement basic `UPDATE`(~ OData `PUT|PATCH`)
- [x] implement basic `DELETE`(~ OData `DELETE`)
- [x] map OData to PostgreSQL vocabulary
- [x] implement basic cds deployment
- [x] use default query builders for UPDATE/DELETE
- [ ] add support for multitenancy (see [issue #25](https://github.com/sapmentors/cds-pg/issues/25))
  - [x] support multiple schemas (at config time)
  - [x] support queries with tenant info (at runtime)
- [ ] add support for [full OData vocabulary](http://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html)
  - [x] system query options (`$filter`, `$expand`, `$select`)
  - [x] string functions
  - [ ] collection functions
  - [ ] date + time functions
  - [ ] geo functions
  - [ ] arithmetic operators + functions
- [ ] add draft support (see [issue #30](https://github.com/sapmentors/cds-pg/issues/30))
- [ ] add advanced deployment model that supports delta handling/migrations (see [issue #27](https://github.com/sapmentors/cds-pg/issues/27))
- [ ] add more tests to make the module more robust to @sap/cds core changes
- [ ] maybe add some PostgreSQL specific data type support

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
          "password": "postgres",
          "schema":"public"
        }
      }
    ]
  }
}
```

### CDS deployment

Please check `cds-dbm` at https://github.com/mikezaschka/cds-dbm for deployment including delta handling of data and models!

For quick'n'dirty local deployment:

`npx cds-pg deploy srv --to db`

deploys all tables and views defined in your CDS model to the PostgreSQL DB specified in `default-env.json`. Initial data will also be filled from the provided .csv files following the approach described in [Providing Initial Data](https://cap.cloud.sap/docs/guides/databases#providing-initial-data). Be aware that the existing tables and views are deleted and then re-created according the CDS model.

## Projects using cds-pg

Example project [pg-beershop](https://github.com/gregorwolf/pg-beershop)
