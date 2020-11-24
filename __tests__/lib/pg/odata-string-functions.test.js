const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/srv/db/deploy')
const path = require('path')
const supertest = require('supertest')

// eventually load a .env file for scp hyperledger connectivity
// fails silently if there is none
const _envPath = path.resolve(__dirname, '../../__assets__/cap-proj/.env')
require('dotenv').config({ path: _envPath })
const scp = process.env.scpServiceURL ? true : false

// mock (package|.cds'rc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  impl: './cds-pg', // hint: not really sure as to why this is, but...
}

// construct suite data sets
const localCredentials = require('./credentials-local.json')
const localModel = './__tests__/__assets__/cap-proj/srv/'

// this for local runtime only
const app = require('express')()
const requestLocal = supertest(app)

// note the injected supertest/$request var - it serves as http object in each test
let suiteEnvironments = [['local', localCredentials, localModel, requestLocal]]
if (scp) {
  suiteEnvironments.push(['scp', {}, '', supertest(process.env.scpServiceURL)])
}
// run test suite with different environments (if applicable)
describe.each(suiteEnvironments)('[%s] String + Collection functions', (
  _suitename /* translates to %s via printf */,
  credentials,
  model,
  request
) => {
  beforeAll(async () => {
    // mock console.*
    // in order not to pollute test logs
    global.console = {
      log: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }
    // only deploy when running against local test env
    // scp hyperledger postgres has deployed db content!
    if (_suitename === 'local') {
      this._model = model
      this._dbProperties = {
        kind: 'postgres',
        model: this._model,
        credentials: credentials,
      }

      await deploy(this._model, {}).to(this._dbProperties)

      cds.db = await cds.connect.to(this._dbProperties)

      // serve only a plain beershop
      // that matches the db content/setup in dockered pg
      const servicePath = path.resolve(this._model, 'beershop-service')
      await cds.serve('BeershopService').from(servicePath).in(app)
    }
  })

  afterAll(() => {
    delete global.console // avoid side effect
  })

  // const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  // beforeEach(async () => {
  //   if (_suitename === 'scp') {
  //     await wait(200)
  //   }
  // })
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
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('indexof', async () => {
    const response = await request.get(`/beershop/Beers?$filter=indexof(name,'ch') eq 1`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('ANDed indexof', async () => {
    const response = await request.get(`/beershop/Beers?$filter=indexof(name,'ch') eq 1 and indexof(name,'Sch') eq 0`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('ORed indexof', async () => {
    const response = await request.get(`/beershop/Beers?$filter=indexof(name,'ch') eq 1 or indexof(name,'Sch') eq 0`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('length', async () => {
    const response = await request.get(`/beershop/Beers?$filter=length(name) eq 14`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
  })

  test('startswith', async () => {
    const response = await request.get(`/beershop/Beers?$filter=startswith(name,'Schön')`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('substring (from)', async () => {
    const response = await request.get(`/beershop/Beers?$filter=substring(name,1) eq 'chönramer Hell'`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
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
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('tolower', async () => {
    const response = await request.get(`/beershop/Beers?$filter=tolower(name) eq 'schönramer hell'`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('toupper w/o special chars in eq', async () => {
    const response = await request.get(`/beershop/Beers?$filter=toupper(name) eq 'HALLERNDORFER LANDBIER HELL'`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Hallerndorfer Landbier Hell' })])
    )
  })

  test.only('toupper w/ special chars in eq', async () => {
    const response = await request.get(`/beershop/Beers?$filter=toupper(name) eq 'SCHÖNRAMER HELL'`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBe(1)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })

  test('trim', async () => {
    const response = await request.get(`/beershop/Beers?$filter=trim(name) eq name`)
    expect(response.status).toStrictEqual(200)
    expect(response.body.value.length).toBeGreaterThanOrEqual(2)
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Lagerbier Hell' })]))
    expect(response.body.value).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Schönramer Hell' })]))
  })
})
