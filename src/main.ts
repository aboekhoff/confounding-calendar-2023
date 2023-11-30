import './style.css';
import { loadSprites } from './game/gfx';
import { Game } from './game/game';
import { PlayScreen } from './screens/play';
import { EditScreen } from './screens/edit';
import { Storage } from './model/storage';
import { IS_PROD } from './model/constants';

loadSprites(() => {
  const game = new Game();

  if (IS_PROD) {
    game.pushScreen(new PlayScreen(game, Storage.loadPuzzleByName("Concal2023")!));
    game.start();
    return;
  }

  // const screen = new PlayScreen(game);
  const screen = new EditScreen(game, Storage.loadLastPuzzle());
  game.pushScreen(screen);
  game.start();
});
