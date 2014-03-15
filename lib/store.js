var Hash = require('hashish');
var storedhash = {};
exports.write = function(body) {
    var makeId = function() {
        // see en.wikipedia.org/wiki/Base_36
        var id = String.fromCharCode(~~(Math.random() * 26) + 97).concat((Math.random()+1).toString(36).substr(2,5))
        return id;
    }
    var id = makeId()
    storedhash[id] = {body:body,timestamp:new Date().getTime()};
    return id
};
exports.get = function(id) {
    console.log("GEt!" + id);
    id = id.substr(2)
    return storedhash[id]; 
};
exports.setData = function(newdata) {
    storedhash = newdata;
};
exports.getData = function() {
    return storedhash
};
exports.clean = function(inputhash,currtime,duration) {
    var res = Hash(inputhash)
    .filter(function(o,key) {
        var diff = currtime - o.timestamp;
        return (diff <= duration) 
    })  
    .end;
    return res
}
