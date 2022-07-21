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
  srv.on('createBeer', async () => {
    const { Beers } = cds.entities('csw')
    const entries = [{ name: 'Beer1', abv: 1.0, ibu: 1, brewery_ID: '0465e9ca-6255-4f5c-b8ba-7439531f8d28' }]
    const insertResult = await cds.run(INSERT.into(Beers).entries(entries))
    console.log(insertResult)
  })
  srv.before('READ', '*', async (req) => {
    if (req.headers.schema) {
      req.user.schema = req.headers.schema
    }
  })
}
