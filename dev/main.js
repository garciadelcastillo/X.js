///////////
// SETUP //
///////////

// X.setLogLevel(0);  // shut up

//////////////////////////////////////////////////// //
// XBOOLEAN                                          //
///////////////////////////////////////////////////////
var a = X.var(true),
    b = X.var(true),
    c = X.var(false),
    d = X.var(false);

var notA = a.not();

var andAB  = X.and(a, b),
    andABC = X.and(a, b, c),
    andATrue = X.and(a, true),
    andAFalse = X.and(a, false);

var orCD  = X.or(c, d),
    orBCD = X.or(b, c, d),
    orCTrue = X.or(c, true),
    orCFalse = X.or(c, false);

var equalAB = X.equal(a, b),
    equalABC = X.equal(a, b, c),
    equalABTrue = X.equal(a, b, true);


var notEqualAB = X.different(a, b),
    notEqualABC = X.different(a, b, c);


var gtAB  = X.greater(a, b);
var gteAB = X.greaterEqual(a, b);
var ltAB  = X.less(a, b);
var lteAB = X.lessEqual(a, b);



//////////////////////////////////////////////////// // //
// XNUMBER                                              //
//////////////////////////////////////////////////////////

var u = X.var(2),
    v = X.var(3),
    w = X.var(4);

var half = w.half(),
    doub = w.double(),
    abs  = w.abs(),
    sqrt = w.sqrt(),
    sin  = w.sin(),
    cos  = w.cos(),
    tan  = w.tan(),
    roun = w.round(),
    flr  = w.floor(),
    ceil = w.ceil(),
    degs = w.toDegrees(),
    rads = w.toRadians();

var add = X.add(u, v, w),
    sub = X.subtract(u, v),
    mul = X.multiply(u, v, w),
    div = X.divide(u, v),
    mod = X.modulo(v, u),
    pow = X.pow(u, v),
    at2 = X.atan2(v, u);

var ran1 = X.random(),
    ran2 = X.random(w),
    ran3 = X.random(-10, w);

console.log(ran2.val);  // whatever random value from 0 to w

w.val = 5;              
console.log(ran2.val);  // normalized randomness stays immutable, value just adjusts to new bounds

ran2.next();            // ticks the random generator to produce a new value
console.log(ran2.val);  // a random new value within specified bounds


//////////////////////////////////////////////////// // // //
// STRING                                                  //
/////////////////////////////////////////////////////////////

var s1 = X.var('Foo'),
    s2 = X.var('Bar'),
    s3 = X.var('Baz'),
    abc = X.var('abcdefghijklmnopqrstuvwxyz');

var len = abc.length();

var upp = s1.toUpperCase(),
    low = s1.toLowerCase();

var concat = X.add(s1, ' ', s2, ' ', s3);

var index = X.var(6);
var slc1 = concat.slice(3, 6),
    slc2 = concat.slice(5),
    slc3 = concat.slice(3, index),
    slc4 = concat.slice(index);

var charAt = concat.charAt(index); 

var repl = concat.replace('Bar', s1);

var beginSlice = X.var(3),
    endSlice = X.var(10);
var sl1 = abc.slice(),
    sl2 = abc.slice(beginSlice),
    sl3 = abc.slice(beginSlice, endSlice);

var chr = abc.charAt(end);

var match = X.var('abcd');
var rep = abc.replace(match, '[replaced]');



//////////////////////////////////////////////////// // // // // //
// METHOD CHAINING! :)                                           //
///////////////////////////////////////////////////////////////////

var chain = X.add(s1, ' ', s2, ' ', s3).slice(1, 10).replace('Bar', s1);




//////////////////////////////////////////////////// // // // // // //
// ARRAYS AND MATCHING PATTERNS                                     //
//////////////////////////////////////////////////////////////////////
var chars = X.var(['a', 'b', 'c']),
    nums = X.var([0, 1, 2]);

var sum = X.add(chars, nums);

// One to one matching
console.log(sum.val);  // ["a0", "b1", "c2"]

// Default matching pattern is 'longest list'
chars.val = ['a'];
console.log(sum.val);  // ["a0", "a1", "a2"]

// Changes in array lengths propagate to children 
chars.val = ['A', 'B', 'C', 'D', 'E'];
console.log(sum.val);  // ["A0", "B1", "C2", "D2", "E2"]

// Matching type can be updated:
sum.setMatchingPattern('shortest-list');
console.log(sum.val);  // ["A0", "B1", "C2"]

sum.setMatchingPattern('cross-reference');  // aka 'cartesian product'
console.log(sum.val);  // ["A0", "A1", "A2", "B0", "B1", "B2", "C0", "C1", "C2", "D0", "D1", "D2", "E0", "E1", "E2"]

// Data can be of mixed type! With array-like xvars and JS primitives...
var hypenated = X.add(chars, '-', nums);
console.log(hypenated.val);  // ["A-0", "B-1", "C-2", "D-2", "E-2"]

var count = X.var(10),
    step = X.var(1.5),
    start = X.var(0),
    end = X.var(100);

var series = X.series(count, start, step);
    range = X.range(count, start, end);



//////////////////////////////////////////////////// // // // // // // //
// CUSTOM RELATIONAL EXPRESSION                                        //
/////////////////////////////////////////////////////////////////////////

// A composite expression is created passing all parents as arguments, 
// plus an update callback function which will be passed an array with 
// all the parents' value(s) in ordered sequence.
// Note passed objects are the actual values, so no need to use the .val accessor 
var comp = X.compose(u, v, w, function(parents) {
    return parents[0] * parents[1] + 10 * parents[2];
});

// If parents are arrays, individual items will be passed to the callback
// according to the specified matching pattern
var colors = X.var(['blue', 'red', 'green']),
    animals = X.var(['dragon', 'turtle']);
var lsd = X.compose(colors, animals, function(parents) {
    return "I just saw a " + parents[0] + " " + parents[1] + "!";
});

console.log(lsd.val);
lsd.setMatchingPattern("cross-reference");
console.log(lsd.val);



/////////
// WIP //
/////////

// Searches the passed object for all XVAR properties, and attaches
// an all caps gsetted accessor for ease of access:
console.log(abc.val);  // XVAR values must be get/set with the .val accessor 
X.injectVars(window);  // attach all caps gsetted accessors
console.log(ABC);      // same functionality can now be accesed through 'ABC'
ABC = 'foobarbaz';
console.log(ABC);



