const { Pool } = require('pg')
const HanaDatabase = require('@sap/cds-runtime/lib/hana/Service.js')
const cqn2pgsql = require('./lib/cqn2pgsql')

module.exports = class PostgresDatabase extends HanaDatabase {
  constructor(...args) {
    super(...args)
    // maybe do more stuff
    // Cloud Foundry provides the user in the field username the pg npm module expects user
    if (this.options.credentials && this.options.credentials.username) {
      this.options.credentials.user = this.options.credentials.username
    }
    this._pool = new Pool(this.options.credentials)
  }

  async init() {
    super.init()

    await this.prepend(function () {
      this.on('BEGIN', async (req) => {
        // this === tx || srv
        const dbc = (this.dbc = await this.acquire(req))
        req.context._dbc = dbc // REVISIT: will become obsolete

        const that = this
        return new Promise((resolve, reject) => {
          dbc.query(req.event, (err) => {
            // REVISIT: compat for continue with tx
            that.tx(req)._state = req.event

            if (err) return reject(err)
            resolve('dummy')
          })
        })
      })
      this.on(['COMMIT', 'ROLLBACK'], (req) => {
        const dbc = this.dbc || req.context._dbc

        const that = this
        return new Promise((resolve, reject) => {
          dbc.query(req.event, (err) => {
            // REVISIT: compat for continue with tx
            that.tx(req)._state = req.event

            if (err) return reject(err)
            resolve('dummy')
          })
        })
      })
      this.on('READ', (req) => {
        const dbc = req.context._dbc
        return dbc.query(cqn2pgsql(req.query)).then((res) => res.rows)
      })
    })
  }

  acquire(arg) {
    // Does PostgreSQL support multi tenancy?
    const tenant = arg && typeof arg === 'string' ? arg : arg.user.tenant || 'anonymous'
    if (tenant) {
      // TODO
    }
    // do acquire
    return this._pool.connect()
    // .then(client => {
    //   return client
    // })
    // .catch(err => {throw new PgError()}) // TODO: err handling -> pg-specific message?
  }

  /**
   * release the query client back to the pool
   * explicitly passing a truthy value
   * see https://node-postgres.com/api/pool#releasecallback
   */
  async release() {
    return this.dbc.release(true)
  }

  /**
   * Convert the cds compile -to sql output to a PostgreSQL compatible format
   * @param {String} SQL from cds compile -to sql
   * @returns {String} postgresql sql compatible SQL
   */
  cdssql2pgsql(cdssql) {
    const pgsql = cdssql.replace(/NVARCHAR/g, 'VARCHAR')
    return pgsql
  }
}
