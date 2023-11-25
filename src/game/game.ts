export interface Screen {
    tick(): void;
    onExit(): void;
}

export class Game {
    public then: number;
    public dt: number;
    public isRunning: boolean;
    public canvas: HTMLCanvasElement;
    public screens: Screen[] = [];

    constructor() {
        this.then = new Date().getTime();
        this.dt = 0;
        this.isRunning = false;
        this.canvas = document.createElement('canvas');
        this.canvas.tabIndex = 1;
        document.body.appendChild(this.canvas);
        window.addEventListener('resize', this.resize);
        this.resize();
    }

    pushScreen(screen: Screen) {
        this.screens.push(screen);
    }

    popScreen() {
        this.screens.pop()?.onExit();
    }

    start() {
        if (this.isRunning) { return; }
        this.isRunning = true;

        const loop = () => {
            if (!this.isRunning) { return; }
            const now = new Date().getTime();
            this.dt = now - this.then;
            this.then = now;
            this.screens[this.screens.length-1].tick();
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    stop() {
        this.isRunning = false;
    }

    resize = () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}