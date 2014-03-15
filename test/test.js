var store = require('../lib/store');

var inputhash = { 
    a : {val: 'foo', timestamp:1349 },
    b : {val: 'foo', timestamp:1351 },
    c : {val: 'foo', timestamp:1490 },
    d : {val: 'foo', timestamp:1550 },
    e : {val: 'foo', timestamp:1600 }
}

console.log(store.clean(inputhash,1700,160))
