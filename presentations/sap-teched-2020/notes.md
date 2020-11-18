# INTRODUCTION

Gregor: Hello, I'm Gregor Wolf. I work as an independent Solution Architect. Together with Mike (Mike continues)

Mike ... and Volker (Volker continues)

Volker ... we want to present you the Projects cds-pg and cds-dbm. (Gregor continues)

# What is cds-pg + cds-dbm

## cds-pg

- cds-pg is the PostgreSQL adapter for SAP the SAP Cloud Application Programming Model (CAP)
- I started it started it in October 2019 with an experiment to connect to a PostgreSQL database
- Just out of curiosity
- HANA pricing
- CAP community call &rarr; CAP rel v4 &rarr; Jul 2020
- hand-holding by Sebastian van Syckel (humanized src code commenter)

- cds-dbm provides automated delta deployment and full database migration support

Mike will tell you about the details (Mike continues)

## cds-dbm: Mike

- thank David Sooter
- what’s in?
  - CRUD
  - basic query options: filter, select, ...
  - deployment (via cds-dbm)
    - **SHOW** initial deployment
    - OData request
    - add field
    - re-deploy
  - hot-off-the-press: schema-support (since yesterday)
- what’s missing?
  - draft mode (&rarr; SAP?!?)
  - multitenancy
  - analytical calculations

Demo cds-dbm with beershop. Show OData Service result before and after adding location to Breweries

# GREGOR

- **SHOW** **beershop** **UI** as the first consumer
  - **Kyma**
  - SCP &rarr; Service Broker
  - SCP &rarr; user-provided service (AWS)
  - semi: SCP Postgres (trial) Hyperscaler
  - Azure Cloud (deployed using Azure DevOps)

# VOLKER

- make test-driven dev as effortless as possible
- **SHOW** onboarding

# we wish, we want

- open up more &rarr; define exit points in CAP core (e.g. not limited to @sap scope!)
- The SAP Cloud Application Programming Model together with SAP Fiori Elements simply rocks. Make it now Open Source to get a broad adoption also outside the SAP Ecosystem.

