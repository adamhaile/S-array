declare var SArray : {
	<T>(v : T[]) : SDataArray<T>;
    lift<T>(a : () => T[]) : SArray<T>;
}

export = SArray;

interface SArray<T> {
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
    
    mapS<U>(fn : (v : T, m : U | undefined, i : number) => U, exit? : (v : T, m : U, i : number) => void, move? : (items : T[], mapped : (() => U)[], from : number[], to : number[]) => void) : SArray<() => U> & { combine() : Array<U> };
    mapSample<U>(fn : (v : T) => U, exit? : (v : T, i : number) => void, move? : (from : number[], to : number[]) => void) : SArray<U>;
    orderBy<U>(key : (v : T) => U) : SArray<T>;
}

interface SDataArray<T> extends SArray<T> {
    (v : T[]) : T[];

    push(v : T) : SDataArray<T>;
    pop() : T;
    unshift(v : T) : SDataArray<T>;
    shift() : T;
    splice(i : number, len : number, ...items : T[]) : SDataArray<T>;
    remove(v : T) : SDataArray<T>;
    removeAll(v : T) : SDataArray<T>;
}
