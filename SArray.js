// synchronous array signals for S.js
(function (package) {
    if (typeof exports === 'object' && exports.__esModule) {
        exports.default = package(require('s-js')); // ES6 to CommonJS
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = package(require('s-js')); // CommonJS
    } else if (typeof define === 'function') {
        define(['s-js'], package); // AMD
    } else {
        (eval || function () {})("this").SArray = package(S); // globals
    }
})(function (S) {
    "use strict";

    SArray.lift = lift;

    return SArray;

    function SArray(values) {
        if (!Array.isArray(values))
            throw new Error("SArray must be initialized with an array");

        var dirty     = S.data(false),
            mutations = [],
            mutcount  = 0,
            pops      = 0,
            shifts    = 0,
            data      = S.root(function () { return S.on(dirty, update, values, true); });

        // add mutators
        array.push      = push;
        array.pop       = pop;
        array.unshift   = unshift;
        array.shift     = shift;
        array.splice    = splice;

        // not ES5
        array.remove    = remove;
        array.removeAll = removeAll;

        return transformer(array);
        
        function array(newvalues) {
            if (arguments.length > 0) {
                mutation(function array() { values = newvalues; });
                return newvalues;
            } else {
                return data();
            }
        }

        function mutation(m) {
            mutations[mutcount++] = m;
            dirty(true);
        }
        
        function update() {
            if (pops)   values.splice(values.length - pops, pops);
            if (shifts) values.splice(0, shifts);
            
            pops     = 0;
            shifts   = 0;
            
            for (var i = 0; i < mutcount; i++) {
                mutations[i]();
                mutations[i] = null;
            }
            
            mutcount = 0;
            
            return values;
        }
        
        // mutators
        function push(item) {
            mutation(function push() { values.push(item); });
            return array;
        }
    
        function pop() {
            array();
            if ((pops + shifts) < values.length) {
                var value = values[values.length - ++pops];
                dirty(true);
                return value;
            }
        }
    
        function unshift(item) {
            mutation(function unshift() { values.unshift(item); });
            return array;
        }
    
        function shift() {
            array();
            if ((pops + shifts) < values.length) {
                var value = values[shifts++];
                dirty(true);
                return value;
            }
        }
    
        function splice(/* arguments */) {
            var args = Array.prototype.slice.call(arguments);
            mutation(function splice() { Array.prototype.splice.apply(values, args); });
            return array;
        }
    
        function remove(item) {
            mutation(function remove() {
                for (var i = 0; i < values.length; i++) {
                    if (values[i] === item) {
                        values.splice(i, 1);
                        break;
                    }
                }
            });
            return array;
        }
    
        function removeAll(item) {
            mutation(function removeAll() {
                for (var i = 0; i < values.length; ) {
                    if (values[i] === item) {
                        values.splice(i, 1);
                    } else {
                        i++;
                    }
                }
            });
            return array;
        }
    }

    // util to convert plain () => T[] signal into an SArray<T>
    function lift(s) {
        return transformer(function () { return s(); });
    }

    // util to add transformer methods
    function transformer(s) {
        s.concat      = concat;
        s.every       = every;
        s.filter      = filter;
        s.find        = find;
        //s.findIndex = findIndex;
        s.forEach     = forEach;
        s.includes    = includes;
        //s.indexOf   = indexOf;
        //s.join      = join;
        //s.lastIndexOf = lastIndexOf;
        s.map         = map;
        s.sort        = sort;
        s.reduce      = reduce;
        s.reduceRight = reduceRight;
        s.reverse     = reverse;
        s.slice       = slice;
        s.some        = some;

        // non-ES5 transformers
        s.mapS        = mapS;
        s.mapSample   = mapSample;
        s.combine     = combine;
        s.orderBy     = orderBy;

        // schedulers
        s.defer       = defer;

        return s;
    }

    function mapS(enter, exit, move) {
        var seq = this,
            items = [],
            mapped = [],
            disposers = enter ? [] : null,
            len = 0;

        if (enter) S(function () { S.cleanup(function () { disposers.forEach(function (d) { d(); }); }); });

        var mapS = S(function mapS() {
            var new_items = seq(),
                new_len = new_items.length,
                temp = new Array(new_len),
                tempdisposers = enter ? new Array(new_len) : null,
                from, to, i, j, k, item;

            if (move) from = [], to = [];

            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            NEXT:
            for (i = 0, k = 0; i < len; i++) {
                item = items[i];
                for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                    if (item === new_items[k] && !temp.hasOwnProperty(k)) {
                        temp[k] = mapped[i];
                        if (enter) tempdisposers[k] = disposers[i];
                        if (move && i !== k) { from.push(i); to.push(k); }
                        k = (k + 1) % new_len;
                        continue NEXT;
                    }
                }
                if (exit) S.sample(function () { exit(item, enter ? mapped[i]() : mapped[i], i); });
                if (enter) disposers[i]();
            }

            if (move && from.length) S.sample(function () { move(items, mapped, from, to); });

            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            for (i = 0; i < new_len; i++) {
                if (temp.hasOwnProperty(i)) {
                    mapped[i] = temp[i];
                    if (enter) disposers[i] = tempdisposers[i];
                } else {
                    item = new_items[i];
                    mapped[i] = !enter ? item : S.root(function (disposer) {
                        disposers[i] = disposer;
                        var _item = item, _i = i;
                        return S(function (value) { return enter(_item, value, _i); });
                    }); 
                }
            }

            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;

            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();

            return mapped;
        });

        return transformer(mapS);
    }
    
    function mapSample(enter, exit, move) {
        var seq = this,
            items = [],
            mapped = [],
            len = 0;

        return transformer(S.on(seq, function mapSample() {
            var new_items = seq(),
                new_len = new_items.length,
                temp = new Array(new_len),
                from, to, i, j, k, item;

            if (move) from = [], to = [];

            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            NEXT:
            for (i = 0, k = 0; i < len; i++) {
                item = items[i];
                for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                    if (item === new_items[k] && !temp.hasOwnProperty(k)) {
                        temp[k] = mapped[i];
                        if (move && i !== k) { from.push(i); to.push(k); }
                        k = (k + 1) % new_len;
                        continue NEXT;
                    }
                }
                if (exit) exit(item, mapped[i], i);
            }

            if (move && from.length) move(items, mapped, from, to);

            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            for (i = 0; i < new_len; i++) {
                if (temp.hasOwnProperty(i)) {
                    mapped[i] = temp[i];
                } else {
                    mapped[i] = enter(new_items[i], i);
                }
            }

            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;

            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();

            return mapped;
        }));
    }

    function forEach(enter, exit, move) {
        var seq = this,
            items = [],
            len = 0;

        var forEach = S(function forEach() {
            var new_items = seq(),
                new_len = new_items.length,
                found = new Array(new_len),
                from = [],
                to = [],
                i, j, k, item;

            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            NEXT:
            for (i = 0, k = 0; i < len; i++) {
                item = items[i];
                for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                    if (item === new_items[k] && !found[k]) {
                        found[k] = true;
                        if (i !== k) { from.push(i); to.push(k); }
                        k = (k + 1) % new_len;
                        continue NEXT;
                    }
                }
                if (exit) exit(item, i);
            }

            if (move && from.length) move(from, to);

            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            if (enter) {
                S.sample(function forEach() {
                    for (var i = 0; i < new_len; i++) {
                        if (!found[i]) enter(new_items[i], i);
                    }
                });
            }

            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = new_len;

            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();

            return items;
        });

        return transformer(forEach);
    }

    function combine() {
        var seq = this;
        return transformer(S(function combine() {
            var s = seq(),
                result = new Array(s.length);
            for (var i = 0; i < s.length; i++) {
                result[i] = s[i]();
            }
            return result;
        }));
    }

    function map(enter, exit, move) {
        if (enter && move) {
            var _move = move;
            move = function (items, mapped, from, to) { _move(items, mapped.map(function (s) { return s(); }), from, to); };
        }
        var mapS = this.mapS(enter, exit, move);
        return enter ? mapS.combine() : mapS;
    }

    function find(pred) {
        var seq = this;
        return S(function find() {
            var s = seq(),
                i, item;
            for (i = 0; i < s.length; i++) {
                item = s[i];
                if (pred(item)) return item;
            }
            return undefined;
        });
    }

    function includes(o) {
        var seq = this;
        return S(function find() {
            var s = seq();
            for (var i = 0; i < s.length; i++) {
                if (s[i] === o) return true;
            }
            return false;
        });
    }

    function sort(fn) {
        var seq = this;
        return transformer(S(function sort() {
            var copy = seq().slice(0);
            if (fn) copy.sort(fn);
            else copy.sort();
            return copy;
        }));
    }

    function orderBy(by) {
        var seq = this,
            key;

        if (typeof by !== 'function') {
            key = by;
            by = function (o) { return o[key]; };
        }

        return transformer(S(function orderBy() {
            var copy = seq().slice(0);
            copy.sort(function (a, b) {
                a = by(a);
                b = by(b);
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return copy;
        }));
    }

    function filter(predicate) {
        var seq = this;
        return transformer(S(function filter() {
            var s = seq(),
                result = [],
                i, v;

            for (i = 0; i < s.length; i++) {
                v = s[i];
                if (predicate(v)) result.push(v);
            }

            return result;
        }));
    }

    function concat(/* others */) {
        var seq = this,
            others = Array.prototype.slice.call(arguments);
        return transformer(S(function concat() {
            var s = seq();
            for (var i = 0; i < others.length; i++) {
                s = s.concat(others[i]());
            }
            return s;
        }));
    }

    function reduce(fn, seed) {
        var seq = this;
        return S(function reduce() {
            var s = seq(),
                result = seed instanceof Function ? seed() : seed;
            for (var i = 0; i < s.length; i++) {
                result = fn(result, s[i], i, s);
            }
            return result;
        });
    }

    function reduceRight(fn, seed) {
        var seq = this;
        return S(function reduceRight() {
            var s = seq(),
                result = seed instanceof Function ? seed() : seed;
            for (var i = s.length - 1; i >= 0; i--) {
                result = fn(result, s[i], i, s);
            }
            return result;
        });
    }

    function every(fn) {
        var seq = this;
        return S(function every() {
            var s = seq();
            for (var i = 0; i < s.length; i++) {
                if (!fn(s[i])) return false;
            }
            return true;
        });
    }

    function some(fn) {
        var seq = this;
        return S(function some() {
            var s = seq();
            if (fn === undefined) return s.length !== 0;
            for (var i = 0; i < s.length; i++) {
                if (fn(s[i])) return true;
            }
            return false;
        });
    }

    function reverse() {
        var seq = this;
        return transformer(S(function () {
            var copy = seq().slice(0);
            copy.reverse();
            return copy;
        }));
    }

    function slice(s, e) {
        var seq = this;
        return transformer(S(function () {
            return seq().slice(s, e);
        }));
    }

    // schedulers
    function defer(scheduler) {
        return transformer(S.defer(scheduler).S(this));
    }
});
