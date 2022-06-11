const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/deploy')

// mock (package|.cdsrc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  dialect: 'plain',
  impl: './cds-pg' // hint: not really sure as to why this is, but...
}

jest.setTimeout(100000)

describe('QL to PostgreSQL', () => {
  beforeAll(async () => {
    this._model = './__tests__/__assets__/cap-proj/srv/'
    this._dbProperties = {
      kind: 'postgres',
      dialect: 'plain',
      model: this._model,
      credentials: {
        host: 'localhost',
        port: '5432',
        database: 'beershop',
        username: 'postgres',
        password: 'postgres'
      }
    }
    cds.db = await cds.connect.to(this._dbProperties)
  })

  describe('SELECT', () => {
    beforeEach(async () => {
      await deploy(this._model, {}).to(this._dbProperties)
    })

    test('-> with from', async () => {
      const { Beers } = cds.entities('csw')
      const beers = await cds.run(SELECT.from(Beers))
      expect(beers.length).toStrictEqual(11)
      expect(beers).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })

    test('-> with from and limit', async () => {
      const { Beers } = cds.entities('csw')
      const beers = await cds.run(SELECT.from(Beers).limit(1))
      expect(beers.length).toStrictEqual(1)
    })

    test('-> with one and where', async () => {
      const { Beers } = cds.entities('csw')
      const beer = await cds.run(SELECT.one(Beers).where({ ID: '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b' }))
      expect(beer).toHaveProperty('ID', '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
    })

    test('-> with one, columns and where', async () => {
      const { Beers } = cds.entities('csw')
      const beer = await cds.run(
        SELECT.one(Beers).columns(['ID', 'name']).where({ ID: '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b' })
      )
      expect(beer).toHaveProperty('ID', '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
      expect(beer).not.toHaveProperty('abv')
    })

    test('-> with one - no result returns null not empty array', async () => {
      const { Beers } = cds.entities('csw')
      const beer = await cds.run(SELECT.one(Beers).where({ name: 'does not exist' }))
      expect(beer).not.toBeInstanceOf(Array)
      expect(beer).toBeNull()
    })

    test('-> with distinct', async () => {
      const { Beers } = cds.entities('csw')
      const results = await cds.run(SELECT.distinct.from(Beers).columns('abv'))
      expect(results.length).toStrictEqual(6)
      const otherResults = await cds.run(SELECT.distinct.from(Beers).columns('abv', 'ibu'))
      expect(otherResults.length).toStrictEqual(9)
    })

    test('-> with orderBy', async () => {
      const { Beers } = cds.entities('csw')
      const beers = await cds.run(
        SELECT.from(Beers)
          .where({ abv: { '>': 1.0 } })
          .orderBy({ abv: 'desc' })
      )
      expect(beers[0].abv).toStrictEqual('5.9')
      const reverseBeers = await cds.run(
        SELECT.from(Beers)
          .where({ abv: { '>': 1.0 } })
          .orderBy({ abv: 'asc' })
      )
      expect(reverseBeers[0].abv).toStrictEqual('4.9')
    })

    test('-> with groupBy', async () => {
      const { Beers } = cds.entities('csw')
      const results = await cds.run(SELECT.from(Beers).columns('count(*) as count', 'brewery_id').groupBy('brewery_id'))
      expect(results.length).toStrictEqual(6)
    })

    test('-> with having', async () => {
      const { Beers } = cds.entities('csw')
      const results = await cds.run(
        SELECT.from(Beers).columns('brewery_id').groupBy('brewery_id').having('count(*) >=', 2)
      )
      expect(results.length).toStrictEqual(3)
    })

    test('-> with joins', async () => {
      const { Beers } = cds.entities('csw')
      const results = await cds.run(
        SELECT.from(Beers, (b) => {
          b`.*`,
            b.brewery((br) => {
              br`.*`
            })
        }).where({ brewery_id: '4aeebbed-90c2-4bdd-aa70-d8eecb8eaebb' })
      )
      expect(results[0].brewery).toHaveProperty('name', 'Rittmayer Hallerndorf')
      expect(results.length).toStrictEqual(4)
    })
    test('-> case of the query result', async () => {
      const { TypeChecks } = cds.entities('csw')
      const results = await cds.run(SELECT.one.from(TypeChecks))
      expect(results).toHaveProperty('type_Boolean')
    })
  })

  describe('INSERT', () => {
    beforeEach(async () => {
      await deploy(this._model, {}).to(this._dbProperties)
    })

    test('-> by using entries', async () => {
      const { Beers } = cds.entities('csw')

      const beers = await cds.run(INSERT.into(Beers).entries([{ name: 'Test' }, { name: 'Test1' }]))

      expect(beers.affectedRows).toStrictEqual(2)

      const beer = await cds.run(SELECT.one(Beers).where({ name: 'Test1' }))
      expect(beer).toHaveProperty('name', 'Test1')
    })

    test('-> by using columns and rows', async () => {
      const { Beers } = cds.entities('csw')

      const beers = await cds.run(INSERT.into(Beers).columns(['name']).rows(['Beer 1'], ['Beer 2'], ['Beer 3']))

      expect(beers.affectedRows).toStrictEqual(3)

      const beer = await cds.run(SELECT.one(Beers).where({ name: 'Beer 2' }))
      expect(beer).toHaveProperty('name', 'Beer 2')
    })

    test('-> by using columns and values', async () => {
      const { Beers } = cds.entities('csw')

      const beers = await cds.run(INSERT.into(Beers).columns(['name']).values(['Test']))

      expect(beers.affectedRows).toStrictEqual(1)

      const beer = await cds.run(SELECT.one(Beers).where({ name: 'Test' }))
      expect(beer).toHaveProperty('name', 'Test')
    })

    // see https://cap.cloud.sap/docs/node.js/databases#insertresult-beta and https://answers.sap.com/questions/13569793/api-of-insert-query-results-for-cap-nodejs.html
    test('-> with InsertResult Beta API', async () => {
      const { Beers } = cds.entities('csw')

      const entries = [
        { name: 'Beer1', abv: 1.0, ibu: 1, brewery_ID: '0465e9ca-6255-4f5c-b8ba-7439531f8d28' },
        { name: 'Beer2', abv: 2.0, ibu: 2, brewery_ID: '0465e9ca-6255-4f5c-b8ba-7439531f8d28' },
        { name: 'Beer3', abv: 3.0, ibu: 3, brewery_ID: '0465e9ca-6255-4f5c-b8ba-7439531f8d28' }
      ]

      const uuidRegex = /[\d|a-f]{8}-[\d|a-f]{4}-[\d|a-f]{4}-[\d|a-f]{4}-[\d|a-f]{12}/
      const timestampRegex = /[\d]{4}-[\d]{2}-[\d]{2}T[\d]{2}:[\d]{2}:[\d]{2}.[\d]{3}Z/

      const insertResult = await cds.run(INSERT.into(Beers).entries(entries))
      expect(insertResult.affectedRows).toStrictEqual(3)
      expect(insertResult == 3).toStrictEqual(true)
      expect(insertResult.valueOf()).toStrictEqual(insertResult.affectedRows)
      const beers = insertResult.results
      expect(beers.length).toStrictEqual(3)
      expect(beers[0].ID).toMatch(uuidRegex)
      expect(beers[0].createdAt.toISOString()).toMatch(timestampRegex)
      expect(beers[0].modifiedAt.toISOString()).toMatch(timestampRegex)
    })
  })

  describe('UPDATE', () => {
    beforeEach(async () => {
      await deploy(this._model, {}).to(this._dbProperties)
    })

    test('-> Get affected rows ', async () => {
      const { Beers } = cds.entities('csw')
      const affectedRows = await cds.run(
        UPDATE(Beers).set({ name: 'TEST' }).where({ ID: '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b' })
      )
      expect(affectedRows).toStrictEqual(1)
    })

    test('-> multiple rows', async () => {
      const { Beers } = cds.entities('csw')
      const affectedRows = await cds.run(UPDATE(Beers).set({ abv: 1.0 }))
      expect(affectedRows).toStrictEqual(11)
    })
  })
})
