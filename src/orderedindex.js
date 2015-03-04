
/*

  __ idempotent __
  oi.patch(p).patch(p)   === oi.patch(p)

  __ associative __
  oi.patch(p).patch(q)   === oi.patch(p.patch(q))

  __ distributive __
  oi.patch(p).map(f)     === oi.map(f).patch(p.map(f))
  oi.patch(p).filter(f)  === oi.filter(f).patch(p.filter(f))
  oi.patch(p).push(v)    === oi.patch(p.push(v))
  oi.patch(p).unshift(v) === oi.patch(p.unshift(v))

  __ distributive with oi or if oi not filtered :( __
     we need oi to tell which items are currently undefined
  oi.patch(p).take(n)    === oi.patch(p.take(n))
  oi.patch(o).skip(n)    === oi.patch(p.skip(n))
  oi.patch(p).pop()      === oi.patch(p.pop())
  oi.patch(p).shift()    === oi.patch(p.shift())

  __ distributive with oi :( __
  oi.patch(p).sort(f)    === oi.sort(f).patch(p.sort(f, oi))

stateful
    filter
    sort

head-only
    push
    unshift
    splice

var c = S.col([1, 2, 3]),
    p = c.debounce(0).map(...)
         .defer().sort(...)
         .defer().filter(...)
         .take(10, 10)
         .unshift(...);



p()

*/


function OrderedIndex(order, index) {
    this.order = order;
    this.index = index;
}

OrderedIndex.fromArray = function fromArray(array, key) {
    var idFn = typeof key === 'function'  ? key :
               typeof key === 'string'    ? function (v) { return v[key]; } :
               function (_, i) { return i; },
        order = array.map(idFn),
        index = key ? {} : array.slice();

    if (key) order.forEach(function (id, i) { index[id] = array[i]; });

    return new OrderedIndex(order, index);
};

OrderedIndex.prototype = {
    push: function push(item, id) {
        if (this.index[id] !== undefined)
            this.order.splice(this.order.indexOf(id), 1);

        this.order.push(id);
        this.index[id] = item;

        return new Patch([item], [id], this.order);
    },

    unshift: function unshift(item, id) {
        if (this.index[id] !== undefined)
            this.order.splice(this.order.indexOf(id), 1);

        this.order.unshift(id);
        this.index[id] = item;

        return new Patch([item], [id], this.order);
    },

    pop: function pop() {
        var id = this.order.pop();
        this.index[id] = undefined;
        return new Patch([undefined], [id], this.order);
    },

    shift: function shift() {
        var id = this.order.shift();
        this.index[id] = undefined;
        return new Patch([undefined], [id], this.order);
    },

    toArray: function () {
        var array = [],
            i, item;

        for (i = 0; i < this.order.length; i++) {
            item = this.index[this.order[i]];
            if (item !== undefined) array.push(item);
        }

        return array;
    },

    patch: function patch(p) {
        p.apply(this);
        return this;
    },

    update: function update(p) {
        return p.update(this);
    },

    map: function map(fn) {
        var result = new OrderedIndex(this.order, {}),
            i, id, item;

        for (i = 0; i < this.order.length; i++) {
            id = this.order[i];
            item = this.index[id];

            if (item !== undefined) result.index[id] = fn(item);
        }

        return result;
    },

    filter: function filter(fn) {
        return this.map(function filter(item) {
            return fn(item) ? item : undefined;
        });
    },

    sort: function sort(by) {
        var result = new OrderedIndex(this.order.slice(), this.index),
            byFn = typeof by === 'string' ? function (v) { return v[by]; } : by,
            sortFn = byFn ? function sort(a, b) {
                                a = byFn(result.index[a]);
                                b = byFn(result.index[b]);
                                return a < b ? -1 : a === b ? 0 : 1;
                            }
                          : function sort(a, b) {
                                a = result.index[a];
                                b = result.index[b];
                                return a < b ? -1 : a === b ? 0 : 1;
                            };

        result.order.sort(sortFn);

        return result;
    },

    first: function () {
        return this.index[this.order[0]];
    },

    last: function () {
        return this.index[this.order[this.order.length - 1]];
    }
};


function Patch(items, ids, order, prev) {
    this.items = items;
    this.ids   = ids;
    this.order = order;
    this.next  = null;
    if (prev) prev.next = this;
}

Patch.prototype = {
    apply: function apply(oi) {
        var i, id, item;

        if (this.items) {
            for (i = 0; i < this.items.length; i++) {
                id = this.ids[i];
                item = this.items[i];
                oi.index[id] = item;
            }
        }

        if (this.order) oi.order = oi.order;

        return this;
    },

    update: function update(oi) {
        var patch = this;

        while (patch.next) {
            patch = patch.next;
            patch.apply(oi);
        }

        return patch;
    },

    patch: function patch(p) {
        var items, ids, i, id;

        if (!this.items) items = p.items, ids = p.ids;
        else if (!p.items) items = this.items, ids = this.ids;
        else items = this.items.concat(p.items), ids = this.ids.concat(p.ids);

        return new Patch(items, ids, p.order || this.order);
    },

    map: function map(fn) {
        var items = [], i, item;
        for (i = 0; i < this.items.length; i++) {
            item = this.items[i];
            items.push(item === undefined ? undefined : fn(item));
        });
        return new Patch(items, this.ids, this.order);
    },

    filter: function filter(fn) {
        return this.map(function filterItem(i) {
            return fn(i) ? i : undefined;
        });
    },

    sort: function sort(oi, by) {
        this.apply(oi);
        oi.sort(by);
        return new Patch(this.items, this.ids, oi.order);
    }
};
