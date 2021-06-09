module.exports = async function (srv) {
  srv.on('READ', 'UserScopes', async (req) => {
    const users = [
      {
        username: req.user.id,
        is_admin: req.user.is('admin'),
      },
    ]
    return users
  })
}
