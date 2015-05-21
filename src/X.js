(function () {

    var DEV = false;

    //  ██████╗ ██████╗ ██████╗ ███████╗
    // ██╔════╝██╔═══██╗██╔══██╗██╔════╝
    // ██║     ██║   ██║██████╔╝█████╗  
    // ██║     ██║   ██║██╔══██╗██╔══╝  
    // ╚██████╗╚██████╔╝██║  ██║███████╗
    //  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝

    var version = '0.2.0';

    // Some constants
    var TAU = 2 * Math.PI,              // ;)
        TO_DEGS = 180 / Math.PI,
        TO_RADS = Math.PI / 180;

    // The object containing the public accessors
    var X = {};

    // Current context (window, module, global object, etc.)
    var context = this;

    // All created XVARS
    var elements = [];
    if (DEV) X._elements = elements;  // development public accessor alias

    // Incremental id assignment
    var xIndex = 0;

    // Set how verbose X.js is
    var log = 1;
    X.logLevel = function(value) {
        if (arguments.length == 0) return log;
        log = value;
    };




    ////////////////////
    // INTERNAL STUFF //
    ////////////////////
    
    // Checks if this object has one and only one wrapped parent
    var checkConstrainedParenthood = function(obj) {
        if (obj._parents.length == 1 && obj._parents[0]._type == 'XWRAP') {
            obj._isConstrained = false;
            obj._wrappedSingleParent = true;
        }
    };    

    // A generic constructor interface to create XVARs with type, args and update function name
    // FORMER buildARR
    var build = function(TYPE, parents, update, customProps) {
        var obj = new _typeMap[TYPE]();  // is this XVAR or XWRAP?
    
        obj._makeChildOfParents(parents);
        obj._update = _typeMap[TYPE]._updates[update];  // choose which update function to bind

        // Add custom properties to object if applicable, and before any update
        // Do it after setting obj._update, in case it should be overriden
        if (customProps) {
            for (var prop in customProps) {
                if (customProps.hasOwnProperty(prop)) {
                    obj[prop] = customProps[prop];
                }
            }
        }

        obj._updateElement();  // update once everything is in place
        return obj;
    };

    // Returns a string with the type of data for the _value property of passed object
    var dataType = function(obj) {
        return what(obj).type();
    };










    // ██╗  ██╗██████╗  █████╗ ███████╗███████╗
    // ╚██╗██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝
    //  ╚███╔╝ ██████╔╝███████║███████╗█████╗  
    //  ██╔██╗ ██╔══██╗██╔══██║╚════██║██╔══╝  
    // ██╔╝ ██╗██████╔╝██║  ██║███████║███████╗
    // ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
    /**
     * Base class for XVARS to inherit from
     * @param {object} value
     */
    var XBASE = function(value) {
        // quasi-private properties
        this._id = xIndex++;
        this._value = value;
        this._parents = [];
        this._children = [];
        this._xvar = true;
        this._name = '';
        this._type = 'XBASE';
        this._isConstrained = true;
        this._wrappedSingleParent = false;

        // managing array-like xvars
        this._isArray = false;  // is the _value in this XVAR array-like?
        this._parentLengths = [];
        this._matchPatternType = 'longest-list';  // default behavior
        this._matchPattern = [];  // an array with indices representing the match pattern

        this._preUpdate = null;  // a custom _preUdate function to be run once for special entities (e.g. .random())


        /**
         * Contains references to objects representing characteristic properties of
         * the object. They get registered here upon first creation, and referenced
         * on any subsequent query.
         * @type {Object}
         */
        this._properties = {};

        // Add it to the internal collection manager
        elements.push(this);

        // ADAPTED FROM BOTH XBASE AND XBASEARR
        this._makeChildOfParents = function(parents) {
            for (var l = parents.length, i = 0; i < l; i++) {
                var p = parents[i];
                if (!p || !p._xvar) p = wrap(p);  // if parent is undefined or if parent is not an XVAR, wrap it into one
                this._parents.push(p);
                p._children.push(this);
            }

            // do some default parent lengths and pattern match
            var patt = [];
            for (var l = parents.length, i = 0; i < l; i++) {
                this._parentLengths.push(0);  // defaults to singletons, should be corrected on first update
                patt.push(-1);  // -1 is used to flag singleton elements
            }
            this._matchPattern.push(patt);

            checkConstrainedParenthood(this);
        };

        /**
         * Add a new object to a characteristic property of this object
         * @param  {string} prop
         * @param  {object} obj
         * @return {object} the registered object
         */
        this._register = function(prop, obj) {
            this._properties[prop] = obj;
            return obj;
        };

        // returns an array with the _value prop of the _parents objs for specified indexArray (pattern matching)
        // THIS COULD BECOME A PRIVATE FUNCTION: var valueSlice = function(parents, indexArray) {...}
        this._parentSlice = function(indexArray) {
            var arr = [];

            // if no index passed (singleton parents)
            if (typeof indexArray === 'undefined') {
                for (var len = this._parents.length, i = 0; i < len; i++) {
                    arr.push(this._parents[i]._value);
                }

            // if array parents 
            } else {
                for (var len = this._parents.length, i = 0; i < len; i++) {
                    arr.push( indexArray[i] === -1 ?   // is singleton?
                            this._parents[i]._value :
                            this._parents[i]._value[indexArray[i]]);
                }
            }

            return arr;
        };

        /**
         * Resets parent objects from this object, and removes this child 
         * from parents. Performs search on parents based on own _id
         * @return {Boolean} 
         */
        this._makeOrphan = function() {
            // Remove this from parents' children
            for (var i = 0; i < this._parents.length; i++) {
                var rem = false;
                for (var j = 0; j < this._parents[i]._children.length; j++) {
                    if (this._parents[i]._children[j]._id == this._id) {
                        this._parents[i]._children.splice(j, 1);
                        rem = true;
                        break;
                    }
                }
                if (!rem) {
                    console.log('Couldnt find this object in parents children, something went wrong ' + i);
                    return false;
                }
            }
            this._parents = [];
            return true;
        };

        // Flags this._isArray
        this._checkArrayness = function() {
            this._isArray = false;

            if (this._type == 'XWRAP') {
                this._isArray = is(this._value).type('array');  // USING ONTOLOGY.JS, TO REMOVE
            } else {
                for (var l = this._parentLengths.length, i = 0; i < l; i++) {
                    if (this._parentLengths[i]) {  // if any parent length != 0
                        this._isArray = true;
                        break;
                    }
                }
            }
            return this._isArray;
        };

        // An identity update function to be overriden
        this._update = function(parents) {
            return this._value;
        };

        // Calls updateElement and updateChildren on all object's children
        this._updateChildren = function() {
            this._children.forEach(function(elem) {
                if (DEV) console.log('DEBUG: updating "' + elem._name + '"');
                elem._updateElement();
                elem._updateChildren();
            });
        };

        // A function that encompasses all update actions for this object
        this._updateElement = function(forceDeep) {

            // Check if size of parents has changed
            var changed = false;
            if (forceDeep) {
                changed = true;
            } else {
                for (var l = this._parents.length, i = 0; i < l; i++) {
                    var len = this._parents[i]._isArray ? this._parents[i]._value.length : 0;
                    if (len != this._parentLengths[i]) {
                        this._parentLengths[i] = len;  
                        changed = true;
                    }
                }
            }

            // If parents changed in size, update 'arrayness' the matching pattern 
            if (changed) {
                this._checkArrayness();  // flag this XVAR as array-like
                this._updateMatchPattern();  // recalculate parent matching pattern
            }

            // Check if there a _preUpdate funtion was registered, and run it
            if (this._preUpdate) this._preUpdate();

            // Now call the _update function according to the matching pattern
            // Call _update passing extracted parent values according to matching pattern
            if (this._isArray) {
                this._value = [];
                for (var i = 0; i < this._matchPattern.length; i++) {
                    var slice = this._parentSlice(this._matchPattern[i]);
                    this._value.push(this._update(slice, i));
                }
            } else {
                var slice = this._parentSlice();
                this._value = this._update(slice, 0);
            }

        };


        /**
         * Updates _matchPattern according to parents' lengths and _matchPatternType
         * @return {[type]} [description]
         */
        this._updateMatchPattern = function() {
            if (DEV) console.log('Updating matchPattern for ' + this._name);
            var parentCount = this._parents.length;
            this._matchPattern = [];

            // If no parents are arrays, this objects isn't either, and pattern is [-1, -1 ...] 
            if (!this._isArray) {
                var patt = [];
                for (var i = 0; i < parentCount; i++) {
                    patt.push(-1);
                };
                this._matchPattern.push(patt);
                return true;
            };

            // LONGEST-LIST matching pattern
            if (this._matchPatternType === 'longest-list') {
                var longest = 0;
                for (var i = 0; i < parentCount; i++) {
                    if (this._parents[i]._isArray && this._parents[i]._value.length > longest) 
                            longest = this._parents[i]._value.length;
                };

                for (var i = 0; i < longest; i++) {
                    var patt = [];
                    for (var j = 0; j < parentCount; j++) {
                        if (this._parents[j]._isArray) {
                            patt.push(i > this._parents[j]._value.length - 1 ? 
                                    this._parents[j]._value.length - 1 : i);
                        } else {
                            patt.push(-1)
                        }
                    }
                    this._matchPattern.push(patt);
                };

                return true;
            };

            // SHORTEST-LIST matching pattern
            if (this._matchPatternType === 'shortest-list') {
                var shortest = Number.MAX_VALUE;
                for (var i = 0; i < parentCount; i++) {
                    if (this._parents[i]._isArray) {
                        if (this._parents[i]._value.length < shortest) 
                                shortest = this._parents[i]._value.length;
                    // if any parent is not array, just match first elements
                    } else {
                        shortest = 1;
                    }
                };

                for (var i = 0; i < shortest; i++) {
                    var patt = [];
                    for (var j = 0; j < parentCount; j++) {
                        patt.push( this._parents[j]._isArray ? i : -1);
                    }
                    this._matchPattern.push(patt);
                };

                return true;
            };

            // CROSS-REFERENCE a.k.a. cartesian product: http://en.wikipedia.org/wiki/Cartesian_product
            // adapted from http://stackoverflow.com/a/15310051/1934487
            if (this._matchPatternType === 'cross-reference') {
                var self = this;  // scope the context

                function recursive(arr, i) {
                    if (self._parents[i]._isArray) {
                        for (var len = self._parents[i]._value.length, j = 0; j < len; j++) {
                            var a = arr.slice(0);  // clone array;
                            a.push(j);
                            if (i >= parentCount - 1) {
                                self._matchPattern.push(a);
                            } else {
                                recursive(a, i + 1);
                            }
                        }
                    } else {
                        var a = arr.slice(0);  // clone array;
                        a.push(-1);
                        if (i >= parentCount - 1) {
                            self._matchPattern.push(a);
                        } else {
                            recursive(a, i + 1);
                        }
                    }
                }

                recursive([], 0);

                return true;
            };

            return false;
        };

    };

    // This has better performance than Object.defineProperties(): http://jsperf.com/getter-setter/7
    XBASE.prototype = {
        get val() {
            return this._value;
        },
        set val(x) {
            if (this._isConstrained) {
                if (log) console.warn('X.js: Sorry, this variable is constrained');
            } else {
                // update for single parented wrapped objects
                if (this._wrappedSingleParent) {
                  this._parents[0].val = x;  

                // update for wrap objects 
                } else {
                    this._value = x;  
                    this._checkArrayness();
                    this._updateChildren();
                }
            }
        }
    };

    var _matchTypes = {
        'longest-list': true,
        'shortest-list': true,
        'cross-reference': true
    };

    XBASE.prototype.setMatchingPattern = function(matchType) {
        if (!_matchTypes[matchType]) {
            if (log) console.warn('X.js: unrecognized matching pattern type for XBASE.setMatchingPattern()');
            return false;
        }
        this._matchPatternType = matchType;
        this._updateElement(true);  // force deep update, including matching pattern
        this._updateChildren();
        return true;
    };












    // ██╗  ██╗██╗    ██╗██████╗  █████╗ ██████╗ 
    // ╚██╗██╔╝██║    ██║██╔══██╗██╔══██╗██╔══██╗
    //  ╚███╔╝ ██║ █╗ ██║██████╔╝███████║██████╔╝
    //  ██╔██╗ ██║███╗██║██╔══██╗██╔══██║██╔═══╝ 
    // ██╔╝ ██╗╚███╔███╔╝██║  ██║██║  ██║██║     
    // ╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     
    /**
     * An object wrapper for primitive arguments
     * @param {object} value
     */
    var XWRAP = function(value) {
        XBASE.call(this, value);
        this._type = 'XWRAP';
        this._isConstrained = false;
        this._checkArrayness();  // see if the _value in this element is an array
    };
    XWRAP.prototype = Object.create(XBASE.prototype);
    XWRAP.prototype.constructor = XWRAP;

    // Returns the value wrapped inside a XWRAP object
    var wrap = function(value){
        return new XWRAP(value);
    };












    // ██╗  ██╗██╗   ██╗ █████╗ ██████╗ 
    // ╚██╗██╔╝██║   ██║██╔══██╗██╔══██╗
    //  ╚███╔╝ ██║   ██║███████║██████╔╝
    //  ██╔██╗ ╚██╗ ██╔╝██╔══██║██╔══██╗
    // ██╔╝ ██╗ ╚████╔╝ ██║  ██║██║  ██║
    // ╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝
    var XVAR = function(value) {
        XBASE.call(this, value);
        this._type = 'XVAR';
    };
    XVAR.prototype = Object.create(XBASE.prototype);
    XVAR.prototype.constructor = XVAR;

    //////////////////////////////////////////////////
    // AUTO GENERATION OF CHARACTERISTIC PROTOTYPES //
    // (this are all argument-less)                 //
    //////////////////////////////////////////////////
    var XVARProtos = [
        'not',
        'half',
        'double',
        'abs',
        'sqrt',
        'sin',
        'cos',
        'tan',
        'round',
        'floor',
        'ceil',
        'toDegrees',
        'toRadians',
        'length',
        'toLowerCase',
        'toUpperCase'
    ];

    XVARProtos.forEach(function(prop) {
        XVAR.prototype[prop] = function() {
            return typeof this._properties[prop] !== 'undefined' ?
                    this._properties[prop] :
                    this._register(prop, build('XVAR', [this], prop));
        };
    })

    ////////////////////
    // SPECIAL PROTOS //
    ////////////////////

    // Implements String.slice() or Array.slice()
    XVAR.prototype.slice = function(beginSlice, endSlice) {
        // TRY TO AVOID ARGUMENT CONTROL, rely on default JS behaviors and functions checks for each item
        // if ( is(this._value).type('string') ) {
        //     if (log) console.warn('X.js: XVAR.slice() only works with string single parents at the time');
        //     return undefined;
        // };

        return build('XVAR', [this, beginSlice, endSlice], 'slice');
    };

    // Implements String.charAt()
    XVAR.prototype.charAt = function(index) {
        return build('XVAR', [this, index], 'charAt');
    };

    // Implements String.replace()
    XVAR.prototype.replace = function(subStr, newSubStr) {
        return build('XVAR', [this, subStr, newSubStr], 'replace');
    };

    /**
     * Adds elements to this object's _value, and trigger updates
     * @return {Number} New array length
     */
    XVAR.prototype.push = function() {
        var newV = this._isArray ? this._value : [this._value];
        for (var i = 0; i < arguments.length; i++) {
            newV.push(arguments[i]);
        }
        this.val = newV;
        return this._value.length;  // as in Array.prototype.push();
    };

    /**
     * Removes the last element of the array
     * @return {Object} Returns the popped object
     */
    XVAR.prototype.pop = function() {
        if (this._isConstrained) {
            if (log) console.warn('X.js: Sorry, this variable is constrained');
            return undefined;
        }
        if (!this._isArray) return undefined;
        var popped = this._value.pop();  // a shallow object
        this.val = this._value;  // triggers updates
        return popped;
    };


    //////////////////////
    // BASE CONSTRUCTOR //
    //////////////////////

    X.var = function(value) {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: Invalid arguments for X.var()');
            return undefined;
        };

        return build('XVAR', arguments, 'fromValue');
    };


    ///////////////////////
    // CASTING FUNCTIONS //
    ///////////////////////

    X.boolean = X.bool = function(value) {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: Invalid arguments for X.boolean()');
            return undefined;
        };

        return build('XVAR', arguments, 'boolean');
    };

    X.number = X.num = function(value) {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: Invalid arguments for X.number()');
            return undefined;
        };

        return build('XVAR', arguments, 'number');
    };

    X.string = X.str = function(value) {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: Invalid arguments for X.string()');
            return undefined;
        };

        return build('XVAR', arguments, 'string');
    };

    // Could be expanded to accept many arguments, and create an array with their values...
    X.array = X.arr = function() {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: Invalid arguments for X.array()');
            return undefined;
        };

        return build('XVAR', arguments, 'array');
    };


    ///////////////////
    // BOOLEAN LOGIC //
    ///////////////////

    /**
     * Returns simple chained && of objects' "truthiness" 
     * @param  {...Object} arguments
     * @return {XVAR}
     */
    X.and = function() {
        if (arguments.length == 0) {
            if (log) console.warn('X.js: Invalid arguments for X.and()');
            return undefined;
        };
        return build('XVAR', arguments, 'and');
    }; 

    /**
     * Returns simple chained || of objects' "truthiness" 
     * @param  {...Object} arguments
     * @return {XVAR}
     */
    X.or = function() {
        if (arguments.length == 0) {
            if (log) console.warn('X.js: Invalid arguments for X.or()');
            return undefined;
        };
        return build('XVAR', arguments, 'or');
    }; 

    /**
     * Returns true if all operands are equal to each other via native '==',
     * i.e. there are no two different '!=' objects
     * @param {...Object} arguments
     * @return {XVAR}
     */
    X.equal = function() {
        if (arguments.length < 2) {
            if (log) console.warn('X.js: Must pass at least two arguments to X.equal()');
            return undefined;
        }
        return build('XVAR', arguments, 'equal');
    };

    /**
     * Returns true if ALL OPERANDS are not equal to each other via native '!=',
     * i.e. there are no two equal '==' objects
     * @param {...Object} arguments     
     * @return {XVAR}
     */
    X.notEqual = X.different = function() {
        if (arguments.length < 2) {
            if (log) console.warn('X.js: Must pass at least two arguments to X.notEqual()');
            return undefined;
        }
        return build('XVAR', arguments, 'notEqual');
    };

    /**
     * Implements simple 'A > B' 
     * @return {XVAR}
     */
    X.greater = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.greater()');
            return undefined;
        }
        return build('XVAR', arguments, 'greater');
    };

    /**
     * Implements simple 'A >= B' 
     * @return {XVAR} 
     */
    X.greaterEqual = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.greaterEqual()');
            return undefined;
        }
        return build('XVAR', arguments, 'greaterEqual');
    };

    /**
     * Implements simple 'A < B' 
     * @return {XVAR}
     */
    X.less = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.less()');
            return undefined;
        }
        return build('XVAR', arguments, 'less');
    };

    /**
     * Implements simple 'A <= B' 
     * @return {XVAR}
     */
    X.lessEqual = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.lessEqual()');
            return undefined;
        }
        return build('XVAR', arguments, 'lessEqual');
    };


    //////////////////////////
    // ARITHMETIC FUNCTIONS //
    //////////////////////////

    X.add = function() {
        if (arguments.length == 0) {
            if (log) console.warn('X.js: Invalid arguments for X.add()');
            return undefined;
        };
        return build('XVAR', arguments, 'add');
    };

    X.subtract = X.diff = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.subtract()");
            return undefined;
        }
        return build('XVAR', arguments, 'subtract');
    };

    X.multiply = function() {
        if (arguments.length < 2) {
            if (log) console.log("X.js: Invalid arguments for X.multiply()");
            return undefined;
        }
        return build('XVAR', arguments, 'multiply');
    };

    X.divide = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.divide()");
            return undefined;
        }
        return build('XVAR', arguments, 'divide');
    };

    X.modulo = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.modulo()");
            return undefined;
        }
        return build('XVAR', arguments, 'modulo');
    };

    X.pow = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.pow()");
            return undefined;
        }
        return build('XVAR', arguments, 'pow');
    };

    X.atan2 = function(Y, X) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.atan2()");
            return undefined;
        }
        return build('XVAR', arguments, 'atan2');
    };

    /**
     * Create a pseudo-random number generator with associative limits, 
     * binding a .next() method to trigger random update. 
     * Accepts the forms:
     *     .random()            // from 0 to 1
     *     .random(max)         // from 0 to max
     *     .random(min, max)    // from min to max
     *     
     * @see https://msdn.microsoft.com/en-us/library/system.random
     * @return {XVAR}
     */
    X.random = function(lim0, lim1) {
        // Add the possibility of customizing the random range
        var min, max;
        if (typeof lim1 !== 'undefined') {
            min = lim0;
            max = lim1;
        } else {
            min = 0;
            max = typeof lim0 !== 'undefined' ? lim0 : 1;
        }

        // Create the object and bind a custom properties and update functions
        var ran = build('XVAR', [min, max], 'random', {
            next: randomNext,
            _randomSeeds: [],
            _preUpdate: randomPreupdate
        });

        return ran;
    };

    /**
     * Resets random seeds and trigger updates 
     */
    var randomNext = function() {
        // Uses parent setter to generate a new normalized random value (and trigger updates)
        this._randomSeeds = [];
        for (var l = this._matchPattern.length, i = 0; i < l; i++) {
            this._randomSeeds.push(Math.random());
        };
        this._updateElement();
        this._updateChildren();
    };

    /**
     * A custom preupdate function to check if more seeds are necessary
     * @return {Boolean} Returns true if new seeds were generated
     */
    var randomPreupdate = function() {
        var diff = this._matchPattern.length - this._randomSeeds.length;
        if (diff < 1) return false;  // if there are more seeds than matches, keep the excess
        if (DEV) console.log("Creating " + diff + " new random seeds");
        for (var i = 0; i < diff; i++) {
            this._randomSeeds.push(Math.random());
        }
        return true;
    };



    /**
     * A composite expression is created passing all parents as arguments, 
     * plus an update callback function which will be passed an array with 
     * all the parents' value(s) in ordered sequence.
     * Note passed objects are the actual values, so no need to use the .val accessor 
     * If parents are arrays, individual items will be passed to the callback
     * according to the specified matching pattern
     * @return {[type]} [description]
     */
    X.compose = function() {
        var a = arguments, len = a.length;

        if (len < 2) {
            if (log) console.warn('X.js: invalid arguments for X.compose()');
            return undefined;
        };

        var callback = a[len - 1];
        if ( !is(callback).type('function') ) {  // USING ONTOLOGY, TO DEPRECATE
            if (log) console.warn('X.js: last argument must be an update function for X.compose()');
            return undefined;
        };

        var parents = [];
        for (var i = 0; i < len - 1; i++) {
            parents.push(a[i]);
        };

        // Use a dummy update function, to be overriden by the custom arg callback
        return build('XVAR', parents, 'compose', {
            _update: callback
        });

    };



    /////////////////////
    // ARRAY FUNCTIONS //
    /////////////////////

    /**
     * Creates an array-like numeric series of 'count' elements from 'start' 
     * and gap size 'step'
     */
    X.series = function(count, start, step) {
        if (arguments.length != 3) {
            if (log) console.log("X.js: Invalid arguments for X.series()");
            return undefined;
        }

        return build('XVAR', arguments, 'series');
    };

    /**
     * Creates an array-like numeric series of 'count' steps 
     * between 'start' and 'end'. Note that, for example, two steps 
     * will generate three elements.
     */
    X.range = function(count, start, end) {
        if (arguments.length != 3) {
            if (log) console.log("X.js: Invalid arguments for X.range()");
            return undefined;
        }

        return build('XVAR', arguments, 'range');
    };


    //////////////////////
    // STRING FUNCTIONS //
    //////////////////////

    /**
     * Same as X.add, but the result is always a concatenated string (even if
     * all parents are numbers); 
     * @type {}
     */
    X.concat = function() {
        if (arguments.length == 0) {
            if (log) console.log("X.js: Invalid arguments for X.concat()");
            return undefined;
        }

        return build('XVAR', arguments, 'concat');
    };


    /**
     * Main library of update methods for XVAR objects
     * UPDATE: all functions get passed an array of PARENT VALUES, and
     * must return the updated value. This was done so to allow for 
     * multiple calls to the update function between elements in 
     * array-like parents. 
     * UPDATE: they now also get passed the index of current update
     * iteration as the second argument. This is typically i for arrays
     * or -1 for non-array objects. See 'random'.
     * @type {Object}
     */
    XVAR._updates = {

        fromValue: function(p) {
            return p[0];  // retrieve from xvar/xwrapped parent
        },


        ///////////////////////
        // CASTING FUNCTIONS //
        ///////////////////////

        boolean: function(p) {
            return Boolean(p[0]);
        },

        number: function(p) {
            return Number(p[0]);
        },

        string: function(p) {
            return String(p[0]);
        },

        array: function(p) {
            return [p[0]];
        },

        ////////////////////
        // BOOLEAN LOGIC  //
        ////////////////////

        not: function(p) {
            return !p[0];
        },

        and: function(p) {
            for (var i = 0; i < p.length; i++) {
                if (!p[i]) return false;
            }
            return true;
        },

        or: function(p) {
            for (var i = 0; i < p.length; i++) {
                if (p[i]) return true;
            }
            return false;
        },

        equal: function(p) {
            for (var l = p.length - 1, i = 0; i < l; i++) {
                if (p[i] != p[i + 1]) return false;
            }
            return true;
        },

        notEqual: function(p) {
            for (var l = p.length, i = 0; i < l - 1; i++) {  // pyramidal comparison without self-check 
                for (var j = i + 1; j < l; j++) {
                    if (p[i] == p[j]) return false;
                }
            }
            return true;
        },

        greater: function(p) {
            return p[0] > p[1];
        },

        greaterEqual: function(p) {
            return p[0] >= p[1];
        },

        less: function(p) {
            return p[0] < p[1];
        },

        lessEqual: function(p) {
            return p[0] <= p[1];
        },


        //////////////////////////
        // ARITHMETIC FUNCTIONS //
        //////////////////////////

        half: function(p) {
            return 0.5 * p[0];
        },

        double: function(p) {
            return 2 * p[0];
        },

        abs: function(p) {
            return Math.abs(p[0]);
        },

        sqrt: function(p) {
            return Math.sqrt(p[0]);
        },

        sin: function(p) {
            return Math.sin(p[0]);
        },

        cos: function(p) {
            return Math.cos(p[0]);
        },

        tan: function(p) {
            return Math.tan(p[0]);
        },

        round: function(p) {
            return Math.round(p[0]);
        },

        floor: function(p) {
            return Math.floor(p[0]);
        },

        ceil: function(p) {
            return Math.ceil(p[0]);
        },

        toDegrees: function(p) {
            return TO_DEGS * p[0];
        },

        toRadians: function(p) {
            return TO_RADS * p[0];
        },

        add: function(p) {
            var sum = p[0];  // also sets initial type
            for (var i = 1; i < p.length; i++) {
                sum += p[i];
            }
            return sum;
        },

        subtract: function(p) {
            return p[0] - p[1];
        },

        multiply: function(p) {
            var mul = p[0];
            for (var l = p.length, i = 1; i < l; i++) {
                mul *= p[i];
            }
            return mul;
        },

        divide: function(p) {
            return p[0] / p[1];
        },

        modulo: function(p) {
            return p[0] % p[1];
        },

        pow: function(p) {
            return Math.pow(p[0], p[1]);
        },

        atan2: function(p) {
            return Math.atan2(p[0], p[1]);  // inputs were in the form (Y, X)
        },

        random: function(p, i) {
            // Updates the value without changing the random parameter. See 'randomNext'.
            return this._randomSeeds[i] * (p[1] - p[0]) + p[0];
        },


        /////////////////////
        // ARRAY FUNCTIONS //
        /////////////////////

        // @TODO: what if 'count' is a float?
        series: function(p) {
            var ser = [];
            for (var i = 0; i < p[0]; i++) {  // inputs in the form (count, start, step)
                ser.push(p[1] + i * p[2]);
            }  
            return ser;
        },

        // @TODO: what if 'count' is a float?
        range: function(p) {
            var rang = [],
                step = (p[2] - p[1]) / p[0];
            for (var i = p[1]; i <= p[2]; i += step) {  // inputs in the form (count, start, end)
                rang.push(i);
            }  
            return rang;
        },

        //////////////////////
        // STRING FUNCTIONS //
        //////////////////////

        // returns the length of parent string (or array, if parent is array of arrays)
        // should have no default, and return undefined if not eligible? This would be 'truer' to JS...
        length: function(p) {
            return typeof p[0].length !== 'undefined' ? p[0].length : 1; 
        },

        toLowerCase: function(p) {
            // Parent may not be a string
            return p[0].toLowerCase ? p[0].toLowerCase() : p[0];
        },

        toUpperCase: function(p) {
            // Parent may not be a string
            return p[0].toUpperCase ? p[0].toUpperCase() : p[0];
        },

        slice: function(p) {
            return typeof p[0].slice !== 'undefined' ?
                    p[0].slice(p[1], p[2]) : 
                    p[0];
        },

        charAt: function(p) {
            return typeof p[0].charAt !== 'undefined' ? 
                    p[0].charAt(p[1]) : 
                    p[0];
        },

        replace: function(p) {
            return typeof p[0].replace !== 'undefined' ? 
                    p[0].replace(p[1], p[2]) : 
                    p[0];
        },

        concat: function(p) {
            var sum = String(p[0]);
            for (var i = 1; i < p.length; i++) {
                sum += p[i];
            }
            return sum;
        },


        ////////////////////
        // MISC FUNCTIONS //
        ////////////////////

        // A dummy update, will in fact be overriden by the custom callback
        compose: function(p) {
            return p[0];
        }

    };














    // ██╗    ██╗██╗██████╗ 
    // ██║    ██║██║██╔══██╗
    // ██║ █╗ ██║██║██████╔╝
    // ██║███╗██║██║██╔═══╝ 
    // ╚███╔███╔╝██║██║     
    //  ╚══╝╚══╝ ╚═╝╚═╝     

    // An object mapping XVAR types to private constructors
    var _typeMap = {
        'XWRAP'   : XWRAP,
        'XVAR'    : XVAR
    };

    /**
     * Searches the passed object for all XVARS and retrieves their names
     * @return {boolean} returns true if any was found
     */
    X.tagVars = function(object) {
        if (!object) {
            if (log) console.log('X.js: Incorrect arguments for X.tagVars()');
            return false;
        }

        var found = false;
        for (var a in object) {
            if (has(object[a]).property('_xvar')) {
                object[a]._name = a;
                found = true;
            }   
        }
        return found;
    };


    /**
     * Adds news properties to the passed objects as uppercased gsetters to all the elements in this X
     * @param  {object} object
     * @return {boolean}
     */
    X.injectVars = X.linkVars = function(object) {
        if (!object) {
            if (log) console.log('X.js: Incorrect arguments for X.injectVars()');
            return false;
        }

        this.tagVars(object);  // Internal call, should be optimized to detect if element has name already

        var flag = false;
        elements.forEach(function(e) {
            if (e._name === '') return;  // continue to next iteration
            var str = e._name.toUpperCase();
            Object.defineProperty(object, str, {
                get: function() {
                    return e._value;
                },
                set: function(x) {
                    e.val = x;
                }
            });
            if (log) console.info('X.js: Created "' + str + '" pointing to "' + e._name + '.val"');
            flag = true;
        })
        return true;
    };








    // ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗
    // ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
    // █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║   
    // ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║   
    // ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║   
    // ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

    // browser context
    if ( typeof exports != 'object' || exports === undefined ) {
        if (window) window.X = X;
        else console.log('X.js: No window object was found...');

    // node.js context
    } else {
        // var exp = module.exports = {};
        // exp.X = X;
        module.exports = X;
    }
    

}());  // as per Crockford's
