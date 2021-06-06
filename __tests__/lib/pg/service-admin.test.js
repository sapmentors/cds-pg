const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/deploy')

cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  impl: './cds-pg', // hint: not really sure as to why this is, but...
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
      this._model = model
      this._dbProperties = {
        kind: 'postgres',
        model: this._model,
        credentials: credentials,
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

    describe('OData admin: CREATE', () => {
      test.todo('odata: entityset Beers -> sql: insert into beers', async () => {
        const response = await request
          .post('/beershop-admin/Beers')
          .send({
            name: 'Schlappe Seppel',
            ibu: 10,
            abv: '16.2',
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
          .set('Authorization', 'Basic Ym9iOg==')

        expect(response.body.createdAt).toBeTruthy()
        expect(response.body.modifiedAt).toBeTruthy()
        //expect(response.body.createdBy).toStrictEqual('bob')
        // expect(response.body.modifiedBy).toStrictEqual('bob')
        expect(response.status).toStrictEqual(201)
      })
    })
  }
)
