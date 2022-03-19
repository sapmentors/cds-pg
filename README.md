![npm version](https://img.shields.io/npm/v/cds-pg)
![Package Build](https://github.com/sapmentors/cds-pg/workflows/Node.js%20Package/badge.svg)

# `cds-pg` - PostgreSQL adapter for SAP CDS (CAP)

First a big thank you to our contributors:

[![Contributors Display](https://badges.pufler.dev/contributors/sapmentors/cds-pg?size=50&padding=5&bots=false)](https://github.com/sapmentors/cds-pg/graphs/contributors)

This node module provides an adapter to the PostgreSQL database.

For a short introduction on the background of this project you can check out [a short video](https://www.youtube.com/watch?v=b9sPczwYN5Q&t=2310s) that has been captured as part of the SAP devtoberfest.

## Current status

**_cds-pg_ is ready to be used!**
Still, there's some gaps left to fill - note the list below and please see [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for how to contribute additional capabilities!

Also checkout the following blog posts on how to get started using `cds-pg` in your local development environment and on SAP Business Technology Platform (BTP), Cloud Foundry:

- [Setup an example project using `cds-pg`](https://blogs.sap.com/2020/11/16/getting-started-with-cap-on-postgresql-node.js/)
- [Prepare and deploy the project to SAP BTP CF](https://blogs.sap.com/2020/11/30/run-and-deploy-cap-with-postgresql-on-sap-cloud-platform-cloud-foundry-node.js/)

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
- [x] add draft support (see [issue #30](https://github.com/sapmentors/cds-pg/issues/30))
- [x] add advanced deployment model that supports delta handling/migrations (see [issue #27](https://github.com/sapmentors/cds-pg/issues/27))
- [x] support [`virtual` fields](https://cap.cloud.sap/docs/cds/cdl#virtual-elements) (see [issue 204](https://github.com/sapmentors/cds-pg/issues/204))
- [ ] support [`localized` entities](https://cap.cloud.sap/docs/guides/localized-data) (see [issue 196](https://github.com/sapmentors/cds-pg/issues/196))

## Usage in your CAP project

Add this package to your [SAP Cloud Application Programming Model](https://cap.cloud.sap/docs/) project by running:

```bash
npm install cds-pg
```

Then add this configuration to the `cds` section of your `package.json:

```JSON
  "cds": {
    "requires": {
      "db": {
        "kind": "postgres"
      },
      "postgres": {
        "dialect": "plain", // <- for cds >= 5.1
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
        "tags": ["plain", "database"],
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

`cds-pg` contains the database adapter to translate the incoming requests to PostgreSQL during runtime, but also includes a _quick and dirty_ command to deploy the current data model to the PostgreSQL database specified in `default-env.json`. Initial data will also be filled from the provided `.csv` files following the approach described in [Providing Initial Data](https://cap.cloud.sap/docs/guides/databases#providing-initial-data). Be aware that the existing tables and views are deleted and then re-created according the CDS model, so this should **not be used in production environments**:

`npx cds-pg deploy srv --to db`

For a more sophisticated approach, please check out `cds-dbm` at https://github.com/mikezaschka/cds-dbm, which offers an advanced deployment model including delta handling of data and models!
Please also read the following blogposts for a detailed description, on how `cds-dbm` can be used in combintation with `cds-pg`:

- [Setup an example project using `cds-pg`](https://blogs.sap.com/2020/11/16/getting-started-with-cap-on-postgresql-node.js/)
- [Prepare and deploy the project to SAP BTP CF](https://blogs.sap.com/2020/11/30/run-and-deploy-cap-with-postgresql-on-sap-cloud-platform-cloud-foundry-node.js/)

## Projects using `cds-pg`

- [pg-beershop](https://github.com/gregorwolf/pg-beershop) – An example project with multiple deployment scenarios (Cloud Foundry, Kyma, Azure, Google Cloud Platform)
- [cap-devtoberfest](https://github.com/mikezaschka/cap-devtoberfest) – A simple project showcasing how to run `cds-pg` and `cds-dbm` locally and on SAP BTB Cloud Foundry
