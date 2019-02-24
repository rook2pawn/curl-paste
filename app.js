const Nanocomponent = require('nanocomponent')
const choo = require('choo')
const html = require('choo/html')
const css = require("sheetify");
const raw = require('nanohtml/raw')

css('./app.css')

class Header extends Nanocomponent {
  constructor () {
    super();
  }

  createElement (state) {
    return html`<div class='header'> ${state.header.href} A portable, open-source paste site. Host it yourself!</div>`;
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
        ${raw("&gt;")} <span class="blip">curl</span> --data-binary @yourfile.txt <span class="hostname">https://curlpaste.com</span>
    </div>

<div class="usage secure">
        <h2>Secure Usage</h2>
        ${raw("&gt;")} <span class="blip">curl</span> --data-binary @yourfile.txt <span class="hostname">https://curlpaste.com</span>/once
        <div class="description">Document is deleted after one minute or viewed once.</div>
    </div>

<div class="usage">
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

var app = choo()
var header = new Header;
var input = new Input;

function mainView (state, emit) {
  return html`<body>
  ${header.render(state)}
  ${input.render(state)}  
  </body>`
 }

app.use((state, emitter) => {
  state.header = {};
  state.header.href = window.location.href
})

app.route('/', mainView)
app.mount('body')
