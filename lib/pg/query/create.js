const format = require('pg-format');

/**
 * Handle create calls to postgres
 * 
 * @param {*} dbc 
 * @param {*} cqn 
 */
async function handleCreate(dbc, cqn) {
    const insert = cqn.INSERT
    const fields = Object.keys(insert.entries[0]);

    let sql = `${cqn.cmd} INTO ${cqn.INSERT.into.split('.').join('_')} ` +
        ` ( ${fields.join(', ')}) VALUES %L `;

    const values = insert.entries.map(entry => Object.values(entry).map(value => value));
    sql = format(sql, values);

    if (process.env.DEBUG || process.env.CDS_DEBUG) {
        console.info('[cds-pg]', '-', 'sql > ', sql)
    }
    return dbc.query(sql);
}

module.exports = handleCreate;