var argv = require('optimist')
    .usage('Webserver\nUsage : $0')
    .demand('p')
    .describe('p','port')
    .describe('s','secret key on query')
    .argv;

var secret = argv.s;
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
var lib = require('./lib/handle')
var store = require('./lib/store')({
    duration: 1000*60*60*168,
    checkfrequency: 1000*60
})
var server = http.createServer(router);
server.listen(argv.p);

router.get(function(path,req) {
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

router.get(function(path,req) {
  if (req.url.indexOf('/id/') === 0) {
    return true
  }
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
      var obj = {file:'view.html',template:true,stream:hs};
      ecstatic({root:path.join(__dirname, '/web'),streamMap:obj})(req,res)
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
  var obj = {file:'index.html',stream:hs};
  ecstatic({autoIndex:true,root:path.join(__dirname, '/web'),streamMap:obj})(req,res)
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
var handlebody = function(req,res,body) {
  if (body.length === 0) {
    res.write('cannot paste empty text');
    res.end('\n');
    return
  }
  var p = qs.parse(url.parse(req.url).query);
  if ((secret !== undefined) && (p.secret && secret) && (p.secret === secret)) {
    // bypassing size limit
  } else if (body.length > kb*100) { 
    console.log("Flood attack or faulty client, nuking request");
    res.write('File size exceeded '+ kb*100 + ' bytes');
    res.end('\n');
    req.connection.destroy();
    return
  } 
  store.write(body,function(err,id) {
    var hostname = req.headers.host
    if (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null) {
        res.writeHead(301, {'Location':'/id/'+id})
        res.end('\n');
    } else {
        res.write('raw: http://'+hostname+'/f'+id + '\nweb: http://'+hostname+'/id/'+id);
        res.end('\n');
    }
  })
}

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
