const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/db/deploy')

// mock (package|.cdsrc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  impl: './cds-pg', // hint: not really sure as to why this is, but...
}

const guidRegEx = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/

describe('OData to Postgres dialect', () => {
  const app = require('express')()
  const request = require('supertest')(app)

  beforeAll(async () => {
    this._model = './__tests__/__assets__/cap-proj/srv/'
    this._dbProperties = {
      kind: 'postgres',
      model: this._model,
      credentials: {
        host: 'localhost',
        port: '5432',
        database: 'beershop',
        username: 'postgres',
        password: 'postgres',
      },
    }
    cds.db = await cds.connect.to(this._dbProperties)

    // serve only a plain beershop
    // that matches the db content/setup in dockered pg
    await cds.serve('BeershopService').from(`${__dirname}/../../__assets__/cap-proj/srv/beershop-service`).in(app)
  })

  beforeEach(async () => {
    await deploy(this._model, {}).to(this._dbProperties)
  })

  // making sure we're running the beershop
  // no db connection required
  test('$metadata document', async () => {
    const response = await request.get('/beershop/$metadata')

    expect(response.status).toStrictEqual(200)
    const expectedVersion = '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">'
    const expectedBeersEntitySet = '<EntitySet Name="Beers" EntityType="BeershopService.Beers">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBeersEntitySet)).toBeTruthy()
  })

  describe('odata: GET -> sql: SELECT', () => {
    beforeEach(async () => {
      await deploy(this._model, {}).to(this._dbProperties)
    })
    test('odata: entityset Beers -> sql: select all beers', async () => {
      const response = await request.get('/beershop/Beers')
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toStrictEqual(2)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })

    test('odata: entityset Beers -> sql: select all beers and count', async () => {
      const response = await request.get('/beershop/Beers?$count=true')
      expect(response.status).toStrictEqual(200)
      expect(response.body['@odata.count']).toEqual(2)
    })

    test('odata: single entity -> sql: select record', async () => {
      const response = await request.get('/beershop/Beers(9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b)')
      // http response code
      expect(response.status).toStrictEqual(200)
      // the beer
      expect(response.body.ID).toStrictEqual('9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
      expect(response.body.name).toStrictEqual('Schönramer Hell')
    })

    test('odata: $select -> sql: select record', async () => {
      const response = await request.get('/beershop/Beers(9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b)?$select=name,ibu')
      // http response code
      expect(response.status).toStrictEqual(200)
      // the beer
      expect(response.body.abv).toBeUndefined()
      expect(response.body.name).toStrictEqual('Schönramer Hell')
    })

    test('odata: $filter -> sql: select record', async () => {
      const response = await request.get("/beershop/Beers?$filter=name eq 'Lagerbier Hell'")

      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toStrictEqual(1)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })
    test('odata: $expand single entity on 1:1 rel -> sql: sub-select single record from expand-target table', async () => {
      const response = await request.get('/beershop/Beers/9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b?$expand=brewery')
      expect(response.status).toStrictEqual(200)
      expect(response.body.brewery.ID).toStrictEqual('fa6b959e-3a01-40ef-872e-6030ee4de4e5')
    })
    test('odata: $expand entityset on 1:1 rel -> sql: sub-select from expand-target table', async () => {
      const response = await request.get('/beershop/Beers?$expand=brewery')
      expect(response.status).toStrictEqual(200)
      expect(response.body.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            brewery: {
              ID: 'fa6b959e-3a01-40ef-872e-6030ee4de4e5',
              name: 'Private Landbrauerei Schönram GmbH & Co. KG',
            },
          }),
        ])
      )
    })
    test('odata: $expand entityset on 1:n rel -> sql: sub-select multiple records from expand-target table', async () => {
      const response = await request.get('/beershop/Breweries?$expand=beers')
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBeGreaterThanOrEqual(2) // we have 2 beers
      response.body.value.map((brewery) => {
        expect(brewery.beers.length).toBeGreaterThanOrEqual(1) // every brewery has at least 1 beer
        expect(brewery.beers[0].ID).toMatch(guidRegEx) // guid
        expect(brewery.beers[0].name).toMatch(/\w+/)
      })
    })
    test('odata: $filter on $expand (1:n) -> sql: sub-select matching records from expand-target table', async () => {
      const response = await request.get("/beershop/Breweries?$expand=beers($filter=name eq 'Schönramer Hell')")
      expect(response.status).toStrictEqual(200)
      const data = response.body.value
      const augustiner = data.find((brewery) => brewery.name.includes('Augustiner'))
      expect(augustiner.beers.length).toStrictEqual(0) // Augustiner doesn't produce Schönramer Hell
      const schoenram = data.find((brewery) => brewery.name.includes('Private Landbrauerei'))
      expect(schoenram.beers.length).toStrictEqual(1) // that's where Schönramer Hell is produced
      expect(schoenram.beers).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
    })
    test('odata: multiple $ combined: $expand, $filter, $select -> sql: sub-select only selected fields matching records from expand-target table', async () => {
      const response = await request.get(
        "/beershop/Breweries?$expand=beers($filter=name eq 'Schönramer Hell';$select=name,ibu)"
      )
      expect(response.status).toStrictEqual(200)
      const data = response.body.value
      const augustiner = data.find((brewery) => brewery.name.includes('Augustiner'))
      expect(augustiner.beers.length).toStrictEqual(0) // Augustiner doesn't produce Schönramer Hell
      const schoenram = data.find((brewery) => brewery.name.includes('Private Landbrauerei'))
      expect(schoenram.beers.length).toStrictEqual(1) // that's where Schönramer Hell is produced
      // we expect only these fields
      expect(schoenram.beers[0]).toMatchObject({
        ID: expect.stringMatching(guidRegEx),
        name: 'Schönramer Hell',
        ibu: 20,
      })
    })
  })

  describe('odata: POST -> sql: INSERT', () => {
    beforeEach(async () => {
      await deploy(this._model, {}).to(this._dbProperties)
    })

    test('odata: entityset Beers -> sql: insert into beers', async () => {
      const response = await request
        .post('/beershop/Beers')
        .send({
          name: 'Schlappe Seppel',
          ibu: 10,
          abv: '16.2',
        })
        .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')

      expect(response.status).toStrictEqual(201)
    })
  })

  describe('odata: DELETE -> sql: DELETE', () => {
    test('odata delete ', async () => {
      const response = await request.delete(`/beershop/Beers/9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b`).send()
      expect(response.status).toStrictEqual(204)
    })
  })
})
