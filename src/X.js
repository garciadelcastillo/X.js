(function () {

    var DEV = true;

    //  ██████╗ ██████╗ ██████╗ ███████╗
    // ██╔════╝██╔═══██╗██╔══██╗██╔════╝
    // ██║     ██║   ██║██████╔╝█████╗  
    // ██║     ██║   ██║██╔══██╗██╔══╝  
    // ╚██████╗╚██████╔╝██║  ██║███████╗
    //  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝

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
    if (DEV) X._elements = elements;  // development accessor alias

    // Incremental id assignment
    var xIndex = 0;

    // Set how verbose X.js is
    var log = 1;
    X.setLogLevel = function(value) {
        if (arguments.length == 0) return log;
        log = value;
    };




    ////////////////////////
    // INTERNAL FUNCTIONS //
    ////////////////////////
    
    // Checks if this object has only one wrapped parent
    var checkConstrainedParenthood = function(obj) {
        if (obj._parents.length == 1 && obj._parents[0]._type == 'XWRAP') {
            obj._isConstrained = false;
            obj._wrappedSingleParent = true;
        }
    };    


    // A generic constructor interface to create XVARs with type, args and update function name
    // FORMER buildARR
    var build = function(TYPE, parents, update) {
        var obj = new _typeMap[TYPE]();
        obj._makeChildOfParents(parents);
        obj._update = _typeMap[TYPE]._updates[update];
        obj._updateArrayness();
        obj._matchUpdate();
        return obj;
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

        this._isArray = false;
        this._parentsLengths = [];
        this._matchPatternType = 'longest-list';  // will add shortest list, cross reference, etc.
        this._matchPattern = [];  // an array with indices representing the match pattern


        /**
         * Contains references to objects representing characteristic properties of
         * the object. They get registered here upon first creation, and referenced
         * on any subsequent query.
         * @type {Object}
         */
        this._properties = {};

        // Add it to the collection
        elements.push(this);

        // quasi-private methods
        this._updateChildren = function() {
            this._children.forEach(function(elem) {
                if (DEV) console.log('DEBUG: updating "' + elem._name + '"');
                elem._updateArrayness();
                elem._matchUpdate();  // includes an improved call to _update()
                elem._updateChildren();
            });
        };

        // ADAPTED FROM BOTH XBASE AND XBASEARR
        this._makeChildOfParents = function(parents) {
            for (var l = parents.length, i = 0; i < l; i++) {
                var p = parents[i];
                if (!p._xvar) p = wrap(p);  // if parent is not an XVAR, wrap it into one
                this._parents.push(p);
                p._children.push(this);
            }
            checkConstrainedParenthood(this);
        };

        /**
         * Discerns if this object's _value is array, and iterates over
         * the update method accordingly
         * @return {[type]} [description]
         */
        this._matchUpdate = function() {
            console.log('_matchUpdate for ' + this._name);

            // it should be checked about here that parents are still arrays
            // and make wrapping arrangements if necessary

            // if parents are arrays
            if (this._isArray) {
                this._value = [];
                for (var i = 0; i < this._matchPattern.length; i++) {
                    console.log('match update ' + i + ' with ' + this._matchPattern[i]);
                    var slice = this._parentSlice(this._matchPattern[i]);
                    console.log(slice);
                    this._value.push(this._update(slice));
                }

            // if parents are singletons
            } else {
                console.log('singleton');
                var slice = this._parentSlice();
                console.log(slice);
                this._value = this._update(slice);
            }
        };    

        // An identity update function to be overriden
        this._update = function(parents) {
            return this._value;
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
                    arr.push(this._parents[i]._value[indexArray[i]]);
                }
            }

            return arr;
        };

        /**
         * Checks if any parent is an array, and if so, flags this element _value as
         * array and performs matchpatterning updates
         * @return {[type]} [description]
         */
        this._updateArrayness = function() {
            if (DEV) console.log('Updating arrayness for ' + this._name);

            // check if any parent is array, and flag the element
            this._isArray = false;
            for (var i = 0; i < this._parents.length; i++) {
                if (is(this._parents[i]._value).type('array')) {
                    this._isArray = true;
                    break;
                }
            }

            if (!this._isArray) return;  

            // Checks if parents' lengths have remained constant, and otherwise 
            // updates the matching pattern
            // @TODO: this assumes all parents are arrays, will need to incorporate
            //      a wrapping check
            var lens = [];
            for (var i = 0; i < this._parents.length; i++) {
                lens.push(this._parents[i]._value.length);  
            }
            if ( !is(lens).deepIdentical(this._parentsLengths) ) {
                this._parentsLengths = lens;
                this._updateMatchPattern();
            }
        };


        /**
         * Updates _matchPattern according to parents' lengths and _matchPatternType
         * @return {[type]} [description]
         * @TODO how do we account here for array children from single parents? 
         *      e.g. var arrSin = arr1.sin() 
         */
        this._updateMatchPattern = function() {
            if (DEV) console.log('Updating matchPattern for ' + this._name);
            var parentCount = this._parents.length;
            this._matchPattern = [];

            if (this._matchPatternType === 'longest-list') {
                var longest = 0;
                for (var i = 0; i < parentCount; i++) {
                    if (this._parents[i]._value.length > longest) 
                            longest = this._parents[i]._value.length;
                };

                for (var i = 0; i < longest; i++) {
                    var patt = [];
                    for (var j = 0; j < parentCount; j++) {
                        patt.push(i > this._parents[j]._value.length - 1 ? 
                                this._parents[j]._value.length - 1 : i);
                    }
                    this._matchPattern.push(patt);
                };
                return true;
            };

            if (this._matchPatternType === 'shortest-list') {
                var shortest = Number.MAX_VALUE;
                for (var i = 0; i < parentCount; i++) {
                    if (this._parents[i]._value.length < shortest) 
                            shortest = this._parents[i]._value.length;
                };

                for (var i = 0; i < shortest; i++) {
                    var patt = [];
                    for (var j = 0; j < parentCount; j++) {
                        patt.push(i);
                    }
                    this._matchPattern.push(patt);
                };
                return true;
            };

            // a.k.a. cartesian product: http://en.wikipedia.org/wiki/Cartesian_product
            // adapted from http://stackoverflow.com/a/15310051/1934487
            if (this._matchPatternType === 'cross-reference') {
                var self = this;  // scope the context

                function recursive(arr, i) {
                    for (var len = self._parents[i]._value.length, j = 0; j < len; j++) {
                        var a = arr.slice(0);  // clone array;
                        a.push(j);
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
                if (log) console.warn('X.js: Sorry, this is constrained');
            } else {
                // update for single parented wrapped objects
                if (this._wrappedSingleParent) {
                  this._parents[0].val = x;  

                // update for wrapped objects 
                } else {
                    this._value = x;  
                    this._updateChildren();
                }
            }
        }
    };


    XBASE.prototype.setMatchingPattern = function(matchType) {
        if (!_matchTypesAvailable[matchType]) {
            if (log) console.warn('X.js: unrecognized matching pattern type for XBASE.setMatchingPattern()');
            return false;
        }
        this._matchPatternType = matchType;
        this._updateMatchPattern();
        this._matchUpdate();
        this._updateChildren();
        return true;
    };

    var _matchTypesAvailable = {
        'longest-list': true,
        'shortest-list': true,
        'cross-reference': true
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
    };
    XWRAP.prototype = Object.create(XBASE.prototype);
    XWRAP.prototype.constructor = XWRAP;

    var wrap = function(value){
        return new XWRAP(value);
    };









    /**
     * Fixing this is postponed for the moment. 
     * TODO:
     * - Implement the XARRWRAPer
     * - Tap into detection of array parents
     * - Upon first detection of a parent being an array, flag the _areParentsArrays
     * - Unlink object from parents (and viceversa)
     * - Draw XARRWRAP children from all parents
     * - Link those as new parents to target XVAR
     */

    // // ██╗  ██╗ █████╗ ██████╗ ██████╗ ██╗    ██╗██████╗  █████╗ ██████╗ 
    // // ╚██╗██╔╝██╔══██╗██╔══██╗██╔══██╗██║    ██║██╔══██╗██╔══██╗██╔══██╗
    // //  ╚███╔╝ ███████║██████╔╝██████╔╝██║ █╗ ██║██████╔╝███████║██████╔╝
    // //  ██╔██╗ ██╔══██║██╔══██╗██╔══██╗██║███╗██║██╔══██╗██╔══██║██╔═══╝ 
    // // ██╔╝ ██╗██║  ██║██║  ██║██║  ██║╚███╔███╔╝██║  ██║██║  ██║██║     
    // // ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     

    // /**
    //  * An object wrapper to interface between a parent whose value maybe non/array
    //  * and a child that needs array parents. Tries to solve the problem of a nonarray
    //  * parent turning into one (and viceversa). 
    //  * @param {XVAR} value
    //  */
    // var XARRWRAP = function(value) {
    //     XBASE.call(this, value);
    //     this._type = 'XARRWRAP';
    //     this._isConstrained = false;

    //     this._update = function() {
    //         if (typeof this._parents[0].value === '[object Array]') {
    //             return this._parents[0].value;
    //         }
    //         return [this._parents[0].value];
    //     }
    // };

    // var buildArrayChild = function(parent) {
    //     // var obj = new XARRWRAP();
    //     // obj._makeChildOfParents(parent);
    //     // // obj._update = _typeMap[TYPE]._updates[update];
    //     // obj._updateArrayness();
    //     // obj._matchUpdate();
    //     // return obj;
    //     return buils('XARRWRAP', parent, 'fromParent');
    // };

    // XARRWRAP._updates = {
    //     fromParent: function(pv) {
    //         // if (typeof pv[0] === '[object Array]') {
    //         if (this._isArray) {  // if parent is array
    //             return pv[0];
    //         }
    //         return [pv[0]];  // otherwise turn value into singleton array
    //     }
    // };










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
    X.notEqual = function() {
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
        if (arguments.length > 2) {
            if (log) console.log("X.js: Invalid arguments for X.random()");
            return undefined;
        }

        var min, max;
        if (typeof lim1 === 'undefined') {
            min = 0;
            max = typeof lim0 === 'undefined' ? 1 : lim0;
        } else {
            min = lim0;
            max = lim1;
        }

        // Create the object and bind a .next() method to get new values
        var ran = build('XVAR', [Math.random(), min, max], 'random');
        ran['next'] = randomNext;

        return ran;
    };

    // @TODO: must adapt this to work with arrays (and not do the same seed for all elements...)
    var randomNext = function() {
        // Uses parent setter to generate a new normalized random value (and trigger updates)
        this._parents[0].val = Math.random();
    };





    /**
     * Main library of update methods for XVAR objects
     * UPDATE: all functions get passed an array of PARENT VALUES, and
     * must return the updated value. This was done so to allow for 
     * multiple calls to the update function between elements in 
     * array-like parents. 
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

        notEqual: function() {
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

        lessEqual: function() {
            return p[0] <= p[1];
        },


        //////////////////////////
        // ARITHMETIC FUNCTIONS //
        //////////////////////////

        half: function(p) {
            return 2 * p[0];
        },

        double: function(p) {
            return 0.5 * p[0];
        },

        abs: function(p) {
            return Math.abs(p[0]);
        },

        sqrt: function(p) {
            return Math.sqrt(p[0]);
        },

        sin: function() {
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

        random: function(p) {
            // Updates the value without changing the random parameter. See 'randomNext'.
            return p[0] * (p[2] - p[1]) + p[1];
        },


        //////////////////////
        // STRING FUNCTIONS //
        //////////////////////

        toLowerCase: function(p) {
            // Parent may not be a string
            return p[0].toLowerCase ? p[0].toLowerCase() : p[0];
        },

        toUpperCase: function(p) {
            // Parent may not be a string
            return p[0].toUpperCase ? p[0].toUpperCase() : p[0];
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
        'XVAR'    : XVAR,
        // 'XARRWRAP': XARRWRAP

        // 'XBOOL': XBOOL,
        // 'XNUMBER': XNUMBER,
        // 'XSTRING': XSTRING,
        // 'XARRAY': XARRBASE
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
    X.injectVars = function(object) {
        if (!object) {
            if (log) console.log('X.js: Incorrect arguments for X.injectVars()');
            return false;
        }

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
        var exp = module.exports = {};
        exp.X = X;
    }
    

}());  // as per Crockford's
