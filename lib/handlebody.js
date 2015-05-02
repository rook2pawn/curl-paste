var kb = 1024;// number of bytes in kb
var qs = require('querystring');
var url = require('url')
module.exports = exports = function(store,secret) {
    return function(req,res,body) {
        var p = qs.parse(url.parse(req.url).query);
        console.log("P:",p,"secret:",secret)
        if ((p.secret && secret) && (p.secret === secret)) {
            console.log(p)
            console.log("Bypassing size limitation");
        } else if (body.length > kb*100) { // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
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
}
