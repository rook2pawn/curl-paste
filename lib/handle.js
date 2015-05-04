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

module.exports = exports = function(store,secret) {
    var self = {};
    var handlebody = function(req,res,body) {
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
        var id = store.write(body)
        var hostname = req.headers.host
        if (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end('<html><body> <h2>Your paste is here -&gt;</h2> <br><a href="http://'+hostname+'/f'+id+'">http://'+hostname+'/f'+id+' </a></body</html>');
        } else {
            res.write('http://'+hostname+'/f'+id);
            res.end('\n');
        }
    }
    var handlereq = function(req,res) {
        var p = url.parse(req.url);
        if (req.method == 'GET') {
            if ((req.url.indexOf('/f') === 0) && (req.url.indexOf('/favicon') !== 0)) {
                var data = store.get(req.url);
                if (data !== undefined)
                    res.write(data.body);
                res.end('\n');
            } else {
                var hostname = req.headers.host
                var hs = hyperstream({
                    'title' : hostname,
                    'span.hostname' : hostname
                });
                var obj = {'index.html':hs};
                ecstatic({autoIndex:true,root:path.join(__dirname, '../web'),passthrough:obj})(req,res)
            }
        } else if ((req.method == 'POST') && (p.pathname == '/')) {
            req.setEncoding('utf8')
            req.pipe(concat(function(body) {
                handlebody(req,res,body);
            }));
        } else if ((req.method == 'POST') && (p.pathname == '/pasteurl')) {
            req.setEncoding('utf8')
            req.pipe(concat(function(body) {
            var obj=qs.parse(body);
            if (vu.isUri(obj.paste_url)) {
                request(obj.paste_url,function(e,resp,body) {
                    handlebody(req,res,body);
                });
            } else 
                res.end('not a valid url: ' + obj.paste_url+'\n');

            }));
        } else if ((req.method == 'POST') && (p.pathname == '/pastetext')) {
            req.setEncoding('utf8')
            req.pipe(concat(function(body) {
                var text = qs.parse(body).text;
                text = text.replace(/\r\n/g,'\n');
                handlebody(req,res,text);
            }));
        }
    };
    self.request = handlereq;
    return self;
}
