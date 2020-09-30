const { processCQN } = require('../execute')

/**
 * Deletes are directly handled by the internal SQL builder.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {Object} cqn
 */
async function deleteHandler(dbc, cqn) {
  return processCQN(dbc, cqn)
}

module.exports = deleteHandler
