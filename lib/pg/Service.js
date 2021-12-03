const { Pool } = require('pg')
const { rewrite } = require('@sap/cds/libx/_runtime/db/generic')
/*eslint no-undef: "warn"*/
/*eslint no-unused-vars: "warn"*/
const cds = global.cds || require('@sap/cds/lib')

// postgres specific execution
const execute = require('./execute')

/*
 * The service
 */
module.exports = class PostgresDatabase extends cds.DatabaseService {
  constructor(...args) {
    super(...args)

    // Cloud Foundry provides the user in the field username the pg npm module expects user
    if (this.options.credentials && this.options.credentials.username) {
      this.options.credentials.user = this.options.credentials.username
    }
    // Special handling for:
    // SAP Cloud Platform - Cloud Foundry - PostgreSQL Hyperscaler Service
    if (this.options.credentials && this.options.credentials.hostname) {
      this.options.credentials.host = this.options.credentials.hostname
    }
    if (this.options.credentials && this.options.credentials.dbname) {
      this.options.credentials.database = this.options.credentials.dbname
    }
    if (this.options.credentials && this.options.credentials.sslrootcert) {
      if (typeof this.options.credentials.sslRequired === 'undefined') {
        this.options.credentials.sslRequired = true
      }
      this.options.credentials.ssl = {
        rejectUnauthorized: false,
        ca: this.options.credentials.sslrootcert,
      }
    }
    this._pool = new Pool(this.options.credentials)

    // SET SCHEMA
    if (this.options.credentials && this.options.credentials.schema) {
      this._pool.query(`SET search_path TO '${this.options.credentials.schema}';`)
    }

    // Mapping of the pg specific executions. Inspired by the SQLite and HANA adapters.
    // We call the default run handlers but pass in our custom execution functions.
    this._execute = execute
    this._insert = this._queries.insert(execute.insert)
    this._read = this._queries.read(execute.read, execute.stream)
    this._update = this._queries.update(execute.update, execute.select)
    this._delete = this._queries.delete(execute.delete)
    this._run = this._queries.run(this._insert, this._read, this._update, this._delete, execute.cqn, execute.sql)
  }

  /**
   * Convert the cds compile -to sql output to a PostgreSQL compatible format
   * @see https://www.postgresql.org/docs/13/datatype.html
   *
   * NVARCHAR -> VARCHAR
   * DOUBLE -> NUMERIC(15, 15)
   * BINARY_BLOB -> CHAR
   * BLOB -> BYTEA
   * NCLOB -> TEXT
   * TIMESTAMP_TEXT -> TIMESTAMPTZ
   * TIME_TEXT -> TIME
   * DATE_TEXT -> DATE
   *
   * @param {String} SQL from cds compile -to sql
   * @returns {String} postgresql sql compatible SQL
   */
  cdssql2pgsql(cdssql) {
    let pgsql = cdssql.replace(/NVARCHAR/g, 'VARCHAR')
    pgsql = pgsql.replace(/DOUBLE/g, 'NUMERIC(30, 15)')
    pgsql = pgsql.replace(/BINARY_BLOB/g, 'CHAR')
    pgsql = pgsql.replace(/BLOB/g, 'BYTEA')
    pgsql = pgsql.replace(/NCLOB/g, 'TEXT')
    pgsql = pgsql.replace(/TIMESTAMP_TEXT/g, 'TIMESTAMPTZ')
    pgsql = pgsql.replace(/TIME_TEXT/g, 'TIME')
    pgsql = pgsql.replace(/DATE_TEXT/g, 'DATE')
    return pgsql
  }

  init() {
    /*
     * before
     */
    // ensures the correct model is present (e.g., tenant extensions)
    this._ensureModel && this.before('*', this._ensureModel)
    // VIRTUAL, MANAGED, Keys and null checks
    this.before(['CREATE', 'UPDATE'], '*', this._input)
    // "flattens" the query
    // and "redirects" modification statements (CUD) from view to actual table
    this.before(['CREATE', 'READ', 'UPDATE', 'DELETE'], '*', rewrite)
    this.before('READ', '*', this._virtual)

    /*
     * on
     */
    this.on('CREATE', '*', this._CREATE)
    this.on('READ', '*', this._READ)
    this.on('UPDATE', '*', this._UPDATE)
    this.on('DELETE', '*', this._DELETE)

    /*
     * after
     */
    // nothing

    /*
     * tx
     */
    this.on(['BEGIN', 'COMMIT', 'ROLLBACK'], function (req) {
      return this.dbc.query(req.event)
    })

    /*
     * "final on"
     */
    this.on('*', function (req) {
      return this._run(this.model, this.dbc, req.query || req.event, req)
    })
  }

  /**
   * assign request metadata
   * @param {Object} req currently served express http request, enhanced by cds
   */
  setModel(req) {
    this.models = req.context._model
  }

  /*
   * connection
   */
  async acquire(arg) {
    const schema = (typeof arg === 'string' ? arg : arg.user.schema) || undefined
    // const tenant = (typeof arg === 'string' ? arg : arg.user.tenant) || 'anonymous'
    const dbc = await this._pool.connect()
    // SET SCHEMA
    if (this.options.credentials && this.options.credentials.schema && schema) {
      dbc.query(`SET search_path TO '${schema}';`)
    } else if (this.options.credentials && this.options.credentials.schema) {
      dbc.query(`SET search_path TO '${this.options.credentials.schema}';`)
    }
    return dbc
  }

  /**
   * release the query client back to the pool
   * explicitly passing a truthy value
   * see https://node-postgres.com/api/pool#releasecallback
   */
  async release(dbc) {
    await dbc.release(true)
    return 'dummy'
  }

  // if needed
  async disconnect(tenant = 'anonymous') {
    // potential await custom_disconnect_function(tenant)
    super.disconnect(tenant)
  }

  // REVISIT: Borrowed from SQLite service, but needs cleanup
  async deploy(model, options = {}) {
    let createEntities = cds.compile.to.sql(model)
    if (!createEntities || createEntities.length === 0) return // > nothing to deploy

    // Transform to PostgresSQL
    createEntities = createEntities.map((e) => this.cdssql2pgsql(e))

    const dropViews = []
    const dropTables = []
    for (let each of createEntities) {
      const [, table, entity] = each.match(/^\s*CREATE (?:(TABLE)|VIEW)\s+"?([^\s(]+)"?/im) || []
      if (table) dropTables.push({ DROP: { entity } })
      else dropViews.push({ DROP: { view: entity } })
    }

    if (options.dry) {
      const log = console.log // eslint-disable-line no-console
      for (let {
        DROP: { view },
      } of dropViews) {
        log('DROP VIEW IF EXISTS ' + view + ';')
      }
      log()
      for (let {
        DROP: { entity },
      } of dropTables) {
        log('DROP TABLE IF EXISTS ' + entity + ';')
      }
      log()
      for (let each of createEntities) log(each + ';\n')
      return
    }

    const tx = this.transaction()
    await tx.run(dropViews)
    await tx.run(dropTables)
    await tx.run(createEntities)
    await tx.commit()

    return true
  }
}
