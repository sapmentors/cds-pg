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
    await cds.serve('BeershopService').from(`${__dirname}/__assets__/cap-proj/srv/beershop-service`).in(app)
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
      // http response code
      expect(response.status).toStrictEqual(200)
      // 2 beers in the shop
      expect(response.body.value.length).toStrictEqual(2)
      // at least one of them must be the "Lagerbier Hell"
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })

    test('odata: single entity -> sql: select record', async () => {
      const response = await request.get('/beershop/Beers(9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b)')
      // http response code
      expect(response.status).toStrictEqual(200)
      // the beer
      expect(response.body.ID).toStrictEqual('9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
      expect(response.body.name).toStrictEqual('Schönramer Hell')
    })

    test.skip('odata: $expand entityset on 1:1 rel -> sql: sub-select from expand-target table', async () => {
      const response = await request.get('/beershop/Beers?$expand=brewery')
      /*
        { SELECT: {
          from: {ref:['BeershopService.Beers']},
          columns: [
            {ref:['ID']},
            {ref:['name']},
            {ref:['abv']},
            {ref:['ibu']},
            {ref:['brewery_ID']},
            {
              ref: [ 'brewery' ],
              expand: [ {ref:['ID']}, {ref:['name']} ],
              orderBy: [ {ref:[ 'ID' ], sort: 'asc' } ],
              limit: { rows: {val:9007199254740991} }
            }
          ],
          orderBy: [ {ref:[ 'ID' ], sort: 'asc' } ],
          limit: { rows: {val:1000} }
        }}
      */
      // http response code
      expect(response.status).toStrictEqual(200)
      // further assertions
    })
    test.skip('odata: $expand single entity on 1:1 rel -> sql: sub-select single record from expand-target table', async () => {
      const response = await request.get('/beershop/Beers(9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b)?$expand=brewery')
      /*
      { SELECT: {
        from: {ref:['BeershopService.Beers']},
        where: [
          {ref:['ID']},
          '=',
          {val:'9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b'}
        ],
        columns: [
          {ref:['ID']},
          {ref:['name']},
          {ref:['abv']},
          {ref:['ibu']},
          {ref:['brewery_ID']},
          {
            ref: [ 'brewery' ],
            expand: [ {ref:['ID']}, {ref:['name']} ],
            orderBy: [ {ref:[ 'ID' ], sort: 'asc' } ],
            limit: { rows: {val:9007199254740991} }
          }
        ]
      }}
      */
      // http response code
      expect(response.status).toStrictEqual(200)
      // further assertions
    })
    test.skip('odata: $expand entityset on 1:n rel -> sql: sub-select multiple records from expand-target table', async () => {
      const response = await request.get('/beershop/Breweries?$expand=beers')
      /*
     { SELECT: {
      from: {ref:['BeershopService.Breweries']},
      columns: [
        {ref:['ID']},
        {ref:['name']},
        {
          ref: [ 'beers' ],
          expand: [
            {ref:['ID']},
            {ref:['name']},
            {ref:['abv']},
            {ref:['ibu']},
            {ref:['brewery_ID']}
          ],
          orderBy: [ {ref:[ 'ID' ], sort: 'asc' } ],
          limit: { rows: {val:9007199254740991} }
        }
      ],
      orderBy: [ {ref:[ 'ID' ], sort: 'asc' } ],
      limit: { rows: {val:1000} }
    }}
      */
      // http response code
      expect(response.status).toStrictEqual(200)
      // further assertions
    })
    test
    test.todo('odata: $filter -> sql: select')
    test.todo('odata: $select -> sql: select')
    test.todo('odata: $filter on $expand -> sql: select')
    test.todo('odata: multiple $ combined: $expand, $filter, $select -> sql: select')
  })
})
