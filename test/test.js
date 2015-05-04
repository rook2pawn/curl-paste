var store = require('../lib/store')({
    duration: 1000*60*60*168,
    checkfrequency: 1000*60
})
var handle = require('../lib/handle')(store)
var inputhash = { 
    a : {val: 'foo', timestamp:1349 },
    b : {val: 'foo', timestamp:1351 },
    c : {val: 'foo', timestamp:1490 },
    d : {val: 'foo', timestamp:1550 },
    e : {val: 'foo', timestamp:1600 }
}
console.log(store.clean(inputhash,1700,160))

var request = require('supertest')
request(handle.request)
  .get('/')
  .expect(404)
  .expect('File not found. :(')
  .end(function(err, res){
    if (err) throw err;
  });


request(handle.request)
  .get('/')
  .expect(404)
  .expect('File not found. :(')
  .end(function(err, res){
    if (err) throw err;
  });


