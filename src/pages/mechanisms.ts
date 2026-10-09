import { definePage } from '../engine/page';
import { h } from '../engine/dom';
import '../sections/mech-util.css';
import { mechHero, mechCurves, mechBaton } from '../sections/mech-hero';
import { mechPrinciples } from '../sections/mech-principles';
import { mechDirect } from '../sections/mech-direct';
import { mechEnvironmental } from '../sections/mech-env';
import { mechClosing } from '../sections/mech-closing';
import { chapterNav, chaptersFrom } from '../sections/chapter-nav';

export default definePage((root, _params, scope) => {
  const main = h('div.mech');
  root.append(main);
  main.append(mechHero(scope), mechCurves(scope), mechBaton(scope), mechPrinciples(scope), mechDirect(scope));
  mechEnvironmental(scope, main);
  main.append(mechClosing(scope));
  const sections = Array.from(main.children).filter((c): c is HTMLElement => c instanceof HTMLElement && (c.tagName === 'SECTION' || c.classList.contains('section')));
  chapterNav(scope, chaptersFrom(sections));
});
