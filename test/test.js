var request = require('supertest')
var test = require('tape');
var router = require('router-middleware')
var app = router()
var lib = require('../lib/index')

app.get('/id/:id',lib.getFile,lib.deleteIfViewOnce)
app.get('/web/:id',lib.getFileWeb,lib.deleteIfViewOnce)
app.post('/', lib.writeFile)
app.post('/once',lib.writeFileViewOnce)


var id = ''
var server = request(app)

test('post MAX test', function (t) {
  var largeText = "c".repeat(51*1024).concat('a')
  t.plan(1)
  server
    .post('/')
    .set('Content-Type', 'text/plain')
    .send(largeText)
    .end(function(err, res) {
      t.equal(err.message, "socket hang up");
    });
})

test('post MAX test', function (t) {
  var largeText = "c".repeat(351*1024)
  t.plan(1)
  server
    .post('/')
    .set('Content-Length', 351*1024)
    .set('Content-Type', 'text/plain')
    .send(largeText)
    .end(function(err, res){
      t.equal(err.message, "read ECONNRESET");
    });
})



test('post test', function (t) {
  t.plan(1)
  server
    .post('/')
    .send('foobar')
    .end(function(err, res){
      if (err) throw err;
      id = res.text.match(/id\/(.+)?\n/)[1]
      t.pass()
    });
})

test('get test',function(t) {
  t.plan(1)
  server
    .get('/id/'+id)
    .end(function(err,res) {
      console.log(res.text)
      t.equals(res.text,'foobar')
    })
})

test('post secure test', function (t) {
  t.plan(1)
  server
    .post('/once')
    .send('cupid')
    .end(function(err, res){
      if (err) throw err;
      id = res.text.match(/id\/(.+)?\n/)[1]
      t.pass()
    });
})

test('get secure test',function(t) {
  t.plan(1)
  server
    .get('/id/'+id)
    .end(function(err,res) {
      console.log(res.text)
      t.equals(res.text,'cupid')
    })
})

test('get secure test - be blank',function(t) {
  t.plan(1)
  server
    .get('/web/'+id)
    .end(function(err,res) {
      t.equals(res.statusCode,404)
    })
})
