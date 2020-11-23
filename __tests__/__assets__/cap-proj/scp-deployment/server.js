const express = require('express')
const path = require('path')

const host = '0.0.0.0'
const port = process.env.PORT || 4004
let app = express()

let staticFolder = path.join(__dirname, '/public')
app.use(express.static(staticFolder))

const server = app.listen(port, host, () => console.info(`app is listing at http://localhost:${port}`))
server.on('error', (error) => console.error(error.stack))
