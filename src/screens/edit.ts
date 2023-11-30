import { setupPickerFrames, sprites } from '../game/gfx';
import { Game, Screen } from '../game/game';
import { pick, renderEntities, renderSprite } from '../game/render';
import { V3, V3i } from '../model/vec';
import { Entity } from '../model/entity';
import { Puzzle } from '../model/puzzle';
import * as preact from 'preact';
import { html } from '../ui/html';
import { Palette } from '../ui/Palette';
import { Folder } from '../ui/Folder';
import { PuzzleInspector } from '../ui/PuzzleInspector'
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

/*
const EditType = {
    CREATE: 'CREATE',
    DELETE: 'DELETE',
    REPLACE: 'REPLACE',
};
*/

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
    public showFolder: boolean = false;

    constructor(public g: Game, puzzle: Puzzle | null) {
        puzzle = puzzle || new Puzzle();
        this.puzzle = puzzle;
        this.init();
    }

    public update() {
        this.pickTimeout -= this.g.dt;
        this.updateAnimations();
    }

    loadPuzzle = (id: string) => {
        Entity.clear();
        this.renderList.length = 0;
        this.puzzle = Storage.loadPuzzle(id);
        this.init();
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
        for (const e of this.puzzle.v2e.values()) {
            this.renderList.push(e);
        }
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
            "BLOCK_1": { type: "BLOCK_1", frames: [sprites["block"][0]] },
            "BLOCK_2": { type: "BLOCK_2", frames: [sprites["block"][1]] },
            "BLOCK_3": { type: "BLOCK_3", frames: [sprites["block"][2]] },
            "BLOCK_4": { type: "BLOCK_4", frames: [sprites["block"][3]] },
            "BLOCK_5": { type: "BLOCK_5", frames: [sprites["block"][4]] },
            "BLOCK_6": { type: "BLOCK_5", frames: [sprites["block"][5]] },
            "ELEVATOR_BLOCK": { type: "ELEVATOR_BLOCK", frames: [sprites["elevator-block-inactive"][0]] },
            "POWER_BLOCK": { type: "POWER_BLOCK", frames: [sprites["power-block-inactive"][0]] },
            "WIZARD": { type: "WIZARD", frames: sprites["wiz"], frameDuration: 96 },
            "MIRROR_1_SE": { type: "MIRROR_1_SE", frames: sprites["mirror-1-se"] },
            "MIRROR_1_SW": { type: "MIRROR_1_SW", frames: sprites["mirror-1-sw"] },
            "MIRROR_1_NE": { type: "MIRROR_1_NE", frames: sprites["mirror-1-ne"] },
            "MIRROR_1_NW": { type: "MIRROR_1_NW", frames: sprites["mirror-1-nw"] },
            "MIRROR_2_SE": { type: "MIRROR_1_SE", frames: sprites["mirror-2-se"] },
            "MIRROR_2_SW": { type: "MIRROR_1_SW", frames: sprites["mirror-2-sw"] },
            "MIRROR_2_NE": { type: "MIRROR_1_NE", frames: sprites["mirror-2-ne"] },
            "MIRROR_2_NW": { type: "MIRROR_1_NW", frames: sprites["mirror-2-nw"] },
        }; 
    }

    public setupTools() {
        this.tools = [
            { type: "ROTATE_LEFT", sprite: sprites["rotate-right"][0] },
            { type: "ROTATE_RIGHT", sprite: sprites["rotate-left"][0] },
            { type: "PLAY", sprite: sprites["play"][0] },
            { type: "SAVE", sprite: sprites["save"][0] },
            { type: "FOLDER", sprite: sprites["folder"][0] },
            { type: "PLUS", sprite: sprites["plus"][0] },
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
            { type: "BLOCK_4", sprite: sprites["block"][3] },
            { type: "BLOCK_5", sprite: sprites["block"][4] },
            { type: "BLOCK_6", sprite: sprites["block"][5] },
            { type: "POWER_BLOCK", sprite: sprites["power-block-inactive"][0] },
            { type: "ELEVATOR_BLOCK", sprite: sprites["elevator-block-inactive"][0] },
            { type: "MIRROR_1_SE", sprite: sprites["mirror-1-se"][0] },
            { type: "MIRROR_1_SW", sprite: sprites["mirror-1-sw"][0] },
            { type: "MIRROR_1_NW", sprite: sprites["mirror-1-nw"][0] },
            { type: "MIRROR_1_NE", sprite: sprites["mirror-1-ne"][0] },
            { type: "MIRROR_2_SE", sprite: sprites["mirror-2-se"][0] },
            { type: "MIRROR_2_SW", sprite: sprites["mirror-2-sw"][0] },
            { type: "MIRROR_2_NW", sprite: sprites["mirror-2-nw"][0] },
            { type: "MIRROR_2_NE", sprite: sprites["mirror-2-ne"][0] },
            { type: "EXIT", sprite: sprites["exit"][0] },
            { type: "BOX", sprite: sprites["box"][0] },
        ];
    }

    public addBaseEntities() {
        const size = 32;
        const size2 = size/2;

        for (let x = -size2; x < size2; x++) {
            inner:for (let y = -size2; y < size2; y++) {
                const pos = V3i.create(x, y, 0);
                if (this.puzzle.v2e.has(pos)) {
                    this.renderList.push(this.puzzle.v2e.get(pos)!);
                    continue inner;
                }
                const e = this.puzzle.createEntity("BLOCK_6", V3i.create(x, y, 0));
                this.renderList.push(e);
            }
        }
    }

    addCallbacks() {
        this.g.canvas.addEventListener('mousemove', this.onMouseMove);
        this.g.canvas.addEventListener('mousedown', this.onMouseDown);
        this.g.canvas.addEventListener('keydown', this.onKeyDown);
        this.g.canvas.oncontextmenu = this.onContextMenu;
    }

    removeCallbacks() {
        this.g.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.g.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.g.canvas.removeEventListener('keydown', this.onKeyDown);
        this.g.canvas.oncontextmenu = null;
    }

    onKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case "Escape":
                this.showFolder = false;
                break;
            case "F10":
                console.log(JSON.stringify(Storage.export(), null, 2));
                break;
        }
    }

    onMouseMove = (e: MouseEvent) => {
        this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
    };

    onMouseDown = (e: MouseEvent) => {
        this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
        if (this.activeBrush != null) {
            this.handleInput(e.buttons > 1);
        }
    }

    onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }

    handlePaletteClick = (brushData: BrushData) => {
        // this.activeBrush = null;

        if (brushData.type === "FOLDER") {
            this.showFolder = true;
            return;
        }

        if (brushData.type === "PLUS") {
            this.puzzle = new Puzzle();
            this.renderList.length = 0;
            this.init();
        }

        if (brushData.type === "ROTATE_RIGHT") {
            this.puzzle.rotateRight();
            this.sortRenderList();
            return;
        }

        if (brushData.type === "ROTATE_LEFT") {
            this.puzzle.rotateLeft();
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
            return;
        }

        this.activeBrush = brushData;
    }

    handleInput(isRightButton: boolean) {
        // brushes

        if (this.entityAtPoint == null || this.activeBrush == null) {
            return;
        }

        if (this.activeBrush!.type === "ERASER") {
            if (!this.puzzle.v2e.has(this.entityAtPoint.pos)) {
                return;
            }
            this.deleteEntity(this.entityAtPoint);
            return;
        }

        if (isRightButton) {
            this.createEntity(this.activeBrush?.type!, this.entityAtPoint.pos);
        } else {
            this.createEntity(this.activeBrush?.type!, V3i.add(this.entityAtPoint.pos, V3i.up));
        }
        
    }

    createEntity(type: string, pos: V3i) {
        if (this.puzzle.v2e.has(pos)) {
            this.deleteEntity(this.puzzle.v2e.get(pos)!);
        }
        const e = this.puzzle.createEntity(
            type,
            pos,
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
        const puzzleInspector = PuzzleInspector({
            puzzle: this.puzzle,
        });
        const folder = this.showFolder && Folder({
            puzzles: Storage.getPuzzleList(),
            handleClick: this.loadPuzzle,
        });
        const dom = html`
            <div class="EditorUi">
                ${tools}
                ${palette}
                ${folder}
                ${puzzleInspector}
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