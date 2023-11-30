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
    ELEVATOR_BLOCK: "ELEVATOR_BLOCK",
    POWER_BLOCK: "POWER_BLOCK",
    MIRROR_1_SE: "MIRROR_1_SE",
    MIRROR_1_SW: "MIRROR_1_SW",
    MIRROR_1_NE: "MIRROR_1_NE",
    MIRROR_1_NW: "MIRROR_1_NW",
    MIRROR_2_SE: "MIRROR_2_SE",
    MIRROR_2_SW: "MIRROR_2_SW",
    MIRROR_2_NE: "MIRROR_2_NE",
    MIRROR_2_NW: "MIRROR_2_NW",
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
    public frameDrop = 0;
    public isActive: boolean = false;
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

    public isPulse(): boolean {
        return this.type === "PULSE";
    }

    public isActor(): boolean {
        return this.type === "WIZARD" ||
               this.type === "MIRROR_1_NE" ||
               this.type === "MIRROR_1_SE" ||
               this.type === "MIRROR_1_NW" ||
               this.type === "MIRROR_1_SW" ||
               this.type === "MIRROR_2_NE" ||
               this.type === "MIRROR_2_SE" ||
               this.type === "MIRROR_2_NW" ||
               this.type === "MIRROR_2_SW" ||
               this.type === "BOX" ||
               this.type === "PULSE"
    }

    public isMirror(): boolean {
        return this.type.startsWith("MIRROR");
    }

    public isElevator(): boolean {
        return this.type === "ELEVATOR_BLOCK";
    }

    public isPowerBlock(): boolean {
        return this.type === "POWER_BLOCK";
    }

    public getRotation(): string {
        if (this.type.endsWith("NE")) { return "NE"; }
        if (this.type.endsWith("NW")) { return "NW"; }
        if (this.type.endsWith("SE")) { return "SE"; }
        if (this.type.endsWith("SW")) { return "SW"; }
        return "";
    }

    public getFacing(): V3i {
        console.log(this.getRotation());
        switch (this.getRotation()) {
            case "SE": return V3i.right;
            case "NW": return V3i.left;
            case "NE": return V3i.forward;
            case "SW": return V3i.back;
            default: return V3i.zero;
        }
    }

    public getMirrorType(): string {
        if (this.type.startsWith("MIRROR_1")) {
            return "1";
        }

        if (this.type.startsWith("MIRROR_2")) {
            return "2";
        }

        return "";
    }

    public isPushable() {
        return this.isActor() && !this.isElevator();
    }

    public isAffectedByGravity(): boolean {
        return this.type === "WIZARD" || 
               this.type === "BOX" ||
               this.isMirror();
    }

    public hasOrientation(): boolean {
        return this.isMirror();
    }

    public rotate() {
        const [prefix, group, suffix] = this.type.split("_");
        this.type = prefix + "_" + group + "_" + ROTATIONS[suffix];
        const { frames, duration, mode, drop } = getSpriteForEntity(this);
        this.frames = frames;
        this.frameDuration = duration || 0;
        this.frameElapsed = 0;
        this.frameIndex = 0;
        this.frameDrop = drop || 0;
        this.playbackMode = mode;
        setupPickerFrames(this);
    }
}