
(function () {

    var DEV = true;

    //  ██████╗ ██████╗ ██████╗ ███████╗
    // ██╔════╝██╔═══██╗██╔══██╗██╔════╝
    // ██║     ██║   ██║██████╔╝█████╗  
    // ██║     ██║   ██║██╔══██╗██╔══╝  
    // ╚██████╗╚██████╔╝██║  ██║███████╗
    //  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝

    // The object containing the public accessors
    var X = {};

    // Current context (window, module, global object, etc.)
    var context = this;

    // All created XVARS
    var elements = [];
    if (DEV) X._elements = elements;  // accessor alias

    // Set how verbose is X.js
    var log = 1;
    X.setLogLevel = function(value) {
        if (arguments.length == 0) return log;
        log = value;
    };

    // A generic constructor interface to create XVARs with type, args and update function name
    var build = function(TYPE, parents, update) {
        var obj = new _typeMap[TYPE]();
        obj._makeChildOfParents(parents);
        obj._update = _typeMap[TYPE]._updates[update];
        obj._update();
        return obj;
    };

    // Checks if this object has only one wrapped parent
    var checkConstrainedParenthood = function(obj) {
        if (obj._parents.length == 1 && obj._parents[0]._type == 'XWRAP') {
            obj._isConstrained = false;
            obj._wrappedSingleParent = true;
        }
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
        this._value = value;
        this._parents = [];
        this._children = [];
        this._xvar = true;
        this._name = '';
        this._type = 'XBASE';
        this._isConstrained = true;
        this._wrappedSingleParent = false;

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
                if (log) console.log('DEBUG: updating "' + elem._name + '"');
                elem._update();
                elem._updateChildren();
            });
        };

        this._makeChildOfParents = function(parents) {
            for (var l = parents.length, i = 0; i < l; i++) {
                var p = parents[i];
                if (!p._xvar) p = wrap(p);  // if parent is not an XVAR, wrap it into one
                this._parents.push(p);
                p._children.push(this);
            }
            checkConstrainedParenthood(this);
        };

        this._update = function() {};  // to be overriden

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








    // A generic constructor interface to create XVARs with type, args and update function name
    var buildARR = function(TYPE, parents, update) {
        var obj = new _typeMap[TYPE]();
        obj._makeChildOfParents(parents);
        obj._update = _typeMap[TYPE]._updates[update];

        // // check if any parent is array, and flag the element
        // for (var i = 0; i < parents.length; i++) {
        //     if (is(parents[i]._value).type('array')) {
        //         obj._isArray = true;
        //         break;
        //     }
        // }
        obj._updateArrayness();

        obj._matchUpdate();
        return obj;
    };

    // Checks if this object has only one wrapped parent
    var checkConstrainedParenthoodArr = function(obj) {
        if (obj._parents.length == 1 && obj._parents[0]._type == 'XARRWRAP') {
            obj._isConstrained = false;
            obj._wrappedSingleParent = true;
        }
    };





    var XARRBASE = function(value) {
        XBASE.call(this, value);
        this._type = 'XARRBASE';

        this._isArray = false;
        this._parentsLengths = [];
        this._matchPatternType = 'longest-list';  // will add shortest list, cross reference, etc.
        this._matchPattern = [];  // an array with indices representing the match pattern

        // quasi-private methods
        this._updateChildren = function() {
            this._children.forEach(function(elem) {
                if (log) console.log('DEBUG: updating "' + elem._name + '"');
                // elem._update();
                elem._updateArrayness();
                elem._matchUpdate();  // includes an improved call to _update()
                elem._updateChildren();
            });
        };

        this._makeChildOfParents = function(parents) {
            for (var l = parents.length, i = 0; i < l; i++) {
                var p = parents[i];
                if (!p._xvar) p = wrapArr(p);  // if parent is not an XVAR, wrap it into one
                this._parents.push(p);
                p._children.push(this);
            }
            checkConstrainedParenthoodArr(this);
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
                    // var slice = this._parentSlice(i);
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

        // to be overriden
        this._update = function(parents) {
            return this._value;
        };  

        // returns an array with the _value prop of the _parents objs for specified indexArray (pattern matching)
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
                        // patt.push(i > this._parents[j]._value.length - 1 ? 
                        //         this._parents[j]._value.length - 1 : i);
                        patt.push(i);
                    }
                    this._matchPattern.push(patt);
                };
                return true;
            };

        };

    };
    XARRBASE.prototype = Object.create(XBASE.prototype);
    XARRBASE.prototype.constructor = XARRBASE;

    XARRBASE.prototype = {
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
                    // this._updateArrayness();
                    // this._matchUpdate();
                    this._updateChildren();
                }
            }
        }
    };

    XARRBASE.prototype.setMatchingPattern = function(matchType) {
        if (!_matchTypesAvailable[matchType]) {
            if (log) console.warn('X.js: unrecognized matching pattern type for XARRBASE.setMatchingPattern()');
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




    X.array = function(value) {
        if (DEV) console.log('Creating XARRAY with value ' + value);

        if (arguments.length != 1) {
            if (log) console.warn('X.js: invalid arguments for X.array()');
            return undefined;
        };

        var obj = buildARR('XARRAY', arguments, 'fromValue');

        return obj
    };

    X.array.add = function() {
        return buildARR('XARRAY', arguments, 'add');
    };




    /**
     * Main library of update methods for XARRAY objects
     * @type {Object}
     */
    XARRBASE._updates = {

        // NEW: gets passed an array of parent values, no need for _value accessor
        fromValue: function(parents) {
            return parents[0];
        },

        add: function(p) {
            var sum = p[0];  // also sets initial type
            for (var i = 1; i < p.length; i++) {
                sum += p[i];
            }
            return sum;
        }

    }; 





    var XARRWRAP = function(value) {
        XARRBASE.call(this, value);
        this._type = 'XARRWRAP';
        this._isConstrained = false;
    };
    XARRWRAP.prototype = Object.create(XARRBASE.prototype);
    XARRWRAP.prototype.constructor = XARRWRAP;

    var wrapArr = function(value){
        return new XARRWRAP(value);
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



    X.xvar = function(value) {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: invalid arguments for X.xvar()');
            return undefined;
        };

        return build('XVAR', arguments, 'fromValue');
    };

    X.xvar.compose = function() {
        var a = arguments, len = a.length;

        if (len < 2) {
            if (log) console.warn('X.js: invalid arguments for X.xvar.compose()');
            return undefined;
        };

        var callback = a[len - 1];
        if ( is(callback).notType('function') ) {
            if (log) console.warn('X.js: last argument must be a function for X.xvar.compose()');
            return undefined;
        };

        var parents = [callback];
        // parents.push(this);  // store current context as parent?
        for (var i = 0; i < len - 1; i++) {
            parents.push(a[i]);
        }

        return build('XVAR', parents, 'compose');
    };



    /**
     * Main library of update methods for XVAR objects
     * @type {Object}
     */
    XVAR._updates = {

        fromValue: function() {
            this._value = this._parents[0]._value;  // retrieve from wrapped parent
        },

        compose: function() {
            // Call the update callback on the context it was created with scoped vars.
            // Instead of using the global context, would it be better to store it as parent
            // when object is composed?
            this._value = this._parents[0]._value.apply(context, this._parents.slice(1));
        }

    };













    // ██╗  ██╗██████╗  ██████╗  ██████╗ ██╗     
    // ╚██╗██╔╝██╔══██╗██╔═══██╗██╔═══██╗██║     
    //  ╚███╔╝ ██████╔╝██║   ██║██║   ██║██║     
    //  ██╔██╗ ██╔══██╗██║   ██║██║   ██║██║     
    // ██╔╝ ██╗██████╔╝╚██████╔╝╚██████╔╝███████╗
    // ╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝

    var XBOOL = function(value) {
        var init = Boolean(value);  // Hard casting of input arg, true to JS default behaviors. If no arg is passed, will default to false.
        XBASE.call(this, init);
        this._type = 'XBOOL';
    };
    XBOOL.prototype = Object.create(XBASE.prototype);
    XBOOL.prototype.constructor = XBOOL;

    // Prototype methods
    XBOOL.prototype.not = function() {
        return this._properties['not'] ? 
                this._properties['not'] :
                this._register('not', build('XBOOL', [this], 'not'));
    };

    /**
     * Main factory constructor from simple input value
     * @param {object}
     * @return {XBOOL}
     */
    X.bool = function() {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: invalid arguments for X.bool()');
            return undefined;
        };

        return build('XBOOL', arguments, 'fromValue');
    };
    X.boolean = X.bool;  // an alias

    /**
     * Returns simple chained && of objects' "truthiness" 
     * @param  {...object} arguments
     * @return {XBOOL}
     */
    X.bool.and = function() {
        return build('XBOOL', arguments, 'and');
    };

    /**
     * Returns simple chained && of objects' "truthiness" 
     * @param  {...object} arguments
     * @return {XBOOL}
     */
    X.bool.or = function() {
        return build('XBOOL', arguments, 'or');
    };

    /**
     * Returns true if all operands are equal to each other via native '=='
     * @param {...object} arguments
     * @return {XBOOL}
     */
    X.bool.equal = function() {
        if (arguments.length < 2) {
            if (log) console.warn('X.js: Must pass at least two arguments to X.bool.equal()');
            return undefined;
        }
        return build('XBOOL', arguments, 'equal');
    };

    /**
     * Returns true if all operands are not equal to each other via native '!='
     * @param {...object} arguments     
     * @return {XBOOL}
     */
    X.bool.notEqual = function() {
        if (arguments.length < 2) {
            if (log) console.warn('X.js: Must pass at least two arguments to X.bool.notEqual()');
            return undefined;
        }
        return build('XBOOL', arguments, 'notEqual');
    };

    /**
     * Implements simple 'A > B' 
     * @return {XBOOL}
     */
    X.bool.greater = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.bool.greater()');
            return undefined;
        }
        return build('XBOOL', arguments, 'greater');
    };

    /**
     * Implements simple 'A >= B' 
     * @return {XBOOL} 
     */
    X.bool.greaterEqual = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.bool.greaterEqual()');
            return undefined;
        }
        return build('XBOOL', arguments, 'greaterEqual');
    };

    /**
     * Implements simple 'A < B' 
     * @param  {object} A
     * @param  {object} B
     * @return {XBOOL}
     */
    X.bool.less = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.bool.less()');
            return undefined;
        }
        return build('XBOOL', arguments, 'less');
    };

    /**
     * Implements simple 'A <= B' 
     * @param  {object} A
     * @param  {object} B
     * @return {XBOOL}
     */
    X.bool.lessEqual = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: Must pass exactly two arguments to X.bool.lessEqual()');
            return undefined;
        }
        return build('XBOOL', arguments, 'lessEqual');
    };


    /**
     * Main library of update methods for XBOOL objects
     * @type {Object}
     */
    XBOOL._updates = {

        fromValue: function() {
            this._value = this._parents[0]._value;  // retrieve from wrapped parent
        },

        not: function() {
            this._value = !this._parents[0]._value;
        },

        and: function() {
            for (var len = this._parents.length, i = 0; i < len; i++) {
                if (!this._parents[i]._value) {
                    this._value = false;
                    return;
                }
            }
            this._value = true;
        },

        or: function() {
            for (var len = this._parents.length, i = 0; i < len; i++) {
                if (this._parents[i]._value) {
                    this._value = true;
                    return;
                }
            }
            this._value = false;
        },

        equal: function() {
            for (var len = this._parents.length - 1, i = 0; i < len; i++) {
                if (this._parents[i]._value != this._parents[i+1]._value) {
                    this._value = false;
                    return;
                }
            }
            this._value = true;
        },

        notEqual: function() {
            // pyramidal match without self-check 
            for (var len = this._parents.length, i = 0; i < len - 1; i++) {
                for (var j = i + 1; j < len; j++) {
                    if (this._parents[i]._value == this._parents[j]._value) {
                        this._value = false;
                        return;
                    }
                }
            }
            this._value = true;
        },

        greater: function() {
            this._value = this._parents[0]._value > this._parents[1]._value;
        },

        greaterEqual: function() {
            this._value = this._parents[0]._value >= this._parents[1]._value;
        },

        less: function() {
            this._value = this._parents[0]._value < this._parents[1]._value;
        },

        lessEqual: function() {
            this._value = this._parents[0]._value <= this._parents[1]._value;
        }
    };
















    // ██╗  ██╗███╗   ██╗██╗   ██╗███╗   ███╗██████╗ ███████╗██████╗ 
    // ╚██╗██╔╝████╗  ██║██║   ██║████╗ ████║██╔══██╗██╔════╝██╔══██╗
    //  ╚███╔╝ ██╔██╗ ██║██║   ██║██╔████╔██║██████╔╝█████╗  ██████╔╝
    //  ██╔██╗ ██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗
    // ██╔╝ ██╗██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██████╔╝███████╗██║  ██║
    // ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝

    var XNUMBER = function(value) {
        var init = Number(value);  // Hard casting of input arg, true to JS default behaviors. If no arg is passed, will default to NaN.
        XBASE.call(this, init);
        this._type = 'XNUMBER';
    };
    XNUMBER.prototype = Object.create(XBASE.prototype);
    XNUMBER.prototype.constructor = XNUMBER;

    var XNUMBER_METHODS = [
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
        'toRadians'
    ];

    XNUMBER_METHODS.forEach(function(prop) {
        XNUMBER.prototype[prop] = function() {
            return this._properties[prop] ?
                    this._properties[prop] :
                    this._register(prop, build('XNUMBER', [this], prop));
        };
    })


    /**
     * Main factory constructor from simple input value
     * @return {XNUMBER}
     */
    X.number = function() {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: invalid arguments for X.number()');
            return undefined;
        };

        return build('XNUMBER', arguments, 'fromValue');
    };
    X.num = X.number;  // an alias


    X.number.add = function() {
        if (arguments.length < 2) {
            if (log) console.log("X.js: Invalid arguments for X.number.add()");
            return undefined;
        }
        return build('XNUMBER', arguments, 'add');
    };

    X.number.subtract = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.number.subtract()");
            return undefined;
        }
        return build('XNUMBER', arguments, 'subtract');
    };

    X.number.multiply = function() {
        if (arguments.length < 2) {
            if (log) console.log("X.js: Invalid arguments for X.number.multiply()");
            return undefined;
        }
        return build('XNUMBER', arguments, 'multiply');
    };

    X.number.divide = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.number.divide()");
            return undefined;
        }
        return build('XNUMBER', arguments, 'divide');
    };

    X.number.modulo = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.number.modulo()");
            return undefined;
        }
        return build('XNUMBER', arguments, 'modulo');
    };

    X.number.pow = function(A, B) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.number.pow()");
            return undefined;
        }
        return build('XNUMBER', arguments, 'pow');
    };

    X.number.atan2 = function(Y, X) {
        if (arguments.length != 2) {
            if (log) console.log("X.js: Invalid arguments for X.number.atan2()");
            return undefined;
        }
        return build('XNUMBER', arguments, 'atan2');
    };

    /**
     * Create a pseudo-random number generator with associative limits, 
     * binding a .next() method to trigger random update.
     * Influenced by C#'s Random Class
     * @param  {object} min lower limit (optional)
     * @param  {object} max upper limit (optional)
     * @return {XNUMBER}
     */
    X.number.random = function(lim0, lim1) {
        var min, max;
        if (typeof lim1 === 'undefined') {
            min = 0;
            max = typeof lim0 === 'undefined' ? 1 : lim0;
        } else {
            min = lim0;
            max = lim1;
        }

        // Create the object and bind a .next() method to get new values
        var ran = build('XNUMBER', [Math.random(), min, max], 'random');
        ran['next'] = XNUMBER._updates.randomNext;

        return ran;
    };




    /**
     * Main library of update methods for XNUMBER objects
     * @type {Object}
     */
    XNUMBER._updates = {

        fromValue: function() {
            this._value = this._parents[0]._value;  // retrieve from wrapped parent
        },


        half: function() {
            this._value = this._parents[0]._value / 2;
        },

        double: function() {
            this._value = 2 * this._parents[0]._value;
        },

        abs: function() {
            this._value = Math.abs(this._parents[0]._value);
        },

        sqrt: function() {
            this._value = Math.sqrt(this._parents[0]._value);
        },

        sin: function() {
            this._value = Math.sin(this._parents[0]._value);
        },

        cos: function() {
            this._value = Math.cos(this._parents[0]._value);
        },

        tan: function() {
            this._value = Math.tan(this._parents[0]._value);
        },

        round: function() {
            this._value = Math.round(this._parents[0]._value);
        },

        floor: function() {
            this._value = Math.floor(this._parents[0]._value);
        },

        ceil: function() {
            this._value = Math.ceil(this._parents[0]._value);
        },

        toDegrees: function() {
            this._value = this._parents[0]._value * 180 / Math.PI;
        },

        toRadians: function() {
            this._value = this._parents[0]._value * Math.PI / 180;
        },


        add: function() {
            this._value = 0;
            for (var len = this._parents.length, i = 0; i < len; i++) {
                this._value += this._parents[i]._value;
            }
        },

        subtract: function() {
            this._value = this._parents[0]._value - this._parents[1]._value;
        },

        multiply: function() {
            this._value = this._parents[0]._value;
            for (var len = this._parents.length, i = 1; i < len; i++) {
                this._value *= this._parents[i]._value;
            }
        },

        divide: function() {
            this._value = this._parents[0]._value / this._parents[1]._value;
        },

        modulo: function() {
            this._value = this._parents[0]._value % this._parents[1]._value;
        },

        pow: function() {
            this._value = Math.pow(this._parents[0]._value, this._parents[1]._value);
        },

        atan2: function() {
            this._value = Math.atan2(this._parents[0]._value, this._parents[1]._value);  // inputs were in the form (Y, X)
        },

        random: function() {
            // Updates the value without changing the random parameter. See 'randomNext'
            this._value = this._parents[0]._value * (this._parents[2]._value - this._parents[1]._value)
                    + this._parents[1]._value;
        },

        randomNext: function() {
            // Uses parent setter to generate a new normalized random value (and trigger updates)
            this._parents[0].val = Math.random();
        }

    };





























    // ██╗  ██╗███████╗████████╗██████╗ ██╗███╗   ██╗ ██████╗ 
    // ╚██╗██╔╝██╔════╝╚══██╔══╝██╔══██╗██║████╗  ██║██╔════╝ 
    //  ╚███╔╝ ███████╗   ██║   ██████╔╝██║██╔██╗ ██║██║  ███╗
    //  ██╔██╗ ╚════██║   ██║   ██╔══██╗██║██║╚██╗██║██║   ██║
    // ██╔╝ ██╗███████║   ██║   ██║  ██║██║██║ ╚████║╚██████╔╝
    // ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 

    var XSTRING = function(value) {
        var init = String(value);  // Hard casting of input arg, true to JS default behaviors. If no arg is passed, will default to "undefined".
        XBASE.call(this, init);
        this._type = 'XSTRING';
    };
    XSTRING.prototype = Object.create(XBASE.prototype);
    XSTRING.prototype.constructor = XSTRING;

    var XSTRING_METHODS = [
        'toLowerCase',
        'toUpperCase'
    ];

    XSTRING_METHODS.forEach(function(prop) {
        XSTRING.prototype[prop] = function() {
            return this._properties[prop] ?
                    this._properties[prop] :
                    this._register(prop, build('XSTRING', [this], prop));
        };
    });

    XSTRING.prototype.slice = function(start, end) {
        if (arguments.length < 1 || arguments.length > 2) {
            if (log) console.warn('X.js: invalid arguments for XSTRING.slice()');
            return undefined;
        };

        var args = [this];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        return build('XSTRING', args, 'slice');
    };

    XSTRING.prototype.charAt = function(position) {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: invalid arguments for XSTRING.charAt()');
            return undefined;
        };

        return build('XSTRING', [this, position], 'charAt');
    };

    XSTRING.prototype.replace = function(subStr, newSubStr) {
        if (arguments.length != 2) {
            if (log) console.warn('X.js: invalid arguments for XSTRING.replace()');
            return undefined;
        };

        return build('XSTRING', [this, subStr, newSubStr], 'replace');
    };



    /**
     * Main factory constructor from simple input value
     * @return {XNUMBER}
     */
    X.string = function() {
        if (arguments.length != 1) {
            if (log) console.warn('X.js: invalid arguments for X.string()');
            return undefined;
        };

        return build('XSTRING', arguments, 'fromValue');
    };
    X.str = X.string;  // an alias


    X.string.concat = function() {
        return build('XSTRING', arguments, 'concat');
    };




    /**
     * Main library of update methods for XSTRING objects
     * @type {object}
     */
    XSTRING._updates = {

        fromValue: function() {
            this._value = this._parents[0]._value;  // retrieve from wrapped parent
        },


        toLowerCase: function() {
            this._value = this._parents[0]._value.toLowerCase();
        },

        toUpperCase: function() {
            this._value = this._parents[0]._value.toUpperCase();
        },

        slice: function() {
            this._value = this._parents[0]._value.slice(this._parents[1]._value, 
                    this._parents[2] ? this._parents[2]._value : undefined);
        },

        charAt: function() {
            this._value = this._parents[0]._value.charAt(this._parents[1]._value);       
        },

        replace: function() {
            this._value = this._parents[0]._value.replace(this._parents[1]._value, this._parents[2]._value);
        },


        concat: function() {
            this._value = "";
            for (var len = this._parents.length, i = 0; i < len; i++) {
                this._value += this._parents[i]._value;
            }
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
        'XVAR': XVAR,
        'XBOOL': XBOOL,
        'XNUMBER': XNUMBER,
        'XSTRING': XSTRING,
        'XARRAY': XARRBASE
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



