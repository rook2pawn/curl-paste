var test = require('tape');
var url = require('url')
var concat = require('concat-stream')
var store = require('../lib/store')({
  duration: 1000*60*60*168,
  checkfrequency: 1000*60
})
var handle = require('../lib/handle')(store)
var vu = require('valid-url');
var request = require('supertest')
var assert = require('assert')

test('get',function(t) {
  t.plan(1)
  var agent = request(handle.curlWeb)
  var get = agent.get('/')
    get
    .expect(200)
    .expect(function(res) {
      t.equal(get.host + ': curl --data-binary @your-file-here.txt http://'+get.host,res.text.trim())
    })
    .end(function(err, res){
    console.log(err)
      t.end(err)
    });
});

test('post and then get',function(t) {
  var raw_url;
  var web_url;
  var agent = request(function(req,res,next) {
    req.setEncoding('utf8')
    req.pipe(concat(function(body) {
      handle.handleBody(req,res,body);
    }))
  })
  t.test('first part post',function(st) {
    agent
    .post('/')
    .send('foobar')
    .expect(function(res) {
      var lines = res.text.split('\n');
      raw_url = lines[0].slice(4)
      web_url = lines[1].slice(4)
      if (vu.isUri(raw_url) === false) {
        st.fail("not valid url "+raw_url)
      } else {
        st.pass("valid url "+raw_url)
      }

      if (vu.isUri(web_url) === false) {
        st.fail("not valid url "+web_url)
      } else {
        st.pass("valid url "+web_url)
      }
    })
    .end(function(err,res) {
      console.log("done",err)
      st.end(err)
    })
  })

  t.test('second part get',function(st) {
    var href = url.parse(raw_url).path;
    agent = request(handle.getFile)
    agent
    .get(href)
    .expect(function(res) {
// if you uncomment the following line, npm test will fail
// but tape test/test.js will work ?
//      st.comment("got text:" + res.text)
      console.log("getting ", href, " got back ->",res.text)
      st.equal(res.text, 'foobar\n')
    })
    .end(function(err,res) {
      console.log("done",err)
      st.end(err)
    })
  })
});
