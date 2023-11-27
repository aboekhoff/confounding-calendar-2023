import { html } from './html';
import type { Puzzle } from '../model/puzzle';

interface PuzzleInspectorProps {
    puzzle: Puzzle;
}

export function PuzzleInspector(props: PuzzleInspectorProps) {
    const { puzzle } = props;
    const onNameInput = (e: Event) => {
        puzzle.name = (e.target! as HTMLInputElement).value;
    };
    const onNextInput = (e: Event) => {
        puzzle.next = (e.target! as HTMLInputElement).value;
    }
    const onHintInput = (e: Event) => {
        puzzle.hint = (e.target! as HTMLInputElement).value;
    }
    return html`
    <div class="PuzzleInspector">
        <div>${puzzle.id}</div>
        <div><input value=${puzzle.name} onInput=${onNameInput}/></div>
        <div><input value=${puzzle.next} onInput=${onNextInput}/></div>
        <div><input value=${puzzle.hint} onInput=${onHintInput}/></div>
    </div>
    `;
}
