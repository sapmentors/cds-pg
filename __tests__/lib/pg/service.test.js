const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/deploy')
// const path = require('path')

// mock (package|.cds'rc).json entries
cds.env.requires.db = {
  kind: 'postgres'
}
cds.env.requires.postgres = {
  dialect: 'plain',
  impl: './cds-pg' // hint: not really sure as to why this is, but...
}

const guidRegEx = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/

// default (single) test environment is local,
// so running against a dockerized postgres with a local cap bootstrap service.
// when there's a .env in /__tests__/__assets__/cap-proj/
// with a scpServiceURL (see .env.example in that dir)
// tests are also run against a deployed service url (cf hyperscaler postgres)
const { suiteEnvironments, app } = require('./_buildSuiteEnvironments')

// run test suite with different sets of data
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
        dialect: 'plain',
        model: this._model,
        credentials: credentials
      }

      // only bootstrap in local mode as scp app is deployed and running
      if (_suitename.startsWith('local')) {
        await require('./_runLocal')(model, credentials, app, false) // don't deploy content initially
      }
    })

    afterAll(() => {
      delete global.console // avoid side effect
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

    test('List of entities exposed by the service', async () => {
      const response = await request.get('/beershop/')

      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toStrictEqual(4)
    })

    describe('odata: GET -> sql: SELECT', () => {
      beforeEach(async () => {
        // "reset" aka re-deploy static content
        if (_suitename.startsWith('local')) {
          await deploy(this._model, {}).to(this._dbProperties)
        } else if (_suitename === 'scp') {
          await request.post(`/beershop/reset`).send({}).set('content-type', 'application/json')
        }
      })
      test('odata: entityset Beers -> sql: select all beers', async () => {
        const response = await request.get('/beershop/Beers')
        expect(response.status).toStrictEqual(200)
        expect(response.body.value.length).toStrictEqual(11)
        expect(response.body.value).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Lagerbier Hell'
            })
          ])
        )
      })

      test('odata: entityset Beers -> sql: select all beers ORDER BY "virtual field"', async () => {
        const response = await request.get('/beershop/Beers?$orderby=rating')
        expect(response.status).toStrictEqual(200)
        expect(response.body.value.length).toStrictEqual(11)
        expect(response.body.value).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Lagerbier Hell',
              rating: null
            })
          ])
        )
      })

      test('odata: entityset Beers -> sql: select all beers and count', async () => {
        const response = await request.get('/beershop/Beers?$count=true')
        expect(response.status).toStrictEqual(200)
        expect(response.body['@odata.count']).toEqual(11)
      })

      test('odata: entityset Beers -> count only', async () => {
        const response = await request.get('/beershop/Beers/$count')
        expect(response.status).toStrictEqual(200)
        expect(response.text).toEqual('11')
      })

      test('odata: single entity -> sql: select record', async () => {
        const response = await request.get('/beershop/Beers(9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b)')
        // http response code
        expect(response.status).toStrictEqual(200)
        // the beer
        expect(response.body.ID).toStrictEqual('9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
        expect(response.body.name).toStrictEqual('Schönramer Hell')
      })

      test('odata: $select -> sql: select record', async () => {
        const response = await request.get('/beershop/Beers(9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b)?$select=name,ibu')
        // http response code
        expect(response.status).toStrictEqual(200)
        // the beer
        expect(response.body.abv).toBeUndefined()
        expect(response.body.name).toStrictEqual('Schönramer Hell')
      })

      test('odata: $filter -> sql: select record', async () => {
        const response = await request.get("/beershop/Beers?$filter=name eq 'Lagerbier Hell'")

        expect(response.status).toStrictEqual(200)
        expect(response.body.value.length).toStrictEqual(1)
        expect(response.body.value).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Lagerbier Hell'
            })
          ])
        )
      })

      test('odata: $filter -> Lambda Operator any', async () => {
        const response = await request.get('/beershop/Breweries?$count=true&$filter=beers/any(d:d/abv ge 5)')

        expect(response.status).toStrictEqual(200)
        expect(response.body.value.length).toStrictEqual(4)
        expect(response.body['@odata.count']).toStrictEqual(4)
      })

      test('odata: $filter -> Lambda Operator all', async () => {
        const response = await request.get('/beershop/Breweries?$count=true&$filter=beers/all(d:d/abv ge 5)')

        expect(response.status).toStrictEqual(200)
        expect(response.body.value.length).toStrictEqual(2)
        expect(response.body['@odata.count']).toStrictEqual(2)
      })

      test('odata: $expand single entity on 1:1 rel -> sql: sub-select single record from expand-target table', async () => {
        const response = await request.get(
          '/beershop/Beers/9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b?$expand=brewery($select=ID,name)'
        )
        expect(response.status).toStrictEqual(200)
        expect(response.body.brewery.ID).toStrictEqual('fa6b959e-3a01-40ef-872e-6030ee4de4e5')
      })
      test('odata: $expand entityset on 1:1 rel -> sql: sub-select from expand-target table', async () => {
        const response = await request.get('/beershop/Beers?$expand=brewery($select=ID,name)')
        expect(response.status).toStrictEqual(200)
        expect(response.body.value).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              brewery: {
                ID: 'fa6b959e-3a01-40ef-872e-6030ee4de4e5',
                name: 'Private Landbrauerei Schönram GmbH & Co. KG'
              }
            })
          ])
        )
      })
      test('odata: $expand entityset on 1:n rel -> sql: sub-select multiple records from expand-target table', async () => {
        const response = await request.get('/beershop/Breweries?$expand=beers')
        expect(response.status).toStrictEqual(200)
        expect(response.body.value.length).toBeGreaterThanOrEqual(2) // we have 2 beers
        response.body.value.map((brewery) => {
          expect(brewery.beers.length).toBeGreaterThanOrEqual(1) // every brewery has at least 1 beer
          expect(brewery.beers[0].ID).toMatch(guidRegEx) // guid
          expect(brewery.beers[0].name).toMatch(/\w+/)
        })
      })
      test('odata: $filter on $expand (1:n) -> sql: sub-select matching records from expand-target table', async () => {
        const response = await request.get(
          `/beershop/Breweries?$expand=beers($filter=name eq '${encodeURIComponent('Schönramer Hell')}')`
        )
        expect(response.status).toStrictEqual(200)
        const data = response.body.value
        const augustiner = data.find((brewery) => brewery.name.includes('Augustiner'))
        expect(augustiner.beers.length).toStrictEqual(0) // Augustiner doesn't produce Schönramer Hell
        const schoenram = data.find((brewery) => brewery.name.includes('Private Landbrauerei'))
        expect(schoenram.beers.length).toStrictEqual(1) // that's where Schönramer Hell is produced
        expect(schoenram.beers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Schönramer Hell'
            })
          ])
        )
      })
      test('odata: multiple $ combined: $expand, $filter, $select -> sql: sub-select only selected fields matching records from expand-target table', async () => {
        const response = await request.get(
          `/beershop/Breweries?$expand=beers($filter=name eq '${encodeURIComponent(
            'Schönramer Hell'
          )}';$select=name,ibu)`
        )
        expect(response.status).toStrictEqual(200)
        const data = response.body.value
        const augustiner = data.find((brewery) => brewery.name.includes('Augustiner'))
        expect(augustiner.beers.length).toStrictEqual(0) // Augustiner doesn't produce Schönramer Hell
        const schoenram = data.find((brewery) => brewery.name.includes('Private Landbrauerei'))
        expect(schoenram.beers.length).toStrictEqual(1) // that's where Schönramer Hell is produced
        // we expect only these fields
        expect(schoenram.beers[0]).toMatchObject({
          ID: expect.stringMatching(guidRegEx),
          name: 'Schönramer Hell',
          ibu: 20
        })
      })
    })

    describe('odata: GET on Draft enabled Entity -> sql: SELECT', () => {
      beforeEach(async () => {
        // "reset" aka re-deploy static content
        if (_suitename.startsWith('local')) {
          await deploy(this._model, {}).to(this._dbProperties)
        } else if (_suitename === 'scp') {
          await request.post(`/beershop/reset`).send({}).set('content-type', 'application/json')
        }
      })
      test('odata: entityset TypeChecksWithDraft -> select all', async () => {
        const response = await request.get('/beershop/TypeChecksWithDraft')
        expect(response.status).toStrictEqual(200)
      })
      test('odata: entityset TypeChecksWithDraft -> select all and count', async () => {
        const response = await request.get('/beershop/TypeChecksWithDraft?$count=true')
        expect(response.status).toStrictEqual(200)
        expect(response.body['@odata.count']).toEqual(1)
      })
      test('odata: entityset TypeChecksWithDraft -> select like Fiori Elements UI', async () => {
        const response = await request.get(
          '/beershop/TypeChecksWithDraft?$count=true&$expand=DraftAdministrativeData&$filter=(IsActiveEntity%20eq%20false%20or%20SiblingEntity/IsActiveEntity%20eq%20null)&$select=HasActiveEntity,ID,IsActiveEntity,type_Boolean,type_Date,type_Int32&$skip=0&$top=30'
        )
        expect(response.status).toStrictEqual(200)
        expect(response.body['@odata.count']).toEqual(1)
      })
      test('odata: create new entityset TypeChecksWithDraft -> create like Fiori Elements UI', async () => {
        const response = await request
          .post('/beershop/TypeChecksWithDraft')
          .send(JSON.stringify({}))
          .set('Accept', 'application/json;odata.metadata=minimal;IEEE754Compatible=true')
          .set('Content-Type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
        // Creates:
        // sql > SELECT * FROM BeershopService_TypeChecksWithDraft_drafts ALIAS_1 WHERE ID = $1
        // values >  [ 'c436a286-6d1e-44ad-9630-b09e55b9a61e' ]
        // But this fails with:
        // The key 'ID' does not exist in the given entity
        // the column is created with lowercase id
        expect(response.status).toStrictEqual(201)
      })
    })

    describe('odata: POST -> sql: INSERT', () => {
      beforeEach(async () => {
        // "reset" aka re-deploy static content
        if (_suitename.startsWith('local')) {
          await deploy(this._model, {}).to(this._dbProperties)
        } else if (_suitename === 'scp') {
          await request.post(`/beershop/reset`).send({}).set('content-type', 'application/json')
        }
      })

      test('odata: entityset Beers -> sql: insert into beers', async () => {
        const response = await request
          .post('/beershop/Beers')
          .send({
            name: 'Schlappe Seppel',
            ibu: 10,
            abv: '16.2'
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')

        expect(response.body.createdAt).toBeTruthy()
        expect(response.body.modifiedAt).toBeTruthy()
        expect(response.body.createdBy).toBeTruthy()
        expect(response.body.modifiedBy).toBeTruthy()
        expect(response.status).toStrictEqual(201)
      })
    })

    describe('odata: POST -> DEEP INSERT', () => {
      beforeEach(async () => {
        await deploy(this._model, {}).to(this._dbProperties)
      })

      test('odata: deep insert Brewery and beers -> sql: deep insert into Breweries', async () => {
        const response = await request
          .post('/beershop/Breweries')
          .send({
            name: 'Gluck Fabrik',
            beers: [
              {
                name: 'Glucks Pils',
                ibu: 101,
                abv: '5.2'
              },
              {
                name: 'Glucks Pils Herb',
                ibu: 101,
                abv: '6.2'
              }
            ]
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
        expect(response.body.createdAt).toBeTruthy()
        expect(response.body.modifiedAt).toBeTruthy()
        expect(response.body.createdBy).toBeTruthy()
        expect(response.body.modifiedBy).toBeTruthy()
        expect(response.body.beers.length).toBe(2)
        expect(response.body.beers[0].name).toStrictEqual('Glucks Pils')
        expect(response.body.beers[1].name).toStrictEqual('Glucks Pils Herb')
        expect(response.status).toStrictEqual(201)
      })
    })

    describe('odata: PUT -> sql: UPDATE', () => {
      beforeEach(async () => {
        // "reset" aka re-deploy static content
        if (_suitename.startsWith('local')) {
          await deploy(this._model, {}).to(this._dbProperties)
        } else if (_suitename === 'scp') {
          await request.post(`/beershop/reset`).send({}).set('content-type', 'application/json')
        }
      })

      test('odata: entityset Beers -> sql: update beers', async () => {
        const response = await request
          .put('/beershop/Beers/9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b')
          .send({
            name: 'Changed name',
            ibu: 10
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
        expect(response.status).toStrictEqual(200)

        const getResponse = await request.get('/beershop/Beers/9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b').send()
        expect(getResponse.body).toEqual(
          expect.objectContaining({
            name: 'Changed name',
            ibu: 10
          })
        )
      })

      test('odata: entityset Beers -> sql: create beer', async () => {
        const response = await request
          .put('/beershop/Beers/e0c571af-7745-4f1a-88bc-d7620aff6a39')
          .send({
            name: 'Testbier created with PUT',
            ibu: 15
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
        expect(response.status).toStrictEqual(200)

        const getResponse = await request.get('/beershop/Beers/e0c571af-7745-4f1a-88bc-d7620aff6a39').send()
        expect(getResponse.body).toEqual(
          expect.objectContaining({
            name: 'Testbier created with PUT',
            ibu: 15
          })
        )
        // Cleanup created entry
        await request.delete('/beershop/Beers/e0c571af-7745-4f1a-88bc-d7620aff6a39').send()
      })
    })

    describe('odata: DELETE -> sql: DELETE', () => {
      test('odata: delete single beer -> sql: delete record', async () => {
        const guid = '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b'
        const response = await request.delete(`/beershop/Beers(${guid})`)
        expect(response.status).toStrictEqual(204)

        // make sure the deleted beer doesn't exist anymore
        const subsequentResponse = await request.get(`/beershop/Beers(${guid})`)
        expect(subsequentResponse.status).toStrictEqual(404)
      })
      // reinsert deleted entry to allow further test to run
      afterEach(async () => {
        await request
          .post(`/beershop/Beers`)
          .send({
            ID: '9e1704e3-6fd0-4a5d-bfb1-13ac47f7976b',
            name: 'Schönramer Hell',
            abv: '5.0',
            ibu: 20,
            brewery_ID: 'fa6b959e-3a01-40ef-872e-6030ee4de4e5'
          })
          .set('Accept', 'application/json;odata.metadata=minimal;IEEE754Compatible=true')
          .set('Content-Type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
      })
    })
    describe('odata: SCHEMAS -> Test user-defined-schema functionality', () => {
      test('odata: entityset Beers -> sql: delete 1 entry from superbeers & confirm 11 entryies in public schema', async () => {
        const suiteEnvironments = { suitename: _suitename, credentials: credentials, model: model, request: request }
        if (suiteEnvironments.suitename === 'local-with-schema') {
          const guid = '1efd2b35-6fd4-4ac5-a73e-64dfc3fb123b'
          let response = await request.delete(`/beershop/Beers(${guid})`).set('schema', 'superbeer')
          expect(response.status).toStrictEqual(204)

          response = await request.get(`/beershop/Beers?$count=true`).set('schema', 'superbeer')
          expect(response.status).toStrictEqual(200)
          expect(response.body['@odata.count']).toEqual(10)

          response = await request.get(`/beershop/Beers?$count=true`).set('schema', 'public')
          expect(response.status).toStrictEqual(200)
          expect(response.body['@odata.count']).toEqual(11)
        }
      })
    })
    describe('odata: PATCH -> DEEP UPDATE', () => {
      test('odata: deep update Brewery and beers -> sql: deep update into Breweries', async () => {
        const response = await request
          .patch('/beershop/Breweries/4aeebbed-90c2-4bdd-aa70-d8eecb8eaebb')
          .send({
            name: 'Rittmayer Hallerndorfz',
            beers: [
              {
                name: 'Weissen',
                ibu: 55,
                abv: '5.2'
              }
            ]
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
        expect(response.status).toStrictEqual(200)
        // deep update deletes the other beers from Rittmayer Hallerndorf - they have to be restored, otherwise the user-defined-schema test fails
        const restoreReponse = await request
          .patch('/beershop/Breweries/4aeebbed-90c2-4bdd-aa70-d8eecb8eaebb')
          .send({
            name: 'Rittmayer Hallerndorf',
            beers: [
              {
                name: 'Hallerndorfer Landbier Hell',
                abv: 4.9,
                ibu: 0
              },
              {
                name: 'Hallerndorfer Hausbrauerbier',
                abv: 5,
                ibu: 0
              },
              {
                name: 'Bitter 42',
                abv: 5.5,
                ibu: 42
              },
              {
                name: 'Summer 69',
                abv: 5.9,
                ibu: 12
              }
            ]
          })
          .set('content-type', 'application/json;charset=UTF-8;IEEE754Compatible=true')
        expect(restoreReponse.status).toStrictEqual(200)
      })
    })
  }
)
