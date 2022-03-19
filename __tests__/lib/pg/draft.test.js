const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/deploy')

// mock (package|.cdsrc).json entries
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
        dialect: 'plain',
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

    describe('OData draft', () => {
      test(' ->  switch entity to edit mode and check that active entity can still be read', async () => {
        const basepath = '/beershop/TypeChecksWithDraft(ID=5e4ca9ef-7c4c-4b22-8e85-7cadefa02c94,IsActiveEntity=true)'
        const response = await request
          .post(
            `${basepath}/BeershopService.draftEdit?$expand=DraftAdministrativeData($select=DraftUUID,InProcessByUser)`
          )
          .send({
            PreserveChanges: true,
          })
        expect(response.status).toStrictEqual(201)

        const responseGet = await request.get(basepath)
        expect(responseGet.status).toStrictEqual(200)
      })
    })
  }
)
