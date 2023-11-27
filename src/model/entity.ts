import { getSpriteForEntity, setupPickerFrames } from '../game/gfx';
import { V3, V3i } from './vec';

const ROTATIONS: Record<string, string> = {
    "NE": "SE",
    "SE": "SW",
    "SW": "NW",
    "NW": "NE",
};

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
    EXIT: "EXIT",
    BOX: "BOX",
    FONT: "FONT",
}

export const PlaybackMode = {
    LOOP: "LOOP",
    ONCE: "ONCE",
    PINGPONG_FORWARD: "PINGPONG_FORWARD",
    PINGPONG_BACKWARD: "PINGPONG_BACKWARD",
};

export class Entity {
    static nextId = 1;
    static byId: Map<number, Entity> = new Map();

    public static deleteEntity(e: Entity) {
        this.byId.delete(e.id);
    } 

    public static clear() {
        this.byId.clear();
    }

    public id: number;
    public type: string = EntityType.BLOCK_1;
    public pos: V3i = V3i.zero;
    public lastPos: V3i = V3i.zero; 
    public screenPos: V3 = V3.create(0, 0, 0);
    public playbackMode: string = PlaybackMode.LOOP;
    public frames: HTMLCanvasElement[] = [];
    public pickerFrames: HTMLCanvasElement[] = [];
    public frameIndex = 0;
    public frameElapsed = 0;
    public frameDuration = 0;
    public age = 0; // used for pulses
    public momentum: V3i = V3i.zero;
    public destroyed: boolean = false;

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
        return this.type === "WIZARD" ||
               this.type === "MIRROR_NE" ||
               this.type === "MIRROR_SE" ||
               this.type === "MIRROR_NW" ||
               this.type === "MIRROR_SW" ||
               this.type === "BOX" ||
               this.type === "PULSE"
    }

    public isAffectedByGravity(): boolean {
        return this.type === "WIZARD" ||
               this.type === "MIRROR_NE" ||
               this.type === "MIRROR_SE" ||
               this.type === "MIRROR_NW" ||
               this.type === "MIRROR_SW" ||
               this.type === "BOX";
    }

    public hasOrientation(): boolean {
        return this.type === "MIRROR_NE" ||
               this.type === "MIRROR_SE" ||
               this.type === "MIRROR_NW" ||
               this.type === "MIRROR_SW";
    }

    public rotate() {
        const [prefix, suffix] = this.type.split("_");
        this.type = prefix + "_" + ROTATIONS[suffix];
        const { frames, duration, mode } = getSpriteForEntity(this);
        this.frames = frames;
        this.frameDuration = duration || 0;
        this.frameElapsed = 0;
        this.frameIndex = 0;
        this.playbackMode = mode;
        setupPickerFrames(this);
    }
}