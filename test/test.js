var test = require('tape');
var url = require('url')
var store = require('../lib/store')({
  duration: 1000*60*60*168,
  checkfrequency: 1000*60
})
var handle = require('../lib/handle')(store)
var vu = require('valid-url');
var request = require('supertest')

test('get',function(t) {
  var agent = request(handle.request)
  agent
    .get('/')
    .expect(200)
    .expect(function(res) {
      return (res.text.indexOf('curl --data-binary @your-file-here.txt') == -1)
    })
    .end(function(err, res){
    console.log(err)
      t.end(err)
    });
});

test('post and then get',function(t) {
  var my_url;
  var agent = request(handle.request)
  t.test('first part post',function(st) {
    agent
    .post('/')
    .send('foobar')
    .expect(function(res) {
      var _url = res.text.slice(0,-1)
      if (vu.isUri(_url) === false) {
        st.fail("not valid url "+_url)
      } else {
        st.pass("valid url "+_url)
        my_url = _url; 
      }
    })
    .end(function(err,res) {
      console.log("done",err)
      st.end(err)
    })
  })

  t.test('second part get',function(st) {
    var href = url.parse(my_url).path;
    agent
    .get(href)
    .expect(function(res) {
// if you uncomment the following line, npm test will fail
// but tape test/test.js will work ?
//      st.comment("got text:" + res.text)
      st.equal(res.text, 'foobar\n')
    })
    .end(function(err,res) {
      console.log("done",err)
      st.end(err)
    })
  })
});
