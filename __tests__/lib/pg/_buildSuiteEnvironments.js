const path = require('path')
const supertest = require('supertest')

// eventually load a .env file for scp hyperledger connectivity
// fails silently if there is none
const _envPath = path.resolve(__dirname, '../../__assets__/cap-proj/.env')
require('dotenv').config({ path: _envPath })
const scp = process.env.scpServiceURL ? true : false

// construct suite data sets
const localCredentials = require('./credentials-local.json')
const localCredentialsWithSchema = require('./credentials-local-w-schema.json')
const localModel = './__tests__/__assets__/cap-proj/srv/'

// this for local runtime only
const app = require('express')()
const requestLocal = supertest(app)

// note the injected supertest/$request var - it serves as http object in each test
let suiteEnvironments = [
  ['local', localCredentials, localModel, requestLocal],
  ['local-with-schema', localCredentialsWithSchema, localModel, requestLocal],
]
if (scp) {
  suiteEnvironments.push(['scp', {}, '', supertest(process.env.scpServiceURL)])
}

module.exports = { suiteEnvironments, app }
