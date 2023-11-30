import { V3i, V3 } from "./vec";
import { Entity, EntityType, SerializedEntity } from "./entity";
import { getSpriteForEntity, setupPickerFrames } from "../game/gfx";
import { rotate } from "./util";
import { PULSE_LIFETIME } from '../model/constants';

const MAX_INT = 2147483647;

export interface SerializedPuzzle {
    id: string;
    name: string;
    next: string;
    hint: string;
    entities: SerializedEntity[];
}

export class Puzzle {
    public name: string = "New Puzzle";
    public next: string = "";
    public hint: string = "";
    public v2e: Map<V3i, Entity> = new Map();
    public player: Entity | undefined;
    public actors: Set<Entity> = new Set();
    public history: Entity[][] = [];
    public initialState: Entity[] = [];
    public id: string;
    public isDirty: boolean = false;
    public mirrors1: Set<Entity> = new Set();
    public mirrors2: Set<Entity> = new Set();
    public elevators: Set<Entity> = new Set();
    public powerBlocks: Set<Entity> = new Set();

    constructor() {
        this.id = ((Math.random() * MAX_INT) | 0).toString(16) + ":" + 
                  ((Math.random() * MAX_INT) | 0).toString(16) + ":" + 
                  ((Math.random() * MAX_INT) | 0).toString(16);
    }

    init() {
        this.history.length === 0;
        this.actors.size === 0;
        for (const e of this.v2e.values()) {
            if (e.isActor()) {
                this.actors.add(e);
            }
            if (e.type === "WIZARD") {
                this.player = e;
            }
        }
        this.initialState = [...this.v2e.values()].map(e => e.copy());
    }

    deleteEntity(pos: V3i) {
        if (!this.v2e.has(pos)) {
            return;
        }

        this.isDirty = true;
        const e = this.v2e.get(pos)!;
        this.v2e.delete(pos);
        this.actors.delete(e);
        Entity.deleteEntity(e);
    }

    createEntity(type: string, pos: V3i): Entity {
        this.deleteEntity(pos);
        this.isDirty = true;

        const e = new Entity();
        e.type = type;
        e.pos = pos;
        e.lastPos = e.pos;
        e.screenPos = V3.create(pos.x, pos.y, pos.z);
        const { frames, duration, drop } = getSpriteForEntity(e);

        e.frames = frames;
        e.frameDuration = duration || 0;
        e.frameDrop = drop || 0;
        this.v2e.set(e.pos, e);
        if (e.type == EntityType.WIZARD) {
            this.player = e;
        }
        if (e.isActor()) {
            this.actors.add(e);
        }
        if (e.isMirror()) {
            if (e.getMirrorType() === "1") {
                this.mirrors1.add(e);
            } else if (e.getMirrorType() === "2") {
                this.mirrors2.add(e);
            }
        }
        if (e.isElevator()) {
            this.actors.add(e);
            this.elevators.add(e);
        }
        if (e.isPowerBlock()) {
            this.powerBlocks.add(e);
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

    rotateLeft(alsoRotateScreenPos = true) {
        this.pushHistoryAll();
        this._rotate(alsoRotateScreenPos);
        this._rotate(alsoRotateScreenPos);
        this._rotate(alsoRotateScreenPos);
    }

    rotateRight(alsoRotateScreenPos = true) {
        this.pushHistoryAll();
        this._rotate(alsoRotateScreenPos);
    }

    _rotate(alsoRotateScreenPos = true) {
        const { min, max } = this.getBounds();
        let v2e2 = new Map<V3i, Entity>();
        const prevPlayerPos = this.getPlayerPos();

        for (const e of this.v2e.values()) {
            const pos = rotate(min, max, e.pos, 1)!;
            e.lastPos = e.pos;
            e.pos = V3i.create(pos.x, pos.y, pos.z);
            if (alsoRotateScreenPos) {
                e.screenPos = rotate(min, max, e.screenPos, 1);    
            }
            v2e2.set(e.pos, e);   
            if (e.hasOrientation()) {
                e.rotate();
            }      
        }

        /*
        const swap = this.v2e;
        swap.clear();
        this.v2e = v2e2;
        v2e2 = swap;
        
        const delta = V3.sub(prevPlayerPos, this.getPlayerPos());
        

        for (const e of this.v2e.values()) {
            const pos = V3i.add(e.pos, delta);
            e.lastPos = e.pos;
            e.pos = pos;
            if (alsoRotateScreenPos) {
                e.screenPos = V3.add(e.screenPos, delta);    
            }
            v2e2.set(e.pos, e);   
        }
        */

        this.v2e = v2e2;
    }

    getEntityAbove(v: V3i): Entity | null {
        return this.v2e.get(V3i.add(v, V3i.up)) || null;
    }

    getEntityBelow(v: V3i): Entity | null {
        return this.v2e.get(V3i.add(v, V3i.down)) || null;
    }

    canMoveActor(e: Entity, dir: V3i): boolean {
        if (e.isElevator()) { return false; }
        if (!e.isActor()) { return false; }
        const next = this.v2e.get(V3i.add(e.pos, dir));
        if (next == null) { return true; }
        if (!next.isActor()) { return false; }
        return this.canMoveActor(next, dir);
    }

    moveActor(e1: Entity, dir: V3i) {
        console.log("moving actor");
        console.log(e1);
        if (dir == V3i.zero) { return; }
        const e2 = this.v2e.get(V3i.add(e1.pos, dir));
        
        if (e2 != null) {
            this.moveActor(e2, dir);
        }
       
        this.v2e.delete(e1.pos);
        e1.lastPos = e1.pos;
        e1.pos = V3i.add(e1.pos, dir);
        this.v2e.set(e1.pos, e1);

        if (dir !== V3i.up) {
            const above = this.getEntityAbove(e1.lastPos);
            if (above && this.canMoveActor(above, dir)) {
                this.moveActor(above, dir);
            }
        }
        
    }

    applyGravity(e: Entity): boolean {
        if (!e.isAffectedByGravity()) {
            return false;
        }
        const below = this.v2e.get(V3i.add(e.pos, V3i.down));
        if (below == null && e.pos.z > 0) {
            this.moveActor(e, V3i.down);
            return true;
        }
        return false;
    }

    didPlayerWin() {
        const below = this.getEntityBelow(this.player!.pos);
        return (below !== null && below.type === EntityType.EXIT);
    }

    didPlayerLose() {
        return this.player!.pos.z <= 0;
    }

    isGameOver() {
        return this.didPlayerWin() || this.didPlayerLose(); 
    }

    pushHistory() {
        this.history.push(
            [...this.actors, ...this.powerBlocks].map(e => e.copy())
        );
    }

    pushHistoryAll() {
        this.history.push([...this.v2e.values()].map(e => e.copy()));
    }

    movePlayer(dir: V3i) {
        const player = this.player!;
        if (this.canMoveActor(player, dir)) {
            this.pushHistory();
            this.moveActor(player, dir);
        }
    }

    public findOtherMirror(e: Entity, es: Iterable<Entity>): Entity | null {
        for (const other of es) {
            if (e !== other) { return other;}
        }
        return null;
    }

    public isReflectiveHit(e: Entity, mirror: Entity): boolean {
        const facing = mirror.getFacing();
        return V3i.add(mirror.pos, facing) === e.pos;
    }

    updateElevators(isActive: boolean) {
        this.elevators.forEach(e => {
            if (isActive) {
                this.moveActor(e, V3i.up);
            } else {
                this.moveActor(e, V3i.down);
            }
            e.isActive = isActive;
            const { frames } = getSpriteForEntity(e);
            e.frames = frames;
        });
    }

    public getPlayerPos(): V3i {
        return this.player ? this.player.pos : V3i.zero;
    }

    public tick(): boolean {

        let ticked = false;
        for (const e of this.actors) {
            if (e.destroyed) { continue; }
            if (e.momentum === V3i.zero) { continue; }
            e.age++;
            
            const nextPos = V3i.add(e.pos, e.momentum);
            const nextEntity = this.v2e.get(nextPos);
            if (nextEntity == null) {
                this.moveActor(e, e.momentum);
                ticked = true;
            }
            else if (e.isPulse() && nextEntity.isPowerBlock()) {
                nextEntity.isActive = !nextEntity.isActive;
                e.destroyed = true;
                const { frames } = getSpriteForEntity(nextEntity);
                nextEntity.frames = frames;
                this.updateElevators(nextEntity.isActive);
                ticked = true;
            }
            else if (e.isPulse() && nextEntity.isMirror() && this.isReflectiveHit(e, nextEntity)) {
                const type = nextEntity.getMirrorType();
                let other: Entity | null = null;
                if (type === "1") {
                    other = this.findOtherMirror(nextEntity, this.mirrors1);
                }
                else {
                    other = this.findOtherMirror(nextEntity, this.mirrors2);
                }
                if (other != null) {
                    const facing = other.getFacing();
                    const pos = V3i.add(other.pos, facing);
                    if (this.v2e.get(pos) == null) {
                        this.v2e.delete(e.pos);
                        e.pos = pos;
                        e.lastPos = other.pos;
                        e.screenPos = other.pos;
                        this.v2e.set(e.pos, e);
                        e.momentum = facing;
                        ticked = true;
                    } else {
                        e.momentum = V3i.zero;
                        e.destroyed = true;
                    }
                }
            }
            else if (e.isPulse() && !nextEntity!.isActor() || !this.canMoveActor(nextEntity!, e.momentum)) {
                e.destroyed = true;
            }
            else {
                this.moveActor(e, e.momentum);
                e.destroyed = true;
                ticked = true;
            }
        }

        for (const e of this.actors) {
            if (e.type === EntityType.PULSE && e.age >= PULSE_LIFETIME) {
                e.destroyed = true;
            }
        }

        for (const e of this.actors) {
            ticked = ticked || this.applyGravity(e);
        }

        return ticked;
    }

    undo() {
        const prevState = this.history[this.history.length-1];

        for (const e of prevState) {
            this.v2e.delete(Entity.byId.get(e.id)!.pos);
        }

        for (const data of prevState) {
            const e = Entity.byId.get(data.id)!;
            Object.assign(e, data);
            this.v2e.set(e.pos, e);
        }

        if (this.history.length > 1) {
            this.history.pop();
        }
    }

    reset() {
        this.history.push(this.initialState);
        this.undo();
    }

    serialize(): SerializedPuzzle {
        return {
            name: this.name,
            next: this.next,
            id: this.id,
            hint: this.hint,
            entities: [...this.v2e.values()].map(e => e.serialize()),
        };
    }

    static deserialize(data: SerializedPuzzle): Puzzle {
        const p = new Puzzle();
        p.id = data.id;
        p.name = data.name;
        p.next = data.next;
        p.hint = data.hint;
        for (const e of data.entities) {
            const v = V3i.create(e.pos[0], e.pos[1], e.pos[2]);
            p.createEntity(e.type, v);
        }
        p.init();
        return p;
    }
}

