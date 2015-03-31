describe("S.array()", function () {
    it("is created with an array", function () {
        var a = S.array([1, 2, 3]);

        expect(a()).toEqual([1, 2, 3]);
    });

    it("throws if not initialized with an array", function () {
        expect(function () {
            var a = S.array(1, 2, 3);
        }).toThrow();
    });
});

describe("S.array mutator", function () {
    var a, l;

    beforeEach(function () {
        a = S.array([1, 2, 3]);
        l = S(function () { return a().length; });
    });

    it("push acts like Array.prototype.push", function () {
        expect(a.push(4)).toBe(a);
        expect(a()).toEqual([1, 2, 3, 4]);
        expect(l()).toBe(4);
    });

    it("pop acts like Array.prototype.pop", function () {
        expect(a.pop()).toBe(3);
        expect(a()).toEqual([1, 2]);
        expect(l()).toBe(2);
    });

    it("unshift acts like Array.prototype.unshift", function () {
        expect(a.unshift(0)).toBe(a);
        expect(a()).toEqual([0, 1, 2, 3]);
        expect(l()).toBe(4);
    });

    it("shift acts like Array.prototype.shift", function () {
        expect(a.shift()).toBe(1);
        expect(a()).toEqual([2, 3]);
        expect(l()).toBe(2);
    });

    it("splice acts like Array.prototype.splice", function () {
        expect(a.splice(1, 1, 4, 5)).toBe(a);
        expect(a()).toEqual([1, 4, 5, 3]);
        expect(l()).toBe(4);
    });

    it("remove removes the first occurence of the item", function () {
        a.push(1);
        expect(a.remove(1)).toBe(a);
        expect(a()).toEqual([2, 3, 1]);
        expect(l()).toBe(3);
    });

    it("removeAll removes all occurence of the item", function () {
        a.push(1);
        expect(a.removeAll(1)).toBe(a);
        expect(a()).toEqual([2, 3]);
        expect(l()).toBe(2);
    });
});

describe("S.array.concat", function () {
    var a1, a2, a3;

    beforeEach(function () {
        a1 = S.array([1]);
        a2 = S.array([2]);
        a3 = S.array([3]);
    });

    it("combines all passed S.arrays in order", function () {
        var s = a1.concat(a2, a3);

        expect(s()).toEqual([1, 2, 3]);
    });

    it("responds to changes in all arrays", function () {
        var s = a1.concat(a2, a3);

        expect(s()).toEqual([1, 2, 3]);
        a1.push(4);
        expect(s()).toEqual([1, 4, 2, 3]);
        a2.pop();
        expect(s()).toEqual([1, 4, 3]);
        a3([5, 6]);
        expect(s()).toEqual([1, 4, 5, 6]);
    });
});

describe("S.array.every", function () {
    it("behaves like Array.prototype.every", function () {
        var a = S.array([1, 3, 2]);
        expect(a.every(function (v) { return v > 0; })()).toBe(true);
        expect(a.every(function (v) { return v > 1; })()).toBe(false);
    });

    it("is true for an empty array", function () {
        var s = S.array([]).every(function () { return false; });
        expect(s()).toBe(true);
    });

    it("responds to changes in source", function () {
        var a = S.array([2, 3, 1]),
            s = a.every(function (v) { return v > 1; });

        expect(s()).toBe(false);
        a.pop();
        expect(s()).toBe(true);
        a.push(0);
        expect(s()).toBe(false);
    });
});

describe("S.array.filter", function () {
    it("behaves like Array.prototype.filter", function () {
        var a = S.array([1, 3, 2]);
        expect(a.filter(function (v) { return v > 0; })()).toEqual([1, 3, 2]);
        expect(a.filter(function (v) { return v > 1; })()).toEqual([3, 2]);
    });

    it("responds to changes in source", function () {
        var a = S.array([2, 3, 1]),
        s = a.filter(function (v) { return v > 1; });

        expect(s()).toEqual([2, 3]);
        a.shift();
        expect(s()).toEqual([3]);
        a.push(4);
        expect(s()).toEqual([3, 4]);
    });
});

describe("S.array.find", function () {
    it("behaves like Array.prototype.find", function () {
        var a = S.array([1, 3, 2]);
        expect(a.find(function (v) { return v > 0; })()).toEqual(1);
        expect(a.find(function (v) { return v > 1; })()).toEqual(3);
        expect(a.find(function (v) { return v > 4; })()).toBeUndefined();
    });

    it("responds to changes in source", function () {
        var a = S.array([2, 3]),
        s = a.find(function (v) { return v > 2; });

        expect(s()).toEqual(3);
        a.shift();
        expect(s()).toEqual(3);
        a.push(4);
        expect(s()).toEqual(3);
    });
});

describe("S.array.forEach", function () {
    var a;

    beforeEach(function () {
        a = S.array(["a", "b", "c"]);
    });

    it("behaves like Array.prototype.forEach", function () {
        var r = "",
        s = a.forEach(function (v) { r += v; });
        expect(r).toEqual("abc");
    });

    it("tracks changes in source", function () {
        var r = "",
        s = a.forEach(function (v) { r += v; });
        a.unshift("d");
        expect(r).toEqual("abcd");
    });

    it("ignores prior items", function () {
        var enter = jasmine.createSpy(),
        s = a.forEach(enter);
        enter.calls.reset();
        a.unshift("d");
        expect(enter.calls.count()).toBe(1);
        expect(enter).toHaveBeenCalledWith("d", 0);
    });

    it("reports when a value exits the array", function () {
        var exit = jasmine.createSpy(),
        s = a.forEach(null, exit);
        a.pop();
        expect(exit.calls.count()).toBe(1);
        expect(exit).toHaveBeenCalledWith("c", 2);
    });

    it("reports when a value moves in the array", function () {
        var move = jasmine.createSpy(),
        s = a.forEach(null, null, move);
        a(["a", "c", "b"]);
        expect(move.calls.count()).toBe(1);
        expect(move).toHaveBeenCalledWith([1, 2], [2, 1]);
    });

    it("ignores changes to other dependencies", function () {
        var d = S.data(1),
        enter = jasmine.createSpy(),
        s = a.forEach(function (v) { d(); enter(); });
        enter.calls.reset();
        d(2);
        expect(enter.calls.count()).toBe(0);
    });
});

describe("S.array.includes", function () {
    it("behaves like Array.prototype.includes", function () {
        var a = S.array([1, 3, 2]);
        expect(a.includes(3)()).toBe(true);
        expect(a.includes(4)()).toBe(false);
    });

    it("responds to changes in source", function () {
        var a = S.array([2, 3, 1]),
            s = a.includes(2);

        expect(s()).toBe(true);
        a.shift();
        expect(s()).toBe(false);
        a.push(2);
        expect(s()).toBe(true);
    });
});

describe("S.array.map", function () {
    var a;

    beforeEach(function () {
        a = S.array([1, 3, 2]);
    });

    it("behaves like Array.prototype.map", function () {
        var s = a.map(function (x) { return x * 2; });
        expect(s()).toEqual([2, 6, 4]);
    });

    it("tracks changes in source", function () {
        var s = a.map(function (x) { return x * 2; });
        a.push(4);
        expect(s()).toEqual([2, 6, 4, 8]);
    });

    it("preserves prior computations", function () {
        var s = a.map(function (x) { return Math.random(); }),
            pre = s().slice();
        a.push(4);
        expect(pre).toEqual(s().slice(0, -1));
    });

    it("reports when a value exits the array", function () {
        var exit = jasmine.createSpy(),
            s = a.map(null, exit);
        a.pop();
        expect(exit).toHaveBeenCalledWith(2, 2);
    });

    it("reports when a value moves in the array", function () {
        var move = jasmine.createSpy(),
            s = a.map(null, null, move);
        a([1, 2, 3]);
        expect(move).toHaveBeenCalledWith([1, 2], [2, 1]);
    });

    it("tracks changes to other dependencies", function () {
        var d = S.data(1),
            s = a.map(function (v) { return v + d(); });
        expect(s()).toEqual([2, 4, 3]);
        d(2);
        expect(s()).toEqual([3, 5, 4]);
        a.push(4);
        expect(s()).toEqual([3, 5, 4, 6]);
    });
});


describe("S.array.sort", function () {
    var a;

    beforeEach(function () {
        a = S.array([1, 3, 2]);
    });

    it("behaves like Array.prototype.sort", function () {
        var s = a.sort();
        expect(s()).toEqual([1, 2, 3]);
    });

    it("tracks changes in source", function () {
        var s = a.sort();
        a.push(0);
        expect(s()).toEqual([0, 1, 2, 3]);
    });

    it("can sort by a comparator function", function () {
        var s = a.sort(function (a, b) { return b - a; });
        expect(s()).toEqual([3, 2, 1]);
    });
});

describe("S.array.reduce", function () {
    it("behaves like Array.prototype.forEach", function () {
        var a = S.array(["a", "b", "c"]),
            s = a.reduce(function (a, v) { return a + v; }, "");
        expect(s()).toEqual("abc");
    });

    it("tracks changes in source", function () {
        var a = S.array(["a", "b", "c"]),
            s = a.reduce(function (a, v) { return a + v; }, "");
        a.push("d");
        expect(s()).toEqual("abcd");
        a.shift();
        expect(s()).toEqual("bcd");
    });
});

describe("S.array.reduceRight", function () {
    it("behaves like Array.prototype.forEach", function () {
        var a = S.array(["a", "b", "c"]),
            s = a.reduceRight(function (a, v) { return a + v; }, "");
        expect(s()).toEqual("cba");
    });

    it("tracks changes in source", function () {
        var a = S.array(["a", "b", "c"]),
            s = a.reduceRight(function (a, v) { return a + v; }, "");
        a.push("d");
        expect(s()).toEqual("dcba");
        a.shift();
        expect(s()).toEqual("dcb");
    });
});

describe("S.array.reverse", function () {
    it("behaves like Array.prototype.reverse", function () {
        var a = S.array(["a", "b", "c"]),
            s = a.reverse();
        expect(s()).toEqual(["c", "b", "a"]);
    });

    it("tracks changes in source", function () {
        var a = S.array(["a", "b", "c"]),
            s = a.reverse();
        a.push("d");
        expect(s()).toEqual(["d", "c", "b", "a"]);
        a.shift();
        expect(s()).toEqual(["d", "c", "b"]);
    });
});

describe("S.array.slice", function () {
    it("behaves like Array.prototype.slice", function () {
        var a = S.array(["a", "b", "c", "d", "e", "f", "g", "h"]);
        expect(a.slice(0, 4)()).toEqual(["a", "b", "c", "d"]);
        expect(a.slice(3, 7)()).toEqual(["d", "e", "f", "g"]);
    });

    it("tracks changes in source", function () {
        var a = S.array(["a", "b", "c", "d", "e", "f", "g", "h"]),
            s = a.slice(1, 4);
        a.unshift("d");
        expect(s()).toEqual(["a", "b", "c"]);
        a.shift();
        expect(s()).toEqual(["b", "c", "d"]);
    });
});

describe("S.array.some", function () {
    it("behaves like Array.prototype.some", function () {
        var a = S.array([1, 3, 2]);
        expect(a.some(function (v) { return v > 2; })()).toBe(true);
        expect(a.some(function (v) { return v > 3; })()).toBe(false);
    });

    it("is false for an empty array", function () {
        var s = S.array([]).some(function () { return false; });
        expect(s()).toBe(false);
    });

    it("responds to changes in source", function () {
        var a = S.array([2, 3, 1]),
            s = a.some(function (v) { return v > 2; });

        expect(s()).toBe(true);
        a.splice(1, 1);
        expect(s()).toBe(false);
        a.push(4);
        expect(s()).toBe(true);
    });
});

describe("S.array.combine", function () {
    it("combines an array signal of signals to an array signal of values", function () {
        var a = S.array([S.data("a"), S.data("b"), S.data("c")]),
            s = a.combine();
        expect(s()).toEqual(["a", "b", "c"]);
    })
});

describe("S.array.orderBy", function () {
    var a, b;

    beforeEach(function () {
        a = S.array([1, 3, 2]);
        b = S.array(["cc", "a", "bbb"]);
    });

    it("can sort using a getter function", function () {
        var s = a.orderBy(function (v) { return -v; });
        expect(s()).toEqual([3, 2, 1]);
    });

    it("can sort using a property name", function () {
        var s = b.orderBy('length');
        expect(s()).toEqual(["a", "cc", "bbb"]);
    });

    it("tracks changes in source", function () {
        var s = a.orderBy(function (v) { return -v; });
        a.push(0);
        expect(s()).toEqual([3, 2, 1, 0]);
    });
});
