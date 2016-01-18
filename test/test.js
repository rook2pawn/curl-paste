var request = require('supertest')
var test = require('tape');
var router = require('router-middleware')
var app = router()
var lib = require('../lib/index')

app.get('/id/:id',lib.getFile,lib.deleteIfViewOnce)
app.get('/web/:id',lib.getFileWeb,lib.deleteIfViewOnce)
app.post('/',lib.writeFile)
app.post('/once',lib.writeFileViewOnce)


var id = ''
var server = request(app)

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
