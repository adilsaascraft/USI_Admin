const https = require('https')
const fs = require('fs')
const next = require('next')

const dev = true
const app = next({ dev })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem'),
}

app.prepare().then(() => {
  https.createServer(httpsOptions, (req, res) => {
    handle(req, res)
  }).listen(3001, () => {
    console.log('🚀 HTTPS server running at https://localhost:3001')
  })
})
