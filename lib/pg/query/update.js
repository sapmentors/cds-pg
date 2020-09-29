const { processCQN } = require('../execute')

/**
 * Updates are directly handled by the internal SQL builder.
 *
 * @param {import('pg').PoolClient} dbc
 * @param {Object} cqn
 * @return {import('pg').QueryArrayResult} the result rows
 */
async function updateHandler(dbc, cqn) {
  return processCQN(dbc, cqn)
}

module.exports = updateHandler
