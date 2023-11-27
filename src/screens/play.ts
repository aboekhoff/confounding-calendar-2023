import { font2, sprites } from '../game/gfx';
import { Game, Screen } from '../game/game';
import { renderEntities, renderSprite, pick, renderFlatSprite } from '../game/render';
import { V3, V3i } from '../model/vec';
import { Entity, EntityType, PlaybackMode } from '../model/entity';
import { Puzzle } from '../model/puzzle';
import { BOUNCE_FACTOR, SCALE } from '../model/constants';
import { EditScreen } from '../screens/edit';
import { Storage } from '../model/storage';
import { Audio, SoundType } from '../game/audio';

const CommandType = {
    MOVE: 'MOVE',
    FIRE: 'FIRE',
    UNDO: 'UNDO',
    RESET: 'RESET',
    NEXT: "NEXT",
    ACTION_1: 'ACTION_1',
    ACTION_2: 'ACTION_2',
};

export const Mode = {
    PLAY: "PLAY",
    GAMEOVER: "GAMEOVER",
    WIN: "WIN",
}

interface SpriteEntity {
    sprite: HTMLCanvasElement;
    screenPos: V3;
    destroyed?: boolean;
};

interface Command {
    type: string;
    pos?: V3i;
    dir?: V3i;
}

interface Transition {
    e: Entity | SpriteEntity;
    start: V3;
    end: V3;
    elapsed: number;
    duration: number;
    bounce: boolean;
    destroy?: boolean;
    sprite?: SpriteData;
}

interface SpriteData {
    frames: HTMLCanvasElement[];
    duration?: number;
    mode?: string;
}

export class PlayScreen implements Screen {
    public mode: string = "PLAY";
    public puzzle: Puzzle = new Puzzle();
    public renderList: Entity[] = [];
    public entityAtPoint: Entity | null = null;
    public inputQueue: Command[] = [];
    public transitions: Transition[] = [];
    public history: Entity[][] = [];
    public textEntities: SpriteEntity[] = [];

    constructor(public g: Game, puzzle: Puzzle) {
        this.puzzle = puzzle;
        console.log(this.puzzle);
        this.init();    
    }

    public update() {
        switch (this.mode) {
            case Mode.PLAY:
                this.processTransitions();
                if (this.transitions.length === 0 && this.puzzle.tick()) { 
                    this.computeTransitions(); 
                };
                this.updateAnimations();
                this.handleInput();
                this.checkGameOver();
                break;
            case Mode.GAMEOVER:
                this.processTransitions();
                if (this.transitions.length === 0) { this.puzzle.tick() };
                this.updateAnimations();
                this.handleInput();
                break;
            case Mode.WIN:
                // load next puzzle, and we're basically playable
                // for some definition of playable
                this.processTransitions();
                this.updateAnimations();
                this.handleInput();
                break;
        }
    }

    public loadNextPuzzle() {
        this.g.popScreen();
        const nextPuzzle = Storage.loadPuzzleByName(this.puzzle.next);
        if (nextPuzzle === null) {
            // game over sequence?
        } else {
            this.g.pushScreen(new PlayScreen(this.g, nextPuzzle));    
        }
    }

    public checkGameOver() {
        if (this.puzzle.didPlayerLose()) {
            this.mode = Mode.GAMEOVER;
            this.showText(`
            you died :(<br>
            press z to undo<br>
            press r to restart
            `);
        }
        else if (this.puzzle.didPlayerWin()) {
            this.mode = Mode.WIN;
            Audio.play(SoundType.SPARKLE);
            this.showText("frotz!<br>press space<br>to continue");
        }
    }

    public clearText() {
        this.textEntities.length = 0;    
    }

    public showText(text: string) {
        this.textEntities.length = 0;
        const lines = text.trim().split('<br>');
        for (let i = 0; i < lines.length; i++) {
            this.showText1(lines[i].trim().toLowerCase(), lines.length - 1 - i);
        }
    }

    public showText1(text: string, offsetZ = 0) {
        console.log(text)
        const fontWidth = font2['a'].width * SCALE;
        const fontHeight = font2['a'].height * SCALE;
        const textWidth = (text.length/2) * fontWidth;
        const offset = this.getOffset();
        const startPos = V3.create(offset.x - (textWidth * fontWidth), (offset.y) - (offset.y/2) - (offsetZ * fontHeight), 0);
        let curPos = startPos;

        for (let x = 0; x < text.length; x++) {
            const pos = V3.create((offset.x - textWidth) + (fontWidth * x), curPos.y, 0);
            const angle = Math.random() * Math.PI * 2;
            const lastPosX = pos.x + (Math.cos(angle) * fontWidth * 10);
            const lastPosY = pos.y + (Math.sin(angle) * fontWidth * 10); 
            const lastPos = V3i.create(lastPosX, lastPosY, 0);
            const screenPos = V3.create(lastPos.x, lastPos.y, 0);

            const te = {
                pos: V3.create(curPos.x, curPos.y, curPos.z),
                screenPos: V3.create(lastPos.x, lastPos.y, lastPos.z),
                lastPos,
                sprite: font2[text[x]]
            };

            const transition = {
                e: te,
                start: screenPos,
                end: pos,
                elapsed: 0,
                duration: 600,
                bounce: false,
            }

            this.textEntities.push(te);
            this.transitions.push(transition);
        }
    }

    public handleInput() {
        if (this.inputQueue.length === 0) {
            return;
        }

        const command = this.inputQueue.shift()!;

        switch (command.type) {
            case CommandType.NEXT:
                this.loadNextPuzzle();
                break;
            case CommandType.MOVE:
                if (this.puzzle.isGameOver()) {
                    return;
                }
                if (this.transitions.length > 0) {
                    this.inputQueue.unshift(command);
                    return;
                }
                this.puzzle.movePlayer(command.dir!);
                this.computeTransitions();
                break;
            case CommandType.FIRE:
                const pos2 = V3i.add(this.puzzle.player!.pos, command.dir!);
                if (this.puzzle.isGameOver()) {
                    return;
                }
                if (this.transitions.length > 0) {
                    this.inputQueue.unshift(command);
                    return;
                }
                if (this.puzzle.v2e.get(pos2) != null) {
                    return;
                }
                const e = this.puzzle.createEntity(EntityType.PULSE, pos2);
                e.momentum = command.dir!;
                this.renderList.push(e);
                this.computeTransitions();
                break;
            case CommandType.UNDO:
                this.puzzle.undo();
                this.transitions.length = 0;
                this.clearText();
                this.resetScreenPositions();
                this.mode = Mode.PLAY;
                break;
            case CommandType.RESET:
                this.puzzle.reset();
                this.transitions.length = 0;
                this.clearText();
                this.resetScreenPositions();
                this.mode = Mode.PLAY;
                break;
            default:
        }
    }

    computeTransitionsAll() {
        for (const e of this.puzzle.v2e.values()) {
            if (e.pos != e.lastPos) {
                const t = this.computeTransition1(e);
                if (t != null) {
                    this.transitions.push(t);
                }
            }
        }
    }

    computeTransitions() {
        for (const e of this.puzzle.actors) {
            if (e.pos !== e.lastPos) {
                const t = this.computeTransition1(e);
                if (t != null) {
                    this.transitions.push(t);
                }
            }
        }
    }

    computeTransition1(e: Entity): Transition | null {
        e.lastPos = e.pos;
        if (e.type === EntityType.WIZARD) {
            return {
                e,
                start: e.screenPos,
                end: e.pos,
                duration: 200,
                elapsed: 0,
                bounce: true,
            };
        }

        if (e.type === EntityType.PULSE) {
            const t = {
                e,
                start: e.screenPos,
                end: e.pos,
                duration: 50,
                elapsed: 0,
                bounce: true,
            };
            return t;
        }

        return {
            e,
            start: e.screenPos,
            end: e.pos,
            duration: 200,
            elapsed: 0,
            bounce: false,
        };
    }

    processTransitions() {
        const done = new Set<Transition>();

        for (const t of this.transitions) {
            if (t.elapsed === 0 && t.sprite) {
                const e = (t.e as Entity);
                e.frames = t.sprite.frames;
                e.frameDuration = t.sprite.duration!;
                e.playbackMode = t.sprite.mode || "LOOP";
            }

            const e = (t.e as Entity);
            if (t.elapsed === 0 && e.type) {
                if (e.type === EntityType.WIZARD) {
                    const dir = V3i.sub(t.end, t.start);
                    if (dir.z === 0) {
                        Audio.play(SoundType.STEP);
                    }
                }

                if (e.type === EntityType.BOX) {
                    const dir = V3i.sub(t.end, t.start);
                    if (dir.z === 0) {
                        Audio.play(SoundType.BOX);
                    }
                }

                if (e.type === EntityType.PULSE) {
                    if (e.age === 1) {
                        Audio.play(SoundType.PULSE);
                    }
                }
            }

            t.elapsed += this.g.dt;
            this.processTransition1(t);
            if (t.elapsed >= t.duration) {
                done.add(t);
            }
        }

        for (let i = this.transitions.length-1; i >= 0; i--) {
            const t = this.transitions[i];
            if (done.has(t)) {
                this.transitions.splice(i, 1);
            }
        }
    }

    processTransition1(t: Transition) {
        if (t.duration === 0) { return; }
        const time = t.elapsed / t.duration;
        const delta = V3.mul(V3.sub(t.end, t.start), time);
        let bounciness = 0;
        if (t.bounce) {
            bounciness = time < 0.5 ? time * BOUNCE_FACTOR : (1-time) * BOUNCE_FACTOR;
        }
        if (time >= 1) {
            t.e.screenPos = t.end;

            if (t.e.destroyed) {
                this.puzzle.v2e.delete((t.e as Entity).pos);
                const idx = this.renderList.indexOf((t.e as Entity));
                if (idx != -1) {
                    this.renderList.splice(idx, 1);
                }
            }

        } else {
            delta.z += bounciness;
            t.e.screenPos = V3.add(t.start, delta);
        }

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

    public init() {
        this.g.canvas.focus();
        this.addCallbacks();
        for (const e of this.puzzle.v2e.values()) {
            this.renderList.push(e);
        }
        if (this.puzzle.hint) {
            this.showText(this.puzzle.hint);
        }
        Audio.playTheme();
    }

    onExit = () => {
        this.removeCallbacks();
    }

    onKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case " ":
                if (this.puzzle.didPlayerWin()) {
                    this.inputQueue.push({
                        type: CommandType.NEXT,
                    });
                }
                break;
            case "]":
                this.puzzle.rotateRight(false);
                this.computeTransitionsAll();
                e.preventDefault();
                e.stopPropagation();
                break;
            case "[":
                this.puzzle.rotateLeft(false);
                this.computeTransitionsAll();
                e.preventDefault();
                e.stopPropagation();
                break;
            case "ArrowUp":
            case "w":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    dir: V3i.forward
                });
                e.stopPropagation();
                break;
            case "ArrowDown":
            case "s":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    dir: V3i.back
                });
                e.stopPropagation();
                break;
            case "ArrowLeft":
            case "a":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    dir: V3i.left
                });
                e.stopPropagation();
                break;
            case "ArrowRight":
            case "d":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    dir: V3i.right
                });
                e.stopPropagation();
                break;
            case "z":
                this.inputQueue.push({
                    type: CommandType.UNDO,
                });
                e.stopPropagation();
                break;
            case "r":
                this.inputQueue.push({
                    type: CommandType.RESET,
                });
                e.stopPropagation();
                break;
            case "F10":
                this.puzzle.reset();
                this.puzzle.history.length = 0;
                this.g.popScreen();
                this.g.pushScreen(new EditScreen(this.g, this.puzzle));
                break;
            case "i":
                this.inputQueue.push({
                    type: CommandType.FIRE,
                    dir: V3i.forward,
                });
                break;
            case "j":
                this.inputQueue.push({
                    type: CommandType.FIRE,
                    dir: V3i.left,
                });
                break;
            case "k":
                this.inputQueue.push({
                    type: CommandType.FIRE,
                    dir: V3i.back,
                });
                break;
            case "l":
                this.inputQueue.push({
                    type: CommandType.FIRE,
                    dir: V3i.right,
                });
                break;
        }
    }

    onMouseMove = (_: MouseEvent) => {
        // this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
    }

    onMouseDown = (_: MouseEvent) => {
        // FIXME NEED PATHFINDING FOR THIS TO WORK
        /*
        this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
        if (this.entityAtPoint) {
            this.inputQueue.push({
                type: CommandType.MOVE,
                pos: V3i.add(this.entityAtPoint.pos, V3i.up),
            });
        }
        */
    }

    onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
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

    public updateAnimations() {
        const { dt } = this.g;

        for (const e of this.puzzle.v2e.values()) {
            if (e.frameDuration === 0) { continue; }
            e.frameElapsed += dt;
            if (e.frameElapsed >= e.frameDuration) {
                if (e.playbackMode === PlaybackMode.LOOP) {
                    e.frameElapsed = e.frameElapsed % e.frameDuration;
                    e.frameIndex = (e.frameIndex + 1) % e.frames.length;
                } else {
                    e.frameIndex = e.frames.length - 1;
                }
            }
        }
    }

    public render() {
        const { canvas } = this.g;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.renderEntities();
        this.renderHighlight();
        this.renderText();
    }

    renderText() {
        this.textEntities.forEach(e => {
            renderFlatSprite(this.g.canvas, e.sprite, e.screenPos.x, e.screenPos.y);
        });
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

        renderSprite(this.g.canvas, this.getOffset(), this.entityAtPoint, sprites['highlight'][0]);
    }

    getOffset(): V3 {
        return V3.create(this.g.canvas.width/2, this.g.canvas.height/2, 0);
    }

    public tick() {
        this.update();
        this.render();
    }
}