const { Pool } = require('pg')
const dateTime = require('@sap/cds-runtime/lib/hana/dateTime.js')
const { managed, virtual, keys, rewrite } = require('@sap/cds-runtime/lib/db/generic')
/*eslint no-undef: "warn"*/
/*eslint no-unused-vars: "warn"*/
const cds = global.cds || require('@sap/cds/lib')
const { readHandler, createHandler, updateHandler, deleteHandler } = require('./lib/pg/query')

/*
 * the service
 */module.exports = class PostgresDatabase extends cds.DatabaseService {
    constructor(...args) {
        super(...args)

        // Cloud Foundry provides the user in the field username the pg npm module expects user
        if (this.options.credentials && this.options.credentials.username) {
            this.options.credentials.user = this.options.credentials.username
        }
        this._pool = new Pool(this.options.credentials)
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
        // "flattens" the query
        // and "redirects" modification statements (CUD) from view to actual table
        this.before(['CREATE', 'UPDATE'], '*', dateTime) // > has to run before rewrite
        this.before(['CREATE', 'UPDATE'], '*', keys)
        this.before(['CREATE', 'UPDATE'], '*', managed)
        this.before(['CREATE', 'UPDATE'], '*', virtual)
        this.before(['CREATE', 'READ', 'UPDATE', 'DELETE'], '*', rewrite)
        this.before(['CREATE', 'READ', 'UPDATE', 'DELETE'], '*', this._rewrite)
        this.before(['CREATE', 'READ', 'UPDATE', 'DELETE'], '*', this.models)

        /*
         * on
         */
        this.on('CREATE', '*', async function (req) {
            const results = await createHandler(this.dbc, req.query);
            return results.rows;
        })
        this.on('READ', '*', async function (req) {
            const results = await readHandler(this.dbc, req.query, req._model);
            return results;
        })
        this.on('UPDATE', '*', async function (req) {
            const result = await updateHandler(this.dbc, req.query);
            return result.rows;
        })
        this.on('DELETE', '*', async function (req) {
            const result = await deleteHandler(this.dbc, req.query);
            return result.rows;
        })

        /*
         * after
         */
        // nothing

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
            // if you reach here, your request wasn't handled above
        })
    }

    /*
    * assign request metadata
    */
    models(req) {
        this.models = req.context._model;
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