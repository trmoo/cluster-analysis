/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유
 *  학교 수업 목적으로만 이용해 주세요. 무단 배포·상업적 이용을 금합니다. */
// 앱의 뼈대 — 1280×720 무대를 창 크기에 맞춰 늘이고 줄인다(스크롤 없음).
// 탭(대단원) → 카드(화면 하나 = 활동 하나) 차례로 넘긴다.
import './style.css';
import { h, 화면수명, 대화상자 } from './lib/ui.js';
import { 이어하기저장, 이어하기확인 } from './lib/resume.js';
import { 기록 } from './lib/store.js';
import 탭0 from './tabs/t0-open.js';
import 탭1, { 종류탭 } from './tabs/t1-cluster.js';
import 탭2 from './tabs/t2-similar.js';
import 탭3 from './tabs/t3-eval.js';
import 탭4 from './tabs/t4-wrap.js';

const 탭들 = [탭0, 탭1, 탭2, 종류탭, 탭3, 탭4];   // 유사성(거리)을 배운 뒤 군집 분석의 종류
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
// 수업이 도중에 끝나면 → 이어하기 파일, 다 했으면 → 전체 활동 PDF (어느 화면에서나 누를 수 있게 카드 줄 오른쪽에 둔다)
const 이어단추 = h('button', { class: 'btn sm sub-act', title: '지금까지 한 활동을 HTML 파일로 내려받아요', onClick: () => 이어하기저장(location.hash) }, '💾 다음 시간에 이어하기');
const 완료단추 = h('button', { class: 'btn sm primary sub-act', title: '전체 활동 과정을 PDF 로 내려받아요', onClick: () => 완료하기() }, '🏁 군집 분석 실험실 완료');
무대.append(
  h('header', { class: 'top' },
    h('div', { class: 'brand' }, h('span', { class: 'dots' }, h('i'), h('i'), h('i')), '군집 분석 실험실'),
    탭줄),
  h('div', { class: 'subbar' }, 앞단추, 카드줄, h('div', { class: 'sub-acts' }, 이어단추, 완료단추), 뒤단추),
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

/** 「군집 분석 실험실 완료」 — 덜 한 활동이 있으면 알려 주고, 전체 활동 과정을 PDF 로 내려받는다 */
function 완료하기() {
  const 전부 = 탭들.flatMap(t => t.카드.filter(c => c.id !== 'pdf').map(c => ({ 글: `${t.이름} · ${c.제목}`, 끝: 기록.완료됨(`${t.id}/${c.id}`) })));
  const 남음 = 전부.filter(x => !x.끝);
  const 만들기 = async () => {
    완료단추.disabled = true; 완료단추.textContent = '⏳ PDF 만드는 중…';
    try {
      const { PDF만들기 } = await import('./pdf.js');
      await PDF만들기((지금쪽, 전체쪽) => { 완료단추.textContent = `⏳ PDF 만드는 중… ${지금쪽}/${전체쪽}`; });
      기록.완료('wrap/pdf'); 카드줄그리기();
      대화상자('🎉 군집 분석 실험실 완료!', h('div', { html: '「군집분석_학습정리.pdf」 를 내려받았어요(A4 6쪽, 내가 한 활동이 모두 담겨 있어요).<br>브라우저의 <b>내려받기 폴더</b>를 확인하세요.' }));
    } catch (e) {
      console.error(e);
      대화상자('😢 PDF 를 만들지 못했어요', e.message);
    } finally { 완료단추.disabled = false; 완료단추.textContent = '🏁 군집 분석 실험실 완료'; }
  };
  if (!남음.length) { 만들기(); return; }
  대화상자(`아직 ${남음.length}개 활동이 남았어요`,
    h('div', null,
      h('p', { style: { margin: '0 0 6px' } }, '하지 않은 활동은 PDF 에 「아직 하지 않은 활동」으로 찍혀요.'),
      h('div', { class: 'muted', style: { fontSize: '14px', maxHeight: '220px', overflow: 'auto' } }, 남음.map(x => h('div', null, '○ ' + x.글)))),
    [{ 글: '돌아가서 마저 하기' }, { 글: '그래도 PDF 만들기', 주: true, 할일: 만들기 }]);
}

맞추기();
주소읽기();
그리기();
// 「다음 시간에 이어하기」 로 받은 파일을 열었으면 지난 기록을 불러올지 묻는다
이어하기확인(주소 => { location.hash = 주소 || location.hash; 주소읽기(); 그리기(); });
