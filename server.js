const argv = require('optimist')
    .usage('curlpaste\nUsage : $0')
    .describe('p','port')
    .describe('s', 'use https')
    .boolean('s')
    .argv;

const config = require("./config.js");

if (!argv.p) {
  argv.p = config.port;
}

const router = require('router-middleware')
const Ddos = require('ddos')
const ddos = new Ddos({burst:2, limit:4})
const app = router()
const path = require('path')
const ecstatic = require('ecstatic')({root:path.join(__dirname,'static')})
const fs = require('fs')

var server;
if (argv.s) {
  var https = require('https')
  server = https.createServer({key:fs.readFileSync('privkey.pem'),cert:fs.readFileSync('fullchain.pem')},app)
} else {
  var http = require('http')
  server = http.createServer(app)
}
server.listen(argv.p, () => {
  console.log("curl-paste server started on " + argv.p)
})

app.fileserver(ecstatic)
app.get('/',function(req,res,next) {
  const protocol = 'http'
  if (req.connection.encrypted)
    protocol = 'https'
  if (req.headers['user-agent'] && (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null)) {
    return next();
  } else {
    const hostname = req.headers.host
    res.write(hostname + ': curl --data-binary @your-file-here.txt '+protocol+'://'+hostname)
    return res.end('\n')
  }
})
const lib = require('./lib/index')

app.get('/id/:id',lib.getFile,lib.deleteIfViewOnce)
app.get('/web/:id',lib.getFileWeb,lib.deleteIfViewOnce)
app.post('/', ddos, lib.writeFile)
app.post('/web',lib.writeFileWeb)
app.post('/once',lib.writeFileViewOnce)
app.get('/park/:id',lib.showParking)
setInterval(lib.cleanSecure,10000)
lib.cleanSecure()

