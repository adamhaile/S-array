// sets, unordered and ordered, for S.js
(function (package) {
    if (typeof exports === 'object')
        package(require('S')); // CommonJS
    else if (typeof define === 'function')
        define(['S'], package); // AMD
    else package(S); // globals
})(function (S) {
    "use strict";

    S.seq = seq;

    seq.S = seqDataCombinator;

    function seq(values) {
        var seq = S.data(values);

        seq.S = new seqDataCombinator(seq);

        seq.push    = push;
        seq.pop     = pop;
        seq.unshift = unshift;
        seq.shift   = shift;
        seq.splice  = splice;
        seq.remove  = remove;

        return seq;
    }

    function map(comb, enter, exit, move) {
        var items = [],
            mapped = [],
            len = 0;

        var map = S(function () {
            var new_items = comb.seq(),
                new_len = new_items.length,
                temp = new Array(new_len),
                moved = new Array(len),
                i, j, k, item;

            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            NEXT:
            for (i = 0, k = 0; i < len; i++) {
                item = mapped[i];
                for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                    if (items[i] === new_items[k] && !temp.hasOwnProperty(k)) {
                        temp[k] = item;
                        if (i !== k) moved[i] = k;
                        k = (k + 1) % new_len;
                        continue NEXT;
                    }
                }
                if (exit) exit(item, i);
            }

            if (move && moved.length) move(moved);

            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            for (i = 0; i < new_len; i++) {
                if (temp.hasOwnProperty(i)) {
                    mapped[i] = temp[i];
                } else {
                    item = new_items[i];
                    mapped[i] = enter ? enter(item, i) : item;
                }
            }

            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;

            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();

            return mapped;
        });

        map.S = new seqFormulaCombinator(map);

        return map;
    }

    function order(comb, fn) {
        var order = S(function () { return _.sortBy(comb.seq(), fn); });

        order.S = new seqFormulaCombinator(order);

        return order;
    }

    function filter(comb, predicate) {
        var filter = S(function () { return _.filter(comb.seq(), predicate); });

        filter.S = new seqFormulaCombinator(filter);

        return filter;
    }

    function append(comb, others) {
        var append = S(function () {
            return Array.prototype.concat.apply(comb.seq(), _.map(others, function (o) { return o(); }));
        });

        append.S = new seqFormulaCombinator(append);

        return append;
    }

    function enter(comb, fn) {
        var values = S.peek(comb.seq).map(_fn),
            outs = new Delta(),
            ch = K.ch(outs);

        var ins = getDelta(comb);

        var enter = S(function () {
            var i, exited, entered;

            comb.delta();

            while (ins.next) {
                ins = ins.next;

                exited = [], entered = [];

                for (i in ins.exited) exited[i] = values[i];
                for (i in ins.entered) entered[i] = _fn(ins.entered[i], i);

                outs = outs.next = new Delta(values, exited, ins.moved, entered, ins.length);

                applyDelta(values, outs);

                ch(outs);
            }

            return values;
        });

        enter.S = new seqFormulaCombinator(enter, ch);

        return enter;

        function _fn(x, i) {
            var v = fn(x, i);
            return v === undefined ? x : v;
        }
    }

    function exit(comb, fn) {
        return tapDelta(comb, function (delta) { delta.exited.map(fn); });
    }

    function move(comb, fn) {
        return tapDelta(comb, function (delta) { if (delta.moved.length) fn(delta.moved); });
    }

    function tapDelta(comb, fn) {
        var delta = getDelta(comb);

        var tap = S(function () {
            comb.delta();

            while (delta.next) {
                delta = delta.next;
                fn(delta);
            }

            return delta.values;
        });

        tap.S = new seqFormulaCombinator(tap, comb.delta);

        return tap;
    }

    function getDelta(comb) {
        var delta;

        if (!comb.delta) {
            delta = new Delta();

            comb.delta = S(function () {
                var current = comb.seq();

                delta = delta.next = compare(delta.values, current.slice());

                return delta;
            });
        } else {
            delta = S.peek(comb.delta);
        }

        return delta;
    }

    function compare(xs, ys) {
        var exited = [],
            moved = [],
            entered = [],
            found = [],
            xlen = xs.length,
            ylen = ys.length,
            i, j, k, x, y;

        NEXT:
        for (i = 0, k = 0; i < xlen; i++) {
            x = xs[i];
            for (j = 0; j < ylen; j++, k = (k + 1) % ylen) {
                y = ys[k];
                if (x === y && !found.hasOwnProperty(k)) {
                    found[k] = true;
                    if (i !== k) moved[i] = k;
                    k = (k + 1) % ylen;
                    continue NEXT;
                }
            }
            exited[i] = x;
        }

        for (k = 0; k < ylen; k++) {
            if (!found.hasOwnProperty(k)) {
                entered[k] = ys[k];
            }
        }

        return new Delta(ys, exited, moved, entered, ylen);
    }

    function Delta(values, exited, moved, entered, len) {
        this.values = values || [];
        this.exited = exited || [];
        this.moved = moved || [];
        this.entered = entered || [];
        this.length = len || 0;
        this.next = null;
    }

    function applyDelta(array, delta) {
        var temp = [],
            moved = delta.moved,
            entered = delta.entered,
            i, j;

        for (i in moved) {
            j = moved[i];
            if (j < i) array[j] = array[i];
            else temp[j] = array[i];
        }

        for (i in temp) {
            array[i] = temp[i];
        }

        for (i in entered) {
            array[i] = entered[i];
        }

        array.length = delta.length;
    }

    function reduce(source, fn, seed) {
        return S(function () { return _.reduce(source(), fn, seed); });
    }

    function seqDataCombinator(seq, delta) {
        S.data.S.call(this);

        this.seq = seq;
        this.delta = delta;
    }

    function seqFormulaCombinator(seq, delta) {
        S.formula.S.call(this, seq.S._update, seq.S._source_offsets, seq.S._source_listeners);

        this.seq = seq;
        this.delta = delta;
    }

    seqDataCombinator.prototype = new S.data.S();
    seqFormulaCombinator.prototype = new S.formula.S(null);

    seqDataCombinator.prototype.map    = seqFormulaCombinator.prototype.map    = function _S_map(enter, exit, move) { return map   (this, enter, exit, move); },
    seqDataCombinator.prototype.order  = seqFormulaCombinator.prototype.order  = function _S_order(fn)              { return order (this, fn); },
    seqDataCombinator.prototype.filter = seqFormulaCombinator.prototype.filter = function _S_filter(fn)             { return filter(this, fn); },
    seqDataCombinator.prototype.append = seqFormulaCombinator.prototype.append = function _S_append()               { return append(this, arguments); },
    seqDataCombinator.prototype.enter  = seqFormulaCombinator.prototype.enter  = function _S_enter(fn)              { return enter (this, fn); },
    seqDataCombinator.prototype.exit   = seqFormulaCombinator.prototype.exit   = function _S_exit(fn)               { return exit  (this, fn); },
    seqDataCombinator.prototype.move   = seqFormulaCombinator.prototype.move   = function _S_move(fn)               { return move  (this, fn); },
    seqDataCombinator.prototype.reduce = seqFormulaCombinator.prototype.reduce = function _S_reduce(fn, seed)       { return reduce(this, fn, seed); }

    function push(item) {
        var values = S.peek(this);

        values.push(item);
        this(values);

        return this;
    }

    function pop(item) {
        var values = S.peek(this),
            value = values.pop();

        this(values);

        return value;
    }

    function unshift(item) {
        var values = S.peek(this);

        values.unshift(item);
        this(values);

        return this;
    }

    function shift(item) {
        var values = S.peek(this),
            value = values.shift();

        this(values);

        return value;
    }

    function splice(index, count, item) {
        var values = S.peek(this);

        values.splice(index, count, item);
        this(values);

        return this;
    }

    function remove(item) {
        var values = S.peek(this);

        for (var i = 0; i < values.length; i++) {
            if (values[i] === item) {
                values.splice(i, 1);
                break;
            }
        }

        this(values);

        return this;
    }
});
