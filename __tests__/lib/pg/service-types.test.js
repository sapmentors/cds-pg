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

    describe('OData types: CREATE', () => {
      test(' -> Boolean', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_Boolean: true,
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Int32', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_Int32: 10,
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Int64', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_Int64: 1000000000000,
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Decimal', async () => {
        const response = await request
          .post('/beershop/TypeChecks')
          .send({
            type_Decimal: '3.1',
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Double', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_Double: 23423.1234234,
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Date', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_Date: '2015-12-31',
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Time', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_Time: '10:21:15',
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> DateTime', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_DateTime: '2012-12-03T07:16:23.574Z',
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Timestamp', async () => {
        const value = '2012-12-03T07:16:23.574Z';
        const response = await request.post('/beershop/TypeChecks').send({
          type_Timestamp: value,
        })
        expect(response.status).toStrictEqual(201)
        const verify = await request.get(`/beershop/TypeChecks(${response.body.ID})`).send()
        expect(verify.body.type_Timestamp).toStrictEqual(value);
      })

      test(' -> String', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_String: 'Hello World',
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> Binary', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_Binary: 'SGVsbG8gV29ybGQ=',
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> LargeBinary', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_LargeBinary: 'SGVsbG8gV29ybGQ=',
        })
        expect(response.status).toStrictEqual(201)
      })

      test(' -> LargeString', async () => {
        const response = await request.post('/beershop/TypeChecks').send({
          type_LargeString:
            'Magna sit do quis culpa elit laborum culpa laboris excepteur. Proident qui culpa mollit ut ad enim. Reprehenderit aute occaecat ut ut est nostrud aliquip.',
        })
        expect(response.status).toStrictEqual(201)
      })
    })
  }
)
