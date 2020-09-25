
/**
 * Handle delete calls to postgres
 * 
 * @param {*} dbc 
 * @param {*} cqn 
 * @param {*} model 
 */
async function deleteHandler(dbc, cqn) {
    const del = cqn.DELETE
    let sql =
        `${cqn.cmd} FROM ${del.from.split('.').join('_')} `;
    if (del.where) {
        // <key> = '<value>', e.g. ID='some-guid-here'
        sql += ` WHERE ${del.where
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

module.exports = deleteHandler;