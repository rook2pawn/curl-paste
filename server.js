var http = require('http');
var path = require('path');
var concat = require('concat-stream');
var hyperstream = require('hyperstream');
var request = require('request');
var vu = require('valid-url');
var qs = require('querystring');
var store = require('./lib/store');
var handlebody = require('./lib/handlebody')(store);
var argv = require('optimist')
    .usage('Webserver\nUsage : $0')
    .demand('p')
    .describe('p','port')
    .argv;
var ecstatic = require('ecstatic');

var GLOBAL = {
    duration: 1000*60*60*168,
    checkfrequency: 1000*30
};
var server = http.createServer();
server.on('request',function(req,res) {
	console.log("REQ:",req.url,req.method);
    if (req.method == 'GET') {
        if ((req.url.indexOf('/f') === 0) && (req.url.indexOf('/favicon') !== 0)) {
            var data = store.get(req.url);
            if (data !== undefined)
                res.write(data.body);
            res.end('\n');
        } else {
            var hostname = req.headers.host
            var hs = hyperstream({
                'html title' : hostname,
                'span.hostname' : hostname
            });
            ecstatic({dir:path.join(__dirname, '/web'),passthrough:hs})(req,res)
        }
    } else if ((req.method == 'POST') && (req.url == '/')) {
        req.setEncoding('utf8')
        req.pipe(concat(function(body) {
            handlebody(req,res,body);
        }));
    } else if ((req.method == 'POST') && (req.url == '/pasteurl')) {
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
    }
});
server.listen(argv.p);
setInterval(function() {
    store.setData(store.clean(store.getData(),new Date().getTime(),GLOBAL.duration));
},GLOBAL.checkfrequency);
