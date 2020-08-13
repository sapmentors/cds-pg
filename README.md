# cds-pg - PostgreSQL adapter for SAP CDS (CAP)

This node module provides an adapter to the PostgreSQL database.

## Installation

Add this package to your SAP Cloud Application Programming Model project by running:

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
