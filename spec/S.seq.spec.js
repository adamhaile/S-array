
test("S.seq creation", function () {
    var s = S.seq([1, 2, 3]);

    ok(s, "can be created");

    deepEqual(s(), [1, 2, 3], "contains expected values");

    var t = S([1, 2, 3, 4]);

    ok(t, "can be created with S([...]) shorthand");

    deepEqual(t(), [1, 2, 3, 4], "object created by S([...]) shorthand contains expected values");
});

test("S.seq reset", function () {
    var s = S.seq([1, 2, 3]);

    s([4, 5, 6]);

    deepEqual(s(), [4,5,6], "seq reflects reset values");
});

test("S.seq.add", function () {
    var s = S.seq([1, 2, 3]);

    s.add(4);

    deepEqual(s(), [1, 2, 3, 4], "added item appears in values");
});

test("S.seq.remove", function () {
    var s = S.seq([1, 2, 3, 4, 5]);

    s.remove(5);

    deepEqual(s(), [1, 2, 3, 4], "value removed from end is gone");

    s.remove(3);

    deepEqual(s(), [1, 2, 4], "value removed from middle is gone");

    s.remove(1);

    deepEqual(s(), [2, 4], "value removed from beginning is gone");
});

test("S.seq.map creation", function () {
    var s = S.seq([1, 2, 3]),
    m = s .S. map(function (i) { return i * 2; });

    ok(m, "map returns object");

    ok(m.S, "object returned by map is a seq");

    deepEqual(m(), [2, 4, 6], "map contains expected values");
});

test("S.seq.map with add", function () {
    var s = S.seq([1, 2, 3]),
    m = s .S. map(function (i) { return i * 2; });

    s.add(4);

    deepEqual(m(), [2, 4, 6, 8], "map updates with expected added value");
});

test("S.seq.map with remove", function () {
    var s = S.seq([1, 2, 3, 4, 5]),
    exited = [],
    m = s .S. map(function (i) { return i * 2; }, function (i) { exited.push(i); });

    s.remove(5);

    deepEqual(m(), [2, 4, 6, 8], "map responds to removal from end");
    deepEqual(exited, [10], "exit called for value removed from end");

    s.remove(3);

    deepEqual(m(), [2, 4, 8], "map responds to removal from middle");
    deepEqual(exited, [10, 6], "exit called for value removed from middle");

    s.remove(1);

    deepEqual(m(), [4, 8], "map responds to removal from start");
    deepEqual(exited, [10, 6, 2], "exit called for value removed from start");
});

test("S.seq.enter creation", function () {
    var s = S.seq([1, 2, 3]),
    m = s .S. enter(function (i) { return i * 2; });

    ok(m, "enter returns object");

    ok(m.S, "object returned by enter is a seq");

    deepEqual(m(), [2, 4, 6], "enter contains expected values");
});

test("S.seq.enter with add", function () {
    var s = S.seq([1, 2, 3]),
    m = s .S. enter(function (i) { return i * 2; });

    s.add(4);

    deepEqual(m(), [2, 4, 6, 8], "enter updates with expected added value");
});

test("S.seq.enter with reset", function () {
    var s = S.seq([1, 2, 3]),
    m = s .S. enter(function (i) { return i * 2; });

    s([4, 5, 6]);

    deepEqual(m(), [8, 10, 12], "enter updates with expected added value");
});

test("S.seq.exit with reset", function () {
    var s = S.seq([1, 2, 3]),
    exited = [],
    m = s .S. exit(function (i) { exited.push(i); });

    s([3, 4, 5, 6]);

    deepEqual(m(), [3, 4, 5, 6], "exit returns correct array value");
    deepEqual(exited, [1, 2], "exit called for removed values");
});

test("S.seq.exit with remove", function () {
    var s = S.seq([1, 2, 3, 4, 5]),
    exited = [],
    m = s .S. exit(function (i) { exited.push(i); });

    s.remove(5);

    deepEqual(m(), [1, 2, 3, 4], "map responds to removal from end");
    deepEqual(exited, [5], "exit called for value removed from end");

    s.remove(3);

    deepEqual(m(), [1, 2, 4], "map responds to removal from middle");
    deepEqual(exited, [5, 3], "exit called for value removed from middle");

    s.remove(1);

    deepEqual(m(), [2, 4], "map responds to removal from start");
    deepEqual(exited, [5, 3, 1], "exit called for value removed from start");
});

test("S.seq.filter", function () {
    var s = S.seq([1, 2, 3, 4, 5, 6]),
    f = s .S. filter(function (n) { return n % 2; });

    deepEqual(f(), [1, 3, 5]);
});

test("S.seq.map with chanels", function () {
    var c = S(true),
    s = S([c]),
    f = function (c) { return c(); },
    m = s .S. map(f);

    c(false);

    deepEqual(m(), [true]);

    deepEqual(_.map(s(), f), [false]);

});

function mapSpeed() {
    var i, j, s, m, c = 0;

    for (i = 1; i <= 10000; i++) {
        s = S.seq([]);
        m = s.S.map(function (v) { c++; return v * 2; });
        for (j = 0; j < 50; j++) {
            s.add(j);
        }
    }

    return c;
}

function enterSpeed() {
    var i, j, s, m, c = 0;

    for (i = 1; i <= 10000; i++) {
        s = S.seq([]);
        m = s.S.enter(function (v) { c++; return v * 2; });
        for (j = 0; j < 50; j++) {
            s.add(j);
        }
    }

    return c;
}
