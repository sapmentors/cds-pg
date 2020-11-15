const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/srv/db/deploy')
// const credentials = require('./pg-aws-env.json')
// To test against a deployed db save this JSON in i.e. pg-aws-env.json:
/*
{
  "username": "yourusername",
  "password": "yourpassword",
  "hostname": "yourhostname",
  "dbname": "yourdbname",
  "port": "5432",
  "sslRequired": true,
  "sslrootcert": "certificate",
  "uri": "postgres://yourhostname:5432/yourdbname"
}
*/
const credentials = require('./service-scp-pg.test.json')
// mock (package|.cds'rc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  impl: './cds-pg', // hint: not really sure as to why this is, but...
}

describe('OData to Postgres dialect', () => {
  const app = require('express')()
  const request = require('supertest')(app)

  beforeAll(async () => {
    this._model = './__tests__/__assets__/cap-proj/srv/'
    // fill credentials as they are provided from the SAP Cloud Platform
    // Cloud Foundry Hyperscaler PostgreSQL Service
    this._dbProperties = {
      kind: 'postgres',
      model: this._model,
      credentials: credentials,
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
  })
})
