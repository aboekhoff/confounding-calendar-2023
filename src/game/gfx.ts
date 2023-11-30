import { Entity, PlaybackMode } from "../model/entity";
import { makeArray2d, i2rgba } from "../model/util";
import { IS_PROD } from "../model/constants";

export interface SpriteData {
    name: string;
    rect: { x: number, y: number, w: number, h: number };
    frames: number;
    speed?: number;
    mode?: string;
    drop?: number;
} 

export const type2Sprite: Record<string, string> = {
    "WIZARD": "wiz",
    "BLOCK_1": "block-1",
    "BLOCK_2": "block-2",
    "BLOCK_3": "block-3",
    "BLOCK_4": "block-4",
    "BLOCK_5": "block-5",
    "BLOCK_6": "block-6",
    "MIRROR_1_NE": "mirror-1-ne",
    "MIRROR_1_NW": "mirror-1-nw",
    "MIRROR_1_SW": "mirror-1-sw",
    "MIRROR_1_SE": "mirror-1-se",
    "MIRROR_2_NE": "mirror-2-ne",
    "MIRROR_2_NW": "mirror-2-nw",
    "MIRROR_2_SW": "mirror-2-sw",
    "MIRROR_2_SE": "mirror-2-se",
    "EXIT": "exit",
    "BOX": "box",
    "PULSE": "pulse",
}

export const spriteData: Record<string, SpriteData> = {
    wiz: {
        name: "wiz",
        rect: { x: 0, y: 0, w: 32, h: 32 },
        frames: 16,
        speed: 96,
    },
    "block-1": {
        name: "block-1",
        rect: { x: 0, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    "block-2": {
        name: "block-2",
        rect: { x: 32, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    "block-3": {
        name: "block-3",
        rect: { x: 64, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    "block-4": {
        name: "block-4",
        rect: { x: 96, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    "block-5": {
        name: "block-5",
        rect: { x: 128, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    "block-6": {
        name: "block-6",
        rect: { x: 128 + 32, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    "block-highlight": {
        name: "block-highlight",
        rect: { x: 32 * 15, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    block: {
        name: "block",
        rect: { x: 0, y: 32, w: 32, h: 32 },
        frames: 6,
    },
    "block-frame": {
        name: "block-frame",
        rect: { x: 32 * 14, y: 32, w: 32, h: 32 },
        frames: 1,
    },
    dot: {
        name: "dot",
        rect: { x: 64, y: 64, w: 32, h: 16 },
        frames: 2,
    },
    highlight: {
        name: "highlight",
        rect: { x: 128, y: 64, w: 32, h: 16 },
        frames: 1,
    },
    eraser: {
        name: "eraser",
        rect: { x: 128 + 32, y : 64, w: 32, h: 16 },
        frames: 1,
    },
    "rotate-right": {
        name: "rotate-right",
        rect: { x: 128 + 64, y : 64, w: 32, h: 16 },
        frames: 1,
    },
    "rotate-left": {
        name: "rotate-left",
        rect: { x: 128 + 96, y: 64, w:32, h: 16 },
        frames: 1,
    },
    "play": {
        name: "play",
        rect: { x: 256, y: 64, w:32, h: 16 },
        frames: 1,
    },
    "save": {
        name: "save",
        rect: { x: 256 + 32, y: 64, w: 32, h: 16 },
        frames: 1,
    },
    "folder": {
        name: "folder",
        rect: { x: 256 + 64, y: 64, w: 32, h: 16 },
        frames: 1,
    },
    "copy": {
        name: "copy",
        rect: { x: 256 + 96, y: 64, w: 32, h: 16 },
        frames: 1,
    },
    "undo": {
        name: "undo",
        rect: { x: 256 + 128, y: 64, w: 32, h: 16 },
        frames: 1,
    },
    "redo": {
        name: "redo",
        rect: { x: 256 + 128 + 32, y: 64, w: 32, h: 16 },
        frames: 1,
    },
    "plus": {
        name: "plus",
        rect: { x: 256 + 128 + 64, y: 64, w: 32, h: 16 },
        frames: 1,
    },
    "mirror-1-se": {
        name: "mirror-1-se",
        rect: { x: 0, y: 64 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "mirror-1-sw": {
        name: "mirror-1-sw",
        rect: { x: 32, y: 64 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "mirror-1-nw": {
        name: "mirror-1-nw",
        rect: { x: 64, y: 64 + 16, w: 32, h: 32},
        frames: 1,
    },
    "mirror-1-ne": {
        name: "mirror-1-ne",
        rect: { x: 96, y: 64 + 16, w: 32, h: 32},
        frames: 1,
    },
    "mirror-2-se": {
        name: "mirror-2-se",
        rect: { x: 0, y: 64 + 32 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "mirror-2-sw": {
        name: "mirror-2-sw",
        rect: { x: 32, y: 64 + 32 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "mirror-2-nw": {
        name: "mirror-2-nw",
        rect: { x: 64, y: 64 + 32 + 16, w: 32, h: 32},
        frames: 1,
    },
    "mirror-2-ne": {
        name: "mirror-2-ne",
        rect: { x: 96, y: 64 + 32 + 16, w: 32, h: 32},
        frames: 1,
    },
    "box": {
        name: "box",
        rect: { x: 64, y: 64 * 2 + 16, w: 32, h: 32},
        frames: 1,
    },
    "base-block": {
        name: "base-block",
        rect: { x: 96, y: 64 * 2 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "exit": {
        name: "exit",
        rect: { x: 0, y: 64 + 32 * 3 + 16, w: 32, h: 32 },
        frames: 6,
        speed: 128 + 64,
    },
    "font-1": {
        name: "font-1",
        rect: { x: 0, y: 64 + 32 * 4 + 16, w: 32, h: 32 },
        frames: 16, 
    },
    "font-2": {
        name: "font-2",
        rect: { x: 0, y: 64 + 32 * 5 + 16, w: 32, h: 32 },
        frames: 16, 
    },
    "font-3": {
        name: "font-3",
        rect: { x: 0, y: 64 + 32 * 6 + 16, w: 32, h: 32 },
        frames: 16, 
    },
    "power-block-inactive": {
        name: "power-block-inactive",
        rect: { x: 0, y: 64 + 32 * 7 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "power-block-active": {
        name: "power-block-active",
        rect: { x: 32, y: 64 + 32 * 7 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "elevator-block-inactive": {
        name: "elevator-block-inactive",
        rect: { x: 64, y: 64 + 32 * 7 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "elevator-block-active": {
        name: "elevator-block-active",
        rect: { x: 96, y: 64 + 32 * 7 + 16, w: 32, h: 32 },
        frames: 1,
    },
    "font-4": {
        name: "font-4",
        rect: { x: 0, y: 64 + 32 * 8 + 16, w: 16, h: 16 },
        frames: 26 + 6, 
    },
    "font-5": {
        name: "font-5",
        rect: { x: 0, y: 64 + 32 * 8 + 16 * 2, w: 16, h: 16 },
        frames: 15,
    },
    "pulse": {
        name: "pulse",
        rect: { x: 0, y: 64 + 32 * 8 + 16 * 3, w: 32, h: 32 },
        frames: 10,
        speed: 32,
        drop: 2,
    },
    "burst": {
        name: "burst",
        rect: { x: 0, y: 64 + 32 * 9 + 16 * 3, w: 32, h: 32},
        frames: 16,
        speed: 24,
        mode: PlaybackMode.ONCE,
    },
    "sticker-move":
    {
        name: "sticker-move",
        rect: { x: 0, y: 64 + 32 * 10 + 16 * 3, w: 64, h: 64 },
        frames: 1,
    },
    "sticker-cast":
    {
        name: "sticker-cast",
        rect: { x: 64, y: 64 + 32 * 10 + 16 * 3, w: 64, h: 64 },
        frames: 1,
    },
    "sticker-rotate": {
        name: "sticker-rotate",
        rect: { x: 128, y: 64 + 32 * 10 + 16 * 3, w: 64, h: 64 },   
        frames: 1,
    },
}

export const font2: Record<string, HTMLCanvasElement> = {};
export const font: Record<string, HTMLCanvasElement> = {};
export const sprites: Record<string, HTMLCanvasElement[]> = {};
export const spriteAlpha: Map<HTMLCanvasElement, boolean[][]> = new Map();

export function loadSprites(loadedCallback: () => void) {
    const img = document.createElement('img');
    img.onload = () => {
      setupSprites(img);
      setupFont();
      loadedCallback();  
    }

    if (IS_PROD) {
        img.src = "assets/spritesheet.png"
    } else {
        img.src = "assets/spritesheet.png";
    }
}

function computeSpriteAlpha(c: HTMLCanvasElement) {
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const out = makeArray2d<boolean>(c.width, c.height, false);

    for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
            const idx = y * (data.width * 4) + (x * 4) + 3;
            const pixel = data.data[idx];
            out[y][x] = pixel === 255;
        }
    }
    return out;
}

function setupFont() {
    const fontString1 = 'abcdefghijklmnop';
    const fontString2 = 'qrstuvwxyz012345';
    const fontString3 = '6789?!,\'." :)(;';

    const fontString4 = fontString1 + fontString2;
    const fontString5 = fontString3;

    const strings = [fontString1, fontString2, fontString3];
    for (let i = 0; i < strings.length; i++) {
        const key = "font-" + (i+1);
        const s = strings[i]; 
        for (let j = 0; j < s.length; j++) {
            const c = s[j];
            font[c] = sprites[key][j];
        }
    }

    const strings2 = [fontString4, fontString5];
    for (let i = 0; i < strings2.length; i++) {
        const key = "font-" + (i+4);
        const s = strings2[i]; 
        for (let j = 0; j < s.length; j++) {
            const c = s[j];
            font2[c] = sprites[key][j];
        }
    }
}

function setupSprites(img: HTMLImageElement) {
    for (const entry of Object.values(spriteData)) {
        const arr: HTMLCanvasElement[] = [];
        sprites[entry.name] = arr;
        for (let i = 0; i < entry.frames; i++) {
            const canvas = document.createElement('canvas');
            arr.push(canvas);
            canvas.width = entry.rect.w;
            canvas.height = entry.rect.h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(
                img, 
                entry.rect.x + (i * entry.rect.w), entry.rect.y, entry.rect.w, entry.rect.h,
                0, 0, entry.rect.w, entry.rect.h
            );
            spriteAlpha.set(canvas, computeSpriteAlpha(canvas));
        }
    }
}

export function setupPickerFrames(e: Entity) {
    const { id, frames } = e;
    const color = i2rgba(id);
    const pickerFrames: HTMLCanvasElement[] = [];
    e.pickerFrames = pickerFrames;
    for (const frame of frames) {
        const alpha = spriteAlpha.get(frame)!;
        const pickerFrame = document.createElement('canvas');
        pickerFrames.push(pickerFrame);
        pickerFrame.width = frame.width;
        pickerFrame.height = frame.height;
        const ctx = pickerFrame.getContext('2d', { willReadFrequently: true });
        const imageData = ctx!.createImageData(pickerFrame.width, pickerFrame.height);
        for (let y = 0; y < pickerFrame.height; y++) {
            for (let x = 0; x < pickerFrame.width; x++) {
                if (!alpha[y][x]) { continue; }
                const idx = y * (pickerFrame.width * 4) + (x * 4);
                imageData.data[idx] = color[0];
                imageData.data[idx+1] = color[1];
                imageData.data[idx+2] = color[2];
                imageData.data[idx+3] = 255;
            }
        }
        ctx!.putImageData(imageData, 0, 0);
    }
}

export function getSpriteForEntity(e: Entity) {
    let spriteKey = type2Sprite[e.type];
    if (e.destroyed) {
        spriteKey = "burst";
    }
    if (e.type === "POWER_BLOCK") {
        spriteKey = e.isActive ? "power-block-active" : "power-block-inactive";
    }
    if (e.type === "ELEVATOR_BLOCK") {
        spriteKey = e.isActive ? "elevator-block-active" : "elevator-block-inactive";
    }
    const { name, speed, drop, mode } = spriteData[spriteKey];
    const frames = sprites[spriteKey];
    return { name, frames, duration: speed, mode: mode || "LOOP", drop };
}