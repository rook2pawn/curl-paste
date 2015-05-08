var argv = require('optimist')
    .usage('Webserver\nUsage : $0')
    .demand('p')
    .describe('p','port')
    .describe('s','secret key on query')
    .argv;
var http = require('http');
var store = require('./lib/store')({
    duration: 1000*60*60*168,
    checkfrequency: 1000*60
})
var handle = require('./lib/handle')(store,argv.s);

var server = http.createServer();
server.on('request',handle.request);
server.listen(argv.p);
