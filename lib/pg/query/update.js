const { processCQN } = require('../execute')

/**
 *
 * @param {*} dbc
 * @param {*} cqn
 */
async function updateHandler(dbc, cqn) {
  return processCQN(dbc, cqn)
}

module.exports = updateHandler
