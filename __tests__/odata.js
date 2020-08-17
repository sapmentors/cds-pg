const cds = require('@sap/cds')
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  impl: './cds-pg',
}
describe('OData to Postgres dialect', () => {
  const app = require('express')()
  const request = require('supertest')(app)
  beforeAll(async () => {
    cds.db = await cds.connect.to({
      kind: 'postgres',
      credentials: {
        host: 'localhost',
        port: '5432',
        database: 'beershop',
        user: 'postgres',
        password: 'postgres',
      },
    })
    await cds
      .serve('BeershopService')
      .from(__dirname + '/__assets__/cap-proj/srv/beershop-service')
      .in(app)
  })

  // afterAll(async () => {
  //   await app.close()
  //   process.emit('shutdown')
  // })

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
  })
})
