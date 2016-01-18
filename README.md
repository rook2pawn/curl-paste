[![Build Status](https://travis-ci.org/rook2pawn/curl-paste.svg?branch=master)](https://travis-ci.org/rook2pawn/curl-paste)

curl-paste
==========

* <a href='#regularapi'>Regular API</a>
* <a href='#secureapi'>Secure API - View Once Methods</a>

<a name='regularapi'></a>
Regular API
===========

GET /{id}
---------
Returns document at {id}

GET /web/{id}
-------------
Returns document in web view at {id}

POST /
------
Upload document, returns {id}

POST /pastetext
---------------
Upload document from web view

<a name='secureapi'></a>
Secure Methods
==============

POST /once
----------
Upload document, returns {id}. After one GET of {id}, document is deleted.

POST /once?expires={seconds}
----------------------------
Upload document, returns {id}. After one GET of {id}, document is deleted. Document is also deleted after {seconds}.
