const readHandler = require('./read')
const createHandler = require('./create')
const deleteHandler = require('./delete')
const updateHandler = require('./update')
const { processCQN, processRawSQL } = require('../execute')

module.exports = {
  readHandler,
  createHandler,
  deleteHandler,
  updateHandler,
  cqnHandler: processCQN,
  sqlHandler: processRawSQL,
}
