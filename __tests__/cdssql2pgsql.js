const cds = require('@sap/cds')
const postgresDatabase = require('../index')
const fs = require('fs')

describe('CDS SQL to PostgreSQL', () => {
  describe('Create Statements', () => {
    test('+ should return PostgreSQL compatible statment', async () => {
      const servicePath = `${__dirname}/__assets__/cap-proj/srv/beershop-service`
      const csn = await cds.load(`${servicePath}`)
      const cdssql = cds.compile.to.sql(csn, { as: 'str' })
      const cdspg = new postgresDatabase()
      let pgsql = cdspg.cdssql2pgsql(cdssql)
      const pgsqlMatch = fs.readFileSync(`${__dirname}/__assets__/test.sql`, 'utf-8')
      expect(pgsql).toMatch(pgsqlMatch)
    })
  })
})
