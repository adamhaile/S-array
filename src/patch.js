
/*

oi.patch(p).map(f)    === oi.map(f).patch(p.map(f))
oi.patch(p).filter(f) === oi.filter(f).patch(p.filter(f))
oi.patch(p).sort(f)   === oi.sort(f).patch(p.sort(f))

*/

function Patch(items, ids, order, prev) {
    this.items = items;
    this.ids   = ids;
    this.order = order;
    this.next  = null;
    if (prev) prev.next = this;
}

Patch.push = function push(oi, item, id) {
    if (oi.index[id] !== undefined)
        oi.order.splice(oi.order.indexOf(id), 1);

    oi.order.push(id);
    oi.index[id] = item;

    return new Patch([item], [id], oi.order);
};

Patch.pop = function pop(oi) {
    var id = oi.order.pop();
    oi.index[id] = undefined;
    return new Patch([undefined], [id], oi.order);
};

Patch.shift = function pop(oi) {
    var id = oi.order.shift();
    oi.index[id] = undefined;
    return new Patch([undefined], [id], oi.order);
};

Patch.unshift = function unshift(oi, item, id) {
    if (oi.index[id] !== undefined)
        oi.order.splice(oi.order.indexOf(id), 1);

    oi.order.unshift(id);
    oi.index[id] = item;

    return new Patch([item], [id], oi.order);
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
    map: function map(fn) {
        var items = this.items.map(function mapItem(i) {
            return i !== undefined ? fn(i) : undefined;
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
