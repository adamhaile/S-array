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

    function seq(values) {
        var seq = S.data(values);

        seq.S = new seqCombinator(seq);

        seq.push    = push;
        seq.pop     = pop;
        seq.unshift = unshift;
        seq.shift   = shift;
        seq.splice  = splice;
        seq.remove  = remove;

        return seq;
    }

    function map(enter, exit, move) {
        var seq = this.seq,
            items = [],
            mapped = [],
            len = 0;

        var map = S.on(seq).S(function map() {
            var new_items = seq(),
                new_len = new_items.length,
                temp = new Array(new_len),
                moved = new Array(len),
                i, j, k, item, enterItem;

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
                enter && item.dispose();
            }

            if (move && moved.length) move(moved);

            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            S.pin(function map() {
                for (var i = 0; i < new_len; i++) {
                    if (temp.hasOwnProperty(i)) {
                        mapped[i] = temp[i];
                    } else {
                        item = new_items[i];
                        if (enter) {
                            // capture the current value of item and i in a closure
                            enterItem = (function (item, i) {
                                            return function () { return enter(item, i); };
                                        })(item, i);
                            mapped[i] = S(enterItem);
                        } else {
                            mapped[i] = item;
                        }
                    }
                }
            });

            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;

            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();

            return mapped;
        });

        map.S = new seqCombinator(map);

        return map;
    }

    function order(fn) {
        var seq = this.seq,
            order = S(function () { return _.sortBy(seq(), fn); });

        order.S = new seqCombinator(order);

        return order;
    }

    function filter(predicate) {
        var seq = this.seq,
            filter = S(function () { return _.filter(seq(), predicate); });

        filter.S = new seqCombinator(filter);

        return filter;
    }

    function append(others) {
        var seq = this.seq,
            append = S(function () {
                return seq().concat(_.map(others, function (o) { return o(); }));
            });

        append.S = new seqCombinator(append);

        return append;
    }

    function reduce(fn, seed) {
        var seq = this.seq,
            reduce = S(function () { return _.reduce(source(), fn, seed); });

        reduce.S = new seqCombinator(reduce);

        return reduce;
    }

    function values() {
        var seq = this.seq,
            values = S(function () { return _.map(seq(), function (o) { return o(); }); });

        values.S = new seqCombinator(values);

        return values;
    }

    function seqCombinator(seq) {
        this.seq = seq;
    }

    seqCombinator.prototype = {
        map: map,
        order: order,
        filter: filter,
        append: append,
        reduce: reduce,
        values: values
    };

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
