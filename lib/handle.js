var hyperstream = require('hyperstream');
var path = require('path');
var qs = require('querystring');
var url = require('url')
var ecstatic = require('ecstatic');

var secret; 
var kb = 1024;// number of bytes in kb
function escapeHtml(unsafe) {
    return unsafe
//         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;")
 }
exports.escapeHtml = escapeHtml

/**
 * Convert a string to HTML entities
 */
String.prototype.toHtmlEntities = function() {
    return this.replace(/./gm, function(s) {
        return "&#" + s.charCodeAt(0) + ";";
    });
};

/**
 * Create string from HTML entities
 */
String.fromHtmlEntities = function(string) {
    return (string+"").replace(/&#\d+;/gm,function(s) {
        return String.fromCharCode(s.match(/\d+/gm)[0]);})
}


module.exports = exports = function(store) {

  var pageWeb = function(req,res,next) {
    var hostname = req.headers.host
    var hs = hyperstream({
        'title' : hostname,
        'span.hostname' : hostname,
        'a#home' : { href : 'http://'+hostname , _html : 'http://'+hostname }
    });
    var obj = {file:'index.html',stream:hs};
    ecstatic({autoIndex:true,root:path.join(__dirname, '..','/web'),streamMap:obj})(req,res)
  }

  var getWeb = function(req,res,next) {
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
        ecstatic({root:path.join(__dirname,'..', '/web'),streamMap:obj})(req,res)
      } else {
        res.end('\n');
      }
    })
  }


  var getFile = function (req,res,next) {
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
  }


  var curlWeb = function(req,res,next) {
    var hostname = req.headers.host
    res.write(hostname + ': curl --data-binary @your-file-here.txt http://'+hostname)
    res.end('\n') 
  }


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

  return {
    getFile : getFile,
    getWeb : getWeb,
    pageWeb : pageWeb,
    curlWeb : curlWeb,
    handleBody : handlebody
  }
}
