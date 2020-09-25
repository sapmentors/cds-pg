const CustomBuilder = require('./customBuilder')
const { sqlFactory } = require('../node_modules/@sap/cds-runtime/lib/db/sql-builder/');

async function executeInsertCQN(model, dbc, query, user, locale, txTimestamp) {
    const { sql, values = [] } = sqlFactory(
        query,
        {
            user: user,
            customBuilder: CustomBuilder,
            now: txTimestamp || { sql: "strftime('%Y-%m-%dT%H:%M:%fZ','now')" } // '2012-12-03T07:16:23.574Z'
        },
        model
    )
    //const vals = await _convertStreamValues(values)
    return executeInsertSQL(dbc, sql, values)
}

function executeInsertSQL(dbc, sql, values) {
    return new Promise((resolve, reject) =>
        dbc.run(sql, values, function (err) {
            err ? reject(Object.assign(err, { query: sql })) : resolve([this.lastID])
        })
    )
}


module.exports = {
    insert: executeInsertCQN
}