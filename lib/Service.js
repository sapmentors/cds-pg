const { Pool } = require('pg')
const format = require('pg-format');

// PG specific stuff
const CustomBuilder = require('./customBuilder');
const sqlFactory = require('./sqlFactory')
const execute = require('./execute')

/*eslint no-undef: "warn"*/
/*eslint no-unused-vars: "warn"*/
const cds = global.cds || require('@sap/cds/lib')

/*
 * the service
 */
module.exports = class PostgresDatabase extends cds.DatabaseService {
    constructor(...args) {
        super(...args)

        // Cloud Foundry provides the user in the field username the pg npm module expects user
        if (this.options.credentials && this.options.credentials.username) {
            this.options.credentials.user = this.options.credentials.username
        }
        this._pool = new Pool(this.options.credentials)

        // TODO: Check if this should be the "official“ way to do this 
        this._execute = execute
        this._insert = this._queries.insert(execute.insert)
        this._read = this._queries.read(execute.select, execute.stream)
        this._update = this._queries.update(execute.update, execute.select)
        this._delete = this._queries.delete(execute.delete)
        this._run = this._queries.run(this._insert, this._read, this._update, this._delete, execute.cqn, execute.sql)
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

    init() {
        /*
         * before
         */
        // currently needed for transaction handling
        this._ensureOpen && this.before('*', this._ensureOpen)
        this._ensureModel && this.before('*', this._ensureModel)

        this.before(['CREATE', 'UPDATE'], '*', this._keys)
        this.before(['CREATE', 'UPDATE'], '*', this._managed)
        this.before(['CREATE', 'UPDATE'], '*', this._virtual)
        this.before(['CREATE', 'READ', 'UPDATE', 'DELETE'], '*', this._rewrite)

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
        if (cds.env.odata_x4) {
            // REVISIT only register for entities that contain structured/arrayed or navigation to it
            this.after(['READ'], '*', this._structured)
            this.after(['READ'], '*', this._arrayed)
        }

        /*
         * tx
         */
        this.on('BEGIN', async function (req) {
            this.dbc = await this.acquire(req)
            await this.dbc.query(req.event)

            // currently needed for continue with tx
            this._state = req.event

            return 'dummy'
        })

        this.on('COMMIT', async function (req) {
            await this.dbc.query(req.event)

            // currently needed for continue with tx
            this._state = req.event

            await this.release(this.dbc)

            return 'dummy'
        })

        this.on('ROLLBACK', async function (req) {
            try {
                await this.dbc.query(req.event)
            } finally {
                await this.release(this.dbc)
            }

            // currently needed for continue with tx
            this._state = req.event

            return 'dummy'
        })

        /*
         * "final on"
         */
        this.on('*', function (req) {
            return this._run(this.model, this.dbc, req.query || req.event, req)
        })
    }

    async deploy(model, options = {}) {
        return true;
    }

    /*
     * connection
     */
    async acquire(arg) {
        // const tenant = (typeof arg === 'string' ? arg : arg.user.tenant) || 'anonymous'
        const dbc = await this._pool.connect()

        // anything you need to do to prepare dbc

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
        await custom_disconnect_function(tenant)
        super.disconnect(tenant)
    }
}
