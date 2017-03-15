# SArray

Convenient array signals for [S.js](https://github.com/adamhaile/S).

SArray adds utility methods to S signals carrying arrays.  These utility methods parallel the standard ES3/5/6 array methods.

```javascript
// transformations without SArray
var arr      = S.data([1, 2, 3]),
    mapped   = S(() => arr().map(x => x * 2)),
    filtered = S(() => arr().filter(x => x > 2)); 

// transformations with SArray
var arr      = SArray([1, 2, 3]),
    mapped   = arr.map(x => x * 2), // arr() now has array methods
    filtered = arr.filter(x => x > 2);

// mutations without SArray
var tmp = S.sample(arr).slice(0);
tmp.push(4);
arr(tmp);

// mutations with SArray
arr.push(4);

// SArray methods also return SArrays
var mappedAndFiltered = arr.map(x => x * 2).filter(x => x > 2);

// Any array-carrying signal can be 'lifted' to create an SArray
var plain = S.data([1, 2, 3]),
    arr = SArray.lift(plain),
    mapped = arr.map(x => x * 2); // etc

// When an array signal changes, map() will re-use prior computations
// for new items that === the old.
var rands = arr.map(() => Math.random().toFixed(2));
rands(); // ["0.83", "0.75", "0.77"]
arr.push(4);
rands(); // ["0.83", "0.75", "0.77", "0.25"] unchanged values reused
```

For a full list of methods and thier signatures, consult [index.d.ts](index.d.ts).