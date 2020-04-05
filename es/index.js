// synchronous array signals for S.js
import S from "s-js";
export default function SArray(values) {
    if (!Array.isArray(values))
        throw new Error("SArray must be initialized with an array");
    var dirty = S.data(false), mutations = [], mutcount = 0, pops = 0, shifts = 0, data = S.root(function () { return S.on(dirty, update, values, true); });
    // add mutators
    var array = function array(newvalues) {
        if (arguments.length > 0) {
            mutation(function array() { values = newvalues; });
            return newvalues;
        }
        else {
            return data();
        }
    };
    array.push = push;
    array.pop = pop;
    array.unshift = unshift;
    array.shift = shift;
    array.splice = splice;
    // not ES5
    array.remove = remove;
    array.removeAll = removeAll;
    lift(array);
    return array;
    function mutation(m) {
        mutations[mutcount++] = m;
        dirty(true);
    }
    function update() {
        if (pops)
            values.splice(values.length - pops, pops);
        if (shifts)
            values.splice(0, shifts);
        pops = 0;
        shifts = 0;
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
    function splice( /* arguments */) {
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
            for (var i = 0; i < values.length;) {
                if (values[i] === item) {
                    values.splice(i, 1);
                }
                else {
                    i++;
                }
            }
        });
        return array;
    }
}
// util to add transformer methods
export function lift(seq) {
    var _seq = seq;
    _seq.concat = chainConcat;
    _seq.every = chainEvery;
    _seq.filter = chainFilter;
    _seq.find = chainFind;
    //s.findIndex = findIndex;
    _seq.forEach = chainForEach;
    _seq.includes = chainIncludes;
    //s.indexOf   = indexOf;
    //s.join      = join;
    //s.lastIndexOf = lastIndexOf;
    _seq.map = chainMap;
    _seq.sort = chainSort;
    _seq.reduce = chainReduce;
    _seq.reduceRight = chainReduceRight;
    _seq.reverse = chainReverse;
    _seq.slice = chainSlice;
    _seq.some = chainSome;
    Object.defineProperty(_seq, 'length', {
        // get: length(_seq)
        get: function length() {
            return _seq().length;
        }
    });
    // non-ES5 transformers
    _seq.mapS = chainMapS;
    _seq.mapSample = chainMapSample;
    _seq.mapSequentially = chainMapSequentially;
    _seq.orderBy = chainOrderBy;
    return _seq;
}
export function mapS(seq, enter, exit, move) {
    var items = [], mapped = [], disposers = [], len = 0;
    S(function () { S.cleanup(function () { disposers.forEach(function (d) { d(); }); }); });
    return S.on(seq, function mapS() {
        var new_items = seq(), new_len = new_items.length, temp = new Array(new_len), tempdisposers = new Array(new_len), from = null, to = null, i, j, k, item;
        if (move)
            from = [], to = [];
        // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
        NEXT: for (i = 0, k = 0; i < len; i++) {
            item = items[i];
            for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                if (item === new_items[k] && !temp.hasOwnProperty(k.toString())) {
                    temp[k] = mapped[i];
                    tempdisposers[k] = disposers[i];
                    if (move && i !== k) {
                        from.push(i);
                        to.push(k);
                    }
                    k = (k + 1) % new_len;
                    continue NEXT;
                }
            }
            if (exit)
                exit(item, mapped[i](), i);
            disposers[i]();
        }
        if (move && from.length)
            move(items, mapped, from, to);
        // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
        for (i = 0; i < new_len; i++) {
            if (temp.hasOwnProperty(i.toString())) {
                mapped[i] = temp[i];
                disposers[i] = tempdisposers[i];
            }
            else {
                mapped[i] = S.root(mapper);
            }
        }
        // 3) in case the new set is shorter than the old, set the length of the mapped array
        len = mapped.length = new_len;
        // 4) save a copy of the mapped items for the next update
        items = new_items.slice();
        return mapped;
        function mapper(disposer) {
            disposers[i] = disposer;
            var _item = new_items[i], _i = i;
            return S(function (value) { return enter(_item, value, _i); }, undefined);
        }
    });
}
function chainMapS(enter, exit, move) {
    var r = lift(mapS(this, enter, exit, move));
    r.combine = chainCombine;
    return r;
}
export function mapSample(seq, enter, exit, move) {
    var items = [], mapped = [], disposers = [], len = 0;
    S(function () { S.cleanup(function () { disposers.forEach(function (d) { d(); }); }); });
    return S.on(seq, function mapSample() {
        var new_items = seq(), new_len = new_items.length, new_indices, new_indices_next, temp, tempdisposers, from = null, to = null, i, j, start, end, new_end, item;
        // fast path for empty arrays
        if (new_len === 0) {
            if (len !== 0) {
                if (exit !== undefined) {
                    for (i = 0; i < len; i++) {
                        item = items[i];
                        exit(item, mapped[i], i);
                        disposers[i]();
                    }
                }
                else {
                    for (i = 0; i < len; i++) {
                        disposers[i]();
                    }
                }
                items = [];
                mapped = [];
                disposers = [];
                len = 0;
            }
        }
        else if (len === 0) {
            for (j = 0; j < new_len; j++) {
                items[j] = new_items[j];
                mapped[j] = S.root(mapper);
            }
            len = new_len;
        }
        else {
            new_indices = new Map();
            temp = new Array(new_len);
            tempdisposers = new Array(new_len);
            if (move)
                from = [], to = [];
            // skip common prefix and suffix
            for (start = 0, end = Math.min(len, new_len); start < end && items[start] === new_items[start]; start++)
                ;
            for (end = len - 1, new_end = new_len - 1; end >= 0 && new_end >= 0 && items[end] === new_items[new_end]; end--, new_end--) {
                temp[new_end] = mapped[end];
                tempdisposers[new_end] = disposers[end];
            }
            // 0) prepare a map of all indices in new_items, scanning backwards so we encounter them in natural order
            new_indices_next = new Array(new_end + 1);
            for (j = new_end; j >= start; j--) {
                item = new_items[j];
                i = new_indices.get(item);
                new_indices_next[j] = i === undefined ? -1 : i;
                new_indices.set(item, j);
            }
            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            for (i = start; i <= end; i++) {
                item = items[i];
                j = new_indices.get(item);
                if (j !== undefined && j !== -1) {
                    temp[j] = mapped[i];
                    tempdisposers[j] = disposers[i];
                    if (move && i !== j) {
                        from.push(i);
                        to.push(j);
                    }
                    j = new_indices_next[j];
                    new_indices.set(item, j);
                }
                else {
                    if (exit)
                        exit(item, mapped[i], i);
                    disposers[i]();
                }
            }
            if (move && (from.length !== 0 || end !== len - 1)) {
                end++, new_end++;
                while (end < len) {
                    from.push(end++);
                    to.push(new_end++);
                }
                move(items, mapped, from, to);
            }
            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            for (j = start; j < new_len; j++) {
                if (temp.hasOwnProperty(j)) {
                    mapped[j] = temp[j];
                    disposers[j] = tempdisposers[j];
                }
                else {
                    mapped[j] = S.root(mapper);
                }
            }
            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;
            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();
        }
        return mapped;
        function mapper(disposer) {
            disposers[j] = disposer;
            return enter(new_items[j], mapped[j], j);
        }
    });
}
function chainMapSample(enter, exit, move) {
    return lift(mapSample(this, enter, exit, move));
}
export function mapSequentially(seq, update) {
    var mapped = [];
    return S(function mapSequentially() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            mapped[i] = update(s[i], mapped[i], i);
        }
        if (mapped.length > s.length)
            mapped.length = s.length;
        return mapped;
    });
}
function chainMapSequentially(enter) {
    return lift(mapSequentially(this, enter));
}
export function forEach(seq, enter, exit, move) {
    var items = [], len = 0;
    return S.on(seq, function forEach() {
        var new_items = seq(), new_len = new_items.length, found = new Array(new_len), from = [], to = [], i, j, k, item;
        // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
        NEXT: for (i = 0, k = 0; i < len; i++) {
            item = items[i];
            for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                if (item === new_items[k] && !found[k]) {
                    found[k] = true;
                    if (i !== k) {
                        from.push(i);
                        to.push(k);
                    }
                    k = (k + 1) % new_len;
                    continue NEXT;
                }
            }
            if (exit)
                exit(item, i);
        }
        if (move && from.length)
            move(from, to);
        // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
        for (var i = 0; i < new_len; i++) {
            if (!found[i])
                enter(new_items[i], i);
        }
        // 3) in case the new set is shorter than the old, set the length of the mapped array
        len = new_len;
        // 4) save a copy of the mapped items for the next update
        items = new_items.slice();
        return items;
    });
}
function chainForEach(enter, exit, move) {
    return lift(forEach(this, enter, exit, move));
}
export function combine(seq) {
    return S(function combine() {
        var s = seq(), result = new Array(s.length);
        for (var i = 0; i < s.length; i++) {
            result[i] = s[i]();
        }
        return result;
    });
}
function chainCombine() {
    return lift(combine(this));
}
export function map(seq, enter, exit, move) {
    return combine(mapS(seq, enter, exit, move == undefined ? undefined :
        function (items, mapped, from, to) { move(items, mapped.map(function (s) { return s(); }), from, to); }));
}
function chainMap(enter, exit, move) {
    return lift(map(this, enter, exit, move));
}
export function find(seq, pred) {
    return S(function find() {
        var s = seq(), i, item;
        for (i = 0; i < s.length; i++) {
            item = s[i];
            if (pred(item))
                return item;
        }
        return undefined;
    });
}
function chainFind(pred) {
    return find(this, pred);
}
export function includes(seq, o) {
    return S(function find() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            if (s[i] === o)
                return true;
        }
        return false;
    });
}
function chainIncludes(o) {
    return includes(this, o);
}
export function sort(seq, fn) {
    return S(function sort() {
        var copy = seq().slice(0);
        if (fn)
            copy.sort(fn);
        else
            copy.sort();
        return copy;
    });
}
function chainSort(fn) {
    return lift(sort(this, fn));
}
export function orderBy(seq, by) {
    var key, fn;
    if (typeof by !== 'function') {
        key = by;
        fn = function (o) { return o[key]; };
    }
    else {
        fn = by;
    }
    return S(function orderBy() {
        var copy = seq().slice(0);
        copy.sort(function (a, b) {
            a = fn(a);
            b = fn(b);
            return a < b ? -1 : a > b ? 1 : 0;
        });
        return copy;
    });
}
function chainOrderBy(by) {
    return lift(orderBy(this, by));
}
export function length(seq) {
    return S(function length() {
        var s = seq();
        return s.length;
    });
}
export function filter(seq, predicate) {
    return S(function filter() {
        var s = seq(), result = [], i, v;
        for (i = 0; i < s.length; i++) {
            v = s[i];
            if (predicate(v))
                result.push(v);
        }
        return result;
    });
}
function chainFilter(predicate) {
    return lift(filter(this, predicate));
}
export function concat(seq) {
    var others = [];
    for (var _a = 1; _a < arguments.length; _a++) {
        others[_a - 1] = arguments[_a];
    }
    return S(function concat() {
        var s = seq();
        for (var i = 0; i < others.length; i++) {
            s = s.concat(others[i]());
        }
        return s;
    });
}
function chainConcat() {
    var others = [];
    for (var _a = 0; _a < arguments.length; _a++) {
        others[_a] = arguments[_a];
    }
    return lift(concat.apply(void 0, [this].concat(others)));
}
export function reduce(seq, fn, seed) {
    return S(function reduce() {
        var s = seq(), result = seed instanceof Function ? seed() : seed;
        for (var i = 0; i < s.length; i++) {
            result = fn(result, s[i], i, s);
        }
        return result;
    });
}
function chainReduce(fn, seed) {
    return reduce(this, fn, seed);
}
export function reduceRight(seq, fn, seed) {
    return S(function reduceRight() {
        var s = seq(), result = seed instanceof Function ? seed() : seed;
        for (var i = s.length - 1; i >= 0; i--) {
            result = fn(result, s[i], i, s);
        }
        return result;
    });
}
function chainReduceRight(fn, seed) {
    return reduceRight(this, fn, seed);
}
export function every(seq, fn) {
    return S(function every() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            if (!fn(s[i]))
                return false;
        }
        return true;
    });
}
function chainEvery(fn) {
    return every(this, fn);
}
export function some(seq, fn) {
    return S(function some() {
        var s = seq();
        if (fn === undefined)
            return s.length !== 0;
        for (var i = 0; i < s.length; i++) {
            if (fn(s[i]))
                return true;
        }
        return false;
    });
}
function chainSome(fn) {
    return some(this, fn);
}
export function reverse(seq) {
    return S(function () {
        var copy = seq().slice(0);
        copy.reverse();
        return copy;
    });
}
function chainReverse() {
    return lift(reverse(this));
}
export function slice(seq, s, e) {
    return S(function () {
        return seq().slice(s, e);
    });
}
function chainSlice(s, e) {
    return lift(slice(this, s, e));
}
