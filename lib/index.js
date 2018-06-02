var store = require('./store')
var ent = require('ent');
var through = require('through')
var concat = require('concat-stream')
var qs = require('querystring')

exports.getFile = function(req,res,next) {
  var id = req.params.id
  store.read(id).pipe(res)
  if (next) {
    next()
  }
}
exports.showParking = function(req,res,next) {
  var protocol = 'http'
  if (req.connection.encrypted)
    protocol = 'https'
  var id = req.params.id
  var hostname = req.headers.host
  var rawlink = protocol+'://'+hostname + '/id/'+id
  var weblink = protocol+'://'+hostname + '/web/'+id
  var homeurl = protocol+'://'+hostname + '/'
  res.render('park',{homeurl:homeurl,rawlink:rawlink,weblink:weblink})
}
exports.getFileWeb = function(req,res,next) {
  var protocol = 'http'
  if (req.connection.encrypted)
    protocol = 'https'
  var id = req.params.id
  var hostname = req.headers.host
  var rawlink = protocol+'://'+hostname + '/id/'+id
  var weblink = protocol+'://'+hostname + '/web/'+id
  var homeurl = protocol+'://'+hostname + '/'
  store.readAsync(id,function(data) {
    if (data.length) {
      data = ent.encode(data)
      res.render('view',{homeurl:homeurl,rawlink:rawlink,weblink:weblink,content:data})
    } else {
      res.writeHead(404,"Document not found.")
      res.write("Document not found.")
      res.end()
    }
  })
  if (next) {
    next()
  }
}
exports.deleteIfViewOnce = function(req,res,next) {
  var id = req.params.id
  store.deleteIfViewOnce(id)
}

var makeId = function() {
  // see en.wikipedia.org/wiki/Base_36
  var id = String.fromCharCode(~~(Math.random() * 26) + 97).concat((Math.random()+1).toString(36).substr(2,5))
  return id;
}

var write = function(req, res, end) {
  var MAX = 50*1024
  var discard = false;
  var body = "";
  req.setEncoding('utf8')
  req.connection.on('error', function(e) {
    console.log("e:", e)
  })
  req.pipe(through(function write(data) {
    body += data
    if (body.length > MAX) {
      res.write('File size exceeded '+ MAX + ' bytes');
      res.end('\n');
      req.connection.destroy()
      discard = true;
    }
  }, function() {
    if (!discard) {
      end.call({body});
    }
  }));
}

exports.writeFile = function(req,res,next) {
  var end = function() {
    var id = makeId()
    store.write(id,this.body,function(err) {
      var protocol = 'http'
      if (req.connection.encrypted)
        protocol = 'https'
      var hostname = req.headers.host
      if (!err) {
        console.log("gonig to write!" + protocol+'://'+hostname+'/id/'+id + '\nweb: '+protocol+'://'+hostname+'/web/'+id )
        res.write('raw: '+protocol+'://'+hostname+'/id/'+id + '\nweb: '+protocol+'://'+hostname+'/web/'+id);
        res.end('\n');
      }
    })
  }
  write(req,res,end);
}

exports.writeFileWeb = function(req,res,next) {
  var end = function () {
    var id = makeId()
    var obj = qs.parse(this.body)
    var isSecure = obj.secure
    var text = obj.text
    if (isSecure === undefined)
      store.write(id,text,function(err) {
        if (!err) {
          res.writeHead(301, {'Location':'/web/'+id})
          res.end('\n');
        }
      })
    else
      store.writeViewOnce(id,text,function(err) {
        if (!err) {
          // 301 user to parking spot
          res.writeHead(301, {'Location':'/park/'+id})
          res.end('\n');
        }
      })
  };
  write(req,res,end);
}

exports.writeFileViewOnce = function(req,res,next) {
  var end = function () {
    var protocol = 'http'
    if (req.connection.encrypted)
      protocol = 'https'
    var hostname = req.headers.host
    var id = makeId()
    store.writeViewOnce(id,this.body,function(err) {
      if (!err) {
        res.write('raw: '+protocol+'://'+hostname+'/id/'+id + '\nweb: '+protocol+'://'+hostname+'/web/'+id);
        res.end('\n');
      }
    })
  }
  write(req,res,end);
}

exports.cleanSecure = function() {
  store.cleanSecure()
}

exports.clean = function(req,res,next) {
  store.clean()
  res.end('Cleaned.\n')
}
