// synchronous array signals for S.js
import S from "s-js";

export interface SArray<T> {
    () : T[];

    concat(...others : SArray<T>[]) : SArray<T>;
    every(pred : (v : T) => boolean) : () => boolean;
    filter(pred : (v : T) => boolean) : SArray<T>;
    find(pred : (v : T) => boolean) : () => T | undefined;
    forEach(fn : (v : T) => void, exit? : (v : T, i : number) => void, move? : (from : number[], to : number[]) => void) : SArray<T>;
    includes(v : T) : () => boolean;
    map<U>(fn : (v : T, m : U | undefined, i : number) => U, exit? : (v : T, m : U, i : number) => void, move? : (items : T[], mapped : U[], from : number[], to : number[]) => void) : SArray<U>;
    sort(fn : (a : T, b : T) => number) : SArray<T>;
    reduce<U>(fn : (cur : U, v : T, i? : number, l? : T[]) => U, seed : U | (() => U)) : () => U;
    reduceRight<U>(fn : (cur : U, v : T, i? : number, l? : T[]) => U, seed : U | (() => U)) : () => U;
    reverse() : SArray<T>;
    slice(s : number, e : number) : SArray<T>;
    some(pred : (v : T) => boolean) : () => boolean;
    
    mapS<U>(fn : (v : T, m : U | undefined, i : number) => U, exit? : (v : T, m : U, i : number) => void, move? : (items : T[], mapped : (() => U)[], from : number[], to : number[]) => void) : SSignalArray<U>;
    mapSample<U>(fn : (v : T) => U, exit? : (v : T, i : number) => void, move? : (from : number[], to : number[]) => void) : SArray<U>;
    orderBy<U>(key : (v : T) => U) : SArray<T>;
}

export interface SSignalArray<T> extends SArray<() => T> {
    combine() : SArray<T>
}

export interface SDataArray<T> extends SArray<T> {
    (v : T[]) : T[];

    push(v : T) : SDataArray<T>;
    pop() : T | undefined;
    unshift(v : T) : SDataArray<T>;
    shift() : T | undefined;
    splice(i : number, len : number, ...items : T[]) : SDataArray<T>;
    remove(v : T) : SDataArray<T>;
    removeAll(v : T) : SDataArray<T>;
}

export default function SArray<T>(values : T[]) : SDataArray<T> {
    if (!Array.isArray(values))
        throw new Error("SArray must be initialized with an array");

    var dirty     = S.data(false),
        mutations = [] as ((() => void) | null)[],
        mutcount  = 0,
        pops      = 0,
        shifts    = 0,
        data      = S.root(function () { return S.on(dirty, update, values, true); });

    // add mutators
    var array = <SDataArray<T>>function array(newvalues? : T[]) {
        if (arguments.length > 0) {
            mutation(function array() { values = newvalues!; });
            return newvalues!;
        } else {
            return data();
        }
    };

    array.push      = push;
    array.pop       = pop;
    array.unshift   = unshift;
    array.shift     = shift;
    array.splice    = splice;

    // not ES5
    array.remove    = remove;
    array.removeAll = removeAll;

    lift(array);

    return array;
    
    function mutation(m : () => void) {
        mutations[mutcount++] = m;
        dirty(true);
    }
    
    function update() {
        if (pops)   values.splice(values.length - pops, pops);
        if (shifts) values.splice(0, shifts);
        
        pops     = 0;
        shifts   = 0;
        
        for (var i = 0; i < mutcount; i++) {
            mutations[i]!();
            mutations[i] = null;
        }
        
        mutcount = 0;
        
        return values;
    }
    
    // mutators
    function push(item : T) {
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

    function unshift(item : T) {
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

    function remove(item : T) {
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

    function removeAll(item : T) {
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

// util to add transformer methods
export function lift<T>(seq : () => T[]) {
    var _seq = seq as SArray<T>;

    _seq.concat      = chainConcat;
    _seq.every       = chainEvery;
    _seq.filter      = chainFilter;
    _seq.find        = chainFind;
    //s.findIndex = findIndex;
    _seq.forEach     = chainForEach;
    _seq.includes    = chainIncludes;
    //s.indexOf   = indexOf;
    //s.join      = join;
    //s.lastIndexOf = lastIndexOf;
    _seq.map         = chainMap;
    _seq.sort        = chainSort;
    _seq.reduce      = chainReduce;
    _seq.reduceRight = chainReduceRight;
    _seq.reverse     = chainReverse;
    _seq.slice       = chainSlice;
    _seq.some        = chainSome;

    // non-ES5 transformers
    _seq.mapS        = chainMapS;
    _seq.mapSample   = chainMapSample;
    _seq.orderBy     = chainOrderBy;

    return _seq;
}

export function mapS<T, U>(
    seq : () => T[], 
    enter : (v : T, m? : U | undefined, i? : number) => U, 
    exit? : (v : T, m : U, i : number) => void, 
    move? : (items : T[], mapped : (() => U)[], from : number[], to : number[]) => void
) {
    var items = [] as T[],
        mapped = [] as (() => U)[],
        disposers = [] as (() => void)[],
        len = 0;

    S(function () { S.cleanup(function () { disposers.forEach(function (d) { d(); }); }); });

    return S.on(seq, function mapS() {
        var new_items = seq(),
            new_len = new_items.length,
            temp = new Array(new_len) as (() => U)[],
            tempdisposers = new Array(new_len) as (() => void)[],
            from = null! as number[], 
            to = null! as number[], 
            i : number, 
            j : number, 
            k : number, 
            item : T;

        if (move) from = [], to = [];

        // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
        NEXT:
        for (i = 0, k = 0; i < len; i++) {
            item = items[i];
            for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                if (item === new_items[k] && !temp.hasOwnProperty(k.toString())) {
                    temp[k] = mapped[i];
                    tempdisposers[k] = disposers[i];
                    if (move && i !== k) { from.push(i); to.push(k); }
                    k = (k + 1) % new_len;
                    continue NEXT;
                }
            }
            if (exit) exit(item, mapped[i](), i);
            disposers[i]();
        }

        if (move && from.length) move(items, mapped, from, to);

        // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
        for (i = 0; i < new_len; i++) {
            if (temp.hasOwnProperty(i.toString())) {
                mapped[i] = temp[i];
                disposers[i] = tempdisposers[i];
            } else {
                mapped[i] = S.root(mapper);
            }
        }

        // 3) in case the new set is shorter than the old, set the length of the mapped array
        len = mapped.length = new_len;

        // 4) save a copy of the mapped items for the next update
        items = new_items.slice();

        return mapped;
        
        function mapper(disposer : () => void) {
            disposers[i] = disposer;
            var _item = new_items[i], _i = i;
            return S(function (value : U) { return enter(_item, value, _i); }, undefined!);
        }
    });
}

function chainMapS<T, U>(
    this : () => T[], 
    enter : (v : T, m? : U | undefined, i? : number) => U, 
    exit? : (v : T, m : U, i : number) => void, 
    move? : (items : T[], mapped : (() => U)[], from : number[], to : number[]) => void
) {
    var r  = lift(mapS(this, enter, exit, move)) as any as SSignalArray<T>;
    r.combine = chainCombine;
    return r;
}

export function mapSample<T, U>(
    seq : () => T[], 
    enter : (v : T, m : U | undefined, i : number) => U, 
    exit? : (v : T, m : U, i : number) => void, 
    move? : (items : T[], mapped : U[], from : number[], to : number[]) => void
) {
    var items = [] as T[],
        mapped = [] as U[],
        disposers = [] as (() => void)[],
        len = 0;

    S(function () { S.cleanup(function () { disposers.forEach(function (d) { d(); }); }); });

    return S.on(seq, function mapSample() {
        var new_items = seq(),
            new_len = new_items.length,
            temp : U[],
            tempdisposers : (() => void)[],
            from = null! as number[], 
            to = null! as number[], 
            i : number, 
            j : number, 
            k : number, 
            item : T;

        // fast path for empty arrays
        if (new_len === 0) {
            if (len !== 0) {
                if (exit !== undefined) {
                    for (i = 0; i < len; i++) {
                        item = items[i];
                        exit(item, mapped[i], i);
                        disposers[i]();
                    }
                } else {
                    for (i = 0; i < len; i++) {
                        disposers[i]();
                    }
                }
                items = mapped = [];
                disposers = [];
                len = 0;
            }
        } else if (len === 0) {
            for (i = 0; i < new_len; i++) {
                item = items[i] = new_items[i];
                mapped[i] = S.root(mapper);
            }
            len = new_len;
        } else {
            temp = new Array(new_len);
            tempdisposers = new Array(new_len);
            if (move) from = [], to = [];

            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            NEXT:
            for (i = 0, k = 0; i < len; i++) {
                item = items[i];
                for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                    if (item === new_items[k] && !temp.hasOwnProperty(k.toString())) {
                        temp[k] = mapped[i];
                        tempdisposers[k] = disposers[i];
                        if (move && i !== k) { from.push(i); to.push(k); }
                        k = (k + 1) % new_len;
                        continue NEXT;
                    }
                }
                if (exit) exit(item, mapped[i], i);
                disposers[i]();
            }

            if (move && from.length) move(items, mapped, from, to);

            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            for (i = 0; i < new_len; i++) {
                if (temp.hasOwnProperty(i.toString())) {
                    mapped[i] = temp[i];
                    disposers[i] = tempdisposers[i];
                } else {
                    mapped[i] = S.root(mapper); 
                }
            }

            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;

            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();
        }

        return mapped;
        
        function mapper(disposer : () => void) {
            disposers[i] = disposer;
            return enter(new_items[i], mapped[i], i);
        }
    });
}

function chainMapSample<T, U>(
    this : () => T[], 
    enter : (v : T, m : U | undefined, i : number) => U, 
    exit? : (v : T, m : U, i : number) => void, 
    move? : (items : T[], mapped : U[], from : number[], to : number[]) => void
) {
    return lift(mapSample(this, enter, exit, move));
}

export function forEach<T>(
    seq : () => T[],
    enter : (v : T, i : number) => void, 
    exit? : (v : T, i : number) => void, 
    move? : (from : number[], to : number[]) => void
) {
    var items = [] as T[],
        len = 0;

    return S.on(seq, function forEach() {
        var new_items = seq(),
            new_len = new_items.length,
            found = new Array(new_len) as boolean[],
            from = [] as number[],
            to = [] as number[],
            i : number, 
            j : number, 
            k : number, 
            item : T;

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
        for (var i = 0; i < new_len; i++) {
            if (!found[i]) enter(new_items[i], i);
        }

        // 3) in case the new set is shorter than the old, set the length of the mapped array
        len = new_len;

        // 4) save a copy of the mapped items for the next update
        items = new_items.slice();

        return items;
    });
}

function chainForEach<T>(
    this : () => T[],
    enter : (v : T, i : number) => void, 
    exit? : (v : T, i : number) => void, 
    move? : (from : number[], to : number[]) => void
) {
    return lift(forEach(this, enter, exit, move));
}

export function combine<T>(seq : () => (() => T)[]) {
    return S(function combine() {
        var s = seq(),
            result = new Array(s.length) as T[];
        for (var i = 0; i < s.length; i++) {
            result[i] = s[i]();
        }
        return result;
    });
}

function chainCombine<T>(this : () => (() => T)[]) {
    return lift(combine(this));
}

export function map<T, U>(
    seq : () => T[], 
    enter : (v : T, m? : U | undefined, i? : number) => U, 
    exit? : (v : T, m : U, i : number) => void, 
    move? : (items : T[], mapped : U[], from : number[], to : number[]) => void
) {
    return combine(mapS(seq, enter, exit, move == undefined ? undefined : 
        function (items, mapped, from, to) { move(items, mapped.map(s => s()), from, to); }));
}

function chainMap<T, U>(
    this : () => T[], 
    enter : (v : T, m? : U | undefined, i? : number) => U, 
    exit? : (v : T, m : U, i : number) => void, 
    move? : (items : T[], mapped : U[], from : number[], to : number[]) => void
) {
    return lift(map(this, enter, exit, move));
}

export function find<T>(seq : () => T[], pred : (v : T) => boolean) {
    return S(function find() {
        var s = seq(),
            i : number, item : T;
        for (i = 0; i < s.length; i++) {
            item = s[i];
            if (pred(item)) return item;
        }
        return undefined;
    });
}

function chainFind<T>(this : () => T[], pred : (v : T) => boolean) {
    return find(this, pred);
}

export function includes<T>(seq : () => T[], o : T) {
    return S(function find() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            if (s[i] === o) return true;
        }
        return false;
    });
}

function chainIncludes<T>(this : () => T[], o : T) {
    return includes(this, o);
}

export function sort<T>(seq : () => T[], fn?: (a: T, b : T) => number) {
    return S(function sort() {
        var copy = seq().slice(0);
        if (fn) copy.sort(fn);
        else copy.sort();
        return copy;
    });
}

function chainSort<T>(this : () => T[], fn?: (a: T, b : T) => number) {
    return lift(sort(this, fn));
}

export function orderBy<T>(seq : () => T[], by : keyof T | ((v : T) => any)) {
    var key : keyof T,
        fn : (v : T) => any;

    if (typeof by !== 'function') {
        key = by;
        fn = function (o : T) { return o[key]; };
    } else {
        fn = by as (v : T) => any;
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

function chainOrderBy<T>(this : () => T[], by : keyof T | ((v : T) => any)) {
    return lift(orderBy(this, by));
}

export function filter<T>(seq : () => T[], predicate : (v : T) => boolean) {
    return S(function filter() {
        var s = seq(),
            result = [],
            i, v;

        for (i = 0; i < s.length; i++) {
            v = s[i];
            if (predicate(v)) result.push(v);
        }

        return result;
    });
}

function chainFilter<T>(this : () => T[], predicate : (v : T) => boolean) {
    return lift(filter(this, predicate));
}

export function concat<T>(seq : () => T[], ...others : (() => T)[]) {
    return S(function concat() {
        var s = seq();
        for (var i = 0; i < others.length; i++) {
            s = s.concat(others[i]());
        }
        return s;
    });
}

function chainConcat<T>(this : () => T[], ...others : (() => T)[]) {
    return lift(concat(this, ...others));
}

export function reduce<T, U>(seq : () => T[], fn : (r : U, t : T, i : number, s : T[]) => U, seed : U | (() => U)) {
    return S(function reduce() {
        var s = seq(),
            result = seed instanceof Function ? seed() : seed;
        for (var i = 0; i < s.length; i++) {
            result = fn(result, s[i], i, s);
        }
        return result;
    });
}

function chainReduce<T, U>(this : () => T[], fn : (r : U, t : T, i : number, s : T[]) => U, seed : U | (() => U)) {
    return reduce(this, fn, seed);
}

export function reduceRight<T, U>(seq : () => T[], fn : (r : U, t : T, i : number, s : T[]) => U, seed : U | (() => U)) {
    return S(function reduceRight() {
        var s = seq(),
            result = seed instanceof Function ? seed() : seed;
        for (var i = s.length - 1; i >= 0; i--) {
            result = fn(result, s[i], i, s);
        }
        return result;
    });
}

function chainReduceRight<T, U>(this : () => T[], fn : (r : U, t : T, i : number, s : T[]) => U, seed : U | (() => U)) {
    return reduceRight(this, fn, seed);
}

export function every<T>(seq : () => T[], fn : (v : T) => boolean) {
    return S(function every() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            if (!fn(s[i])) return false;
        }
        return true;
    });
}

function chainEvery<T>(this : () => T[], fn : (v : T) => boolean) {
    return every(this, fn);
}

export function some<T>(seq : () => T[], fn? : (v : T) => boolean) {
    return S(function some() {
        var s = seq();
        if (fn === undefined) return s.length !== 0;
        for (var i = 0; i < s.length; i++) {
            if (fn(s[i])) return true;
        }
        return false;
    });
}

function chainSome<T>(this : () => T[], fn? : (v : T) => boolean) {
    return some(this, fn);
}

export function reverse<T>(seq : () => T[]) {
    return S(function () {
        var copy = seq().slice(0);
        copy.reverse();
        return copy;
    });
}

function chainReverse<T>(this : () => T[]) {
    return lift(reverse(this));
}

export function slice<T>(seq: () => T[], s : number, e : number) {
    return S(function () {
        return seq().slice(s, e);
    });
}

function chainSlice<T>(this: () => T[], s : number, e : number) {
    return lift(slice(this, s, e));
}
