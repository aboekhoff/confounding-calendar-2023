import './style.css';
import { loadSprites } from './game/gfx';
import { Game } from './game/game';
import { PlayScreen } from './screens/play';
import { EditScreen } from './screens/edit';
import { Storage } from './model/storage';

loadSprites(() => {
  const game = new Game();
  // const screen = new PlayScreen(game);
  const lastPuzzle = Storage.loadLastPuzzle();
  console.log(lastPuzzle);
  const screen = new EditScreen(game, Storage.loadLastPuzzle());
  game.pushScreen(screen);
  game.start();
});
