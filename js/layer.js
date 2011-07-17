var _ = {};
var exports; if(exports) _ = exports;

var TESTING = false;
// Just in case
if(Object.create === undefined || TESTING) {
  Object.create = function(proto) {
    function _() {};
    _.prototype = proto;
    return new _;
  };
}

if(Object.getPrototypeOf === undefined || TESTING) {
  Object.getPrototypeOf = function(obj) {
    return obj.__proto__ || obj.constructor.prototype;
  };
}

if(Object.freeze === undefined || TESTING) {
  Object.freeze = function(obj) {
    return obj;
  };
}

if(Object.isFrozen === undefined || TESTING) {
  Object.isFrozen = function(obj) {
    return false;
  };
}

if(Object.keys === undefined || TESTING) {
  Object.keys = function(obj) {
    var result = [];
    for(var k in obj) if(Object.prototype.hasOwnProperty.call(obj, k)) {
      result.push(k);
    }
    return k;
  };
}

if(Object.getOwnPropertyNames === undefined || TESTING) {
  Object.getOwnPropertyNames === Object.keys;
}

if(!Function.prototype.bind || TESTING) {
  Function.prototype.bind = function(self) {
    var fn = this;
    var args = __args();
    return function() { 
      return fn.apply(self || null, args.concat(__args())); 
    };
  };
}

if(!Object.hasOwnProperty.call((function() {return this;})(), 'console')) {
  console = {
    log: function() {},
    warn: function() {},
    error: function() {},
    info: function() {},
    assert: function(t, msg) { 
      if(!t) { 
        alert("assertion failed: " + msg); 
        throw new Error('assert failed'); 
      } 
    }
  };
}

// Function: __args
// Extends javascript with something nice.
// __args() evaluates to the Array of arguments passed to a function
// after the named args.
__args = _._args = function __args() { 
  var caller = __args.caller;
  return Array.prototype.slice.call(caller.arguments, caller.length); 
};

_.is_object = function(thing) {
  return typeof thing === 'object' && thing instanceof Object;
};

_.is_primitive = function(thing) {
  return thing === null || thing === undefined || (Object(thing) !== thing && Object(thing).valueOf() === thing);
};

// Function: _.extend
// overlay maps, but on collisions: concatenates arrays, and combines functions, recursively.
// applies to the first argument, which is returned.
_.extend = function(base) {
  _.each(__args(), function(map) {
    _.each(map, function(value, key) {
      if(key in base) {
        var base_value = base[key];
        if(base_value instanceof Array && value instanceof Array) {
          Array.prototype.push.apply(base_value, value);
        } else if(typeof base_value === 'function' && typeof value === 'function') {
          base[key] = function() { 
            var result = base_value.apply(this, arguments); 
            return value.apply(this, arguments) || result; 
          };
        } else if(_.is_object(base_value) && _.is_object(value)) {
          _.extend(base_value, value);
        } else {
          base[key] = value;
        }
      } else base[key] = value;
    });
  });
  return base;
}

// Function: _.overlay
// First argument: map to overlay
// Additional arguments: copies them to map, 
// using a for..in loop.
_.overlay = function(base) {
  _.each(__args(), function(map) {
    _.each(map, function(value, key) {
      base[key] = value;
    });
  });
  return base;
};

// Function: _.override
// Returns an object with data shadowed.
_.override = function(base) {
  return _.overlay.apply(null, [Object.create(base)].concat(__args()));
};

// Function: _.constant
// returns a constant function which returns the first argument to _.constant
_.constant = function(x) { return function() { return x; } };

// Function: _.identity
// is a function that returns its first argument
_.identity = function(x) { return x; };

// Function: _.access
// _.access('.x.y', { x: { y: 10 } }) returns 10, ok?
// access uses the proxy layer (x._('y') instead of x.y)
// because the path is not guaranteed to be valid.
_.access = function(path, root) {
  if(typeof path === 'function') return path.call(this, root);
  var parts = path.slice(1).split('.');

  if(parts.length == 1 && parts[0] == '') {
    parts = [];
  }

  var last_part = '.';
  if(parts.length == 0) return root;
  _.each(parts.slice(0,-1), function(part) {
    if(!(part in root)) root = root[part] = {};
    else root = root[part];
  });
  var final_part = parts.slice(-1)[0];
  if(!final_part || !root) debugger;
  var value = root[final_part];
  if(arguments.length > 2 && root) {
    value = root[final_part] = arguments[2];
  }
  return value;
}

// Function: _.each
// applies action to each element of the list.
// To change the this context of _.each, just _.each.call(self, ...).
_.each = function(list, action) {
  if(_.either(function() { 'length' in list; }).error) debugger;
  if('length' in list) {
    var length = list.length;
    for(var i = 0; i < length; i++) {
      action.call(this, list[i], i);
    }
  } else for(var k in list) {
    action.call(this, list[k], k);
  }
  return list;
}

// Function: _.keys
// returns the property names of an object, using for..in.
// other (built-in) options are Object.keys() (only own properties),
// or Object.getOwnPropertyNames() (own properties, including non-enumerable ones).
_.keys = function(thing) {
  var keys = [];
  for(var k in thing) keys.push(k);
  return keys;
}

// Function: _.map
// Like _.each, but returns a list/map after being filtered with action.
// throw 'reject' to remove elements from the result set, otherwise expect a map
// with a bunch of undefined.
_.map = function(list, action) {
  if(typeof action === 'string') {
    action = _.access.bind(null, action);
  } else if(typeof action != 'function') {
    action = _.identity;
  }
  if('length' in list) {
    var result = [],
        length = list.length;
    for(var i = 0; i < length; i++) {
      try {
        result.push(action.call(this, list[i], i));
      } catch(ex) {
        if(ex !== 'reject') {
          debugger;
          throw ex;
        }
      }
    }
    return result;
  } else {
    var result = {};
    for(var k in list) {
      try {
        result[k] = action.call(this, list[k], k);
      } catch(ex) {
        if(ex !== 'reject') {
          debugger;
          throw ex;
        }
      }
    }
    return result;
  }
};

// Function: _.noop.
// Stub function, doesn't do anything.
_.noop = function() {};

// Function: range
// sort of _.map([start...end], fn).
// fn can be omitted, defaults to _.identity,
// start can be omitted, defaults to 0.
_.range = function(start, end, fn) {
  if(typeof end != 'number') { fn = end; end = start; start = 0; }
  if(typeof fn !== 'function') fn = _.identity;
  var result = [];
  for(var i = start; i < end; i++) {
    result.push(fn.call(this, i));
  }
  return result;
};

// Function: _.build
// Builds a map from a property list of k,v,k,v,k,v... pairs.
// Sub-lists are interpreted as sub-maps.
// Single elements are returned as-is.
// So... _.build('a', 'b', 'c', 'd') returns { a: 'b', c: 'd' }. (normal case)
// So... _.build('a', ['b']) returns { a: 'b' }. (single element returned as-is)
// So... _.build('a', [['b']]) returns { a: ['b'] }. (single element returned as-is)
// So... _.build('a', [[['b']]]) returns { a: [['b']] }. (single element returned as-is, got it?)
// So... _.build('a', ['b', 'c']) returns { a: { b: 'c' } }. (sub list) 
// but... _.build('a', [['b', 'c']]) returns { a: ['b','c'] }.  (single element returned as-is?)
_.build = function() {
  if(arguments.length == 1) {
    return arguments[0];
  } else {
    var result = {};
    for(var i = 0; i < arguments.length - 1; i += 2) {
      var key = arguments[i];
      var value = arguments[i+1];
      if(value instanceof Array) {
        value = _.build.apply(null, value);
      }
      result[key] = value;
    }
    return result;
  }
}

// Function: _.either(fn, ...)
// returns { result: ... } or { error: ... }.
_.either = function(fn) {
  try {
    return { result: fn.apply(this, __args()) };
  } catch(ex) {
    return { error: ex };
  }
}

_.result = function(fn) {
  return function() {
    try { return fn.apply(this, arguments); }
    catch(ex) { return ex; }
  };
}

_.list = function(map, fn) {
  var result = [];
  if(!fn) fn = function(value, key) { return [key,value]; };
  for(var i in map) {
    try {
      result.push(fn.call(this, map[i], i)) 
    } catch(ex) {
      if(ex != 'reject') { 
        debugger;
        throw ex;
      }
    }
  }
  return result;
};

_.deepfreeze = function(obj) {
  if(undefined == obj) debugger;
  return Object.freeze(Object.create(_.map(obj, function(property) {
    if(_.is_object(property)) return _.deepfreeze(property);
    return property;
  })));
};

_.copy = function(obj) {
  return _.map(obj, function(property) {
    if(_.is_object(property)) return _.copy(property);
    else return property;
  });
};

_.until = function(list, fn) {
  for(var key in list) {
    var result = fn.call(this, list[key], key);
    if(result !== undefined) return result;
  }
};

_.profile = function(name, fn) {
  console.profile(name);
  try {
    return fn.apply(this, __args());
  } finally {
    console.profileEnd();
  }
};

_.Class = function(init, options) {
  if(typeof init !== 'function') { options = init; init = options.init; }
  return _.defineClass(init || function(){}, options.base, options.proto, options.classic);
};

_.defineClass = function(klass, base, proto, statik) {
  var name = ((proto || {})._ || {}).name || (klass || function(){}).name;
  var Class = Function('klass', 'base', _.evil_format(
    "return function %{name}() {                             " +
    "  var self = this;                                      " +
    "  if(!(self instanceof klass)) {                        " +
    "    self = Object.create(klass.prototype);              " +
    "  }                                                     " +
    (base ? "  if(base) base.apply(self, arguments);                 " : "") +
    "  var result = klass.apply(self, arguments);            " +
    "  if(result && result instanceof Object) return result; " +
    "  return self;                                          " +
    "};"
  , { name: name }))(klass, base);

  try {
    Class.prototype 
      = klass.prototype 
      = Object.create((base || Object).prototype);
  } catch(ex) {
    debugger;
  }

  klass.prototype.constructor = klass;
  _.overlay(klass.prototype, proto || {});
  klass.__proto__ = Class;

  Class.toString = _.constant("function " + name + "(...) { ... }");
  if(statik) {
    _.overlay(Class, statik);
    _.overlay(klass, statik);
  }
  return Class;
};

_.deprecated = function(name, message) {
  try { throw new Error(); }
  catch(error) {
    console.warn('%o is deprecated (%o) %o',
      name,
      message,
      error.stack
    );
    debugger;
  }
};

_.local = function(data, func) {
  if(arguments.length < 2) data = {};
  var global = this;
  return function() {
    var backup = {};
    var undef = {};
    try {
      for(var key in data) try { 
        backup[key] = Object.prototype.hasOwnProperty.call(global, key) 
          ? global[key]
          : undef;
        global[key] = data[key];
      } catch(ex) {}
      return func.apply(this, arguments);
    } finally {
      for(var key in backup) try {
        if(backup[key] === undef) delete global[key];
        else global[key]= backup[key];
      } catch(ex) {}
    }
  }
}

_.join = function(thing, how) {
  if(!thing || !(thing instanceof Object)) return thing;
  var mortar = how instanceof Array ? how[0] : how;
  if(thing instanceof Array) {
    var rest = how instanceof Array && how.length > 1 ? how.slice(1) : how;
    return _.map(thing, function(value) {
      _.join(value, rest);
    }).join(mortar);
  } else {
    var qmortar = how instanceof Array && how.length > 1 ? how[1] : how;
    var rest = how instanceof Array && how.length > 2 ? how.slice(2) : how;
    var serial = [];
    _.each(Object.keys(thing), function(key) {
      serial.push(String(key) + mortar + _.join(thing[key], rest));
    });
    return serial.join(qmortar);
  }
}

_.evil_format = function(format, args) {
  return format.replace(/%{([^}]*)}/g, function(match, key) {
    return Object.prototype.hasOwnProperty.call(args, key) ? String(args[key]) : '';
  });
};

_.evil = function(format, args) {
  var code = _.evil_format(format, args);
  return eval(code);
};

// _.push, kind of like $implicit_array[] += $thing in php.
_.push = function(thing, key, obj) {
  if(thing[key] == undefined) thing[key] = [];
  if(thing[key] instanceof Array) thing[key].push(obj);
  else throw new Error("Can't push into a non-array!");
  return thing[key];
};

// vim: set sw=2 ts=2 expandtab :
