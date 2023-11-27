import { html } from './html';

export interface FolderProps {
    puzzles: PuzzleData[];
    handleClick: (id: string) => void;
}

export interface PuzzleData {
    id: string;
    name: string;
}

export function Folder(props: FolderProps) {
    const { puzzles } = props;
    const entries = puzzles.map((data: PuzzleData) => {
        const handleClick = () => props.handleClick(data.id);
        return html`
            <div className="FolderEntry" onClick=${handleClick}>
                ${data.name}
            </div>
        `;
    });

    return html`
        <div className="Folder">
            ${entries}
        </div>
    `;
}
