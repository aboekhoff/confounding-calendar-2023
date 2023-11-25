import { V3, V3i } from './vec';

export interface SerializedEntity {
    type: string;
    pos: number[];
}

export const EntityType = {
    BLOCK_1: "BLOCK_1",
    BLOCK_2: "BLOCK_2",
    BLOCK_3: "BLOCK_3",
    MIRROR_SE: "MIRROR_SE",
    MIRROR_SW: "MIRROR_SW",
    MIRROR_NE: "MIRROR_NE",
    MIRROW_NW: "MIRROR_NW",
    WIZARD: "WIZARD",
    PULSE: "PULSE",
}

export class Entity {
    static nextId = 1;
    static byId: Map<number, Entity> = new Map();

    public static deleteEntity(e: Entity) {
        this.byId.delete(e.id);
    } 

    public id: number;
    public type: string = EntityType.BLOCK_1;
    public pos: V3i = V3i.create(0, 0, 0);
    public lastPos: V3i = V3i.create(0, 0, 0); 
    public screenPos: V3 = V3.create(0, 0, 0);
    public frames: HTMLCanvasElement[] = [];
    public pickerFrames: HTMLCanvasElement[] = [];
    public frameIndex = 0;
    public frameElapsed = 0;
    public frameDuration = 0;

    constructor(storeInstance = true) {
        if (storeInstance) {
            this.id = Entity.nextId++;
            Entity.byId.set(this.id, this)
        } else {
            this.id = -1;
        }
    }

    public serialize() {
        return {
            type: this.type,
            pos: [this.pos.x, this.pos.y, this.pos.z],
        }
    }

    // hopefully this won't lead to weird bugs since ids won't map to the same instance
    // should only be used in undo/redo in game where it won't matter
    public copy(): Entity {
        const out = new Entity(false);
        Object.assign(out, this);
        return out;
    }

    public isActor(): boolean {
        return this.type != EntityType.BLOCK_1;
    }
}