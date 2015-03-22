/**
 * TESTS TO IMPLEMENT
 *     (basically, everything!)
 */


var should = require('should'), 
    X = require('../test/x.js');

X.setLogLevel(0);  // shut up




// ██╗███╗   ██╗     ██╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
// ██║████╗  ██║     ██║██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
// ██║██╔██╗ ██║     ██║█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║
// ██║██║╚██╗██║██   ██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║
// ██║██║ ╚████║╚█████╔╝███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
// ╚═╝╚═╝  ╚═══╝ ╚════╝ ╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
describe("Injecting XVARs to the global object", function() {

    // note the absence of 'var' 
    __globalXVAR = X.var('foo');

    it('Returns correct result', function() {

        should.equal( true, X.injectVars(global) );
        should.equal( 'foo', __GLOBALXVAR);

    });

});


// ██████╗  ██████╗  ██████╗ ██╗     ███████╗ █████╗ ███╗   ██╗
// ██╔══██╗██╔═══██╗██╔═══██╗██║     ██╔════╝██╔══██╗████╗  ██║
// ██████╔╝██║   ██║██║   ██║██║     █████╗  ███████║██╔██╗ ██║
// ██╔══██╗██║   ██║██║   ██║██║     ██╔══╝  ██╔══██║██║╚██╗██║
// ██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗██║  ██║██║ ╚████║
// ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
describe("Boolean operators", function() {

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

    var gtAB  = X.greater(a, b),
        gteAB = X.greaterEqual(a, b),
        ltAB  = X.less(a, b),
        lteAB = X.lessEqual(a, b);

    it('Returns correct result after declaration', function() {

        should.equal(  true, a.val );
        should.equal( false, c.val );

        should.equal( false, notA.val );

        should.equal(  true, andAB.val );
        should.equal( false, andABC.val );
        should.equal(  true, andATrue.val );
        should.equal( false, andAFalse.val );

        should.equal( false, orCD.val );
        should.equal(  true, orBCD.val );
        should.equal(  true, orCTrue.val );
        should.equal( false, orCFalse.val );

        should.equal(  true, equalAB.val );
        should.equal( false, equalABC.val );
        should.equal(  true, equalABTrue.val );

        should.equal( false, notEqualAB.val );
        should.equal( false, notEqualABC.val );

        should.equal( false, gtAB.val );
        should.equal(  true, gteAB.val );
        should.equal( false, ltAB.val );
        should.equal(  true, lteAB.val );        

    });
    

    it('Returns correct result after change', function() {

        a.val = false;
        c.val = true;

        should.equal( false, a.val );
        should.equal(  true, c.val );

        should.equal(  true, notA.val );

        should.equal( false, andAB.val );
        should.equal( false, andABC.val );
        should.equal( false, andATrue.val );
        should.equal( false, andAFalse.val );

        should.equal(  true, orCD.val );
        should.equal(  true, orBCD.val );
        should.equal(  true, orCTrue.val );
        should.equal(  true, orCFalse.val );

        should.equal( false, equalAB.val );
        should.equal( false, equalABC.val );
        should.equal( false, equalABTrue.val );

        should.equal(  true, notEqualAB.val );
        should.equal( false, notEqualABC.val );

        should.equal( false, gtAB.val );
        should.equal( false, gteAB.val );
        should.equal(  true, ltAB.val );
        should.equal(  true, lteAB.val );

    });

});




// ███╗   ██╗██╗   ██╗███╗   ███╗██████╗ ███████╗██████╗ 
// ████╗  ██║██║   ██║████╗ ████║██╔══██╗██╔════╝██╔══██╗
// ██╔██╗ ██║██║   ██║██╔████╔██║██████╔╝█████╗  ██████╔╝
// ██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗
// ██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██████╔╝███████╗██║  ██║
// ╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
describe("Numerical operators", function() {

    var u = X.var(2),
        v = X.var(3),
        w = X.var(4),
        x = X.var(4.56);

    var half = w.half(),
        doub = w.double(),
        abs  = w.abs(),
        sqrt = w.sqrt(),
        sin  = w.sin(),
        cos  = w.cos(),
        tan  = w.tan(),
        roun = x.round(),
        flr  = x.floor(),
        ceil = x.ceil(),
        degs = w.toDegrees(),
        rads = w.toRadians();

    var add = X.add(u, v, w),
        sub = X.subtract(u, v),
        mul = X.multiply(u, v, w),
        div = X.divide(u, v),
        mod = X.modulo(v, u),
        pow = X.pow(u, v),
        at2 = X.atan2(v, u);

    it('Returns correct result after declaration', function() {
        
        should.equal( 2, u.val );
        should.equal( 3, v.val );
        should.equal( 4, w.val );

        should.equal( 2, half.val );
        should.equal( 8, doub.val );
        should.equal( 4, abs.val );
        should.equal( Math.sqrt(4), sqrt.val );
        should.equal( Math.sin(4), sin.val );
        should.equal( Math.cos(4), cos.val );
        should.equal( Math.tan(4), tan.val );
        should.equal( 5, roun.val );
        should.equal( 4, flr.val );
        should.equal( 5, ceil.val );
        should.equal( 4 * 180 / Math.PI, degs.val );
        should.equal( 4 * Math.PI / 180, rads.val );

        should.equal( 9, add.val );
        should.equal( -1, sub.val );
        should.equal( 24, mul.val );
        should.equal( 2/3, div.val );
        should.equal( 1, mod.val );
        should.equal( 8, pow.val );
        should.equal( Math.atan2(3, 2), at2.val );

    });

    it('Returns correct result after change', function() {

        u.val = 3;
        w.val = -100;
        x.val = 2.000001;

        should.equal( 3, u.val );
        should.equal( 3, v.val );
        should.equal( -100, w.val );

        should.equal( -50, half.val );
        should.equal( -200, doub.val );
        should.equal( 100, abs.val );
        should.equal( true, isNaN(sqrt.val) );  // since NaN != NaN... (should.be.NaN doesn't work!)
        should.equal( Math.sin(-100), sin.val );
        should.equal( Math.cos(-100), cos.val );
        should.equal( Math.tan(-100), tan.val );
        should.equal( 2, roun.val );
        should.equal( 2, flr.val );
        should.equal( 3, ceil.val );
        should.equal( -100 * 180 / Math.PI, degs.val );
        should.equal( -100 * Math.PI / 180, rads.val );

        should.equal( -94, add.val );
        should.equal( 0, sub.val );
        should.equal( -900, mul.val );
        should.equal( 1, div.val );
        should.equal( 0, mod.val );
        should.equal( 27, pow.val );
        should.equal( Math.atan2(3, 3), at2.val );

    });

});




// ██████╗  █████╗ ███╗   ██╗██████╗  ██████╗ ███╗   ███╗
// ██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔═══██╗████╗ ████║
// ██████╔╝███████║██╔██╗ ██║██║  ██║██║   ██║██╔████╔██║
// ██╔══██╗██╔══██║██║╚██╗██║██║  ██║██║   ██║██║╚██╔╝██║
// ██║  ██║██║  ██║██║ ╚████║██████╔╝╚██████╔╝██║ ╚═╝ ██║
// ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚═╝     ╚═╝
describe("Random numbers", function() {
    
    var low = X.var(0),
        high = X.var(1);
    var ran = X.random(low, high);

    it('Produces random value between 0 and 1', function() {

        ran.val.should.be.within(0, 1);

    });

    it('Maintains normalized value after remap', function() {

        var prev = ran.val;

        high.val = 2;
        should.equal( 2 * prev, ran.val );

        low.val = -2;
        should.equal( 4 * prev - 2, ran.val );

    });

    it('Should change after .next()', function() {

        var prev = ran.val;

        ran.next();
        should.notEqual( prev, ran.val );

    });

});





// ███████╗████████╗██████╗ ██╗███╗   ██╗ ██████╗ 
// ██╔════╝╚══██╔══╝██╔══██╗██║████╗  ██║██╔════╝ 
// ███████╗   ██║   ██████╔╝██║██╔██╗ ██║██║  ███╗
// ╚════██║   ██║   ██╔══██╗██║██║╚██╗██║██║   ██║
// ███████║   ██║   ██║  ██║██║██║ ╚████║╚██████╔╝
// ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 

describe("String operators", function() {

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

    var repl = concat.replace('Bar', s1);

    var beginSlice = X.var(3),
        endSlice = X.var(10);
    var sl1 = abc.slice(),
        sl2 = abc.slice(beginSlice),
        sl3 = abc.slice(beginSlice, endSlice);

    var chr = abc.charAt(index);

    var match = X.var('efgh');
    var rep = abc.replace(match, '[replaced]');


    it('Returns correct result after declaration', function() {

        should.equal( 'Foo', s1.val );

        should.equal( 26, len.val );

        should.equal( 'FOO', upp.val );
        should.equal( 'foo', low.val );

        should.equal( "Foo Bar Baz", concat.val );

        should.equal( " Ba", slc1.val );
        should.equal( "ar Baz", slc2.val );
        should.equal( " Ba", slc3.val );
        should.equal( "r Baz", slc4.val );


        should.equal( 'abcdefghijklmnopqrstuvwxyz', sl1.val );
        should.equal( 'defghijklmnopqrstuvwxyz', sl2.val );
        should.equal( 'defghij', sl3.val );

        should.equal( "g", chr.val );

        should.equal( 'abcd[replaced]ijklmnopqrstuvwxyz', rep.val );

    });


    it('Returns correct result after change', function() {

        s1.val = 'Rock';
        s2.val = 'Paper';
        s3.val = 'Scissors';
        abc.val = 'zyxwvutsrqponmlkjihgfedcba';
        index.val = 10;
        beginSlice.val = 5;
        endSlice.val = 7;

        should.equal( 'Rock', s1.val );

        should.equal( 26, len.val );

        should.equal( 'ROCK', upp.val );
        should.equal( 'rock', low.val );

        should.equal( "Rock Paper Scissors", concat.val );

        should.equal( "k P", slc1.val );
        should.equal( "Paper Scissors", slc2.val );
        should.equal( "k Paper", slc3.val );
        should.equal( " Scissors", slc4.val );


        should.equal( 'zyxwvutsrqponmlkjihgfedcba', sl1.val );
        should.equal( 'utsrqponmlkjihgfedcba', sl2.val );
        should.equal( 'ut', sl3.val );

        should.equal( 'p', chr.val );

        should.equal( 'zyxwvutsrqponmlkjihgfedcba', rep.val );

    });

});




//  ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
// ██╔════╝██║  ██║██╔══██╗██║████╗  ██║
// ██║     ███████║███████║██║██╔██╗ ██║
// ██║     ██╔══██║██╔══██║██║██║╚██╗██║
// ╚██████╗██║  ██║██║  ██║██║██║ ╚████║
//  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝

describe("Method chaining", function() {

    var s1 = X.var('Foo'),
        s2 = X.var('Bar'),
        s3 = X.var('Baz');

    var chain = X.add(s1, ' ', s2, ' ', s3).slice(1, 10).replace('Bar', s1);

    it('Returns correct result after declaration', function() {

        should.equal( 'oo Foo Ba', chain.val );

    });

    it('Returns correct result after change', function() {

        s1.val = 'XXX'
        s3.val = 'YYY';
        should.equal( 'XX XXX YY', chain.val );

    });

});

                                     


//  █████╗ ██████╗ ██████╗  █████╗ ██╗   ██╗
// ██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
// ███████║██████╔╝██████╔╝███████║ ╚████╔╝ 
// ██╔══██║██╔══██╗██╔══██╗██╔══██║  ╚██╔╝  
// ██║  ██║██║  ██║██║  ██║██║  ██║   ██║   
// ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   

describe("Array operators", function() {

    var count = X.var(10),
        step = X.var(1),
        start = X.var(0),
        end = X.var(1);

    var series = X.series(count, start, step);
        range = X.range(count, start, end);

    it('Returns correct result after declaration', function() {

        should.deepEqual( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], series.val );
        should.deepEqual( [0, 0.1, 0.2, 0.30000000000000004, 0.4, 0.5, 0.6, 0.7, 0.7999999999999999, 0.8999999999999999, 0.9999999999999999], range.val );  // damned floating point precision...

    });

    it('Returns correct result after change', function() {

        step.val = 1.5;
        end.val = 100;
        should.deepEqual( [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5], series.val );
        should.deepEqual( [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], range.val );

    });

});




// ███╗   ███╗ █████╗ ████████╗ ██████╗██╗  ██╗██╗███╗   ██╗ ██████╗     ██████╗  █████╗ ████████╗████████╗███████╗██████╗ ███╗   ██╗███████╗
// ████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██║  ██║██║████╗  ██║██╔════╝     ██╔══██╗██╔══██╗╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗████╗  ██║██╔════╝
// ██╔████╔██║███████║   ██║   ██║     ███████║██║██╔██╗ ██║██║  ███╗    ██████╔╝███████║   ██║      ██║   █████╗  ██████╔╝██╔██╗ ██║███████╗
// ██║╚██╔╝██║██╔══██║   ██║   ██║     ██╔══██║██║██║╚██╗██║██║   ██║    ██╔═══╝ ██╔══██║   ██║      ██║   ██╔══╝  ██╔══██╗██║╚██╗██║╚════██║
// ██║ ╚═╝ ██║██║  ██║   ██║   ╚██████╗██║  ██║██║██║ ╚████║╚██████╔╝    ██║     ██║  ██║   ██║      ██║   ███████╗██║  ██║██║ ╚████║███████║
// ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝     ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝

describe("Array operators", function() {

    var chars = X.var(['a', 'b', 'c']),
        nums = X.var([0, 1, 2]);

    var sum = X.add(chars, nums);
    var hypenated = X.add(chars, '-', nums);

    it('Returns correct result after declaration', function() {

        // Default matching pattern is 'longest list'
        should.deepEqual( ["a0", "b1", "c2"], sum.val );
        should.deepEqual( ["a-0", "b-1", "c-2"], hypenated.val );

    });

    it('Returns correct result after changes', function() {

        // Default matching pattern is 'longest list'
        chars.val = ['a'];
        should.deepEqual( ["a0", "a1", "a2"], sum.val );

        // Changes in array lengths propagate to children 
        chars.val = ['A', 'B', 'C', 'D', 'E'];
        should.deepEqual( ["A0", "B1", "C2", "D2", "E2"], sum.val );

        sum.setMatchingPattern('shortest-list');
        should.deepEqual( ["A0", "B1", "C2"], sum.val );

        sum.setMatchingPattern('cross-reference');  // aka 'cartesian product'
        should.deepEqual( ["A0", "A1", "A2", "B0", "B1", "B2", "C0", "C1", "C2", "D0", "D1", "D2", "E0", "E1", "E2"], sum.val );

        should.deepEqual( ["A-0", "B-1", "C-2", "D-2", "E-2"], hypenated.val );
        
    });

});





//  ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███████╗███████╗
// ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗██╔════╝██╔════╝
// ██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║███████╗█████╗  
// ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║   ██║╚════██║██╔══╝  
// ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ╚██████╔╝███████║███████╗
//  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝      ╚═════╝ ╚══════╝╚══════╝
describe("Composite operator", function() {


    // A composite expression is created passing all parents as arguments, 
    // plus an update callback function which will be passed an array with 
    // all the parents' value(s) in ordered sequence.
    // Note passed objects are the actual values, so no need to use the .val accessor 
    var u = X.var(2),
        v = X.var(3),
        w = X.var(4);
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


    it('Returns correct result after declaration', function() {

        should.equal( 46, comp.val );
        should.deepEqual( ["I just saw a blue dragon!", "I just saw a red turtle!", "I just saw a green turtle!"], lsd.val );

    });

    it('Returns correct result after changes', function() {

        u.val = 100;
        v.val = 200;
        w.val = 300;
        should.equal( 23000, comp.val );

        colors.val = ['yellow', 'orange'];
        animals.val = ['bird', 'lion'];
        should.deepEqual( ["I just saw a yellow bird!", "I just saw a orange lion!"], lsd.val );

        lsd.setMatchingPattern('cross-reference');
        should.deepEqual( ["I just saw a yellow bird!", "I just saw a yellow lion!", "I just saw a orange bird!", "I just saw a orange lion!"], lsd.val );   

    });

});
                                                      



