const format = require('pg-format');


/**
 * Handle update calls to postgres
 * 
 * @param {*} dbc 
 * @param {*} cqn 
 * @param {*} model 
 */
async function updateHandler(dbc, cqn) {

    const update = cqn.UPDATE

    let sql =
        `${cqn.cmd} ${update.entity.split('.').join('_')} ` +
        `SET  ${Object.keys(update.with).map(key => ` ${key} = %L `).join(', ')} `;
    sql = format(sql, ...Object.values(update.with));

    if (update.where) {
        // <key> = '<value>', e.g. ID='some-guid-here'
        sql += ` WHERE ${update.where
            .map((cond) => {
                if (cond.ref) {
                    return cond.ref[0]
                } else if (cond.val) {
                    return `'${cond.val}'`
                } else {
                    return cond
                }
            })
            .join('')}`
    }
    return dbc.query(sql);
}

module.exports = updateHandler;