import { definePage } from '../engine/page';
import { playGameSection } from '../sections/play-game';

export default definePage((root, _params, scope) => {
  root.append(playGameSection(scope));
});
