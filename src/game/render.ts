import { Entity } from '../model/entity';
import { V3 } from '../model/vec';
import { rgba2i } from '../model/util';
import { font, font2 } from './gfx';
import { TILE_WIDTH_HALF, TILE_HEIGHT_HALF, TEXT_SCALE } from '../model/constants';
import { state } from '../model/shared';

const pickerCanvas = document.createElement('canvas');

export function pick(parentCanvas: HTMLCanvasElement, offset: V3, renderList: Entity[], x: number, y: number): number {
    pickerCanvas.width = parentCanvas.width;
    pickerCanvas.height = parentCanvas.height;
    const ctx = pickerCanvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, pickerCanvas.width, pickerCanvas.height);
    renderEntities(pickerCanvas, offset, renderList, { x, y });
    const imageData = ctx.getImageData(x, y, 1, 1);
    const id = rgba2i(imageData.data[0], imageData.data[1], imageData.data[2], imageData.data[3]);
    return id;
} 

export function renderEntities(canvas: HTMLCanvasElement, offset: V3, renderList: Entity[], pickerCoords?: { x: number, y: number }) {
    renderList.sort((e1, e2) => {
        const d1 = e1.screenPos.x + e1.screenPos.y + e1.screenPos.z;
        const d2 = e1.screenPos.x + e2.screenPos.y + e2.screenPos.z;
        return d1 < d2 ? -1 : d2 < d1 ? 1 : 0;
    });

    let query = undefined;

    if (pickerCoords) {
        const px = pickerCoords.x;
        const py = pickerCoords.y;
        query = (x: number, y: number, w: number, h: number) => {
            if (px < x) { return false; }
            if (px > x + w) { return false; }
            if (py < y) { return false; }
            if (py > y + h) { return false; }
            return true;
        }
    }

    renderEntities1(canvas, offset, renderList, query);
}

export function renderEntities1(
    canvas: HTMLCanvasElement, 
    offset: V3, 
    renderList: Entity[], 
    query: ((x: number, y: number, w: number, h: number) => boolean) | undefined
) {
    const { scale } = state;

    const ctx = canvas.getContext('2d')!;
    for (const e of renderList) {
        const sprite = query != null ? e.pickerFrames[e.frameIndex] : e.frames[e.frameIndex];
        const offsetX = offset.x;
        const offsetY = offset.y;
        const sx = (e.screenPos.x * TILE_WIDTH_HALF * scale) - (e.screenPos.y * TILE_WIDTH_HALF * scale);
        let sy = (e.screenPos.x * TILE_HEIGHT_HALF * scale) + (e.screenPos.y * TILE_HEIGHT_HALF * scale);
        sy -= e.screenPos.z * (TILE_HEIGHT_HALF * scale) * 2;

        /*
        if (query) {
            if (!query(offsetX + sx, offsetX + sy, sprite.width * SCALE, sprite.height * SCALE)) {
                continue;
            } 
        }
        */

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            sprite,
            0, 
            0, 
            sprite.width, 
            sprite.height,
            offsetX + sx,
            offsetY + sy, 
            sprite.width * scale, 
            sprite.height * scale
        );
    }
}

// FIXME renderEntity is more appropriate naming
export function renderSprite(canvas: HTMLCanvasElement, offset: V3, e: Entity, sprite: HTMLCanvasElement) {
    _renderSprite(canvas, offset, e.screenPos, sprite);
}

export function _renderSprite(canvas: HTMLCanvasElement, offset: V3, pos: V3, sprite: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    const offsetX = offset.x;
    const offsetY = offset.y;

    const { scale } = state;

    const sx = (pos.x * TILE_WIDTH_HALF * scale) - (pos.y * TILE_WIDTH_HALF * scale);
    let sy = (pos.x * TILE_HEIGHT_HALF * scale) + (pos.y * TILE_HEIGHT_HALF * scale);
    sy -= pos.z * (TILE_HEIGHT_HALF * scale) * 2;
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        sprite,
        0, 
        0, 
        sprite.width, 
        sprite.height,
        offsetX + sx,
        offsetY + sy, 
        sprite.width * scale, 
        sprite.height * scale
    );
}


export function renderText(canvas: HTMLCanvasElement, offset: V3, pos: V3, text: string) {
    const lines = text.trim().split('\n');
    let z = lines.length + pos.z;
    let start = V3.create(pos.x, pos.y, z);
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        let _pos = V3.create(start.x, start.y, start.z);
        for (let i = line.length-1; i >= 0; i--) {
            const c = line[i];
            const sprite = font[c];
            _renderSprite(canvas, offset, _pos, sprite);
            _pos = V3.add(_pos, V3.back);
        }
        start = V3.add(start, V3.up);
    }
}

export function renderFlatSprite(canvas: HTMLCanvasElement, sprite: HTMLCanvasElement, x: number, y: number) {
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        sprite,
        0, 0, sprite.width, sprite.height,
        x, y, sprite.width * TEXT_SCALE, sprite.height * TEXT_SCALE
    );
}

export function renderFlatText(canvas: HTMLCanvasElement, offset: V3, center: V3, text: string) {
    
    const lines = text.trim().split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const half = line.length/2;
        for (let j = 0; j < line.length; j++) {
            const c = line[j];
            const sprite = font2[c];
            renderFlatSprite(
                canvas,
                sprite,
                (offset.x - half) + j + center.x, 
                offset.y + (center.y - lines.length) + i
            );
            
        }
    }
}