(function () {

    var DEV = false;

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
    var build = function(TYPE, parents, update, customProps) {
        var obj = new _typeMap[TYPE]();
        
        // Add custom properties to object if applicable, and before any update
        if (customProps) {
            for (var prop in customProps) {
                if (customProps.hasOwnProperty(prop)) {
                    obj[prop] = customProps[prop];
                }
            }
        }

        obj._makeChildOfParents(parents);
        obj._update = _typeMap[TYPE]._updates[update];
        obj._updateParentArrayness();
        obj._matchUpdate();
        obj._updateValueType();
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
        this._jsType = 'null';
        this._isConstrained = true;
        this._wrappedSingleParent = false;

        this._hasArrayParent = false;  // is any of its parents' _value an array?
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
                elem._updateParentArrayness();
                elem._matchUpdate();  // includes an improved call to _update()
                elem._updateValueType();
                elem._updateChildren();
            });
        };

        // ADAPTED FROM BOTH XBASE AND XBASEARR
        this._makeChildOfParents = function(parents) {
            for (var l = parents.length, i = 0; i < l; i++) {
                var p = parents[i];
                if (!p || !p._xvar) p = wrap(p);  // if parent is undefined or if parent is not an XVAR, wrap it into one
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
            // console.log('_matchUpdate for ' + this._value);

            // it should be checked about here that parents are still arrays
            // and make wrapping arrangements if necessary

            // if parents are arrays
            if (this._hasArrayParent) {

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

                // Call _update passing extracted parent values according to matching pattern
                this._value = [];
                for (var i = 0; i < this._matchPattern.length; i++) {
                    // console.log('match update ' + i + ' with ' + this._matchPattern[i]);
                    var slice = this._parentSlice(this._matchPattern[i]);
                    // console.log(slice);
                    this._value.push(this._update(slice));
                }

            // if parents are singletons
            } else {
                // console.log('singleton');
                var slice = this._parentSlice();
                // console.log(slice);
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
        this._updateParentArrayness = function() {
            if (DEV) console.log('Updating parent arrayness for ' + this._value);

            // Once any of object's parents was ever an array, all parents are accessed
            // via an array wrapper, so there is no more need for this check 
            if (this._hasArrayParent) return;  

            // Check if any parent is array, and flag the element
            for (var i = 0; i < this._parents.length; i++) {
                // if (is(this._parents[i]._value).type('array')) {
                if (this._parents[i]._jsType === 'array') {
                    this._hasArrayParent = true;
                    break;
                }
            }

            // If no parent is array, we are good
            if (!this._hasArrayParent) return;

            // => DISABLED, was part of the attempt to regularize changing parents 
            // // TEMP sanity
            // if (this._parents[0]._type === 'XARRWRAP') return;

            // // Otherwise, some parent became array for the first time, and 
            // // we need to reparent this object to array wrappers

            // var oldParents = this._parents;
            // this._makeOrphan();  // remove links to parents, and from parents

            // var wrappedParents = [];
            // for (var l = oldParents.length, i = 0; i < l; i++) {
            //     //wrappedParents.push( build('XARRWRAP', [oldParents[i]], 'fromParent') );  // infinite loop!
            // };
            // this._makeChildOfParents(wrappedParents);


            // => THIS WAS MOVED TO _matchUpdate
            // // Checks if parents' lengths have remained constant, and otherwise 
            // // updates the matching pattern
            // // @TODO: this assumes all parents are arrays, will need to incorporate
            // //      a wrapping check
            // var lens = [];
            // for (var i = 0; i < this._parents.length; i++) {
            //     lens.push(this._parents[i]._value.length);  
            // }
            // if ( !is(lens).deepIdentical(this._parentsLengths) ) {
            //     this._parentsLengths = lens;
            //     this._updateMatchPattern();
            // }
        };

        this._updateValueType = function() {
            if (!is(this._value).type(this._jsType)) {
                this._jsType = dataType(this._value);
                if (DEV) console.log('Updated _jsType to ' + this._jsType + ' for ' + this._value);
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

        /**
         * Resets parent objects from this object, and removes this children 
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
                    this._jsType = dataType(this._value);
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











    // ██╗  ██╗ █████╗ ██████╗ ██████╗ ██╗    ██╗██████╗  █████╗ ██████╗ 
    // ╚██╗██╔╝██╔══██╗██╔══██╗██╔══██╗██║    ██║██╔══██╗██╔══██╗██╔══██╗
    //  ╚███╔╝ ███████║██████╔╝██████╔╝██║ █╗ ██║██████╔╝███████║██████╔╝
    //  ██╔██╗ ██╔══██║██╔══██╗██╔══██╗██║███╗██║██╔══██╗██╔══██║██╔═══╝ 
    // ██╔╝ ██╗██║  ██║██║  ██║██║  ██║╚███╔███╔╝██║  ██║██║  ██║██║     
    // ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     

    /**
     * An object wrapper to interface between a parent whose value maybe non/array
     * and a child that needs array parents. Tries to solve the problem of a nonarray
     * parent turning into one (and viceversa). 
     * @param {XVAR} value
     */
    var XARRWRAP = function(value) {
        XBASE.call(this, value);
        this._type = 'XARRWRAP';
        this._isConstrained = true;

        // Overrides _matchUpdate to simply set a new wrapped _value 
        this._matchUpdate = function() {
            this._value = this._parents[0]._jsType !== 'array' ?
                    [this._parents[0]._value] : 
                    this._parents[0]._value;
        };
    };

    var buildArrayChild = function(parent) {
        return build('XARRWRAP', arguments, 'fromParent');
    };

    XARRWRAP._updates = {

        // Dummy update (never used)
        // @deprecated
        fromParent: function(p) {
            return p[0];
        }
    };

    // DEBUG 
    X._wrapArr = function(target) {
        return buildArrayChild(target);
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

    // Implements String.slice()
    // Only works for strings right now, will do arrays in the future too
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice
    XVAR.prototype.slice = function(beginSlice, endSlice) {
        if (this._jsType !== 'string') {
            if (log) console.warn('X.js: XVAR.slice() only works with string parents at the time');
            return undefined;
        };

        // @TODO this should be optimized not to need to create dummy vars to fullfil this
        if (arguments.length == 0) return build('XVAR', [this, 0, this.length()], 'slice');
        if (arguments.length == 1) return build('XVAR', [this, beginSlice, this.length()], 'slice');
        if (arguments.length == 2) return build('XVAR', [this, beginSlice, endSlice], 'slice');
    };

    // Implements String.charAt()
    XVAR.prototype.charAt = function(index) {
        if (this._jsType !== 'string') {
            if (log) console.warn('X.js: XVAR.charAt() only works with string parents at the time');
            return undefined;
        };

        if (arguments.length != 1) {
            if (log) console.warn('X.js: Invalid arguments for XVAR.charAt()');
            return undefined;
        };

        return build('XVAR', [this, index], 'charAt');
    };

    // Implements String.replace()
    XVAR.prototype.replace = function(subStr, newSubStr) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Invalid arguments for XVAR.replace()');
            return undefined;
        };

        return build('XVAR', [this, subStr, newSubStr], 'replace');
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
        if (arguments.length > 2) {
            if (log) console.log("X.js: Invalid arguments for X.random()");
            return undefined;
        }

        if ( is(lim0).type('array') || is(lim1).type('array') ) {
            if (log) console.log("X.js: X.random() currently only accepts non-array arguments");
            return undefined;
        }

        var min, max;
        if (typeof lim1 !== 'undefined') {
            min = lim0;
            max = lim1;
        } else {
            min = 0;
            max = typeof lim0 !== 'undefined' ? lim0 : 1;
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


    X.compose = function() {
        var a = arguments, len = a.length;

        if (len < 2) {
            if (log) console.warn('X.js: invalid arguments for X.compose()');
            return undefined;
        };

        var callback = a[len - 1];
        if ( !is(callback).type('function') ) {
            if (log) console.warn('X.js: last argument must be an update function for X.compose()');
            return undefined;
        };

        var parents = [];
        for (var i = 0; i < len - 1; i++) {
            parents.push(a[i]);
        };

        // @TODO: it is not elegant that the custom update function is not registered
        // as a parent. This should be fixed when the arrayParenthood problem is fixed.
        return build('XVAR', parents, 'compose', {
            _customUpdate: callback
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
     * Creates an array like numeric series of 'count' steps 
     * between 'start' and 'end'
     */
    X.range = function(count, start, end) {
        if (arguments.length != 3) {
            if (log) console.log("X.js: Invalid arguments for X.range()");
            return undefined;
        }

        return build('XVAR', arguments, 'range');
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

        random: function(p) {
            // Updates the value without changing the random parameter. See 'randomNext'.
            return p[0] * (p[2] - p[1]) + p[1];
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
                    p[0].slice(p[1], p[2]) : p[0];
        },

        charAt: function(p) {
            return typeof p[0].charAt !== 'undefined' ? 
                    p[0].charAt(p[1]) : '';
        },

        replace: function(p) {
            return typeof p[0].replace !== 'undefined' ? 
                    p[0].replace(p[1], p[2]) : p[0];
        },


        ////////////////////
        // MISC FUNCTIONS //
        ////////////////////

        // @TODO: it is not elegant that the custom update function is not registered
        // as a parent. This should be fixed when the arrayParenthood problem is fixed.
        compose: function(p) {
            return this._customUpdate(p);
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
        'XARRWRAP': XARRWRAP
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
        var exp = module.exports = {};
        exp.X = X;
    }
    

}());  // as per Crockford's
