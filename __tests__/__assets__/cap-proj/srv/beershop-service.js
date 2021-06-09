const cds = require('@sap/cds')

module.exports = (srv) => {
  srv.on('reset', async () => {
    let db
    try {
      db = await cds.connect.to('db')
    } catch (err) {
      db = cds.db
    }
    await cds.deploy('./srv/', {}).to(db)
  })
  srv.before('READ', '*', async (req) => {
    if (req.headers.schema) {
      req.user.schema = req.headers.schema
    }
  })
}
