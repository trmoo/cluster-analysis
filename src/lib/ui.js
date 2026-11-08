/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 화면을 만드는 작은 도구 모음 (외부 라이브러리 없이 DOM 을 만든다)

const SVGNS = 'http://www.w3.org/2000/svg';

function 속성넣기(el, a) {
  if (!a) return;
  for (const [k, v] of Object.entries(a)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
}
function 자식넣기(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

/** HTML 요소 만들기: h('div', {class:'x'}, '글자', 다른요소) */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  속성넣기(el, attrs); 자식넣기(el, kids);
  return el;
}
/** SVG 요소 만들기 */
export function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  속성넣기(el, attrs); 자식넣기(el, kids);
  return el;
}

/** 소수 자리 맞춰 쓰기 (끝의 0 은 지운다) */
export function 수(v, 자리 = 2) {
  if (v == null || !isFinite(v)) return '—';
  const t = Number(v).toFixed(자리);
  return t.includes('.') ? t.replace(/\.?0+$/, '') : t;
}

/** 피드백 상자에 글 넣기 — kind: ok / bad / info */
export function 알림(el, 글, kind = 'info') {
  el.className = 'fb ' + kind;
  el.innerHTML = 글;
}

/**
 * 한 화면(카드)의 수명 관리.
 * 카드를 떠날 때 타이머·이벤트를 한꺼번에 걷어 내야 쌓이지 않는다.
 */
export function 화면수명() {
  const 치울것 = [];
  return {
    interval(fn, ms) { const id = setInterval(fn, ms); 치울것.push(() => clearInterval(id)); return id; },
    timeout(fn, ms) { const id = setTimeout(fn, ms); 치울것.push(() => clearTimeout(id)); return id; },
    on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); 치울것.push(() => target.removeEventListener(ev, fn, opt)); },
    치우기(fn) { 치울것.push(fn); },
    끝() { while (치울것.length) { try { 치울것.pop()(); } catch { /* 무시 */ } } },
  };
}

/** 앱 안의 대화상자 (브라우저 기본 alert 대신) */
export function 대화상자(제목, 내용, 단추 = [{ 글: '닫기' }]) {
  const 배경 = h('div', { class: 'modal-bg' });
  const 닫기 = () => 배경.remove();
  const 상자 = h('div', { class: 'modal' },
    h('h3', null, 제목),
    h('div', { class: 'modal-body' }, 내용),
    h('div', { class: 'modal-btns' }, 단추.map(b => h('button', {
      class: 'btn ' + (b.주 ? 'primary' : ''),
      onClick: () => { 닫기(); b.할일?.(); },
    }, b.글))),
  );
  배경.append(상자);
  배경.addEventListener('click', e => { if (e.target === 배경) 닫기(); });
  document.getElementById('stage').append(배경);
  return 닫기;
}

/** 단추 여러 개 중 하나 고르기 (분절 단추) */
export function 고르기단추(목록, 처음, onPick, cls = '') {
  const 묶음 = h('div', { class: 'seg ' + cls });
  const 그리기 = 값 => {
    [...묶음.children].forEach((b, i) => b.classList.toggle('on', 목록[i].값 === 값));
  };
  목록.forEach(항목 => 묶음.append(h('button', {
    class: 'seg-b', onClick: () => { 그리기(항목.값); onPick(항목.값); },
  }, 항목.글)));
  그리기(처음);
  묶음.설정 = 그리기;
  return 묶음;
}

/** 슬라이더 + 값 표시 */
export function 슬라이더({ 이름, min, max, step = 1, 값, 단위 = '', onInput, onChange }) {
  const 표시 = h('b', null, 값 + 단위);
  const 입력 = h('input', { type: 'range', min, max, step, value: 값 });
  입력.addEventListener('input', () => { 표시.textContent = 입력.value + 단위; onInput?.(Number(입력.value)); });
  입력.addEventListener('change', () => onChange?.(Number(입력.value)));
  const el = h('label', { class: 'slider' }, h('span', null, 이름, ' ', 표시), 입력);
  el.입력 = 입력;
  return el;
}

/** 요소의 자식을 통째로 바꾼다 — null·false·배열을 알아서 걸러 준다 */
export function 채우기(el, ...kids) {
  el.replaceChildren();
  자식넣기(el, kids);
}
