const deploy = require('@sap/cds/lib/srv/db/deploy')
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
    model: model,
    credentials: credentials,
  }

  deployDB ? await deploy(model, {}).to(dbProperties) : null

  cds.db = await cds.connect.to(dbProperties)

  // serve only a plain beershop
  // that matches the db content/setup in dockered pg
  const servicePath = path.resolve(model, 'beershop-service')
  await cds.serve('BeershopService').from(servicePath).in(app)
}
