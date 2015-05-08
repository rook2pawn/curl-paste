var Hash = require('hashish');
var level = require('level')
var db = level('./mydb')

module.exports = exports = function(obj) {
    var duration, checkfrequency;
    if (obj !== undefined) {
        duration = obj.duration;
        checkfrequency = obj.checkfrequency;
    }
    var storedhash = {};
    var self = {};
    self.write = function(body,cb) {
        var makeId = function() {
            // see en.wikipedia.org/wiki/Base_36
            var id = String.fromCharCode(~~(Math.random() * 26) + 97).concat((Math.random()+1).toString(36).substr(2,5))
            return id;
        }
        var id = makeId()
        var obj = {id:id,body:body,timestamp:new Date().getTime()};
        console.log("obj:", obj)
        db.put(id, JSON.stringify(obj),function(err) {
          cb(err,id)
        })
    };
    self.get = function(id,cb) {
        id = id.substr(2)
        db.get(id,cb)
    };
    self.getWeb = function(id,cb) {
        id = id.substr(4)
        db.get(id,cb)
    };
/*
    self.clean = function(inputhash,currtime,duration) {
        var res = Hash(inputhash)
        .filter(function(o,key) {
            var diff = currtime - o.timestamp;
            return (diff <= duration) 
        })  
        .end;
        return res
    }
    self.start = function() {
        setInterval(function() {
            self.setData(self.clean(self.getData(),new Date().getTime(),duration));
        },checkfrequency);
    }
*/
    return self;
};

