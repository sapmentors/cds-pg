const cds = require('@sap/cds')

// mock (package|.cdsrc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  impl: './cds-pg', // hint: not really sure as to why this is, but...
}

describe('OData to Postgres dialect', () => {
  const app = require('express')()
  const request = require('supertest')(app)

  // custom bootstrap
  // docker pg server needs to be started first!
  beforeAll(async () => {
    cds.db = await cds.connect.to({
      kind: 'postgres',
      credentials: {
        host: 'localhost',
        port: '5432',
        database: 'beershop',
        username: 'postgres',
        password: 'postgres',
      },
    })
    // serve only a plain beershop
    // that matches the db content/setup in dockered pg
    await cds.serve('BeershopService').from(`${__dirname}/../../__assets__/cap-proj/srv/beershop-service`).in(app)

    // TODO: Reset the DB
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
    test('odata: entityset Beers -> sql: select all beers', async () => {
      const response = await request.get('/beershop/Beers')
      expect(response.status).toStrictEqual(200)
      //expect(response.body.value.length).toStrictEqual(2)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })

    test.skip('odata: entityset Beers -> sql: select all beers and count', async () => {
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

    test('odata: select -> sql: select record', async () => {
      const response = await request.get('/beershop/Beers(9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b)?$select=name,ibu')
      // http response code
      expect(response.status).toStrictEqual(200)
      // the beer
      expect(response.body.abv).toBeUndefined()
      expect(response.body.name).toStrictEqual('Schönramer Hell')
    })

    test('odata: select -> sql: select record', async () => {
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
      // further assertions
    })
    test
    test.todo('odata: $filter -> sql: select')
    test.todo('odata: $filter on $expand -> sql: select')
    test.todo('odata: multiple $ combined: $expand, $filter, $select -> sql: select')
  })

  describe('odata: POST -> sql: INSERT', () => {
    test('odata: entityset Beers -> sql: insert into beers', async () => {
      const response = await request
        .post('/beershop/Beers')
        .send({
          name: 'Schlappe Seppel',
          ibu: 10,
          abv: '16.2',
        })
        .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')

      this._genratedId = response.body.ID
      expect(response.status).toStrictEqual(201)
    })

    afterEach(async () => {
      await request.delete(`/beershop/Beers/${this._genratedId}`).send()
    })
  })

  describe('odata: DELETE -> sql: DELETE', () => {
    beforeEach(async () => {
      const response = await request
        .post('/beershop/Beers')
        .send({
          name: 'Schlappe Seppel',
          ibu: 10,
          abv: '6.2',
        })
        .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
      this._genratedId = response.body.ID
    })

    test('odata delete ', async () => {
      const response = await request.delete(`/beershop/Beers/${this._genratedId}`).send()
      expect(response.status).toStrictEqual(204)
    })
  })
})
