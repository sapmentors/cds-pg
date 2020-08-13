const cqn2pgsql = require('../lib/cqn2pgsql')
const assert = require('assert').strict

describe('CQN to PostgreSQL', () => {
  describe('SELECT', () => {
    it('+ should return SQL statment', (done) => {
      let query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
          columns: [{ ref: ['ID'] }, { ref: ['name'] }],
          orderBy: [{ ref: ['ID'], sort: 'asc' }],
          limit: { rows: { val: 1000 } },
        },
      }
      let sql = cqn2pgsql(query)
      assert.equal(sql, 'SELECT "ID", "name" FROM "BeershopService_Beers"')
      done()
    })
  })
})
