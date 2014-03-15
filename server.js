var http = require('http');
var path = require('path');
var store = require('./lib/store');
var argv = require('optimist')
    .usage('Webserver\nUsage : $0')
    .demand('p')
    .describe('p','port')
    .demand('h')
    .describe('h','hostname i.e. http://<hostname>/f8adfj')
    .argv;
var ecstatic = require('ecstatic');

var GLOBAL = {
    duration: 1000*60,
    checkfrequency: 1000*30
};
var stats = {
    uploads: 0
};
var server = http.createServer();
server.on('request',function(req,res) {
    if (req.method == 'GET') {
        if ((req.url.indexOf('/f') === 0) && (req.url.indexOf('/favicon') !== 0)) {
            var data = store.get(req.url);
            if (data !== undefined)
                res.write(data.body);
            res.end('\n');
        } else {
            ecstatic(path.join(__dirname, '/web'))(req,res)
        }
    } else if (req.method == 'POST') {
        req.setEncoding('utf8')
        var body = '';
        req.on('data',function(c) {
            body = body.concat(c);
            // 1e5 === 1 * Math.pow(10, 5) === 1 * 100000 ~~~ 100k
            if (body.length > 1e5) { 
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                console.log("Flood attack or faulty client, nuking request");
                res.write('File size exceeded 100k.');
                res.end('\n');
                req.connection.destroy();
            }
        });
        req.on('end',function(c) {
            // 1e5 === 1 * Math.pow(10, 5) === 1 * 100000 ~~~ 100k
            if (body.length > 1e5) { 
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                console.log("Flood attack or faulty client, nuking request");
                res.write('File size exceeded 100k.');
                res.end('\n');
                req.connection.destroy();
            } else {
                var id = store.write(body)
                stats.uploads++;
                if (stats.uploads % 100 === 0) {
                    console.log("Usage report: " + stats.uploads + ' uses as of ' + new Date()); 
                }
                res.write('http://'+argv.h+'/f'+id);
                res.end('\n');
            }
        });
    }
});
server.listen(argv.p);
setInterval(function() {
    store.setData(store.clean(store.getData(),new Date().getTime(),GLOBAL.duration));
},GLOBAL.checkfrequency);
