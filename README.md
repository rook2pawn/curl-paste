[![Build Status](https://travis-ci.org/rook2pawn/curl-paste.svg?branch=master)](https://travis-ci.org/rook2pawn/curl-paste)

# getting started

## install

	npm install

## config port

Port setting is in `config.js`. Defaults to 8000. If you use https you'll probably want to set this to port 443.

## run with https

	npm run start-https

Make sure you have `privkey.pem` and `fullchain.pem` in the root directory.

## run with http

	npm run start-http

# curl-paste

* <a href='#regularapi'>Regular API</a>
* <a href='#secureapi'>Secure API - View Once Methods</a>

<a name='regularapi'></a>
## Regular API

#### GET /{id}
Returns document at {id}

#### GET /web/{id}
Returns document in web view at {id}

#### POST /
Upload document, returns {id}

#### POST /web
Upload document from web view

<a name='secureapi'></a>
## Secure Methods

#### POST /once
Upload document, returns {id}. After one GET of {id}, document is deleted.

#### POST /once?expires={seconds}
Upload document, returns {id}. After one GET of {id}, document is deleted. Document is also deleted after {seconds}.


#Secure with HTTPS

    var server = https.createServer({
        key:fs.readFileSync('privkey.pem'),
        cert:fs.readFileSync('fullchain.pem')
    },app)
