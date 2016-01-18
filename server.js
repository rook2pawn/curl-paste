var argv = require('optimist')
    .usage('curlpaste\nUsage : $0')
    .demand('p')
    .describe('p','port')
    .argv;

var http = require('http')
var router = require('router-middleware')
var app = router()
var lib = require('./lib/index')
var path = require('path')
var ecstatic = require('ecstatic')({root:path.join(__dirname,'web')})
var fs = require('fs')
var server = http.createServer(app)
server.listen(argv.p)

app.fileserver(ecstatic)
app.get('/',function(req,res,next) {
  if (req.headers['user-agent'] && (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null)) {
    res.render('index',{homeurl:'http://'+req.headers.host,hostname:req.headers.host})
  } else {
    var hostname = req.headers.host
    res.write(hostname + ': curl --data-binary @your-file-here.txt http://'+hostname)
    res.end('\n') 
  }
})
app.get('/id/:id',lib.getFile,lib.deleteIfViewOnce)
app.get('/web/:id',lib.getFileWeb,lib.deleteIfViewOnce)
app.post('/',lib.writeFile)
app.post('/web',lib.writeFileWeb)
app.post('/once',lib.writeFileViewOnce)
app.get('/park/:id',lib.showParking)
setInterval(lib.cleanSecure,10000)
lib.cleanSecure()


app.engine('ntl', function (filePath, options, callback) { // define the template engine
  fs.readFile(filePath, function (err, content) {
    if (err) return callback(new Error(err));
    // this is an extremely simple template engine
    var rendered = content.toString();
    Object.keys(options).forEach(function(key) {
      var re = new RegExp("#" + key + "#","gm")
      rendered = rendered.replace(re,options[key])
    })
    return callback(null, rendered);
  })
});
app.set('views', './views'); // specify the views directory
app.set('view engine', 'ntl'); // register the template engine
