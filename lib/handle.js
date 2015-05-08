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
        var id = store.write(body)
        var hostname = req.headers.host
        if (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null) {
            res.writeHead(301, {'Location':'/id/'+id})
            res.end('\n');
        } else {
            res.write('raw: http://'+hostname+'/f'+id + '\nweb: http://'+hostname+'/id/'+id);
            res.end('\n');
        }
    }
    var handlereq = function(req,res) {
        var p = url.parse(req.url);
        if (req.method == 'GET') {
            if ((req.url.indexOf('/f') === 0) && (req.url.indexOf('/favicon') !== 0)) {
                var data = store.get(req.url);
                console.log("Sending back data:", data)
                if (data !== undefined)
                    res.write(data.body);
                res.end('\n');
            } else if (req.url.indexOf('/id/') === 0) {
                var data = store.getWeb(req.url);
                if (data !== undefined) {
                    var hostname = req.headers.host
                    var hs = hyperstream({
                        'title' : hostname,
                        'span.hostname' : hostname,
                        'div#main pre' : data.body,
                        'a#home' : { href : 'http://'+hostname , _html : 'http://'+hostname },
                        'a#rawlink' : { href : 'http://'+hostname+'/f'+data.id, _html: 'http://'+hostname+'/f'+data.id},
                        'a#weblink' : { href : 'http://'+hostname+'/id/'+data.id, _html: 'http://'+hostname+'/id/'+data.id}
                    });
                    var obj = {'view.html':hs};
                    ecstatic({root:path.join(__dirname, '../web'),template:'view.html',passthrough:obj})(req,res)
                }
            } else {
                var hostname = req.headers.host
                if (req.headers['user-agent'].match(/mozilla|chrome|webkit/i) !== null) {
                    var hs = hyperstream({
                        'title' : hostname,
                        'span.hostname' : hostname,
                        'a#home' : { href : 'http://'+hostname , _html : 'http://'+hostname }
                    });
                    var obj = {'index.html':hs};
                    ecstatic({autoIndex:true,root:path.join(__dirname, '../web'),passthrough:obj})(req,res)
                } else {
                    res.write(hostname + ': curl --data-binary @your-file-here.txt http://'+hostname)
                    res.end('\n') 
                }
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
