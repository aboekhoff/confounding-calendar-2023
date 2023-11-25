import { html } from './html';
import { Component, createRef } from 'preact';
import { EDITOR_SCALE } from '../model/constants';
import type { BrushData } from '../screens/edit';  

export interface PaletteProps {
    className: string,
    brushes: BrushData[];
    activeBrush: BrushData | null;
    handleClick: (data: BrushData) => void;
}

export interface PaletteButtonProps {
    activeBrush: BrushData;
    brushData: BrushData;
    handleClick: (data: BrushData) => void;
}

class PaletteButton extends Component<PaletteButtonProps> {
    public canvasRef;

    constructor() {
        super();
        this.canvasRef = createRef();
    }

    componentDidMount() {
        const { brushData } = this.props;
        const canvas = (this.canvasRef.current as unknown) as HTMLCanvasElement | null;
        if (canvas == null) { return; }
        canvas.width = brushData.sprite.width * EDITOR_SCALE;
        canvas.height = brushData.sprite.height * EDITOR_SCALE;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            brushData.sprite, 
            0, 0, brushData.sprite.width, brushData.sprite.height,
            0, 0, brushData.sprite.width * EDITOR_SCALE, brushData.sprite.height * EDITOR_SCALE
        );
    }

    swallowEvent = (e: MouseEvent) => {
        e.stopPropagation();
    }

    render() {
        const { brushData, activeBrush, handleClick } = this.props;
        const _handleClick = (e: MouseEvent) => {
            e.stopPropagation();
            handleClick(this.props.brushData);
        }
        const className = brushData === activeBrush ? "PaletteButton selected" : "PaletteButton";
        return html`
            <canvas 
                class="${className}" 
                ref=${this.canvasRef} 
                onClick=${_handleClick}
                onMouseDown=${this.swallowEvent}
            >
            </canvas>
        `;
        }
} 

export function Palette(props: PaletteProps) {
    const { className, brushes, handleClick, activeBrush } = props;
    const buttons = brushes.map((brushData: BrushData) => html`
        <${PaletteButton}
            brushData=${brushData}
            activeBrush=${activeBrush}
            handleClick=${handleClick}
        >
        </${PaletteButton}>
    `);
    return html`
    <div class="${className}">
        ${buttons}
    </div>
    `;
}