var argv = require('optimist')
    .usage('Webserver\nUsage : $0')
    .demand('p')
    .describe('p','port')
    .describe('s','secret key on query')
    .argv;
var router = require('router-middleware');
var http = require('http');
var kb = 1024;// number of bytes in kb
var qs = require('querystring');
var url = require('url')
var path = require('path');
var concat = require('concat-stream');
var hyperstream = require('hyperstream');
var request = require('request');
var vu = require('valid-url');
var url = require('url')
var qs = require('querystring');
var fs = require('fs');
var ecstatic = require('ecstatic');
var lib = require('./lib')
var store = require('./lib/store')({
    duration: 1000*60*60*168,
    checkfrequency: 1000*60
})
var server = http.createServer(router);
server.listen(argv.p);

router.get(function(path) {
  if ((path.indexOf('/f') === 0) && (path.indexOf('/favicon') !== 0)) {
    return true
  }
},function(req,res,next) {
  store.get(req.url,function(err,data) {
    if (err === null) {
      data = JSON.parse(data)
      if (req.headers['user-agent'] && (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null)) {
        res.writeHead(200, {'Content-Type':'text/plain'})
        res.write(data.body)
      } else {
      res.write(data.body);
      }
    }
    res.end('\n');
  })
})

router.get(function(path) {
  if (req.url.indexOf('/id/') === 0)
    return true
},function(req,res,next) {
  store.getWeb(req.url,function(err,data) {
    if (err === null) {
      data = JSON.parse(data)
      var hostname = req.headers.host
      var hs = hyperstream({
      'title' : hostname,
      'span.hostname' : hostname,
      'pre' : data.body,
      'a#home' : { href : 'http://'+hostname , _html : 'http://'+hostname },
      'a#rawlink' : { href : 'http://'+hostname+'/f'+data.id, _html: 'http://'+hostname+'/f'+data.id},
      'a#weblink' : { href : 'http://'+hostname+'/id/'+data.id, _html: 'http://'+hostname+'/id/'+data.id}
      });
      var obj = {'view.html':hs};
      ecstatic({root:path.join(__dirname, '../web'),template:'view.html',passthrough:obj})(req,res)
    } else {
      res.end('\n');
    }
  })
})

router.get(function(path,req) {
  var hostname = req.headers.host
  if (req.headers['user-agent'] && (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null))
    return true
}, function(req,res,next) {
  var hostname = req.headers.host
  var hs = hyperstream({
      'title' : hostname,
      'span.hostname' : hostname,
      'a#home' : { href : 'http://'+hostname , _html : 'http://'+hostname }
  });
  var obj = {'index.html':hs};
  ecstatic({autoIndex:true,root:path.join(__dirname, '../web'),passthrough:obj})(req,res)
})

router.get(function(path,req) {
  var hostname = req.headers.host
  if (req.headers['user-agent'] && (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null))
    return false
  else return true
},function(req,res,next) {
  var hostname = req.headers.host
  res.write(hostname + ': curl --data-binary @your-file-here.txt http://'+hostname)
  res.end('\n') 
})


router.post('/', function(req,res,next) {
  req.setEncoding('utf8')
  req.pipe(concat(function(body) {
      handlebody(req,res,body);
  }));
})


router.post('/pasteurl', function(req,res,next) {
  req.setEncoding('utf8')
  req.pipe(concat(function(body) {
  var obj=qs.parse(body);
  if (vu.isUri(obj.paste_url)) {
    request(obj.paste_url,function(e,resp,body) {
      handlebody(req,res,body);
    });
  } else 
      res.end('not a valid url: ' + obj.paste_url+'\n');
  }))
})

router.post('/pastetext', function(req,res,next) {
  req.setEncoding('utf8')
  req.pipe(concat(function(body) {
    var text = qs.parse(body).text;
    text = text.replace(/\r\n/g,'\n');
    handlebody(req,res,text);
  }));
})
