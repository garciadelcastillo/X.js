// X.setLogLevel(0);  // shut up

//////////////////////////////////////////////////// //
// XBOOLEAN                                          //
///////////////////////////////////////////////////////
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



//////////////////////////////////////////////////// // //
// XNUMBER                                              //
//////////////////////////////////////////////////////////

var u = X.number(2),
	v = X.number(3),
	w = X.number(4);

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

var add = X.number.add(u, v, w),
	sub = X.number.subtract(u, v),
	mul = X.number.multiply(u, v, w),
	div = X.number.divide(u, v),
	mod = X.number.modulo(v, u),
	pow = X.number.pow(u, v),
	at2 = X.number.atan2(v, u);




X.tagVars(window);
X.injectVars(window);



