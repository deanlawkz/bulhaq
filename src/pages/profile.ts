import { t } from '../engine/i18n';
import { definePage } from '../engine/page';
import { h } from '../engine/dom';
import { reveal } from '../engine/motion';
import { ornamentBand } from '../engine/ornament';
import { resetAnswers, onAnswers } from '../engine/store';
import { profileRadar, AUDIENCES, audTotals } from '../sections/profile-radar';
import { profileQuiz } from '../sections/profile-quiz';
import { profileList } from '../sections/profile-list';

export default definePage((root, _params, scope) => {
  const title = h('h1.t-xl', { html: t('Мой <em>ХАҚ</em>') });
  const lead = h('p.lead.prof-hero__lead', null,
    t('Вопросы ХАҚ-теста — это зеркало, а не экзамен. Здесь нет «правильных» и «неправильных» людей: только честный взгляд на то, где ценность уже живёт, а где её ещё предстоит вырастить.'));
  const hero = h('section.section--tight.prof-hero', null, h('div.wrap.stack', { style: { '--gap': '14px' } }, h('p.eyebrow', null, t('Профиль · зеркало')), title, ornamentBand(10, 'orn-band prof-hero__band'), lead));

  const radar = profileRadar(scope);
  const quiz = profileQuiz(scope);
  const list = profileList(scope, () => radar.primary());
  radar.onPrimary(() => list.refresh());

  // сброс с подтверждением
  const box = h('div.prof-reset');
  const renderReset = (confirm: boolean) => {
    box.textContent = '';
    const any = AUDIENCES.some((a) => audTotals(a).answered > 0);
    if (confirm) {
      box.append(
        h('p', { role: 'alert' }, t('Удалить все ответы на этом устройстве? Это нельзя отменить.')),
        h('div.row', { style: { '--gap': '10px' } },
          h('button.btn.prof-danger', { type: 'button', onclick: () => { resetAnswers(); renderReset(false); } }, t('Да, сбросить')),
          h('button.btn', { type: 'button', onclick: () => renderReset(false) }, t('Отмена'))));
    } else {
      box.append(
        h('button.btn', { type: 'button', disabled: !any, onclick: () => renderReset(true) }, t('Сбросить ответы')),
        h('p.dim', null, t('Ответы хранятся только в вашем браузере и никуда не отправляются.')));
    }
  };
  renderReset(false);
  scope.add(onAnswers(() => { if (!box.querySelector('[role=alert]')) renderReset(false); }));

  const main = h('section.section--tight', null,
    h('div.wrap.prof-main', null, h('div.prof-main__radar', null, radar.el), h('div.prof-main__side', null, quiz)));
  const listSec = h('section.section--tight', null, h('div.wrap.stack', { style: { '--gap': '28px' } }, list.el, box));
  root.append(hero, main, listSec);
  scope.add(reveal(title, { y: 30, start: 'top 100%' }));
  scope.add(reveal(lead, { y: 20 }));
  scope.add(reveal(box, { y: 20 }));
});
