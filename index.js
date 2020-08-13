const { Pool } = require('pg')
let hanaService = '../@sap/cds-runtime/lib/hana/Service.js'
if (!__dirname.endsWith('node_modules/cds-pg')) {
  hanaService = './node_modules/@sap/cds-runtime/lib/hana/Service.js'
}
const HanaDatabase = require(hanaService)
const cqn2pgsql = require('./lib/cqn2pgsql')

module.exports = class PostgresDatabase extends HanaDatabase {
  constructor(...args) {
    super(...args)
    // maybe do more stuff
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
        console.log(req.query)
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

  release(dbc) {
    // do release
    return dbc.release()
  }
}
