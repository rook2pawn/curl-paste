var store = require('./store')
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
exports.getFileWeb = function(req,res,next) {
  var id = req.params.id
  var hostname = req.headers.host
  var rawlink = 'http://'+hostname + '/id/'+id
  var weblink = 'http://'+hostname + '/web/'+id
  var homeurl = 'http://'+hostname + '/'
  store.readAsync(id,function(data) {
    res.render('view',{homeurl:homeurl,rawlink:rawlink,weblink:weblink,content:data})
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

exports.writeFile = function(req,res,next) {
  var MAX = 50*1024
  var size = 0
  var hostname = req.headers.host
  req.setEncoding('utf8')  
  req.pipe(through(function write(data) {
    size += data.length
    if (size > MAX) {
      res.write('File size exceeded '+ MAX + ' bytes');
      res.end('\n');
      req.connection.destroy()
    } else {
      this.queue(data)
    }
  },
  function end () { //optional
    if (size <= MAX)
      this.queue(null)
  })).pipe(concat(function(data) {
    var id = makeId()
    store.write(id,data,function(err) {
      if (!err) {
        res.write('raw: http://'+hostname+'/id/'+id + '\nweb: http://'+hostname+'/web/'+id);
        res.end('\n');
      }
    })
  }))
}

exports.writeFileWeb = function(req,res,next) {
  var MAX = 50*1024
  var size = 0
  var hostname = req.headers.host
  req.setEncoding('utf8')  
  req.pipe(through(function write(data) {
    size += data.length
    if (size > MAX) {
      res.write('File size exceeded '+ MAX + ' bytes');
      res.end('\n');
      req.connection.destroy()
    } else {
      this.queue(data)
    }
  },
  function end () { //optional
    if (size <= MAX)
      this.queue(null)
  })).pipe(concat(function(data) {
    var id = makeId()
    data = qs.parse(data).text
    store.write(id,data,function(err) {
      if (!err) {
        res.writeHead(301, {'Location':'/web/'+id})
        res.end('\n');
      }
    })
  }))
}

exports.writeFileViewOnce = function(req,res,next) {
  var MAX = 50*1024
  var size = 0
  var hostname = req.headers.host
  req.setEncoding('utf8')  
  req.pipe(through(function write(data) {
    size += data.length
    if (size > MAX) {
      res.write('File size exceeded '+ MAX + ' bytes');
      res.end('\n');
      req.connection.destroy()
    } else {
      this.queue(data)
    }
  },
  function end () { //optional
    if (size <= MAX)
      this.queue(null)
  })).pipe(concat(function(data) {
    var id = makeId()
    store.writeViewOnce(id,data,function(err) {
      if (!err) {
        res.write('raw: http://'+hostname+'/id/'+id + '\nweb: http://'+hostname+'/web/'+id);
        res.end('\n');
      }
    })
  }))
}

exports.cleanSecure = function() {
  store.cleanSecure()
}

exports.clean = function(req,res,next) {
  store.clean()
  res.end('Cleaned.\n')
}
