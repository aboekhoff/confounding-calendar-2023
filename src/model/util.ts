import { V3, V3i, V } from './vec';
import { RNG_SEED } from './constants';

export function makeArray2d<T>(w: number, h: number, fill: T) {
    const out: T[][] = [];
    for (let i = 0; i < h; i++) {
        const row: T[] = [];
        out.push(row)
        for (let j = 0; j < w; j++) {
            row.push(fill);
        }
    }
    return out;
}

function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export const rand = mulberry32(RNG_SEED);

export function randf(min: number, max: number) {
    return rand() * (max - min) + min;
}

export function randi(min: number, max: number) {
    return Math.floor(randf(min, max));
}

export function i2rgba(i: number): number[] {
    const r = i & 255;
    const g = (i >> 8) & 255;
    const b = (i >> 16) & 255;
    return [r, g, b, 0];
}

export function rgba2i(r: number, g: number, b: number, a: number) {
    return r | (g << 8) | (b << 16);
}

export function throttle(f: Function, ms: number) {
    let then = new Date().getTime();
    return function(...xs: any[]) {
        const now = new Date().getTime();
        const delta = now - then;
        if (delta < ms) {
            return;
        }
        then = now;
        return f(...xs);
    }
}

export function rotate90(min: V3, max: V3, pos: V): V3 {
    const spanX = max.x - min.x;
    const spanY = max.y - min.y;    
    const normX = pos.x - min.x;
    const normY = pos.y - min.y;

    const out = V3.create(
        (spanY - normY) + min.y,
        (normX) + min.x,
        pos.z
    );

    return out;
}

export function rotate(min: V3, max: V3, pos: V, rotation: number) {
    switch (rotation) {
        case 0: return pos;
        case 1: return rotate90(min, max, pos);
        case 2: return rotate90(min, max, rotate90(min, max, pos));
        case 3: return rotate90(min, max, rotate90(min, max, rotate90(min, max, pos)));
        default: return pos;
    }
}