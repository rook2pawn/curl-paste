var Hash = require('hashish');

module.exports = exports = function(obj) {
    var duration, checkfrequency;
    if (obj !== undefined) {
        duration = obj.duration;
        checkfrequency = obj.checkfrequency;
    }
    var storedhash = {};
    var self = {};
    self.write = function(body) {
        var makeId = function() {
            // see en.wikipedia.org/wiki/Base_36
            var id = String.fromCharCode(~~(Math.random() * 26) + 97).concat((Math.random()+1).toString(36).substr(2,5))
            return id;
        }
        var id = makeId()
        storedhash[id] = {id:id,body:body,timestamp:new Date().getTime()};
        console.log(storedhash[id])
        return id
    };
    self.get = function(id) {
        id = id.substr(2)
      console.log("Get looking up id:", id,storedhash)
        return storedhash[id]; 
    };
    self.getWeb = function(id) {
        id = id.substr(4)
        return storedhash[id]; 
    };
    self.setData = function(newdata) {
        storedhash = newdata;
    };
    self.getData = function() {
        return storedhash
    };
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
    return self;
};

