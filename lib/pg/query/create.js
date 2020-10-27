const format = require('pg-format')
const { processInsertCQN, processRawSQL } = require('../execute')

/**
 * Handles INSERT statements which require a special treatment because batch
 * inserts are currently not supported by the node-postgres library.
 * @see https://github.com/brianc/node-postgres/issues/2257
 *
 * @param {import('pg').PoolClient} dbc
 * @param {Object} cqn
 * @return {import('pg').QueryArrayResult} the inserted values
 */
async function handleCreate(dbc, cqn) {
  const insert = cqn.INSERT

  if (insert.entries || insert.rows || insert.values) {
    let fields = []
    let values = []

    if (insert.entries) {
      fields = Object.keys(insert.entries[0])
      values = insert.entries.map((entry) => Object.values(entry).map((value) => value))
    }

    if (insert.rows) {
      fields = insert.columns
      values = insert.rows.map((entry) => Object.values(entry).map((value) => value))
    }

    if (insert.values) {
      fields = insert.columns
      values = [insert.values]
    }

    let sql =
      `${cqn.cmd} INTO ${cqn.INSERT.into.split('.').join('_')} ` + ` ( ${fields.join(', ')}) VALUES %L Returning *`
    sql = format(sql, values)

    return await processRawSQL(dbc, sql)
  } else {
    return processInsertCQN(dbc, cqn)
  }
}

module.exports = handleCreate
