
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
        this._value = value;
        this._type = 'XWRAP';
        this._isConstrained = false;
    };
    XWRAP.prototype = Object.create(XBASE.prototype);
    XWRAP.prototype.constructor = XWRAP;

    var wrap = function(value){
        return new XWRAP(value);
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
        var init = Number(value);  // Hard casting of input arg, true to JS default behaviors. If no arg is passed, will default to false.
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
        'XBOOL': XBOOL,
        'XNUMBER': XNUMBER
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




    // // ██╗   ██╗████████╗██╗██╗     ███████╗
    // // ██║   ██║╚══██╔══╝██║██║     ██╔════╝
    // // ██║   ██║   ██║   ██║██║     ███████╗
    // // ██║   ██║   ██║   ██║██║     ╚════██║
    // // ╚██████╔╝   ██║   ██║███████╗███████║
    // //  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝
    // var util = {

    //     /**
    //      * Underscore's implementation of _.isNull
    //      * @param  {Object}  obj
    //      * @return {Boolean}
    //      */
    //     isNull: function(obj) {
    //         return obj === null;
    //     },

    //     /**
    //      * Underscore's implementation of _.isUndefined
    //      * @param  {Object}  obj
    //      * @return {Boolean}
    //      */
    //     isUndefined: function(obj) {
    //         return obj === void 0;
    //     },

    //     /**
    //      * Underscore's implementation of _.isBoolean
    //      * @param  {Object}  obj
    //      * @return {Boolean}
    //      */
    //     isBoolean: function(obj) {
    //         return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    //     },

    //     /**
    //      * Underscore's implementation of _.isNumber
    //      * @param  {Object}  obj
    //      * @return {Boolean}
    //      */
    //     isNumber: function(obj) {
    //         return toString.call(obj) === '[object Number]';
    //     },

    //     *
    //      * Underscore's implementation of _.isNaN (NaN is the only number that doesn't equal itself!)
    //      * @param  {Object}  obj
    //      * @return {Boolean}
         
    //     isNaN: function(obj) {
    //         return this.isNumber(obj) && obj !== +obj;
    //     },

    //     /**
    //      * Underscore's implementation of _.isFinite
    //      * @param  {Object}  obj
    //      * @return {Boolean}
    //      */
    //     isFinite: function(obj) {
    //         return isFinite(obj) && !isNaN(parseFloat(obj));
    //     },

    //     /**
    //      * Underscore's implementation of _.isFunction
    //      * @param {Object}
    //      * @return {Boolean}
    //      */
    //     isFunction: function(obj) {
    //         return toString.call(obj) === '[object Function]';
    //     },

    //     /**
    //      * Underscore's implementation of _.isArray
    //      * @param {Object}
    //      * @return {Boolean}
    //      */
    //     isArray: function(obj) {
    //         // first try ECMAScript 5 native
    //         if (Array.isArray) return Array.isArray(obj);

    //         // else compare array
    //         return toString.call(obj) === '[object Array]';
    //     },

    //     /**
    //      * Underscore's implementation of _.isString
    //      * @param  {Object}  obj 
    //      * @return {Boolean}
    //      */
    //     isString: function(obj) {
    //         return toString.call(obj) === '[object String]';
    //     }

    // };

    // X.util = util;


    
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



