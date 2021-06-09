const cds = require('@sap/cds')
const postgresDatabase = require('../index')
const fs = require('fs')

describe('CDS SQL to PostgreSQL', () => {
  describe('Create Statements', () => {
    test('+ should return PostgreSQL compatible statment for beershop-service', async () => {
      const servicePath = `${__dirname}/__assets__/cap-proj/srv/beershop-service`
      const csn = await cds.load(`${servicePath}`)
      const cdssql = cds.compile.to.sql(csn, { as: 'str' })
      const cdspg = new postgresDatabase()
      let pgsql = cdspg.cdssql2pgsql(cdssql).trim()
      //fs.writeFileSync(`${__dirname}/__assets__/test.sql`, pgsql);
      const pgsqlMatch = fs.readFileSync(`${__dirname}/__assets__/test.sql`, 'utf-8')
      expect(pgsql).toMatch(pgsqlMatch)
    })
    test('+ should return PostgreSQL compatible statment for beershop-admin-service', async () => {
      const servicePath = `${__dirname}/__assets__/cap-proj/srv/beershop-admin-service`
      const csn = await cds.load(`${servicePath}`)
      const cdssql = cds.compile.to.sql(csn, { as: 'str' })
      const cdspg = new postgresDatabase()
      let pgsql = cdspg.cdssql2pgsql(cdssql).trim()
      // fs.writeFileSync(`${__dirname}/__assets__/beershop-admin-service.sql`, pgsql)
      const pgsqlMatch = fs.readFileSync(`${__dirname}/__assets__/beershop-admin-service.sql`, 'utf-8')
      expect(pgsql).toMatch(pgsqlMatch)
    })
  })
})
