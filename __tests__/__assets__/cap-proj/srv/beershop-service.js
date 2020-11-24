module.exports = (srv) => {
  srv.on('reset', async () => {
    const db = await cds.connect.to('db')
    await cds.deploy('./srv/', {}).to(db)
  })
}
