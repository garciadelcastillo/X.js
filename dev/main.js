// ///////////
// // SETUP //
// ///////////

X.setLogLevel(0);  // shut up

// //////////////////////////////////////////////////// //
// // XBOOLEAN                                          //
// ///////////////////////////////////////////////////////
// var a = X.bool(true),
//  b = X.bool(true),
//  c = X.bool(false),
//  d = X.bool(false);

// var notA = a.not();

// var andAB  = X.bool.and(a, b),
//  andABC = X.bool.and(a, b, c),
//  andATrue = X.bool.and(a, true),
//  andAFalse = X.bool.and(a, false);

// var orCD  = X.bool.or(c, d),
//  orBCD = X.bool.or(b, c, d),
//  orCTrue = X.bool.or(c, true),
//  orCFalse = X.bool.or(c, false);

// var equalAB = X.bool.equal(a, b),
//  equalABC = X.bool.equal(a, b, c),
//  equalABTrue = X.bool.equal(a, b, true);


// var notEqualAB = X.bool.notEqual(a, b),
//  notEqualABC = X.bool.notEqual(a, b, c);


// var gtAB  = X.bool.greater(a, b);
// var gteAB = X.bool.greaterEqual(a, b);
// var ltAB  = X.bool.less(a, b);
// var lteAB = X.bool.lessEqual(a, b);



// //////////////////////////////////////////////////// // //
// // XNUMBER                                              //
// //////////////////////////////////////////////////////////

// var u = X.number(2),
//  v = X.number(3),
//  w = X.number(4);

// var half = w.half(),
//  doub = w.double(),
//  abs  = w.abs(),
//  sqrt = w.sqrt(),
//  sin  = w.sin(),
//  cos  = w.cos(),
//  tan  = w.tan(),
//  roun = w.round(),
//  flr  = w.floor(),
//  ceil = w.ceil(),
//  degs = w.toDegrees(),
//  rads = w.toRadians();

// var add = X.number.add(u, v, w),
//  sub = X.number.subtract(u, v),
//  mul = X.number.multiply(u, v, w),
//  div = X.number.divide(u, v),
//  mod = X.number.modulo(v, u),
//  pow = X.number.pow(u, v),
//  at2 = X.number.atan2(v, u);

// var ran1 = X.number.random(),
//  ran2 = X.number.random(w),
//  ran3 = X.number.random(-10, w);


// //////////////////////////////////////////////////// // // //
// // STRING                                                  //
// /////////////////////////////////////////////////////////////

// var s1 = X.string('Foo'),
//  s2 = X.string('Bar'),
//  s3 = X.string('Baz');

// var upp = s1.toUpperCase(),
//  low = s1.toLowerCase();

// var concat = X.string.concat(s1, ' ', s2, ' ', s3);

// var slc1 = concat.slice(3, 6),
//  slc2 = concat.slice(5);

// var index = X.number(6);

// var slc3 = concat.slice(3, index),
//  slc4 = concat.slice(index);

// var charAt = concat.charAt(index); 

// var repl = concat.replace('Bar', s1);

// // Method chaining! :)
// var chain = X.string.concat(s1, ' ', s2, ' ', s3).slice(1, 10).replace('Bar', s1);


// //////////////////////////////////////////////////// // // // //
// // XVAR                                                       //
// ////////////////////////////////////////////////////////////////

// var comp1 = X.xvar.compose(100, u, v, w, function() {
//  console.log(arguments);
//  return u.val + v.val + w.val;
// });


// /////////
// // WIP //
// /////////

// X.tagVars(window);
// X.injectVars(window);














//////////////////////////////////////////////////// // // // // //
// ARRAYS AND MATCHING PATTERNS                                  //
///////////////////////////////////////////////////////////////////
var chars = X.array(['a', 'b', 'c']),
    nums = X.array([0, 1, 2]);

var sum = X.array.add(chars, nums);

// Adds internal names to objects based on global object search
X.tagVars(window);

// Adds uppercase gsetters to global object
X.injectVars(window);

// FROM HERE ON, UPPERCASE GSETTERS ARE USED!
// One to one matching
console.log(SUM);  // ["a0", "b1", "c2"]

// Default matching pattern is 'longest list'
CHARS = ['a'];
console.log(SUM);  // ["a0", "a1", "a2"]

// Changes in array lengths propagate to children 
CHARS = ['A', 'B', 'C', 'D', 'E'];
console.log(SUM);  // ["A0", "B1", "C2", "D2", "E2"]

// Matching type can be updated:
sum.setMatchingPattern('shortest-list');
console.log(SUM);  // ["A0", "B1", "C2"]

// Data can be of mixed type! With array-like xvars and JS primitives...
var concat = X.array.add(chars, '-', nums);
console.log(concat.val);  // ["A-0", "B-1", "C-2", "D-2", "E-2"]


