export interface V {
    x: number;
    y: number;
    z: number;
}

export class V3i implements V {
    static instances: Map<string, V3i> = new Map();
    
    public static create(x: number, y: number, z: number) {
        x = x | 0;
        y = y | 0;
        z = z | 0;
        const key = `${x},${y},${z}`;
        if (!this.instances.has(key)) {
            this.instances.set(key, new V3i(x, y, z, key));
        }
        return this.instances.get(key)!;
    }

    public static add(v1: V, v2: V): V3i {
        return V3i.create(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    public static sub(v1: V, v2: V): V3i {
        return V3i.create(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    public static zero = V3i.create(0, 0, 0);
    public static up = V3i.create(0, 0, 1);
    public static down = V3i.create(0, 0, -1);
    public static forward = V3i.create(0, -1, 0);
    public static back = V3i.create(0, 1, 0);
    public static right = V3i.create(1, 0, 0);
    public static left = V3i.create(-1, 0, 0);

    constructor(public x: number, public y: number, public z: number, public key: string) {
        if (V3i.instances.has(key)) {
            throw Error("duplicate v3i being created");
        }
    }
}

export class V3 implements V {

    public static create(x: number, y: number, z: number) {
        return new V3(x, y, z);
    }

    public static add(v1: V, v2: V): V3 {
        return V3.create(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    public static sub(v1: V, v2: V): V3 {
        return V3.create(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    public static mul(v: V, n: number) {
        return V3.create(v.x * n, v.y * n, v.z * n);
    }

    public static zero = V3.create(0, 0, 0);
    public static up = V3.create(0, 0, 1);
    public static down = V3.create(0, 0, -1);
    public static forward = V3.create(0, -1, 0);
    public static back = V3.create(0, 1, 0);
    public static right = V3.create(1, 0, 0);
    public static left = V3.create(-1, 0, 0);

    constructor(public x: number, public y: number, public z: number) {}
}