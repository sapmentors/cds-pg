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
    const response = await request
      .get('/beershop/$metadata')
      .expect('Content-Type', /^application\/xml/)
      .expect(200)

    const expectedVersion = '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">'
    const expectedBeersEntitySet = '<EntitySet Name="Beers" EntityType="BeershopService.Beers">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBeersEntitySet)).toBeTruthy()
  })

  describe('odata: GET -> sql: SELECT', () => {
    test('full entityset Beers', async () => {
      const response = await request.get('/beershop/Beers').expect(200)
      expect(response.status).toStrictEqual(200)
    })
  })
})
