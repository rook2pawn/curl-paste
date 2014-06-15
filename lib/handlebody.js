var mb = 1048576;
module.exports = exports = function(store) {
    return function(req,res,body) {
        if (body.length > mb*3) { // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            console.log("Flood attack or faulty client, nuking request");
            res.write('File size exceeded '+ mb*3 + ' bytes');
            res.end('\n');
            req.connection.destroy();
        } else {
            var id = store.write(body)
            var hostname = req.headers.host
            res.write('http://'+hostname+'/f'+id);
            res.end('\n');
        }
    }
}
