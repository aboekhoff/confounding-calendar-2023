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

    createEntity(type: string, pos: V3i): Entity {
        const { frames, duration } = getSpriteForEntity(type);

        this.deleteEntity(pos);
        this.isDirty = true;

        const e = new Entity();
        e.type = type;
        e.pos = pos;
        e.lastPos = e.pos;
        e.screenPos = V3.create(pos.x, pos.y, pos.z);
        e.frames = frames;
        e.frameDuration = duration || 0;
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

    getEntityAbove(v: V3i): Entity | null {
        return this.v2e.get(V3i.add(v, V3i.up)) || null;
    }

    getEntityBelow(v: V3i): Entity | null {
        return this.v2e.get(V3i.add(v, V3i.down)) || null;
    }

    canMoveActor(e: Entity, dir: V3i): boolean {
        const next = this.v2e.get(V3i.add(e.pos, dir));
        if (next == null) { return true; }
        if (!next.isActor()) { return false; }
        return this.canMoveActor(next, dir);
    }

    moveActor(e1: Entity, dir: V3i) {
        const e2 = this.v2e.get(V3i.add(e1.pos, dir));
        if (e2 != null) {
            this.moveActor(e2, dir);
        }
        const above = this.getEntityAbove(e1.pos);
        if (above) {
            this.moveActor(above, dir);
        }
        this.v2e.delete(e1.pos);
        e1.lastPos = e1.pos;
        e1.pos = V3i.add(e1.pos, dir);
        this.v2e.set(e1.pos, e1);
    }

    applyGravity() {
        for (const e of this.actors) {
            if (!e.isAffectedByGravity()) {
                continue;
            }
            const below = this.v2e.get(V3i.add(e.pos, V3i.down));
            if (below == null) {
                this.moveActor(e, V3i.down);
            }
        }
    }

    movePlayer(dir: V3i) {
        const player = this.player!;
        if (this.canMoveActor(player, dir)) {
            this.moveActor(player, dir);
        }
    }

    shootBolt(start: V3i, dir: V3i): boolean {
        const e = this.v2e.get(start);
        if (e == null) {
            return false;
        }
        const bolt = this.createEntity(
            "BOLT",
            V3i.add(start, dir),
        );
        bolt.momentum = dir;
        bolt.age = 0;
        return true;
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
            p.createEntity(e.type, v);
        }
        p.init();
        return p;
    }
}

