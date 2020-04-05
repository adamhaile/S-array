// compatibility fix for mocha
if (typeof SArray === "undefined") {
    SArray = require('../index');
}
if (typeof expect === "undefined") {
    expect = require('chai').expect;
}
if(typeof S === "undefined"){
    S = require('s-js')
}
if(typeof jasmine === "undefined"){
    jasmine = require('jasmine')
    jasmine.createSpy = function () {
        let count = 0
        let args
        function call(){
            count++
            args = arguments
        }
        call.calls = {
            count(){
                return count
            },
            reset(){
                count = 0
            },
        };
        call.toHaveBeenCalledWith = function () {
            expect(args).deep.equal(arguments)
        };
        return call
    }
}

// by default SArray is loaded into 'default' symbol when module is bound to a global
lift = SArray.lift
SArray = SArray.default;

/* globals describe, expect, beforeEach, jasmine, it, S */
describe("SArray()", function () {
    it("is created with an array", function () {
        var a = SArray([1, 2, 3]);

        expect(a()).deep.equal([1, 2, 3]);
    });

    it("throws if not initialized with an array", function () {
        expect(function () {
            SArray(1, 2, 3);
        }).throw();
    });
});

describe("SArray mutator", function () {
    var a, l;

    beforeEach(function () {
        a = SArray([1, 2, 3]);
        l = S.root(function () { return S(function () { return a().length; }); });
    });

    it("push acts like Array.prototype.push", function () {
        expect(a.push(4)).equal(a);
        expect(a()).deep.equal([1, 2, 3, 4]);
        expect(l()).equal(4);
    });

    it("pop acts like Array.prototype.pop", function () {
        expect(a.pop()).equal(3);
        expect(a()).deep.equal([1, 2]);
        expect(l()).equal(2);
    });

    it("unshift acts like Array.prototype.unshift", function () {
        expect(a.unshift(0)).equal(a);
        expect(a()).deep.equal([0, 1, 2, 3]);
        expect(l()).equal(4);
    });

    it("shift acts like Array.prototype.shift", function () {
        expect(a.shift()).equal(1);
        expect(a()).deep.equal([2, 3]);
        expect(l()).equal(2);
    });

    it("splice acts like Array.prototype.splice", function () {
        expect(a.splice(1, 1, 4, 5)).equal(a);
        expect(a()).deep.equal([1, 4, 5, 3]);
        expect(l()).equal(4);
    });

    it("remove removes the first occurence of the item", function () {
        a.push(1);
        expect(a.remove(1)).equal(a);
        expect(a()).deep.equal([2, 3, 1]);
        expect(l()).equal(3);
    });

    it("removeAll removes all occurence of the item", function () {
        a.push(1);
        expect(a.removeAll(1)).equal(a);
        expect(a()).deep.equal([2, 3]);
        expect(l()).equal(2);
    });
});

describe("(in event) SArray mutator", function () {
    var a, l;

    beforeEach(function () {
        a = SArray([1, 2, 3]);
        l = S.root(function () { return S(function () { return a().length; }); });
    });

    it("push acts like Array.prototype.push", function () {
        S.freeze(function () {
            expect(a.push(4)).equal(a);
            expect(a()).deep.equal([1, 2, 3]);
            expect(l()).equal(3);
        });
        expect(a()).deep.equal([1, 2, 3, 4]);
        expect(l()).equal(4);
    });

    it("pop acts like Array.prototype.pop", function () {
        S.freeze(function () {
            expect(a.pop()).equal(3);
            expect(a.pop()).equal(2);
            expect(a.pop()).equal(1);
            expect(a.pop()).equal(undefined);
            expect(a.pop()).equal(undefined);
            expect(a()).deep.equal([1, 2, 3]);
            expect(l()).equal(3);
        });
        expect(a()).deep.equal([]);
        expect(l()).equal(0);
    });

    it("unshift acts like Array.prototype.unshift", function () {
        S.freeze(function () {
            expect(a.unshift(0)).equal(a);
            expect(a()).deep.equal([1, 2, 3]);
            expect(l()).equal(3);
        });
        expect(a()).deep.equal([0, 1, 2, 3]);
        expect(l()).equal(4);
    });

    it("shift acts like Array.prototype.shift", function () {
        S.freeze(function () {
            expect(a.shift()).equal(1);
            expect(a.shift()).equal(2);
            expect(a.shift()).equal(3);
            expect(a.shift()).equal(undefined);
            expect(a.shift()).equal(undefined);
            expect(a()).deep.equal([1, 2, 3]);
            expect(l()).equal(3);
        });
        expect(a()).deep.equal([]);
        expect(l()).equal(0);
    });

    it("splice acts like Array.prototype.splice", function () {
        S.freeze(function () {
            expect(a.splice(1, 1, 4, 5)).equal(a);
            expect(a()).deep.equal([1, 2, 3]);
            expect(l()).equal(3);
        });
        expect(a()).deep.equal([1, 4, 5, 3]);
        expect(l()).equal(4);
    });

    it("remove removes the first occurence of the item", function () {
        S.freeze(function () {
            a.push(1);
            expect(a.remove(1)).equal(a);
            expect(a()).deep.equal([1, 2, 3]);
            expect(l()).equal(3);
        });
        expect(a()).deep.equal([2, 3, 1]);
        expect(l()).equal(3);
    });

    it("removeAll removes all occurence of the item", function () {
        S.freeze(function () {
            a.push(1);
            expect(a.removeAll(1)).equal(a);
            expect(a()).deep.equal([1, 2, 3]);
            expect(l()).equal(3);
        });
        expect(a()).deep.equal([2, 3]);
        expect(l()).equal(2);
    });
});

describe("SArray.concat", function () {
    var a1, a2, a3;

    beforeEach(function () {
        a1 = SArray([1]);
        a2 = SArray([2]);
        a3 = SArray([3]);
    });

    it("combines all passed SArrays in order", function () {
        S.root(function () {
            var s = a1.concat(a2, a3);

            expect(s()).deep.equal([1, 2, 3]);
        });
    });

    it("responds to changes in all arrays", function () {
        S.root(function () {
            var s = a1.concat(a2, a3);

            expect(s()).deep.equal([1, 2, 3]);
            a1.push(4);
            expect(s()).deep.equal([1, 4, 2, 3]);
            a2.pop();
            expect(s()).deep.equal([1, 4, 3]);
            a3([5, 6]);
            expect(s()).deep.equal([1, 4, 5, 6]);
        });
    });
});

describe("SArray.every", function () {
    it("behaves like Array.prototype.every", function () {
        S.root(function () {
            var a = SArray([1, 3, 2]);
            expect(a.every(function (v) { return v > 0; })()).equal(true);
            expect(a.every(function (v) { return v > 1; })()).equal(false);
        });
    });

    it("is true for an empty array", function () {
        S.root(function () {
            var s = SArray([]).every(function () { return false; });
            expect(s()).equal(true);
        });
    });

    it("responds to changes in source", function () {
        S.root(function () {
            var a = SArray([2, 3, 1]),
                s = a.every(function (v) { return v > 1; });

            expect(s()).equal(false);
            a.pop();
            expect(s()).equal(true);
            a.push(0);
            expect(s()).equal(false);
        });
    });
});

describe("SArray.filter", function () {
    it("behaves like Array.prototype.filter", function () {
        S.root(function () {
            var a = SArray([1, 3, 2]);
            expect(a.filter(function (v) { return v > 0; })()).deep.equal([1, 3, 2]);
            expect(a.filter(function (v) { return v > 1; })()).deep.equal([3, 2]);
        });
    });

    it("responds to changes in source", function () {
        S.root(function () {
            var a = SArray([2, 3, 1]),
            s = a.filter(function (v) { return v > 1; });

            expect(s()).deep.equal([2, 3]);
            a.shift();
            expect(s()).deep.equal([3]);
            a.push(4);
            expect(s()).deep.equal([3, 4]);
        });
    });
});

describe("SArray.find", function () {
    it("behaves like Array.prototype.find", function () {
        S.root(function () {
            var a = SArray([1, 3, 2]);
            expect(a.find(function (v) { return v > 0; })()).deep.equal(1);
            expect(a.find(function (v) { return v > 1; })()).deep.equal(3);
            expect(a.find(function (v) { return v > 4; })()).be.undefined;
        });
    });

    it("responds to changes in source", function () {
        S.root(function () {
            var a = SArray([2, 3]),
            s = a.find(function (v) { return v > 2; });

            expect(s()).deep.equal(3);
            a.shift();
            expect(s()).deep.equal(3);
            a.push(4);
            expect(s()).deep.equal(3);
        });
    });
});

describe("SArray.forEach", function () {
    var a;

    beforeEach(function () {
        a = SArray(["a", "b", "c"]);
    });

    it("behaves like Array.prototype.forEach", function () {
        S.root(function () {
            var r = "";
            a.forEach(function (v) { r += v; });
            expect(r).deep.equal("abc");
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var r = "";
            a.forEach(function (v) { r += v; });
            a.unshift("d");
            expect(r).deep.equal("abcd");
        });
    });

    it("ignores prior items", function () {
        S.root(function () {
            var enter = jasmine.createSpy();
            a.forEach(enter);
            enter.calls.reset();
            a.unshift("d");
            expect(enter.calls.count()).equal(1);
            (enter).toHaveBeenCalledWith("d", 0);
        });
    });

    it("reports when a value exits the array", function () {
        S.root(function () {
            var exit = jasmine.createSpy();
            a.forEach(x => x, exit);
            a.pop();
            expect(exit.calls.count()).equal(1);
            (exit).toHaveBeenCalledWith("c", 2);
        });
    });

    it("reports when a value moves in the array", function () {
        S.root(function () {
            var move = jasmine.createSpy();
            a.forEach(x => x, null, move);
            a(["a", "c", "b"]);
            expect(move.calls.count()).equal(1);
            (move).toHaveBeenCalledWith([1, 2], [2, 1]);
        });
    });

    it("ignores changes to other dependencies", function () {
        S.root(function () {
            var d = S.data(1),
                enter = jasmine.createSpy();
            a.forEach(function (v) { d(); enter(); });
            enter.calls.reset();
            d(2);
            expect(enter.calls.count()).equal(0);
        });
    });
});

describe("SArray.includes", function () {
    it("behaves like Array.prototype.includes", function () {
        S.root(function () {
            var a = SArray([1, 3, 2]);
            expect(a.includes(3)()).equal(true);
            expect(a.includes(4)()).equal(false);
        });
    });

    it("responds to changes in source", function () {
        S.root(function () {
            var a = SArray([2, 3, 1]),
                s = a.includes(2);

            expect(s()).equal(true);
            a.shift();
            expect(s()).equal(false);
            a.push(2);
            expect(s()).equal(true);
        });
    });
});

describe("SArray.map", function () {
    var a;

    beforeEach(function () {
        a = SArray([1, 3, 2]);
    });

    it("behaves like Array.prototype.map", function () {
        S.root(function () {
            var s = a.map(function (x) { return x * 2; });
            expect(s()).deep.equal([2, 6, 4]);
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var s = a.map(function (x) { return x * 2; });
            a.push(4);
            expect(s()).deep.equal([2, 6, 4, 8]);
        });
    });

    it("preserves prior computations", function () {
        S.root(function () {
            var s = a.map(function (x) { return Math.random(); }),
                pre = s().slice();
            a.push(4);
            expect(pre).deep.equal(s().slice(0, -1));
        });
    });

    it("reports when a value exits the array", function () {
        S.root(function () {
            var exit = jasmine.createSpy();
            a.map(x => x, exit);
            a.pop();
            (exit).toHaveBeenCalledWith(2, 2, 2);
        });
    });

    it("reports when a value moves in the array", function () {
        S.root(function () {
            var move = jasmine.createSpy();
            a.map(x => x, null, move);
            a([1, 2, 3]);
            (move).toHaveBeenCalledWith([1, 3, 2], [1, 3, 2], [1, 2], [2, 1]);
        });
    });

    it("tracks changes to other dependencies", function () {
        S.root(function () {
            var d = S.data(1),
                s = a.map(function (v) { return v + d(); });
            expect(s()).deep.equal([2, 4, 3]);
            d(2);
            expect(s()).deep.equal([3, 5, 4]);
            a.push(4);
            expect(s()).deep.equal([3, 5, 4, 6]);
        });
    });
});

describe("SArray.mapSample", function () {
    var a;

    beforeEach(function () {
        a = SArray([1, 3, 2]);
    });

    it("behaves like Array.prototype.map", function () {
        S.root(function () {
            var s = a.mapSample(function (x) { return x * 2; });
            expect(s()).deep.equal([2, 6, 4]);
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var s = a.mapSample(function (x) { return x * 2; });
            a.push(4);
            expect(s()).deep.equal([2, 6, 4, 8]);
        });
    });

    it("preserves prior computations", function () {
        S.root(function () {
            var s = a.mapSample(function (x) { return Math.random(); }),
                pre = s().slice();
            a.push(4);
            expect(pre).deep.equal(s().slice(0, -1));
        });
    });

    it("reports when a value exits the array", function () {
        S.root(function () {
            var exit = jasmine.createSpy();
            a.mapSample(x => x, exit);
            a.pop();
            (exit).toHaveBeenCalledWith(2, 2, 2);
        });
    });

    it("reports when a value moves in the array", function () {
        S.root(function () {
            var moveCalled = false,
                move = (...args) => {
                    moveCalled = true;
                    expect(args).deep.equal([[1, 3, 2], [1, 3, 2], [1, 2], [2, 1]]);
                };
            a.mapSample(x => x, null, move);
            expect(moveCalled).equal(false);
            a([1, 2, 3]);
            expect(moveCalled).equal(true);
        });
    });

    it("does not track changes to other dependencies", function () {
        S.root(function () {
            var d = S.data(1),
                s = a.mapSample(function (v) { return v + d(); });
            expect(s()).deep.equal([2, 4, 3]);
            d(2);
            expect(s()).deep.equal([2, 4, 3]);
            a.push(4);
            expect(s()).deep.equal([2, 4, 3, 6]);
        });
    });
});

describe("SArray.mapSequentially", function () {
    var a;

    beforeEach(function () {
        a = SArray([1, 3, 2]);
    });

    it("behaves like Array.prototype.map", function () {
        S.root(function () {
            var s = a.mapSequentially(function (x) { return x * 2; });
            expect(s()).deep.equal([2, 6, 4]);
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var s = a.mapSequentially(function (x) { return x * 2; });
            a.push(4);
            expect(s()).deep.equal([2, 6, 4, 8]);
        });
    });

    it("does not preserve prior computations", function () {
        S.root(function () {
            var s = a.mapSequentially(function (x) { return Math.random(); }),
                pre = s().slice();
            a.push(4);
            var post = s().slice();
            expect(post.length).equal(4);
            expect(pre[0]).not.deep.equal(post[0]);
            expect(pre[1]).not.deep.equal(post[1]);
            expect(pre[2]).not.deep.equal(post[2]);
        });
    });

    it("passes the result of prior computations to updates", function () {
        S.root(function () {
            var s = a.mapSequentially(function (x, p) { return x + (p | 0); });

            expect(s()).deep.equal([1, 3, 2]);

            a.push(4);

            expect(s()).deep.equal([2, 6, 4, 4]);

            a.push(5);

            expect(s()).deep.equal([3, 9, 6, 8, 5]);
        });
    });

    it("tracks changes to other dependencies", function () {
        S.root(function () {
            var d = S.data(1),
                s = a.mapSequentially(function (v) { return v + d(); });
            expect(s()).deep.equal([2, 4, 3]);
            d(2);
            expect(s()).deep.equal([3, 5, 4]);
            a.push(4);
            expect(s()).deep.equal([3, 5, 4, 6]);
        });
    });
});


describe("SArray.sort", function () {
    var a;

    beforeEach(function () {
        a = SArray([1, 3, 2]);
    });

    it("behaves like Array.prototype.sort", function () {
        S.root(function () {
            var s = a.sort();
            expect(s()).deep.equal([1, 2, 3]);
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var s = a.sort();
            a.push(0);
            expect(s()).deep.equal([0, 1, 2, 3]);
        });
    });

    it("can sort by a comparator function", function () {
        S.root(function () {
            var s = a.sort(function (a, b) { return b - a; });
            expect(s()).deep.equal([3, 2, 1]);
        });
    });
});

describe("SArray.reduce", function () {
    it("behaves like Array.prototype.forEach", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c"]),
                s = a.reduce(function (a, v) { return a + v; }, "");
            expect(s()).deep.equal("abc");
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c"]),
                s = a.reduce(function (a, v) { return a + v; }, function () { return ""; });
            a.push("d");
            expect(s()).deep.equal("abcd");
            a.shift();
            expect(s()).deep.equal("bcd");
        });
    });
});

describe("SArray.reduceRight", function () {
    it("behaves like Array.prototype.forEach", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c"]),
                s = a.reduceRight(function (a, v) { return a + v; }, "");
            expect(s()).deep.equal("cba");
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c"]),
                s = a.reduceRight(function (a, v) { return a + v; }, function () { return ""; });
            a.push("d");
            expect(s()).deep.equal("dcba");
            a.shift();
            expect(s()).deep.equal("dcb");
        });
    });
});

describe("SArray.reverse", function () {
    it("behaves like Array.prototype.reverse", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c"]),
                s = a.reverse();
            expect(s()).deep.equal(["c", "b", "a"]);
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c"]),
                s = a.reverse();
            a.push("d");
            expect(s()).deep.equal(["d", "c", "b", "a"]);
            a.shift();
            expect(s()).deep.equal(["d", "c", "b"]);
        });
    });
});

describe("SArray.slice", function () {
    it("behaves like Array.prototype.slice", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c", "d", "e", "f", "g", "h"]);
            expect(a.slice(0, 4)()).deep.equal(["a", "b", "c", "d"]);
            expect(a.slice(3, 7)()).deep.equal(["d", "e", "f", "g"]);
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c", "d", "e", "f", "g", "h"]),
                s = a.slice(1, 4);
            a.unshift("d");
            expect(s()).deep.equal(["a", "b", "c"]);
            a.shift();
            expect(s()).deep.equal(["b", "c", "d"]);
        });
    });
});

describe("SArray.some", function () {
    it("behaves like Array.prototype.some", function () {
        S.root(function () {
            var a = SArray([1, 3, 2]);
            expect(a.some(function (v) { return v > 2; })()).equal(true);
            expect(a.some(function (v) { return v > 3; })()).equal(false);
        });
    });

    it("is false for an empty array", function () {
        S.root(function () {
            var s = SArray([]).some(function () { return false; });
            expect(s()).equal(false);
        });
    });

    it("responds to changes in source", function () {
        S.root(function () {
            var a = SArray([2, 3, 1]),
                s = a.some(function (v) { return v > 2; });

            expect(s()).equal(true);
            a.splice(1, 1);
            expect(s()).equal(false);
            a.push(4);
            expect(s()).equal(true);
        });
    });
});

describe("SArray.combine", function () {
    it("combines an array signal of signals to an array signal of values", function () {
        S.root(function () {
            var a = SArray(["a", "b", "c"]).mapS(x => x),
                s = a.combine();
            expect(s()).deep.equal(["a", "b", "c"]);
        });
    })
});

describe("SArray.orderBy", function () {
    var a, b;

    beforeEach(function () {
        a = SArray([1, 3, 2]);
        b = SArray(["cc", "a", "bbb"]);
    });

    it("can sort using a getter function", function () {
        S.root(function () {
            var s = a.orderBy(function (v) { return -v; });
            expect(s()).deep.equal([3, 2, 1]);
        });
    });

    it("can sort using a property name", function () {
        S.root(function () {
            var s = b.orderBy('length');
            expect(s()).deep.equal(["a", "cc", "bbb"]);
        });
    });

    it("tracks changes in source", function () {
        S.root(function () {
            var s = a.orderBy(function (v) { return -v; });
            a.push(0);
            expect(s()).deep.equal([3, 2, 1, 0]);
        });
    });
});

describe("SArray.length", function () {
    it("can provide the length of the underneath array", function () {

        var a = SArray([])
        expect(a.length).equal(0);
        a.push('a');
        expect(a.length).equal(1);
        a.push('a');
        expect(a.length).equal(2);
        a.pop();
        expect(a.length).equal(1);

        expect(lift(S.data([])).length).equal(0);
        expect(lift(S.data([1, 2, 3])).length).equal(3);

    });

    it("should trigger updates when length is changed", function () {
        S.root(dispose => {
            var a = SArray([]);

            var enter = jasmine.createSpy();
            S.on(a, () => enter(a.length));

            enter.toHaveBeenCalledWith(0);

            a.push('a');
            enter.toHaveBeenCalledWith(1);

            a.push('a');
            enter.toHaveBeenCalledWith(2);

            a.pop();
            enter.toHaveBeenCalledWith(1);

            dispose();
        });
    });
});
