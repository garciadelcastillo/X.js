// X.setLogLevel(0);  // shut up

var a = X.bool(true),
	b = X.bool(true),
	c = X.bool(false),
	d = X.bool(false);

var notA = a.not();

var andAB  = X.bool.and(a, b),
	andABC = X.bool.and(a, b, c),
	andATrue = X.bool.and(a, true),
	andAFalse = X.bool.and(a, false);

var orCD  = X.bool.or(c, d),
	orBCD = X.bool.or(b, c, d),
	orCTrue = X.bool.or(c, true),
	orCFalse = X.bool.or(c, false);

var equalAB = X.bool.equal(a, b),
	equalABC = X.bool.equal(a, b, c),
	equalABTrue = X.bool.equal(a, b, true);


var notEqualAB = X.bool.notEqual(a, b),
	notEqualABC = X.bool.notEqual(a, b, c);


var gtAB  = X.bool.greater(a, b);
var gteAB = X.bool.greaterEqual(a, b);
var ltAB  = X.bool.less(a, b);
var lteAB = X.bool.lessEqual(a, b);


X.tagVars(window);
X.injectVars(window);



