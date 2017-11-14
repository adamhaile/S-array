export interface SArray<T> {
    (): T[];
    concat(...others: (() => T | T[])[]): SArray<T>;
    every(pred: (v: T) => boolean): () => boolean;
    filter(pred: (v: T) => boolean): SArray<T>;
    find(pred: (v: T) => boolean): () => T | undefined;
    forEach(fn: (v: T) => void, exit?: (v: T, i: number) => void, move?: (from: number[], to: number[]) => void): SArray<T>;
    includes(v: T): () => boolean;
    map<U>(fn: (v: T, m: U | undefined, i: number) => U, exit?: (v: T, m: U, i: number) => void, move?: (items: T[], mapped: U[], from: number[], to: number[]) => void): SArray<U>;
    sort(fn: (a: T, b: T) => number): SArray<T>;
    reduce<U>(fn: (cur: U, v: T, i?: number, l?: T[]) => U, seed: U | (() => U)): () => U;
    reduceRight<U>(fn: (cur: U, v: T, i?: number, l?: T[]) => U, seed: U | (() => U)): () => U;
    reverse(): SArray<T>;
    slice(s: number, e: number): SArray<T>;
    some(pred: (v: T) => boolean): () => boolean;
    mapS<U>(fn: (v: T, m: U | undefined, i: number) => U, exit?: (v: T, m: U, i: number) => void, move?: (items: T[], mapped: (() => U)[], from: number[], to: number[]) => void): SSignalArray<U>;
    mapSample<U>(fn: (v: T, m: U | undefined, i: number) => U, exit?: (v: T, m: U, i: number) => void, move?: (items: T[], mapped: U[], from: number[], to: number[]) => void): SArray<U>;
    mapSequentially<U>(fn: (v: T, m: U | undefined, i: number) => U): SArray<U>;
    orderBy<U>(key: (v: T) => U): SArray<T>;
}
export interface SSignalArray<T> extends SArray<() => T> {
    combine(): SArray<T>;
}
export interface SDataArray<T> extends SArray<T> {
    (v: T[]): T[];
    push(v: T): SDataArray<T>;
    pop(): T | undefined;
    unshift(v: T): SDataArray<T>;
    shift(): T | undefined;
    splice(i: number, len: number, ...items: T[]): SDataArray<T>;
    remove(v: T): SDataArray<T>;
    removeAll(v: T): SDataArray<T>;
}
export default function SArray<T>(values: T[]): SDataArray<T>;
export declare function lift<T>(seq: () => T[]): SArray<T>;
export declare function mapS<T, U>(seq: () => T[], enter: (v: T, m: U | undefined, i: number) => U, exit?: (v: T, m: U, i: number) => void, move?: (items: T[], mapped: (() => U)[], from: number[], to: number[]) => void): () => (() => U)[];
export declare function mapSample<T, U>(seq: () => T[], enter: (v: T, m: U | undefined, i: number) => U, exit?: (v: T, m: U, i: number) => void, move?: (items: T[], mapped: U[], from: number[], to: number[]) => void): () => U[];
export declare function mapSequentially<T, U>(seq: () => T[], update: (v: T, m: U | undefined, i: number) => U): () => U[];
export declare function forEach<T>(seq: () => T[], enter: (v: T, i: number) => void, exit?: (v: T, i: number) => void, move?: (from: number[], to: number[]) => void): () => T[];
export declare function combine<T>(seq: () => (() => T)[]): () => T[];
export declare function map<T, U>(seq: () => T[], enter: (v: T, m: U | undefined, i: number) => U, exit?: (v: T, m: U, i: number) => void, move?: (items: T[], mapped: U[], from: number[], to: number[]) => void): () => U[];
export declare function find<T>(seq: () => T[], pred: (v: T) => boolean): () => T | undefined;
export declare function includes<T>(seq: () => T[], o: T): () => boolean;
export declare function sort<T>(seq: () => T[], fn?: (a: T, b: T) => number): () => T[];
export declare function orderBy<T>(seq: () => T[], by: keyof T | ((v: T) => any)): () => T[];
export declare function filter<T>(seq: () => T[], predicate: (v: T) => boolean): () => T[];
export declare function concat<T>(seq: () => T[], ...others: (() => T | T[])[]): () => T[];
export declare function reduce<T, U>(seq: () => T[], fn: (r: U, t: T, i: number, s: T[]) => U, seed: U | (() => U)): () => U;
export declare function reduceRight<T, U>(seq: () => T[], fn: (r: U, t: T, i: number, s: T[]) => U, seed: U | (() => U)): () => U;
export declare function every<T>(seq: () => T[], fn: (v: T) => boolean): () => boolean;
export declare function some<T>(seq: () => T[], fn?: (v: T) => boolean): () => boolean;
export declare function reverse<T>(seq: () => T[]): () => T[];
export declare function slice<T>(seq: () => T[], s: number, e: number): () => T[];
