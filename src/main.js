/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유
 *  학교 수업 목적으로만 이용해 주세요. 무단 배포·상업적 이용을 금합니다. */
// 앱의 뼈대 — 1280×720 무대를 창 크기에 맞춰 늘이고 줄인다(스크롤 없음).
// 탭(대단원) → 카드(화면 하나 = 활동 하나) 차례로 넘긴다.
import './style.css';
import { h, 화면수명 } from './lib/ui.js';
import { 기록 } from './lib/store.js';
import 탭0 from './tabs/t0-open.js';
import 탭1 from './tabs/t1-cluster.js';
import 탭2 from './tabs/t2-similar.js';
import 탭3 from './tabs/t3-eval.js';
import 탭4 from './tabs/t4-wrap.js';

const 탭들 = [탭0, 탭1, 탭2, 탭3, 탭4];
const 무대 = document.getElementById('stage');

// ── 무대 크기 맞추기: 1280×720 을 창에 꼭 맞게(비율 유지) ──
// 창이 16:9 보다 세로로 길면(화면 분할 등) 너비에 맞추고 무대 높이를 늘려 위아래 검은 띠를 없앤다.
// 카드가 flex 로 짜여 있어 늘어난 높이는 여유 자리가 된다. 아주 긴 창은 1200 에서 멈춘다(그 밖은 띠).
const 최대높이 = 1200;
function 맞추기() {
  const 배율 = Math.min(innerWidth / 1280, innerHeight / 720);
  const 높이 = Math.min(최대높이, Math.max(720, innerHeight / 배율));
  무대.style.height = 높이 + 'px';
  무대.style.transform = `scale(${배율})`;
  무대.style.left = (innerWidth - 1280 * 배율) / 2 + 'px';
  무대.style.top = Math.max(0, (innerHeight - 높이 * 배율) / 2) + 'px';
}
addEventListener('resize', 맞추기);

// ── 틀 만들기 ──
const 탭줄 = h('nav', { class: 'tabs' });
const 카드줄 = h('nav', { class: 'cards' });
const 본문 = h('main', { class: 'area' });
const 앞단추 = h('button', { class: 'nav-btn', title: '이전 (←)', onClick: () => 넘기기(-1) }, '◀');
const 뒤단추 = h('button', { class: 'nav-btn', title: '다음 (→)', onClick: () => 넘기기(1) }, '▶');
무대.append(
  h('header', { class: 'top' },
    h('div', { class: 'brand' }, h('span', { class: 'dots' }, h('i'), h('i'), h('i')), '군집 분석 실험실'),
    탭줄),
  h('div', { class: 'subbar' }, 앞단추, 카드줄, 뒤단추),
  본문,
  h('footer', { class: 'foot' },
    h('span', null, '「데이터 과학」 Ⅲ. 군집 분석 모델의 개념 · ← → 키로 넘기기'),
    h('span', null, '© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만 이용해 주세요')),
);

let 지금 = { 탭: 0, 카드: 0 };
let 수명 = null;

function 그리기() {
  const 탭 = 탭들[지금.탭], 카드 = 탭.카드[지금.카드];
  // 탭 줄
  탭줄.replaceChildren(...탭들.map((t, i) => h('button', {
    class: 'tab' + (i === 지금.탭 ? ' on' : ''), onClick: () => 가기(i, 0),
  }, h('span', { class: 'tab-ico' }, t.아이콘), t.이름)));
  // 카드 줄 (완료한 활동에는 ✔)
  카드줄.replaceChildren(...탭.카드.map((c, i) => h('button', {
    class: 'pill' + (i === 지금.카드 ? ' on' : '') + (기록.완료됨(`${탭.id}/${c.id}`) ? ' done' : ''),
    onClick: () => 가기(지금.탭, i),
  }, `${i + 1}. ${c.제목}`)));
  앞단추.disabled = 지금.탭 === 0 && 지금.카드 === 0;
  뒤단추.disabled = 지금.탭 === 탭들.length - 1 && 지금.카드 === 탭.카드.length - 1;
  // 카드 본문 — 앞 화면의 타이머·이벤트를 먼저 걷어 낸다
  수명?.끝();
  수명 = 화면수명();
  const 틀 = h('section', { class: 'card', 'data-card': `${탭.id}/${카드.id}` });
  본문.replaceChildren(틀);
  try {
    카드.그리기(틀, 수명, { 완료: () => { 기록.완료(`${탭.id}/${카드.id}`); 카드줄그리기(); } });
  } catch (e) {
    틀.replaceChildren(h('div', { class: 'fb bad' }, '화면을 그리다가 문제가 생겼어요: ' + e.message));
    console.error(e);
  }
}
function 카드줄그리기() {
  const 탭 = 탭들[지금.탭];
  [...카드줄.children].forEach((b, i) =>
    b.classList.toggle('done', 기록.완료됨(`${탭.id}/${탭.카드[i].id}`)));
}

function 가기(탭, 카드) {
  지금 = { 탭, 카드 };
  const 주소 = `#${탭들[탭].id}/${탭들[탭].카드[카드].id}`;
  if (location.hash !== 주소) history.replaceState(null, '', 주소);
  그리기();
}
function 넘기기(방향) {
  let { 탭, 카드 } = 지금;
  카드 += 방향;
  if (카드 < 0) { if (탭 === 0) return; 탭--; 카드 = 탭들[탭].카드.length - 1; }
  else if (카드 >= 탭들[탭].카드.length) { if (탭 === 탭들.length - 1) return; 탭++; 카드 = 0; }
  가기(탭, 카드);
}
function 주소읽기() {
  const [t, c] = location.hash.slice(1).split('/');
  const ti = Math.max(0, 탭들.findIndex(x => x.id === t));
  const ci = Math.max(0, 탭들[ti].카드.findIndex(x => x.id === c));
  지금 = { 탭: ti, 카드: ci };
}

addEventListener('keydown', e => {
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  if (document.querySelector('.modal-bg')) return;
  if (e.key === 'ArrowRight') 넘기기(1);
  if (e.key === 'ArrowLeft') 넘기기(-1);
});
addEventListener('hashchange', () => { 주소읽기(); 그리기(); });

맞추기();
주소읽기();
그리기();
