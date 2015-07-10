![X.js | Associative Variabes in JavaScript](https://github.com/garciadelcastillo/X.js/blob/master/assets/xjs_banner_728.png "X.js | Associative Variabes in JavaScript")

X.js is a library to emulate Associative Variables in JavaScript. It provides a constructive API to create `XVAR` objects wrapping a `value` whose runtime value updates synchronously after its parents. The library uses a combination of intuitive syntax, parent-children update trees, modified getters and setters, and safe defaults, to provide an interface with associative feel. 

X.js is read _"big x dot js"_ ;)

## Why Associative Variables?

Some time ago I realized that, when teaching newcomers how to code, they often had a hard time wrapping their minds around the following notion:

```javascript
var a = 1;
var b = a;
console.log(b);  // 1
a = 5;
console.log(b);  // 1 (!)
```

The usual question is, "shouldn't `b` be `5`, since it is equal to `a`...?". And while I had long ago gotten used to the structure of [imperative programming](http://en.wikipedia.org/wiki/Imperative_programming), I still find the logic behind this question sincerely reasonable. 

For a pair of fresh eyes, the feel in the `b = a` expression transmits a clear identity logic, conveyed by the one to one construction, which under that same logic should be enduring and persistent through the life of the program. This is the reason behind [declarative programming](http://en.wikipedia.org/wiki/Declarative_programming), where the focus is on the structure of the program and the data, rather than the control flow.

So, while I don't intend to change the nature of JavaScript, I thought it could be interesting to test creating a small framework for constructive associativity between variables in JS. Enjoy!

## Setup

Download the latest version from [the distribution folder](https://github.com/garciadelcastillo/x.js/tree/master/dist).

If in a browser, a global `X` object will be available as a namespace for the library. If in Node.js, you should manually require it via:

```javascript
var X = require('somepath/x-0.1.0.min.js');  // an actual npm package is wip...
```

## Hello World

`X` is the main object used to interface with the library, in a fabric-like chainable fashion. To instantiate a new variable, use `X.var(value)` and access it through the `.val` property:

```javascript
var a = X.var(100);
console.log(a.val);         // 100
a.val = 150;                // 150
```

Associative variables can be created as children of parent variables, and any changes in the parents propagate to children according to their constructive declaration:

```javascript
var a = X.var(5),
    b = X.var(10);

var add = X.add(a, b);
console.log(add.val);       // 15

a.val = 20;
console.log(add.val);       // 30
```

And yes, the hello world example... ;)

```javascript
var greet = X.var('Hello'),
    to = X.var('world');

var greeting = X.concat(greet, ' ', to, '!');       // greeting.val => "Hello world!"

to.val = 'folks';                                   // greeting.val => "Hello folks!"
greet.val = 'Howdy';                                // greeting.val => "Howdy folks!"
```

## Examples / Features

### Associativity

Everything declared via `X.` is permanently linked to its parents in a constructive logic:

```javascript
var a = X.var(true),
    b = X.var(false),
    u = X.var(1),
    v = X.var(2),
    w = X.var(3);

var and = X.and(a, b),          // and.val => false
    mul = X.multiply(u, v, w),  // mul.val => 6
    div = X.divide(u, v);       // div.val => 0.5
```

Associative variables can also spawn characteristic children via their prototypes:

```javascript
var notAnd = and.not(),         // notAnd.val = true
    halfMul = mul.half();       // halfMul.val = 3
```

Changes in parent objects propagate all the way down the hierarchy tree:

```javascript
b.val = true;
console.log(and.val);           // true
console.log(notAnd.val);        // false
```

And changes in objects with parent dependencies are (still) not allowed:

```javascript
mul.val = 100;                  // "X.js: Sorry, this variable is constrained"
console.log(mul.val);           // 6
```

### Accesibility

Shortcuts to the .val properties of declared `XVAR` objects can be attached to an object for ease of access, and they will show as capitalized versions of the variable's name (I know this convention is commonly used to denote constancy, but it is so opposite to the actual meaning that I think it fits... ;)

```javascript
X.linkVars(window);         // capitalized shortcuts are attached to the window object
console.log(W);             // 3
W = 10;
console.log(MUL);           // 20
```

### Flexibility

`X.js` is weakly-typed, maintaining the spirit of JavaScript. Variables are declared without explicit type, variable types can change at runtime, and operations are coerced when possible:

```javascript
var u = X.var(1),
    v = X.var(2);

var add = X.add(u, v);
console.log(add.val);       // 3

u.val = 'foo';
console.log(add.val);       // "foo3"
```

When necessary, explicit associative type casting is also available:

```javascript
var u = X.var(1),
    v = X.var(2),
    uStr = X.string(u);     // uStr.val => "1"

var add = X.add(u, v);
console.log(add.val);       // "12"
```

Parents can be any combination of XVARs or primitive objects:

```javascript
var abc = X.var('abcdefghijklmnopqrstuvwxyz'),
    match = X.var('efgh');

var newAbc = abc.replace(match, '[CENSORED]');  // newAbc.val => abcd[CENSORED]ijklmnopqrstuvwxyz
match.val = 'foo';                              // newAbc.val => abcdefghijklmnopqrstuvwxyz (no match was found)
```

### Chainability

Since the return type of most methods is an XVAR object, transformations can be chained:

```javascript
var s1 = X.var('Foo'),
    s2 = X.var('Bar'),
    s3 = X.var('Baz');

var chain = X.add(s1, ' ', s2, ' ', s3).slice(1, 10).replace('Bar', s1);   // "oo Foo Ba"
```

### Pattern Matching

When working with arrays as primitives, parents are combined at the element level by default, and the matching pattern can be customized:

```javascript
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
```

### Customizable

Virtually, any kind of child variable can be created by customizing the relation to its parents via the `X.compose()` constructor:

```javascript
var radius = X.var(10);

// A composite expression is created passing all parents as arguments, 
// plus an update callback function which will be passed an array with 
// all the parents' value(s) in ordered sequence.
// Note passed objects are the actual values, so no need to use the .val accessor 
var length = X.compose(radius, function(parents) {
    return 2 * Math.PI * parents[0];
});
var area = X.compose(radius, function(parents) {
    return Math.PI * parents[0] * parents[0];
});

// If parents are arrays, individual items will be passed to the callback
// according to the specified matching pattern
var colors = X.var(['blue', 'red', 'green']),
    animals = X.var(['dragon', 'turtle']);
var lsd = X.compose(colors, animals, function(parents) {
    return "I just saw a " + parents[0] + " " + parents[1] + "!";
});
console.log(lsd.val);  // ["I just saw a blue dragon!", "I just saw a red turtle!", "I just saw a green turtle!"]
```

## More to Come
* Object literals as variable value
* onChange events
* Value transitions with delays
* Sibling vars (two way associations)




