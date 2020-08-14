const cqn2pgsql = require('../lib/cqn2pgsql')

describe('CQN to PostgreSQL', () => {
  describe('SELECT', () => {
    test('+ should return SQL statment', () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
          columns: [{ ref: ['ID'] }, { ref: ['name'] }],
          orderBy: [{ ref: ['ID'], sort: 'asc' }],
          limit: { rows: { val: 1000 } },
        },
      }
      const sql = cqn2pgsql(query)
      expect(sql).toMatch('SELECT "ID", "name" FROM "BeershopService_Beers"')
    })
  })
  test.todo("INSERT")
  test.todo("UPDATE")
  test.todo("DELETE")
})
