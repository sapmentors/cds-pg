const cds = require('@sap/cds')

// mock (package|.cds'rc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  dialect: 'plain',
  impl: './cds-pg', // hint: not really sure as to why this is, but...
}

// default (single) test environment is local,
// so running against a dockerized postgres with a local cap bootstrap service
// when there's a .env in /__tests__/__assets__/cap-proj/
// with a scpServiceURL (see .env.example in that dir)
const { suiteEnvironments, app } = require('./_buildSuiteEnvironments')

// run test suite with different environments (if applicable)
describe.each(suiteEnvironments)(
  '[%s] String + Collection functions',
  (_suitename /* translates to %s via printf */, credentials, model, request) => {
    beforeAll(async () => {
      // mock console.*
      // in order not to pollute test logs
      global.console = {
        log: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }

      if (_suitename.startsWith('local')) {
        // bootstrap local app + deploy sample data
        await require('./_runLocal')(model, credentials, app, true)
      } else if (_suitename == 'scp') {
        // app is deployed, only
        // "reset" aka re-deploy static content
        await request.post(`/beershop/reset`).send({}).set('content-type', 'application/json')
      }
    })

    afterAll(() => {
      delete global.console // avoid side effect
    })

    test('concat', async () => {
      const response = await request.get(
        `/beershop/Beers?$filter=concat(name,' ---discount!') eq 'Lagerbier Hell ---discount!'`
      )
      expect(response.status).toStrictEqual(200)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })
    test('contains', async () => {
      const response = await request.get(`/beershop/Beers?$filter=contains(name,'Lager')`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })

    test('endswith', async () => {
      const response = await request.get(`/beershop/Beers?$filter=endswith(name,'ramer Hell')`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('indexof', async () => {
      const response = await request.get(`/beershop/Beers?$filter=indexof(name,'ch') eq 1`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('ANDed indexof', async () => {
      const response = await request.get(`/beershop/Beers?$filter=indexof(name,'ch') eq 1 and indexof(name,'Sch') eq 0`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('ORed indexof', async () => {
      const response = await request.get(`/beershop/Beers?$filter=indexof(name,'ch') eq 1 or indexof(name,'Sch') eq 0`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('length', async () => {
      const response = await request.get(`/beershop/Beers?$filter=length(name) eq 14`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })

    test('startswith', async () => {
      // cf needs the umlauts pre-encoded
      const response = await request.get(`/beershop/Beers?$filter=startswith(name,'${encodeURIComponent('Schön')}')`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('substring (from)', async () => {
      const response = await request.get(
        `/beershop/Beers?$filter=substring(name,1) eq '${encodeURIComponent('chönramer Hell')}'`
      )
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('substring (from,to)', async () => {
      const response = await request.get(`/beershop/Beers?$filter=substring(name,1,3) eq 'age'`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    })

    // not support by odata server yet!
    test.skip('matchesPattern', async () => {
      const response = await request.get(`/beershop/Beers?$filter=matchesPattern(name,/.*Hell$/`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(2)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('tolower', async () => {
      // cf needs the umlauts pre-encoded
      const response = await request.get(
        `/beershop/Beers?$filter=tolower(name) eq '${encodeURIComponent('schönramer hell')}'`
      )
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('toupper w/o special chars in eq', async () => {
      const response = await request.get(`/beershop/Beers?$filter=toupper(name) eq 'HALLERNDORFER LANDBIER HELL'`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Hallerndorfer Landbier Hell' })])
      )
    })

    test('toupper w/ special chars in eq', async () => {
      // cf needs the umlauts pre-encoded
      const response = await request.get(
        `/beershop/Beers?$filter=toupper(name) eq '${encodeURIComponent('SCHÖNRAMER HELL')}'`
      )
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBe(1)
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })

    test('trim', async () => {
      const response = await request.get(`/beershop/Beers?$filter=trim(name) eq name`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toBeGreaterThanOrEqual(2)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
      expect(response.body.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })])
      )
    })
    
    test('case-insensitive', async () => {
      const response = await request.get(`/beershop/Beers?$filter=contains(name,'bi')`)
      expect(response.status).toStrictEqual(200)
      expect(response.body.value.length).toEqual(7)
      expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Bitter 42' })]))
    })
  }
)
