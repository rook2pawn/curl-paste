curl-paste
==========

    node server.js -p 8500

with foo.txt being
    
*I started Early – Took my Dog –*  
*And visited the Sea –*  
*The Mermaids in the Basement*  
*Came out to look at me –* 

    > curl --data-binary @foo.txt http://localhost:8500
    
gives you back a URL

    > http://localhost:8500/fo4ia6w

Which you can then retrieve the contents at that URL
    
    > curl http://localhost:8500/fo4ia6w
    I started Early – Took my Dog –
    And visited the Sea –
    The Mermaids in the Basement
    Came out to look at me –


There's also a web interface, just point your browser at http://localhost:8500
