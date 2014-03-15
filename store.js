var hash = {};
exports.write = function(body) {
    var makeId = function() {
        // see en.wikipedia.org/wiki/Base_36
        var id = String.fromCharCode(~~(Math.random() * 26) + 97).concat((Math.random()+1).toString(36).substr(2,5))
        return id;
    }
    var id = makeId()
    hash[id] = body;
    return id
};
exports.get = function(id) {
    console.log(id);
    id = id.substr(2)
    return hash[id]; 
};
