import { Puzzle } from './puzzle';

export class Storage {
    static manifest: Record<string, string> = {};

    static loadPuzzle(id: string): Puzzle {
        this.loadManifest();
        const json = localStorage.getItem(id);
        if (json == null) {
            return new Puzzle();
        }
        localStorage.setItem("lastPuzzle", id);
        const data = JSON.parse(json);
        return Puzzle.deserialize(data);
    }

    static savePuzzle(p: Puzzle) {
        localStorage.setItem("lastPuzzle", p.id);
        this.manifest[p.id] = p.name;
        this.saveManifest();
        const json = JSON.stringify(p.serialize());
        localStorage.setItem(p.id, json);
        p.isDirty = false;
    }

    static saveManifest() {
        localStorage.setItem("manifest", JSON.stringify(this.manifest));
    }

    static loadManifest() {
        const json = localStorage.getItem("manifest") || "{}";
        this.manifest = JSON.parse(json);
    }

    static getPuzzleList() {
        return Object.keys(this.manifest).map(k => ({ id: k, name: this.manifest[k] }));
    }

    static loadLastPuzzle(): Puzzle | null {
        const lastId = localStorage.getItem("lastPuzzle") || "";
        return this.loadPuzzle(lastId);
    }

    static loadPuzzleByName(name: string): Puzzle | null {
        for (const id of Object.keys(this.manifest)) {
            if (this.manifest[id] === name) {
                return this.loadPuzzle(id);
            }
        }
        return null;
    }
}