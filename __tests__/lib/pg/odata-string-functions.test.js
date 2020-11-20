const cds = require('@sap/cds')
const deploy = require('@sap/cds/lib/srv/db/deploy')
const path = require('path')

// mock (package|.cds'rc).json entries
cds.env.requires.db = { kind: 'postgres' }
cds.env.requires.postgres = {
  impl: './cds-pg', // hint: not really sure as to why this is, but...
}

// construct suite data sets
const localCredentials = {
  host: 'localhost',
  port: '5432',
  database: 'beershop',
  username: 'postgres',
  password: 'postgres',
}
const localModel = './__tests__/__assets__/cap-proj/srv/'
const scpPostgresCredentials = {
  hostname: 'localhost',
  port: '5432',
  dbname: 'beershop',
  username: 'postgres',
  password: 'postgres',
}
const scpModel = './__tests__/__assets__/cap-proj/srv/'

// run test suite with different sets of data
describe.each([
  ['local', localCredentials, localModel],
  ['scp', scpPostgresCredentials, scpModel],
])('[%s] String + Collection functions', (_suitename /* translates to %s via printf */, credentials, model) => {
  const app = require('express')()
  const request = require('supertest')(app)

  beforeAll(async () => {
    // mock console.*
    // in order not to pollute test logs
    global.console = {
      log: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }

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
})
