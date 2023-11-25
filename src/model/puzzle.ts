import { V3i, V3 } from "./vec";
import { Entity, EntityType, SerializedEntity } from "./entity";
import { getSpriteForEntity, setupPickerFrames } from "../game/gfx";
import { rotate } from "./util";

const MAX_INT = 2147483647;

interface SerializedPuzzle {
    id: string;
    name: string;
    entities: SerializedEntity[];
}

export class Puzzle {
    public name: string = "New Puzzle";
    public v2e: Map<V3i, Entity> = new Map();
    public player: Entity | undefined;
    public actors: Entity[] = [];
    public history: Entity[][] = [];
    public initialState: Entity[] = [];
    public id: string;
    public isDirty: boolean = false;

    constructor() {
        this.id = ((Math.random() * MAX_INT) | 0).toString(16) + ":" + 
                  ((Math.random() * MAX_INT) | 0).toString(16) + ":" + 
                  ((Math.random() * MAX_INT) | 0).toString(16);
    }

    init() {
        this.history.length === 0;
        this.actors.length === 0;
        for (const e of this.v2e.values()) {
            if (e.isActor()) {
                this.actors.push(e);
            }
            if (e.type === "WIZARD") {
                this.player = e;
            }
        }
        this.initialState = this.actors.map(e => e.copy());
    }

    deleteEntity(pos: V3i) {
        if (!this.v2e.has(pos)) {
            return;
        }

        this.isDirty = true;
        const e = this.v2e.get(pos)!;
        this.v2e.delete(pos);
        Entity.deleteEntity(e);
    }

    createEntity(type: string, pos: V3i, frames: HTMLCanvasElement[], frameDuration: number = 0): Entity {
        this.deleteEntity(pos);
        this.isDirty = true;

        const e = new Entity();
        e.type = type;
        e.pos = pos;
        // slight abstraction leakage here
        e.screenPos = V3.create(pos.x, pos.y, pos.z);
        e.frames = frames;
        e.frameDuration = frameDuration;
        this.v2e.set(e.pos, e);
        if (e.type == EntityType.WIZARD) {
            this.player = e;
        }
        if (e.isActor()) {
            this.actors.push(e);
        }
        setupPickerFrames(e);
        return e;
    }

    getBounds() {
        const min = V3.create(Infinity, Infinity, Infinity);
        const max = V3.create(-Infinity, -Infinity, -Infinity);

        for (const v of this.v2e.keys()) {
            min.x = Math.min(v.x, min.x);
            min.y = Math.min(v.y, min.y);
            min.z = Math.min(v.z, min.z);
            max.x = Math.max(v.x, max.x);
            max.y = Math.max(v.y, max.y);
            max.z = Math.max(v.z, max.z);
        }

        return { min, max };
    }

    rotate(alsoRotateScreenPos = true) {
        const { min, max } = this.getBounds();
        const v2e2 = new Map<V3i, Entity>();
        for (const e of this.v2e.values()) {
            const pos = rotate(min, max, e.pos, 1)!;
            e.lastPos = e.pos;
            e.pos = V3i.create(pos.x, pos.y, pos.z);
            if (alsoRotateScreenPos) {
                e.screenPos = rotate(min, max, e.screenPos, 1);    
            }
            v2e2.set(e.pos, e);         
        }
        this.v2e = v2e2;
    }

    movePlayer(pos: V3i) {
        const player = this.player!;
        player.lastPos = player.pos;
        player.pos = pos;
    }

    shootBolt(start: V3i, dir: V3i) {
    }

    undo() {
        console.log("UNDO NOT IMPLEMENTED");
    }

    reset() {
        console.log("RESET NOT IMPLEMENTED");
    }

    serialize(): SerializedPuzzle {
        return {
            name: this.name,
            id: this.id,
            entities: [...this.v2e.values()].map(e => e.serialize()),
        };
    }

    static deserialize(data: SerializedPuzzle): Puzzle {
        const p = new Puzzle();
        p.id = data.id;
        p.name = data.name;
        for (const e of data.entities) {
            const v = V3i.create(e.pos[0], e.pos[1], e.pos[2]);
            const { frames, duration } = getSpriteForEntity(e.type);
            console.log({
                type: e.type,
                pos: v,
                frames,
                duration,
            });
            p.createEntity(e.type, v, frames, duration);
        }
        p.init();
        return p;
    }
}

