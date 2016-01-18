var levelup = require('levelup')
var sub = require('level-sublevel')
var db = sub(levelup('./mydb',{valueEncoding:'json'}))
var jsonstream = require('jsonstream')
var concat = require('concat-stream')
var through2 = require('through2')
var config = require('../config')

var sub = db.sublevel('SEQ')
var docs = db.sublevel('DOC')
var viewOnce = db.sublevel('VIEWONCE')

var preHook = function (ch, add) {
  switch (ch.type) {
    case 'put' :
      var obj = {
        key: ''+Date.now(), 
        value: ch.key, 
        type: 'put',
        prefix: sub
      }
      add(obj)
    break;
    default:
    break;
  }
}
docs.pre(preHook)

exports.write = function(id,body,cb) {
  var curr = new Date().getTime()
  var obj = {id:id,body:body,timestamp:curr};
  docs.put(id, obj, function(err) {
    cb(err)
  })
}
exports.writeViewOnce = function(id,body,cb) {
  var curr = new Date().getTime()
  var obj = {id:id,body:body,timestamp:curr};
  viewOnce.put(id,curr)
  docs.put(id, obj, function(err) {
    cb(err)
  })
}
exports.read = function(id) {
  return docs.createReadStream({
    start:id,
    end:id,
    keys:false
  }).pipe(through2.obj(function(chunk,enc,cb) {
    this.push(chunk.body) // works because body is string
    cb()
  }))//.pipe(jsonstream.stringify(false))
}
exports.readAsync = function(id,cb) {
  return docs.createReadStream({
    start:id,
    end:id,
    keys:false
  }).pipe(through2.obj(function(chunk,enc,cb) {
    this.push(chunk.body) // works because body is string
    cb()
  })).pipe(concat(cb))
}
exports.deleteIfViewOnce = function(id) {
  viewOnce.get(id,function(err,value) {
    if (!err) {
      docs.del(id)
      viewOnce.del(id)
      sub.del(id)
    }
  })
}
exports.cleanSecure = function() {
  var aged = Date.now() - config.cleanSecureExpiry
  viewOnce.createReadStream({
  }).pipe(through2.obj(function(chunk,enc,cb) {
    //console.log("Chunk:", chunk, " age:", (Date.now() - chunk.value) /1000)
    if (chunk.value <= aged) {
     // console.log("Deleting that chunk, age in seconds:", ((Date.now() - chunk.value) /1000))
      viewOnce.del(chunk.key)
      docs.del(chunk.key)
      sub.del(chunk.key)
    }
    cb()
  }))
}
exports.clean = function() {
  var aged = Date.now() - (30 * 1000)
  sub.createReadStream({
    lt : aged
  }).on('data', function(data) {
    docs.del(data.value)
    sub.del(data.key)
  })
}
