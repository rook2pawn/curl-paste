const Nanocomponent = require('nanocomponent')
const choo = require('choo')
const html = require('choo/html')
const css = require("sheetify");
const raw = require('nanohtml/raw')
const path = require('path')

css('./app.css')

class Header extends Nanocomponent {
  constructor () {
    super();
  }

  createElement (state) {

    return html`<div class='header'> <a href="${state.header.origin}">${state.header.origin}</a> A portable, open-source paste site. Host it yourself! <a href="https://github.com/rook2pawn/curl-paste">repo</a></div>`;
  }
}

class Park extends Nanocomponent {
  constructor () {
    super();
  }

  createElement (state) {
    const rawlink = state.header.origin + '/id/'+state.query.id
    const weblink = state.header.origin + '/web/'+state.query.id
    return html`<div class='main'>
    <div>
      These are view once links with a maximum lifetime of one minute.
      <div class='sharelink_curlpaste'>Raw URL: <a id='rawlink' href='${rawlink}'>${rawlink}</a></div>
      <div class='sharelink_curlpaste'>Web URL: <a id='weblink' href='${weblink}'>${weblink}</a></div>
    </div>
    </div>`;
  }

}
class Input extends Nanocomponent {
  constructor () {
    super();
  }

  createElement (state, emitter) {
    return html`
    <div class='main'>


<div class="usage basic">
        <h2>Basic Usage</h2>
        ${raw("&gt;")} curl --data-binary @yourfile.txt ${state.header.href}
    </div>

<div class="usage secure">
        <h2>Secure Usage</h2>
        ${raw("&gt;")} curl --data-binary @yourfile.txt ${path.join(state.header.href,"once")}
        <div class="description">Document is deleted after one minute or viewed once.</div>
    </div>

<div class="usage paste">
        <h2>Or Paste Here</h2>
        <span> Or paste some text in here</span> <input form="pastetext" type="submit" id="paste_btn_text" value="Paste!">
        <form action="/web" name="pastetext" id="pastetext" method="POST">
            <input type="checkbox" name="secure">Secure Paste (deleted after one minute, or viewed once)
            <textarea name="text" value="" rows="10"></textarea>
        </form>
    </div>
    </div>
    `
  }
}

class WebContent extends Nanocomponent {
  constructor () {
    super();
    this.content = undefined;
  }

  createElement (state, emitter) {
    const id = state.query.id;

    if (this.content === undefined) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", `/id/${id}`, true);
      xhr.onload = (e) => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            console.log(xhr.responseText);
            this.content = xhr.responseText;
            this.rerender();
          } else {
            console.error(xhr.statusText);
          }
        }
      };
      xhr.onerror = function (e) {
        console.error(xhr.statusText);
      };
      xhr.send(null);
    }
    const rawlink = state.header.origin + '/id/'+state.query.id
    const weblink = state.header.origin + '/web/'+state.query.id

    return html`
    <div class='main'>

    <div class='linkbox'>
      <div class='sharelink_curlpaste'>Raw URL: <a id='rawlink' href='${rawlink}'>${rawlink}</a></div>
      <div class='sharelink_curlpaste'>Web URL: <a id='weblink' href='${weblink}'>${weblink}</a></div>
    </div>

    <div class='content'>
      ${this.content}
    </div>
    </div>
    `
  }
}

var app = choo()
var header = new Header;
var input = new Input;
var park = new Park;
var web = new WebContent; 

function mainView (state, emit) {
  return html`<body>
  ${header.render(state)}
  ${input.render(state)}  
  </body>`
 }

function parkView (state, emit) {
  return html`<body>
  ${header.render(state)}
  ${park.render(state)}  
  </body>`
 }

function webView (state, emit) {
  return html`<body>
  ${header.render(state)}
  ${web.render(state)}  
  </body>`
 }


app.use((state, emitter) => {
  state.header = {};
  state.header.href = window.location.href;
  state.header.origin = window.location.origin;  
})

app.route('/', mainView)
app.route('/park', parkView)
app.route('/web', webView)


app.mount('body')

document.title = window.location.host;
