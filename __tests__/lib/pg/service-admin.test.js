const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/deploy')

cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  dialect: 'plain',
  impl: './cds-pg' // hint: not really sure as to why this is, but...
}

// default (single) test environment is local,
// so running against a dockerized postgres with a local cap bootstrap service.
// when there's a .env in /__tests__/__assets__/cap-proj/
// with a scpServiceURL (see .env.example in that dir)
// tests are also run against a deployed service url (cf hyperscaler postgres)
const { suiteEnvironments, app } = require('./_buildSuiteEnvironments')

describe.each(suiteEnvironments)(
  '[%s] OData to Postgres dialect',
  (_suitename /* translates to %s via printf */, credentials, model, request) => {
    beforeAll(async () => {
      // mock console.*
      // in order not to pollute test logs
      global.console = {
        log: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
      this._model = model
      this._dbProperties = {
        kind: 'postgres',
        model: this._model,
        credentials: credentials
      }

      // only bootstrap in local mode as scp app is deployed and running
      if (_suitename.startsWith('local')) {
        await require('./_runLocal')(model, credentials, app, false) // don't deploy content initially
      }
    })

    beforeEach(async () => {
      // "reset" aka re-deploy static content
      if (_suitename.startsWith('local')) {
        await deploy(this._model, {}).to(this._dbProperties)
      } else if (_suitename === 'scp') {
        await request.post(`/beershop/reset`).send({}).set('content-type', 'application/json')
      }
    })

    afterAll(() => {
      delete global.console // avoid side effect
    })

    test('OData: List of entities exposed by the admin service', async () => {
      const response = await request.get('/beershop-admin/').auth('bob', '')

      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toStrictEqual(3)
    })

    test('OData: List of entities exposed by the service', async () => {
      const response = await request.get('/beershop/')

      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toStrictEqual(4)
    })

    describe('OData admin: CREATE', () => {
      test('odata: entityset Beers -> sql: insert into beers', async () => {
        const response = await request
          .post('/beershop-admin/Beers')
          .send({
            name: 'Schlappe Seppel',
            ibu: 10,
            abv: '16.2'
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
          .auth('bob', '')

        expect(response.body.createdAt).toBeTruthy()
        expect(response.body.modifiedAt).toBeTruthy()
        expect(response.body.createdBy).toStrictEqual('bob')
        expect(response.body.modifiedBy).toStrictEqual('bob')
        expect(response.status).toStrictEqual(201)

        const responseGet = await request.get(`/beershop-admin/Beers(${response.body.ID})`).auth('bob', '')

        expect(responseGet.status).toStrictEqual(200)
        expect(responseGet.body.createdBy).toStrictEqual('bob')
        expect(responseGet.body.modifiedBy).toStrictEqual('bob')

        const responseDelete = await request.delete(`/beershop-admin/Beers(${response.body.ID})`).auth('bob', '')
        expect(responseDelete.status).toStrictEqual(204)
      })
    })
  }
)
