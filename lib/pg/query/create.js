const format = require('pg-format')
const { processSQL, processCQN } = require('../execute')

/**
 * Handles INSERT statements.
 * Requires specifc treatment because batch inserts are currently not supported by the pg library.
 * @see https://github.com/brianc/node-postgres/issues/2257
 *
 * @param {} dbc
 * @param {*} cqn
 */
async function handleCreate(dbc, cqn) {
  const insert = cqn.INSERT

  if (insert.entries || insert.rows) {
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

    let sql = `${cqn.cmd} INTO ${cqn.INSERT.into.split('.').join('_')} ` + ` ( ${fields.join(', ')}) VALUES %L `
    sql = format(sql, values)

    return processSQL(dbc, sql)
  } else {
    return processCQN(dbc, cqn)
  }
}

module.exports = handleCreate
