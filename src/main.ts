import './style.css';
import { loadSprites } from './game/gfx';
import { Game } from './game/game';
import { PlayScreen } from './screens/play';
import { EditScreen } from './screens/edit';

loadSprites(() => {
  const game = new Game();
  // const screen = new PlayScreen(game);
  const screen = new EditScreen(game);
  game.pushScreen(screen);
  game.start();
});
