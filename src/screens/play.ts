import { sprites } from '../game/gfx';
import { Game, Screen } from '../game/game';
import { renderEntities, renderSprite, pick } from '../game/render';
import { V3, V3i } from '../model/vec';
import { Entity, EntityType } from '../model/entity';
import { Puzzle } from '../model/puzzle';
import { BOUNCE_FACTOR } from '../model/constants';

const CommandType = {
    MOVE: 'MOVE',
    UNDO: 'UNDO',
    RESET: 'RESET',
    ACTION_1: 'ACTION_1',
    ACTION_2: 'ACTION_2',
};

interface Command {
    type: string;
    pos?: V3i;
}

interface Transition {
    e: Entity;
    start: V3;
    end: V3;
    elapsed: number;
    duration: number;
    bounce: boolean;
}

export class PlayScreen implements Screen {
    public offset: number = 0;
    public puzzle: Puzzle = new Puzzle();
    public renderList: Entity[] = [];
    public entityAtPoint: Entity | null = null;
    public inputQueue: Command[] = [];
    public transitions: Transition[] = [];
    public history: Entity[][] = [];

    constructor(public g: Game, puzzle: Puzzle) {
        this.puzzle = puzzle;
        this.init();    
    }

    public update() {
        this.processTransitions();
        this.updateAnimations();
        this.handleInput();
    }

    public handleInput() {
        if (this.inputQueue.length === 0) {
            return;
        }

        const command = this.inputQueue.shift()!;

        switch (command.type) {
            case CommandType.MOVE:
                if (this.transitions.length > 0) {
                    this.inputQueue.unshift(command);
                    return;
                }
                this.puzzle.movePlayer(command.pos!);
                this.computeTransitions();
                break;
            case CommandType.UNDO:
                this.puzzle.undo();
                this.transitions.length = 0;
                this.resetScreenPositions();
                break;
            case CommandType.RESET:
                this.puzzle.reset();
                this.transitions.length = 0;
                this.resetScreenPositions();
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
            if (e.pos != e.lastPos) {
                const t = this.computeTransition1(e);
                if (t != null) {
                    this.transitions.push(t);
                }
            }
        }
    }

    computeTransition1(e: Entity): Transition | null {
        if (e.type === EntityType.WIZARD) {
            return {
                e,
                start: e.screenPos,
                end: e.pos,
                duration: 300,
                elapsed: 0,
                bounce: true,
            };
        }

        return {
            e,
            start: e.screenPos,
            end: e.pos,
            duration: 300,
            elapsed: 0,
            bounce: false,
        };
    }

    processTransitions() {
        const done = new Set<Transition>();

        for (const t of this.transitions) {
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
        delta.z += bounciness;
        t.e.screenPos = V3.add(t.start, delta);
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
        this.addCallbacks();
        for (const e of this.puzzle.v2e.values()) {
            this.renderList.push(e);
        }
    }

    onExit = () => {
        this.removeCallbacks();
    }

    onKeyDown = (e: KeyboardEvent) => {
        console.log(e.key);
        switch (e.key) {
            case "]":
                this.puzzle.rotate(false);
                this.computeTransitionsAll();
                e.preventDefault();
                e.stopPropagation();
                break;
            case "[":
                this.puzzle.rotate(false);
                this.puzzle.rotate(false);
                this.puzzle.rotate(false);
                this.computeTransitionsAll();
                e.preventDefault();
                e.stopPropagation();
                break;
            case "ArrowUp":
            case "w":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    pos: V3i.add(this.puzzle.player!.pos, V3i.forward)
                });
                this.computeTransitions();
                e.preventDefault();
                e.stopPropagation();
                break;
            case "ArrowDown":
            case "s":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    pos: V3i.add(this.puzzle.player!.pos, V3i.back)
                });
                this.computeTransitions();
                e.preventDefault();
                e.stopPropagation();
                break;
            case "ArrowLeft":
            case "a":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    pos: V3i.add(this.puzzle.player!.pos, V3i.left)
                });
                this.computeTransitions();
                e.preventDefault();
                e.stopPropagation();
                break;
            case "ArrowRight":
            case "d":
                this.inputQueue.push({
                    type: CommandType.MOVE,
                    pos: V3i.add(this.puzzle.player!.pos, V3i.right)
                });
                this.computeTransitions();
                e.preventDefault();
                e.stopPropagation();
                break;
        }
    }

    onMouseMove = (e: MouseEvent) => {
        this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
    }

    onMouseDown = (e: MouseEvent) => {
        this.entityAtPoint = this.computeEntityAtPoint(e.clientX, e.clientY);
        if (this.entityAtPoint) {
            this.inputQueue.push({
                type: CommandType.MOVE,
                pos: V3i.add(this.entityAtPoint.pos, V3i.up),
            });
        }
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
                e.frameElapsed = e.frameElapsed % e.frameDuration;
                e.frameIndex = (e.frameIndex + 1) % e.frames.length;
            }
        }
    }

    public render() {
        const { canvas } = this.g;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.renderEntities();
        this.renderHighlight();
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