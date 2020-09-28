const { processCQN } = require('../execute')

/*/**
 *
 * @param {*} dbc
 * @param {*} cqn
 */
async function deleteHandler(dbc, cqn) {
  return processCQN(dbc, cqn)
}

module.exports = deleteHandler
