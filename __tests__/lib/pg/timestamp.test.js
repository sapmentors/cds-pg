const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/deploy')

// mock (package|.cdsrc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
    dialect: 'plain',
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

        describe('Timestamp TEST', () => {

            test(' -> Check modifiedAt', async () => {
                //Set Different TimeZone
                await cds.run(`alter user postgres set timezone = 'EST'`, [])//UTC,EST
                const beforeTimestamp = new Date()
                beforeTimestamp.setMilliseconds(0);
                await request.put('/beershop/Beers/9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
                    .send({
                        name: 'Changed name',
                        ibu: 10,
                    })
                    .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
                await cds.run(`alter user postgres set timezone = 'UTC'`, [])
                const response = await request.get('/beershop/Beers/9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
                const afterTimestamp = new Date()
                const modifiedAt = new Date(response.body.modifiedAt)
                expect((beforeTimestamp <= modifiedAt) && (modifiedAt <= afterTimestamp)).toBe(true)
            })
        })
    }
)
