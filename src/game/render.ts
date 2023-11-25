import { Entity } from '../model/entity';
import { V3 } from '../model/vec';
import { rgba2i } from '../model/util';
import { TILE_WIDTH_HALF, TILE_HEIGHT_HALF, SCALE } from '../model/constants';

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
    const ctx = canvas.getContext('2d')!;
    for (const e of renderList) {
        const sprite = query != null ? e.pickerFrames[e.frameIndex] : e.frames[e.frameIndex];
        const offsetX = offset.x;
        const offsetY = offset.y;
        const sx = (e.screenPos.x * TILE_WIDTH_HALF) - (e.screenPos.y * TILE_WIDTH_HALF);
        let sy = (e.screenPos.x * TILE_HEIGHT_HALF) + (e.screenPos.y * TILE_HEIGHT_HALF);
        sy -= e.screenPos.z * (TILE_HEIGHT_HALF) * 2;

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
            sprite.width * SCALE, 
            sprite.height * SCALE
        );
    }
}

export function renderSprite(canvas: HTMLCanvasElement, offset: V3, e: Entity, sprite: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    const offsetX = offset.x;
    const offsetY = offset.y;

    const sx = (e.screenPos.x * TILE_WIDTH_HALF) - (e.screenPos.y * TILE_WIDTH_HALF);
    let sy = (e.screenPos.x * TILE_HEIGHT_HALF) + (e.screenPos.y * TILE_HEIGHT_HALF);
    sy -= e.screenPos.z * (TILE_HEIGHT_HALF) * 2;
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        sprite,
        0, 
        0, 
        sprite.width, 
        sprite.height,
        offsetX + sx,
        offsetY + sy, 
        sprite.width * SCALE, 
        sprite.height * SCALE
    );
}