const {
  PGSelectBuilder,
  PGResourceBuilder,
  PGExpressionBuilder,
  PGFunctionBuilder,
} = require('../../../lib/pg/sql-builder')
const { sqlFactory } = require('@sap/cds/libx/_runtime/db/sql-builder')

const loadModel = async () => {
  const model = await cds.load('./__tests__/__assets__/cap-proj/db/schema.cds')
  for (const definition of Object.values(model.definitions)) {
    if (definition.elements) {
      for (const [name, element] of Object.entries(definition.elements)) {
        element.name = name
      }
    }
  }
  return model
}

describe('CQN to PostgreSQL', () => {
  beforeAll(async () => {
    this.csn = await loadModel()

    // Helper function
    this.runQuery = (query) =>
      sqlFactory(
        query,
        {
          user: cds.user || 'ANONYMOUS',
          customBuilder: {
            SelectBuilder: PGSelectBuilder,
            ResourceBuilder: PGResourceBuilder,
            ExpressionBuilder: PGExpressionBuilder,
            FunctionBuilder: PGFunctionBuilder,
          },
          now: { sql: "strftime('%Y-%m-%dT%H:%M:%fZ','now')" }, // '2012-12-03T07:16:23.574Z'
        },
        this.csn
      )
  })

  describe('SelectBuilder', () => {
    test('+ should return valid SELECT statement with a given from', async () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch('SELECT * FROM BeershopService_Beers')
      expect(values).toEqual([])
    })

    test('+ should return valid SELECT statement with given from and columns', async () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
          columns: [{ ref: ['ID'] }, { ref: ['name'] }],
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch('SELECT ID AS "ID", name AS "name" FROM BeershopService_Beers')
      expect(values).toEqual([])
    })

    test('+ should return valid SELECT statement with given from, columns, orderBy and limit', async () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
          columns: [{ ref: ['ID'] }, { ref: ['name'] }],
          orderBy: [{ ref: ['ID'], sort: 'asc' }],
          limit: { rows: { val: 1 }, offset: { val: 1 } },
        },
      }

      const { sql } = this.runQuery(query)

      expect(sql).toMatch(
        'SELECT ID AS "ID", name AS "name" FROM BeershopService_Beers ORDER BY ID ASC LIMIT 1 OFFSET 1'
      )
    })

    test('+ should return valid SELECT statement with given from, columns, groupBy', async () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
          columns: [{ ref: ['ID'] }, { ref: ['name'] }],
          groupBy: [{ ref: ['ID'] }, { ref: ['name'] }],
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch('SELECT ID AS "ID", name AS "name" FROM BeershopService_Beers GROUP BY ID, name')
      expect(values).toEqual([])
    })

    test('+ should return valid SELECT statement with given from, columns, where, orderBy and limit', async () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
          columns: [{ ref: ['ID'] }, { ref: ['name'] }],
          where: [{ ref: ['ID'] }, '=', { val: 'b8c3fc14-22e2-4f42-837a-e6134775a186' }],
          orderBy: [{ ref: ['ID'], sort: 'asc' }],
          limit: { rows: { val: 1 }, offset: { val: 1 } },
        },
      }

      const { sql } = this.runQuery(query)

      expect(sql).toMatch(
        `SELECT ID AS "ID", name AS "name" FROM BeershopService_Beers WHERE ID = ? ORDER BY ID ASC LIMIT 1 OFFSET 1`
      )
    })

    test('+ should create a valid count statement', async () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['BeershopService.Beers'] },
          count: true,
          columns: [{ func: 'count', args: [{ ref: ['1'] }], as: 'counted' }],
        },
      }
      const { sql } = this.runQuery(query)

      expect(sql).toMatch('SELECT count ( 1 ) AS "counted" FROM BeershopService_Beers')
    })

    test('+ should ignore composition fields in select', async () => {
      const query = {
        cmd: 'SELECT',
        SELECT: {
          from: { ref: ['csw.Brewery'] },
        },
      }

      const { sql } = this.runQuery(query)
      expect(sql.includes('beer')).toBeFalsy()
      expect(sql).toMatch(
        'SELECT ID AS "ID", createdAt AS "createdAt", createdBy AS "createdBy", modifiedAt AS "modifiedAt", modifiedBy AS "modifiedBy", name AS "name" FROM csw_Brewery'
      )
    })
  })

  // Examples taken from: https://cap.cloud.sap/docs/cds/cqn#insert
  describe('InsertBuilder', () => {
    beforeAll(async () => {
      this.csn = await loadModel()
    })

    it('should return a valid INSERT statement with given columns and values', () => {
      const query = {
        cmd: 'INSERT',
        INSERT: {
          into: 'csw.Beers',
          columns: ['ID', 'name'],
          values: [201, 'MyBeer'],
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch(
        `INSERT INTO csw_Beers ( ID, name , createdAt, createdBy, modifiedAt, modifiedBy ) VALUES ( ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ? )`
      )
      expect(values).toEqual([201, 'MyBeer', 'ANONYMOUS', 'ANONYMOUS'])
    })

    it('should return a valid INSERT statement with given columns and rows', () => {
      const query = {
        cmd: 'INSERT',
        INSERT: {
          into: 'csw.Beers',
          columns: ['ID', 'name'],
          rows: [
            [201, 'MyBeer'],
            [202, 'MyOtherBeer'],
          ],
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch(
        `INSERT INTO csw_Beers ( ID, name , createdAt, createdBy, modifiedAt, modifiedBy ) VALUES ( ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ? )`
      )
      expect(values).toEqual([
        [201, 'MyBeer', 'ANONYMOUS', 'ANONYMOUS'],
        [202, 'MyOtherBeer', 'ANONYMOUS', 'ANONYMOUS'],
      ])
    })

    it('should return a valid INSERT statement with given entries', () => {
      const query = {
        cmd: 'INSERT',
        INSERT: {
          into: 'csw.Beers',
          entries: [
            { ID: 201, name: 'MyBeer' },
            { ID: 202, name: 'MyOtherBeer' },
          ],
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch(
        `INSERT INTO csw_Beers ( ID, name, createdAt, createdBy, modifiedAt, modifiedBy ) VALUES ( ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), ? )`
      )
      expect(values).toEqual([
        [201, 'MyBeer', 'ANONYMOUS', 'ANONYMOUS'],
        [202, 'MyOtherBeer', 'ANONYMOUS', 'ANONYMOUS'],
      ])
    })
  })

  describe('UpdateBuilder', () => {
    test('+ should return a valid UPDATE statement with given data', async () => {
      const query = {
        cmd: 'UPDATE',
        UPDATE: {
          entity: { ref: ['BeershopService.Beers'] },
          data: { name: 'The Raven' },
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch('UPDATE BeershopService_Beers SET name = ?')
      expect(values).toEqual(['The Raven'])
    })

    test('+ should return a valid UPDATE statement with given data and where', async () => {
      const query = {
        cmd: 'UPDATE',
        UPDATE: {
          entity: { ref: ['BeershopService.Beers'] },
          data: { name: 'The Raven' },
          where: [{ ref: ['ID'] }, '=', { val: 111 }],
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch('UPDATE BeershopService_Beers SET name = ? WHERE ID = 111')
      expect(values).toEqual(['The Raven'])
    })
  })

  describe('DeleteBuilder', () => {
    test('+ should return a valid DELETE statement with given from', async () => {
      const query = {
        cmd: 'DELETE',
        DELETE: {
          from: { ref: ['BeershopService.Beers'] },
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch('DELETE FROM BeershopService_Beers')
      expect(values).toEqual([])
    })

    test('+ should return a valid DELETE statement with given from and where', async () => {
      const query = {
        cmd: 'DELETE',
        DELETE: {
          from: { ref: ['BeershopService.Beers'] },
          where: [{ ref: ['ID'] }, '=', { val: 111 }],
        },
      }

      const { sql, values = [] } = this.runQuery(query)

      expect(sql).toMatch('DELETE FROM BeershopService_Beers WHERE ID = 111')
      expect(values).toEqual([])
    })
  })

  test.todo('CreateBuilder')

  test.todo('DropBuilder')
})
