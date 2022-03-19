const cds = require('@sap/cds')
const path = require('path')

/**
 *
 * @param {String} model path to <model>.cds
 * @param {Object} credentials
 * @param {Express} app
 * @param {Boolean} deployDB whether to initially deploy the @see model to the db incl sample data
 */
module.exports = async (model, credentials, app, deployDB = false) => {
  const dbProperties = {
    kind: 'postgres',
    dialect: 'plain',
    model: model,
    credentials: credentials,
  }

  deployDB ? await cds.deploy(model, {}).to(dbProperties) : null

  cds.db = await cds.connect.to(dbProperties)

  // serve only a plain beershop
  // that matches the db content/setup in dockered pg
  const servicePath = path.resolve(model, 'beershop-service')
  await cds.serve('BeershopService').from(servicePath).in(app)
  const adminServicePath = path.resolve(model, 'beershop-admin-service')
  await cds.serve('BeershopAdminService').from(adminServicePath).in(app)
}
