const { processCQN } = require('../execute')

/**
 * Updates are directly handled by the internal SQL builder.
 *
 * @param {PoolClient} dbc
 * @param {Object} cqn
 */
async function updateHandler(dbc, cqn) {
  return processCQN(dbc, cqn)
}

module.exports = updateHandler
