define('S.array', ['S'], function (S) {
    function array(values, key) {
        var oi = OrderedIndex.fromArray(values, key),
            _patch = new Patch([], [], oi.order);

        return exit(oi, _patch, values);
    }

    function exit(oi, _patch, _array) {
        var patch = S.data(_patch);

        _array = _array || oi.toArray();

        function exit() {
            patch();
            if (_patch.next) {
                _patch = _patch.update(oi);
                _array = oi.toArray();
            }
            return _array;
        }

        exit.patch   = patch;
        exit.oi      = oi;

        array.push    = push;
        array.pop     = pop;
        array.shift   = shift;
        array.unshift = unshift;
        array.splice  = splice;
        array.remove  = remove;
        array.map     = map;
        array.filter  = filter;
        array.sort    = sort;

        return array;
    }

    function map(fn) {
        return transformer(this,
            function init(in) {
                return in.map(fn);
            }
            function patch(in, oi) {
                return in.map(fn, oi);
            }
        );
    }

    function filter(fn) {
        return transformer(this,
            function init(in) {
                return in.filter(fn);
            },
            function patch(in, oi) {
                return in.filter(fn, oi);
            }
        );
    }

    function sort(by) {
        return transform(this,
            function init(in) {
                return in.sort(by);
            },
            function patch(in, oi) {
                return in.sort(by, oi);
            }
        );
    }

    function transformer(in, init, step) {
        var out = null;

        return function transform() {
            while (step.next) {
                step = step.next;
                out = out.next = new Gen(next);
                fn(next, out);
            }
            return out;
        });
    }

    function stepReducer(step, seed) {
        var reduced = { items: seed.items, order: seed.order };

        return function () {
            while (step.next) {
                step = step.next;
                if (step.items) {
                    for (var i = 0; i < step.items.length; i++) {
                        reduced.items[step.ids[i]] = step.items[i];
                    }
                }
                if (step.order) reduced.order = step.order
            }

            return reduced;
        }
    }

    function io2map(io) {
        var i, item, array = [];
        for (i = 0; i < io.order.length; i++) {
            item = io.items[io.order[i]];
            if (item !== undefined) array.push(item);
        }
        return array;
    }

    function push(v)         { var l = peek(this); l.push(v);     this(l); return v; }
    function pop()           { var l = peek(this), v = l.pop();   this(l); return v; }
    function shift()         { var l = peek(this), v = l.shift(); this(l); return v; }
    function unshift(v)      { var l = peek(this); l.unshift(v);  this(l); return v; }
    function splice(/*...*/) { var l = peek(this), v = l.splice.apply(l, arguments); this(l); return v;}
    function remove(v)       { var l = peek(this), i = l.indexOf(v); if (i !== -1) { l.splice(i, 1); this(l); return v; } }
});
