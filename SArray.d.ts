
declare var SArray : {
	<T>(v : T[]) : SMutableArray<T>;
}

export default SArray;

export interface SArray<T> {
    () : T[];

    concat(...others : SArray<T>[]) : SArray<T>;
    every(pred : (v : T) => boolean) : () => boolean;
    filter(pred : (v : T) => boolean) : SArray<T>;
    find(pred : (v : T) => boolean) : () => T;
    forEach(fn : (v : T) => void, exit? : (v : T, i : number) => void, move? : (from : number[], to : number[]) => void) : SArray<T>;
    includes(v : T) : () => boolean;
    map<U>(fn : (v : T) => U, exit? : (v : T, i : number) => void, move? : (from : number[], to : number[]) => void) : SArray<U>;
    sort(fn : (a : T, b : T) => number) : SArray<T>;
    reduce<U>(fn : (cur : U, v : T, i? : number, l? : T[]) => U) : () => U;
    reduceRight<U>(fn : (cur : U, v : T, i? : number, l? : T[]) => U) : () => U;
    reverse() : SArray<T>;
    slice(s : number, e : number) : SArray<T>;
    some(pred : (v : T) => boolean) : () => boolean;

    mapS<U>(fn : (v : T) => U) : SSignalArray<U>;
    orderBy<U>(key : (v : T) => U) : SArray<T>;
}

export interface SSignalArray<T> extends SArray<() => T> {
    combine() : Array<T>;
}

export interface SMutableArray<T> extends SArray<T> {
    (v : T[]) : T[];

    push(v : T) : T;
    pop() : T;
    unshift(v : T) : T;
    shift() : T;
    splice(i : number, len : number, ...items : T[]) : SMutableArray<T>;
    remove(v : T) : SMutableArray<T>;
    removeAll(v : T) : SMutableArray<T>;
}
