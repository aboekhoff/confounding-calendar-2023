import { Puzzle, SerializedPuzzle } from './puzzle';
import { IS_PROD } from './constants';
import jsonPuzzles  from './puzzles.json';

export class Storage {
    static manifest: Record<string, string> = {};

    static loadPuzzle(id: string): Puzzle {
        if (IS_PROD) {
            const puzzles = ((jsonPuzzles as unknown) as Record<string, SerializedPuzzle>);
            console.log(puzzles[id]);
            return Puzzle.deserialize(puzzles[id]);
        }

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
        if (IS_PROD) {
            return;
        }
        localStorage.setItem("lastPuzzle", p.id);
        this.manifest[p.id] = p.name;
        this.saveManifest();
        const json = JSON.stringify(p.serialize());
        localStorage.setItem(p.id, json);
        p.isDirty = false;
    }

    static saveManifest() {
        if (IS_PROD) {
            return;
        }
        localStorage.setItem("manifest", JSON.stringify(this.manifest));
    }

    static loadManifest() {
        if (IS_PROD) {
            const puzzles = (jsonPuzzles as unknown) as Record<string, SerializedPuzzle>;
            this.manifest = {};
            Object.keys(puzzles).forEach(id => {
                this.manifest[id] = puzzles[id].name;
            });
        }

        const json = localStorage.getItem("manifest") || "{}";
        this.manifest = JSON.parse(json);
    }

    static getPuzzleList() {
        if (IS_PROD) {
            return [];
        }
        return Object.keys(this.manifest).map(k => ({ id: k, name: this.manifest[k] }));
    }

    static loadLastPuzzle(): Puzzle | null {
        const lastId = localStorage.getItem("lastPuzzle") || "";
        return this.loadPuzzle(lastId);
    }

    static loadPuzzleByName(name: string): Puzzle | null {
        this.loadManifest();
        console.log(this.manifest);
        for (const id of Object.keys(this.manifest)) {
            if (this.manifest[id] === name) {
                return this.loadPuzzle(id);
            }
        }
        return null;
    }

    static export() {
        const out: Record<string, any> = {}
        for (const key of Object.keys(this.manifest)) {
            const puzzle = JSON.parse(localStorage.getItem(key)!);
            out[key] = puzzle; 
        }
        return out;
    }
}