import { setupPickerFrames, sprites } from '../game/gfx';
import { Game, Screen } from '../game/game';
import { pick, renderEntities, renderSprite } from '../game/render';
import { V3, V3i } from '../model/vec';
import { Entity } from '../model/entity';
import { Puzzle } from '../model/puzzle';
import * as preact from 'preact';
import { html } from '../ui/html';
import { Palette } from '../ui/Palette';
import { PICK_TIMEOUT } from '../model/constants';
import { PlayScreen } from '../screens/play';
import { Storage } from '../model/storage';

export interface BrushData {
    type: string;
    sprite: HTMLCanvasElement;

} 

interface Prototype {
    type: string;
    frames: HTMLCanvasElement[];
    frameDuration?: number;
}

const EditType = {
    CREATE: 'CREATE',
    DELETE: 'DELETE',
    REPLACE: 'REPLACE',
};

interface Edit {
    type: string,
    kind?: string,
    prevKind?: string,
    pos: V3i,
};

export class EditScreen implements Screen {
    public puzzle: Puzzle = new Puzzle();
    public renderList: Entity[] = [];
    public entityAtPoint: Entity | null = null;
    public undoList: Edit[] = [];
    public redoList: Edit[] = [];
    public activeBrush: BrushData | null = null;
    public brushes: BrushData[] = [];
    public tools: BrushData[] = [];
    public prototypes: Record<string, Prototype> = {};
    public pickTimeout = 0;
    public rotation: number = 0;

    constructor(public g: Game, puzzle: Puzzle | null) {
        console.log(puzzle);
        puzzle = puzzle || new Puzzle();
        this.puzzle = puzzle;
        for (const e of this.puzzle.v2e.values()) {
            this.renderList.push(e);
        }
        this.init();
    }

    public update() {
        this.pickTimeout -= this.g.dt;
        this.updateAnimations();
    }

    resetScreenPositions() {
        for (const e of this.puzzle.actors) {
            e.screenPos = V3.create(e.pos.x, e.pos.y, e.pos.z);
        }
    }

    computeEntityAtPoint = (px: number, py: number): Entity | null => {
        const id = pick(this.g.canvas, this.getOffset(), this.renderList, px, py);
        return Entity.byId.get(id) || null;
    }

    updateEntityAtPoint = (px: number, py: number) => {
        if (this.pickTimeout > 0) {
            return;
        }
        this.pickTimeout = PICK_TIMEOUT;
        this.entityAtPoint = this.computeEntityAtPoint(px, py);
    }

    public init() {
        this.addCallbacks();
        this.addBaseEntities();
        // doing this here because sprites need to be loaded
        this.setupBrushes();
        this.setupTools();
        this.setupPrototypes();
    }

    public onExit() {
        this.removeCallbacks();
        preact.render(null, document.body);
    }

    public setupPrototypes() {
        this.prototypes = {
            "BLOCK_1": { type: "BLOCK", frames: [sprites["block"][0]] },
            "BLOCK_2": { type: "BLOCK", frames: [sprites["block"][1]] },
            "BLOCK_3": { type: "BLOCK", frames: [sprites["block"][2]] },
            "WIZARD": { type: "WIZARD", frames: sprites["wiz"], frameDuration: 96 },
            "MIRROR_SE": { type: "MIRROR_SE", frames: sprites["mirror-se"], frameDuration: 128 },
            "MIRROR_SW": { type: "MIRROR_SW", frames: sprites["mirror-sw"], frameDuration: 128 },
            "MIRROR_NE": { type: "MIRROR_NE", frames: sprites["mirror-ne"] },
            "MIRROR_NW": { type: "MIRROR_NW", frames: sprites["mirror-nw"] },
        }; 
    }

    public setupTools() {
        this.tools = [
            { type: "ROTATE_RIGHT", sprite: sprites["rotate-right"][0] },
            { type: "ROTATE_LEFT", sprite: sprites["rotate-left"][0] },
            { type: "PLAY", sprite: sprites["play"][0] },
            { type: "SAVE", sprite: sprites["save"][0] },
            { type: "FOLDER", sprite: sprites["folder"][0] },
            { type: "COPY", sprite: sprites["copy"][0] },
            { type: "UNDO", sprite: sprites["undo"][0] },
            { type: "REDO", sprite: sprites["redo"][0] },
        ]
    }

    public setupBrushes() {
        this.brushes = [
            
            { type: "ERASER", sprite: sprites["eraser"][0] },
            { type: "WIZARD", sprite: sprites["wiz"][0] },
            { type: "BLOCK_1", sprite: sprites["block"][0] },
            { type: "BLOCK_2", sprite: sprites["block"][1] },
            { type: "BLOCK_3", sprite: sprites["block"][2] },
            { type: "MIRROR_SE", sprite: sprites["mirror-se"][0] },
            { type: "MIRROR_SW", sprite: sprites["mirror-sw"][0] },
            { type: "MIRROR_NW", sprite: sprites["mirror-nw"][0] },
            { type: "MIRROR_NE", sprite: sprites["mirror-ne"][0] },
        ];
    }

    public addBaseEntities() {
        const size = 32;
        const size2 = size/2;

        for (let x = -size2; x < size2; x++) {
            for (let y = -size2; y < size2; y++) {
                const e = new Entity();
                e.pos = V3i.create(x, y, -1);
                e.screenPos = V3.create(x, y, -1);
                e.frames = sprites["block-frame"];
                e.frameIndex = 0;
                setupPickerFrames(e);
                this.renderList.push(e);
            }
        }
    }

    addCallbacks() {
        this.g.canvas.addEventListener('mousemove', this.onMouseMove);
        this.g.canvas.addEventListener('mousedown', this.onMouseDown);
        this.g.canvas.oncontextmenu = this.onContextMenu;
    }

    removeCallbacks() {
        this.g.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.g.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.g.canvas.oncontextmenu = null;
    }

    onMouseMove = (e: MouseEvent) => {
        this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
    };

    onMouseDown = (e: MouseEvent) => {
        this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
        if (this.activeBrush != null) {
            this.handleInput();
        }
    }

    handlePaletteClick = (brushData: BrushData) => {
        this.activeBrush = null;

        if (brushData.type === "ROTATE_RIGHT") {
            this.puzzle.rotate();
            this.sortRenderList();
            return;
        }

        if (brushData.type === "ROTATE_LEFT") {
            this.puzzle.rotate();
            this.puzzle.rotate();
            this.puzzle.rotate();
            this.sortRenderList();
            return;
        }

        if (brushData.type === "SAVE") {
            console.log("saving");
            Storage.savePuzzle(this.puzzle);
            console.log(this.puzzle.serialize());
            return;
        }

        if (brushData.type === "PLAY") {
            this.g.popScreen();
            this.g.pushScreen(new PlayScreen(this.g, this.puzzle));
        }

        this.activeBrush = brushData;
    }

    handleInput() {
        // brushes

        if (this.entityAtPoint == null || this.activeBrush == null) {
            return;
        }

        console.log(this.activeBrush);

        if (this.activeBrush!.type === "ERASER") {
            if (!this.puzzle.v2e.has(this.entityAtPoint.pos)) {
                return;
            }
            this.deleteEntity(this.entityAtPoint);
            return;
        }

        console.log("CREATING");
        console.log(this.entityAtPoint.pos);
        console.log(V3i.up);
        console.log(V3i.add(this.entityAtPoint.pos, V3i.up));

        this.createEntity(this.activeBrush?.type!, V3i.add(this.entityAtPoint.pos, V3i.up));
    }

    createEntity(type: string, pos: V3i) {
        const prototype = this.prototypes[type];
        const e = this.puzzle.createEntity(
            type,
            pos,
            prototype.frames,
            prototype.frameDuration || 0
        );
        this.renderList.push(e);
        this.sortRenderList();
    }

    deleteEntity(e: Entity) {
        this.puzzle.v2e.delete(e.pos);
        const idx = this.renderList.indexOf(e);
        if (idx !== -1) {
            this.renderList.splice(idx, 1);
        }
    }

    onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    public updateAnimations() {
        const { dt } = this.g;

        for (const e of this.puzzle.v2e.values()) {
            if (e.frameDuration === 0) { continue; }
            e.frameElapsed += dt;
            if (e.frameElapsed >= e.frameDuration) {
                e.frameElapsed = e.frameElapsed % e.frameDuration;
                e.frameIndex = (e.frameIndex + 1) % e.frames.length;
            }
        }
    }

    public render() {
        const { canvas } = this.g;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.sortRenderList();
        this.renderEntities();
        this.renderHighlight();
        this.renderUi();
    }

    public renderUi() {
        const tools = Palette({
            className: "Toolbar",
            brushes: this.tools,
            activeBrush: this.activeBrush,
            handleClick: this.handlePaletteClick,
        });
        const palette = Palette({
            className: "Palette",
            brushes: this.brushes,
            activeBrush: this.activeBrush,
            handleClick: this.handlePaletteClick,
        });
        const dom = html`
            <div class="EditorUi">
                ${tools}
                ${palette}
            </div>
        `
        preact.render(dom, document.body);
    }

    public sortRenderList() {
        this.renderList.sort((e1, e2) => {
            const d1 = e1.screenPos.x + e1.screenPos.y;
            const d2 = e2.screenPos.x + e2.screenPos.y;
            return d1 < d2 ? -1 : d2 < d1 ? 1 : e1.pos.z < e2.pos.z ? -1 : e2.pos.z < e1.pos.z ? 1 : 0; 
        });
    }

    public renderEntities() {
        this.sortRenderList();
        renderEntities(this.g.canvas, this.getOffset(), this.renderList);
    }

    renderHighlight() {
        if (this.entityAtPoint === null) {
            return;
        }

        renderSprite(this.g.canvas, this.getOffset(), this.entityAtPoint, sprites['block-highlight'][0]);
    }

    getOffset(): V3 {
        return V3.create(this.g.canvas.width/2, this.g.canvas.height/2, 0);
    }

    public tick() {
        this.update();
        this.render();
    }
}