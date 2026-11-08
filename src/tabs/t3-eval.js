/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 3 군집 분석 결과 평가 — 실루엣 계수 원리 · 실루엣 그래프 · 엘보 방법 · 최적 k 실험실
import { h, 채우기, s, 수, 알림, 고르기단추, 슬라이더, 대화상자 } from '../lib/ui.js';
import { 기록 } from '../lib/store.js';
import { 좌표판, 점, 중심점, 군집영역, 선, 꺾은선, 색, 회색, 보기좋은축 } from '../lib/plot.js';
import { 실루엣예시 } from '../data.js';
import { 거리, 실루엣, 실루엣점수, 최선k평균, 덩어리, 엘보목록, 실루엣목록, 엘보찾기 } from '../lib/cluster.js';

/** -1 ~ 1 수직선 위에 s 값 표시 */
function 수직선(값) {
  const W = 560, H = 74, x = v => 30 + ((v + 1) / 2) * (W - 60);
  const g = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
  g.append(
    s('rect', { x: x(-1), y: 26, width: x(0) - x(-1), height: 14, fill: '#f8caca', rx: 3 }),
    s('rect', { x: x(0), y: 26, width: x(0.5) - x(0), height: 14, fill: '#ffe9b0' }),
    s('rect', { x: x(0.5), y: 26, width: x(1) - x(0.5), height: 14, fill: '#c9efd6', rx: 3 }));
  for (const v of [-1, -0.5, 0, 0.5, 1]) g.append(s('text', { x: x(v), y: 58, 'text-anchor': 'middle', 'font-size': 13, fill: '#555' }, v));
  g.append(s('text', { x: x(-0.5), y: 72, 'text-anchor': 'middle', 'font-size': 12, fill: '#a33' }, '잘못된 군집'),
    s('text', { x: x(0.12), y: 72, 'text-anchor': 'middle', 'font-size': 12, fill: '#9a6b00' }, '경계'),
    s('text', { x: x(0.75), y: 72, 'text-anchor': 'middle', 'font-size': 12, fill: '#1e6b3d' }, '잘 어울림'));
  const v = Math.max(-1, Math.min(1, 값));
  g.append(s('path', { d: `M${x(v)},24 l-9,-14 h18 Z`, fill: '#1f2a37' }), s('text', { x: x(v), y: 9, 'text-anchor': 'middle', 'font-weight': 900, 'font-size': 13 }, 수(값, 2)));
  return g;
}
const 해석 = v => (v >= 0.5 ? ['자기 군집에 잘 어울려요 (1에 가까움)', 'ok'] : v >= 0 ? ['군집의 경계에 걸친 애매한 상태예요 (0에 가까움)', 'info'] : ['다른 군집에 더 가까워요 — 잘못 묶인 상태 (음수)', 'bad']);

// ───────────────────────── 1. 실루엣 계수의 원리 ─────────────────────────
function 실루엣원리(el, 수명, 도구) {
  const 무리 = {
    A: [[20, 62], [30, 76], [14, 74]],
    B: [[62, 28], [74, 20], [72, 36]],
    C: [[76, 80], [86, 70]],
  };
  const 무리색 = { A: '#2e86de', B: '#27ae60', C: '#f39c12' };
  let X = [34, 62];
  const 도전 = 기록.get('실루엣도전', { 높음: false, 음수: false });
  const 판 = 좌표판({ w: 500, h: 500, x간격: 20, y간격: 20 });
  const 계산칸 = h('div', { class: 'col' });
  const 도전칸 = h('div');
  const x점 = 점(판, ...X, { r: 15, fill: 무리색.A, 글: 'X', 굵기: 3, stroke: '#111' });

  x점.classList.add('drag');
  x점.addEventListener('pointerdown', e => {
    e.preventDefault(); 판.svg.setPointerCapture(e.pointerId);
    const 움직 = ev => { const p = 판.데이터좌표(ev); X = [Math.min(98, Math.max(2, p.x)), Math.min(98, Math.max(2, p.y))]; 그리기(); };
    const 끝 = () => { 판.svg.removeEventListener('pointermove', 움직); 판.svg.removeEventListener('pointerup', 끝); };
    판.svg.addEventListener('pointermove', 움직); 판.svg.addEventListener('pointerup', 끝);
  });

  function 그리기() {
    판.비우기('아래', '가운데', '위');
    for (const [이름, 점목록] of Object.entries(무리)) {
      판.g.아래.append(군집영역(판, 이름 === 'A' ? [...점목록, X] : 점목록, 무리색[이름], 46));
      const 가운데 = 점목록.reduce((a, p) => [a[0] + p[0] / 점목록.length, a[1] + p[1] / 점목록.length], [0, 0]);
      판.g.아래.append(s('text', { x: 판.sx(가운데[0]), y: 판.sy(가운데[1]) - 38, 'text-anchor': 'middle', 'font-weight': 900, fill: 무리색[이름], 'font-size': 17 }, '군집 ' + 이름));
    }
    const 평균거리 = 목록 => 목록.reduce((t, p) => t + 거리(X, p), 0) / 목록.length;
    const a = 평균거리(무리.A);
    const 남 = ['B', 'C'].map(n => ({ n, 평균: 평균거리(무리[n]) })).sort((p, q) => p.평균 - q.평균);
    const b = 남[0].평균, 이웃 = 남[0].n;
    const 값 = (b - a) / Math.max(a, b);
    // 선: X → 같은 군집(파랑 실선), X → 가장 가까운 다른 군집(빨강 점선)
    for (const p of 무리.A) {
      판.g.가운데.append(선(판, X, p, { 색: '#2e86de', 굵기: 2.5 }));
      판.g.가운데.append(s('text', { x: (판.sx(X[0]) + 판.sx(p[0])) / 2, y: (판.sy(X[1]) + 판.sy(p[1])) / 2 - 4, fill: '#1d5fa3', 'font-size': 13, 'font-weight': 800 }, 수(거리(X, p), 1)));
    }
    for (const p of 무리[이웃]) {
      판.g.가운데.append(선(판, X, p, { 색: '#d64545', 굵기: 2, 점선: true }));
      판.g.가운데.append(s('text', { x: (판.sx(X[0]) + 판.sx(p[0])) / 2, y: (판.sy(X[1]) + 판.sy(p[1])) / 2 + 14, fill: '#b02a2a', 'font-size': 13, 'font-weight': 800 }, 수(거리(X, p), 1)));
    }
    for (const [이름, 점목록] of Object.entries(무리)) 점목록.forEach(p => 판.g.위.append(점(판, ...p, { r: 9, fill: 무리색[이름] })));
    판.g.위.append(x점);
    x점.setAttribute('transform', `translate(${판.sx(X[0])},${판.sy(X[1])})`);

    const [말, 종류] = 해석(값);
    const dA = 무리.A.map(p => 수(거리(X, p), 1));
    const dB = 무리[이웃].map(p => 수(거리(X, p), 1));
    채우기(계산칸, 
      h('div', { class: 'formula', html: `a(X) = <span style="color:#1d5fa3">(${dA.join(' + ')}) / 3 = <b>${수(a, 2)}</b></span> &nbsp;<small>같은 군집 A 와의 평균 거리</small>` }),
      h('div', { class: 'formula', html: `b(X) = <span style="color:#b02a2a">(${dB.join(' + ')}) / ${dB.length} = <b>${수(b, 2)}</b></span> &nbsp;<small>가장 가까운 다른 군집 ${이웃}</small>` }),
      h('div', { class: 'muted' }, `다른 군집과의 평균 거리: ${남.map(x => `${x.n} ${수(x.평균, 1)}`).join(' · ')} → 더 가까운 ${이웃} 를 b 로 써요.`),
      h('div', { class: 'formula', html: `s(X) = (b − a) / max(a, b) = (${수(b, 2)} − ${수(a, 2)}) / ${수(Math.max(a, b), 2)} = <b style="font-size:26px">${수(값, 2)}</b>` }),
      수직선(값),
      h('div', { class: 'fb ' + 종류 }, 말),
    );
    if (값 >= 0.7) 도전.높음 = true;
    if (값 < 0) 도전.음수 = true;
    기록.set('실루엣도전', 도전);
    채우기(도전칸, h('b', null, '🎯 X 를 끌어서 '),
      h('span', null, 도전.높음 ? '✅' : '⬜', ' s ≥ 0.7 만들기  '),
      h('span', null, 도전.음수 ? '✅' : '⬜', ' s < 0 (음수) 만들기'));
    if (도전.높음 && 도전.음수) 도구.완료();
  }
  const 예시 = () => {
    const a = 실루엣예시.같은군집, b = 실루엣예시.가까운군집;
    const A = a.reduce((x, y) => x + y) / 3, B = b.reduce((x, y) => x + y) / 3;
    대화상자('📕 교과서 예시 계산', h('div', { class: 'col' },
      h('div', { class: 'formula', html: `a(X) = (${a.join(' + ')}) / 3 = <b>${수(A, 2)}</b>` }),
      h('div', { class: 'formula', html: `b(X) = (${b.join(' + ')}) / 3 = <b>${수(B, 2)}</b>` }),
      h('div', { class: 'formula', html: `s(X) = (${수(B, 2)} − ${수(A, 2)}) / ${수(Math.max(A, B), 2)} = <b>${수((B - A) / Math.max(A, B), 3)}</b>` }),
      h('p', null, '0.5 보다 크니 X 는 군집 A 에 잘 어울리는 편이에요.')));
  };
  el.append(
    h('div', { class: 'plot-box' }, 판.svg),
    h('div', { class: 'col grow' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, '실루엣 계수 (Silhouette Coefficient)'), h('button', { class: 'btn sm', onClick: 예시 }, '📕 교과서 예시')),
      h('p', { class: 'lead' }, '데이터 X 를 끌어 보세요. X 는 언제나 군집 A 소속이에요. 군집 내 평균 거리 a 와 가장 가까운 다른 군집과의 평균 거리 b 를 견주어요.'),
      계산칸, h('div', { class: 'panel' }, 도전칸)));
  그리기();
}

// ───────────────────────── 공용: 연습 데이터 고르기 ─────────────────────────
const 연습데이터 = {
  셋: { 이름: '잘 나뉜 3무리', 점들: () => 덩어리(31, 3, 7, 16).점들 },
  넷: { 이름: '4무리', 점들: () => 덩어리(12, 4, 8, 15).점들 },
  섞임: { 이름: '뒤섞인 데이터', 점들: () => 덩어리(4, 3, 17, 18).점들 },
};

// ───────────────────────── 2. 실루엣 그래프 ─────────────────────────
function 실루엣그래프(el, 수명, 도구) {
  let 데이터 = '셋', k = 2, 고른점 = -1;
  const 해본k = new Set(기록.get('실루엣해본k', []));
  const 왼칸 = h('div', { class: 'plot-box' });
  const 막대칸 = h('div', { class: 'plot-box' });
  const 정보 = h('div', { class: 'col' });
  const 조건칸 = h('div', { class: 'col', style: { gap: '3px' } });

  function 그리기() {
    const 점들 = 연습데이터[데이터].점들();
    const r = 최선k평균(점들, k, 9);
    const 목록 = 실루엣(점들, r.이름표);
    const 점수 = 목록.reduce((t, x) => t + x.s, 0) / 목록.length;
    해본k.add(데이터 + k); 기록.set('실루엣해본k', [...해본k]);

    const 판 = 좌표판({ w: 430, h: 430, x간격: 20, y간격: 20 });
    for (let g = 0; g < k; g++) 판.g.아래.append(군집영역(판, 점들.filter((_, i) => r.이름표[i] === g), 색[g], 22));
    점들.forEach((p, i) => {
      const 음수 = 목록[i].s < 0;
      const 점g = 점(판, ...p, { r: i === 고른점 ? 10 : 7, fill: 색[r.이름표[i]], stroke: 음수 ? '#111' : '#fff', 굵기: 음수 ? 3 : 1.5, cls: i === 고른점 ? 'sel' : '' });
      점g.addEventListener('click', () => { 고른점 = i; 그리기(); });
      판.g.위.append(점g);
    });
    r.중심.forEach((c, g) => 판.g.맨위.append(중심점(판, ...c, { fill: 색[g], 크기: 10 })));
    채우기(왼칸, 판.svg);

    // 막대: 군집마다 실루엣 계수를 큰 것부터
    const W = 600, H = 300, 좌 = 40, 위 = 22, 아래 = 30;
    const sx = v => 좌 + ((v + 0.3) / 1.3) * (W - 좌 - 14);
    const 막대 = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'plot' });
    for (const v of [-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1]) {
      막대.append(s('line', { x1: sx(v), x2: sx(v), y1: 위, y2: H - 아래, class: 'grid' }));
      막대.append(s('text', { x: sx(v), y: H - 10, class: 'tick', 'text-anchor': 'middle' }, v));
    }
    const 줄높이 = (H - 위 - 아래 - k * 6) / 점들.length;
    let y = 위;
    for (let g = 0; g < k; g++) {
      const 구성 = 목록.map((x, i) => ({ ...x, i })).filter(x => r.이름표[x.i] === g).sort((p, q) => q.s - p.s);
      막대.append(s('text', { x: 좌 - 8, y: y + (구성.length * 줄높이) / 2 + 5, 'text-anchor': 'end', 'font-weight': 800, fill: 색[g] }, g + 1));
      for (const x of 구성) {
        const 바 = s('rect', {
          x: Math.min(sx(0), sx(x.s)), y, width: Math.abs(sx(x.s) - sx(0)), height: Math.max(1, 줄높이 - 0.6),
          fill: 색[g], opacity: x.i === 고른점 ? 1 : 0.75, stroke: x.i === 고른점 ? '#111' : 'none', style: 'cursor:pointer',
        });
        바.addEventListener('click', () => { 고른점 = x.i; 그리기(); });
        막대.append(바);
        y += 줄높이;
      }
      y += 6;
    }
    막대.append(s('line', { x1: sx(점수), x2: sx(점수), y1: 위 - 6, y2: H - 아래, stroke: '#d32f2f', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }));
    막대.append(s('text', { x: sx(점수), y: 14, 'text-anchor': 'middle', fill: '#d32f2f', 'font-weight': 900, 'font-size': 13 }, `실루엣 점수 ${수(점수, 2)}`));
    막대.append(s('line', { x1: sx(0.5), x2: sx(0.5), y1: 위, y2: H - 아래, stroke: '#1e8e4e', 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }));
    채우기(막대칸, 막대);

    // 좋은 군집화의 조건 4가지 (교과서 133쪽)
    const 크기 = [...Array(k).keys()].map(g => r.이름표.filter(v => v === g).length);
    const 군집평균 = [...Array(k).keys()].map(g => { const m = 목록.filter((_, i) => r.이름표[i] === g); return m.reduce((t, x) => t + x.s, 0) / m.length; });
    const 조건 = [
      ['각 군집의 데이터가 고르게 분포한다', Math.min(...크기) / Math.max(...크기) >= 0.5, `가장 작은 군집 ${Math.min(...크기)}개 / 가장 큰 군집 ${Math.max(...크기)}개`],
      ['실루엣 계수가 음수인 데이터가 없다', 목록.every(x => x.s >= 0), `음수 ${목록.filter(x => x.s < 0).length}개`],
      ['군집별 평균이 실루엣 점수에서 크게 벗어나지 않는다', 군집평균.every(m => Math.abs(m - 점수) <= 0.15), `군집별 평균 ${군집평균.map(m => 수(m, 2)).join(' / ')}`],
      ['실루엣 점수가 1에 가깝다 (0.5 이상)', 점수 >= 0.5, `점수 ${수(점수, 2)}`],
    ];
    채우기(조건칸, h('b', null, '✅ 좋은 군집화의 조건'), 조건.map(([글, 통과, 근거]) => h('div', { style: { fontSize: '15px' } }, 통과 ? '🟢 ' : '🔴 ', 글, h('span', { class: 'muted' }, ` — ${근거}`))));
    if (고른점 >= 0) {
      const x = 목록[고른점];
      채우기(정보, h('div', { class: 'fb ' + 해석(x.s)[1], html: `고른 점: a = ${수(x.a, 1)}, b = ${수(x.b, 1)} → s = <b>${수(x.s, 2)}</b> · ${해석(x.s)[0]}` }));
    } else 채우기(정보, h('div', { class: 'muted' }, '점이나 막대를 누르면 그 데이터의 a, b, s 를 보여 줘요. 테두리가 검은 점은 실루엣 계수가 음수예요.'));
    기록.set('실루엣그래프', { 데이터: 연습데이터[데이터].이름, k, 점수, 조건: 조건.map(c => c[1]) });
    if (해본k.size >= 3) 도구.완료();
  }

  el.append(
    h('div', { class: 'col' },
      고르기단추(Object.entries(연습데이터).map(([값, d]) => ({ 값, 글: d.이름 })), 데이터, v => { 데이터 = v; 고른점 = -1; 그리기(); }),
      h('div', { class: 'row' }, h('b', null, '군집 수 k'), 고르기단추([2, 3, 4, 5, 6].map(v => ({ 값: v, 글: v })), k, v => { k = v; 고른점 = -1; 그리기(); })),
      왼칸),
    h('div', { class: 'col grow' },
      h('h2', { style: { margin: 0 } }, '실루엣 그래프로 군집 평가하기'),
      막대칸,
      h('div', { class: 'panel col', style: { gap: '6px' } }, 조건칸, 정보)));
  그리기();
}

// ───────────────────────── 3. 엘보 방법 ─────────────────────────
function 엘보(el, 수명, 도구) {
  let 데이터 = '셋', k = 1;
  const 왼칸 = h('div', { class: 'plot-box' });
  const 오른칸 = h('div', { class: 'plot-box' });
  const 피드백 = h('div', { class: 'fb' });
  const 정보 = h('div', { class: 'row' });
  let 목록 = [], 점들 = [];

  function 준비() { 점들 = 연습데이터[데이터].점들(); 목록 = 엘보목록(점들, 8, 3); }
  function 그리기() {
    const r = 최선k평균(점들, k, 3 + k);
    const 판 = 좌표판({ w: 420, h: 420, x간격: 20, y간격: 20 });
    점들.forEach((p, i) => 판.g.아래.append(선(판, p, r.중심[r.이름표[i]], { 색: 색[r.이름표[i]], 굵기: 1 })));
    점들.forEach((p, i) => 판.g.위.append(점(판, ...p, { r: 6, fill: 색[r.이름표[i]], 굵기: 1 })));
    r.중심.forEach((c, g) => 판.g.맨위.append(중심점(판, ...c, { fill: 색[g], 크기: 11 })));
    채우기(왼칸, 판.svg);

    const { 최대, 간격 } = 보기좋은축(목록[0].응집도 * 1.08);
    const 그래프 = 좌표판({ w: 520, h: 370, x: [0.5, 8.5], y: [0, 최대], x간격: 1, y간격: 간격, x글: v => (Number.isInteger(v) && v >= 1 ? v : ''), y글: v => (v >= 10000 ? 수(v / 10000, 1) + '만' : v), x이름: '군집 수 k →', y이름: '↑ 응집도(SSE)', pad: { l: 64, r: 16, t: 30, b: 46 } });
    그래프.g.위.append(꺾은선(그래프, 목록.map(x => ({ x: x.k, y: x.응집도 })), { 고른값: k, onPick: v => { k = v; 그리기(); 피드백.textContent = ''; }, 값글: v => 수(v, 0) }));
    채우기(오른칸, 그래프.svg);
    채우기(정보, h('span', { class: 'badge' }, `k = ${k}`), h('span', { class: 'badge' }, `응집도(SSE) = ${수(r.응집도, 0)}`));
  }
  function 확인() {
    const 답 = 엘보찾기(목록);
    if (k === 답) {
      알림(피드백, `⭕ 맞아요! k = ${답} 다음부터는 응집도가 거의 줄지 않아요. 군집을 더 늘려도 효율이 떨어진다는 뜻이에요.`, 'ok');
      기록.set('엘보', { 데이터: 연습데이터[데이터].이름, 답, 목록: 목록.map(x => Math.round(x.응집도)) });
      도구.완료();
    } else if (Math.abs(k - 답) === 1) 알림(피드백, '아까워요! 「크게 줄다가 갑자기 완만해지는」 바로 그 점을 찾아보세요.', 'info');
    else 알림(피드백, k < 답 ? '❌ 이 점 뒤에서도 응집도가 아직 크게 줄어요.' : '❌ 이미 한참 전부터 거의 줄지 않았어요. 더 앞쪽을 보세요.', 'bad');
  }
  el.append(
    h('div', { class: 'col' },
      h('h2', null, '엘보 방법 (Elbow Method)'),
      h('div', { class: 'row' }, 고르기단추(Object.entries(연습데이터).map(([값, d]) => ({ 값, 글: d.이름 })), 데이터, v => { 데이터 = v; k = 1; 준비(); 그리기(); 피드백.textContent = ''; })),
      왼칸, 정보),
    h('div', { class: 'col grow' },
      h('div', { class: 'panel', html: '<b>응집도(SSE)</b> = 중심점과 실제 데이터 사이 거리의 제곱을 모두 더한 값 — 중심에서 얼마나 멀리 흩어졌는지를 재요. <b>0에 가까울수록 군집 내 유사성이 커요.</b> <span class="muted">(회귀에서는 예측값과 실제값 차이의 제곱합)</span>' }),
      오른칸,
      h('div', { class: 'row' }, h('b', null, '🦾 그래프에서 팔꿈치처럼 꺾이는 점을 누른 뒤'), h('button', { class: 'btn primary', onClick: 확인 }, '정답 확인')),
      피드백));
  준비(); 그리기();
}

// ───────────────────────── 4. 최적 k 실험실 ─────────────────────────
function 최적k(el, 수명, 도구) {
  const 판정 = 기록.get('최적k', []);
  let 퍼짐 = 7, 씨앗 = 101, 진짜 = 3, 예상 = null, 공개 = false;
  const 왼칸 = h('div', { class: 'plot-box' });
  const 그래프칸 = h('div', { class: 'row', style: { gap: '8px', alignItems: 'flex-start' } });
  const 단계칸 = h('div', { class: 'col' });
  const 점수판 = h('div', { class: 'row' });

  function 새데이터() {
    씨앗 = Math.floor(Math.random() * 100000);
    진짜 = 2 + Math.floor(Math.random() * 5);
    예상 = null; 공개 = false; 그리기();
  }
  function 그리기() {
    const 점들 = 덩어리(씨앗, 진짜, 퍼짐, 15).점들;
    let 실목록 = [], 엘목록 = [], 실최고 = null, 엘최고 = null, r = null;
    if (공개) {
      실목록 = 실루엣목록(점들, 8, 5); 엘목록 = 엘보목록(점들, 8, 5);
      실최고 = 실목록.reduce((a, b) => (b.점수 > a.점수 ? b : a)).k;
      엘최고 = 엘보찾기(엘목록);
      r = 최선k평균(점들, 실최고, 5);
    }
    const 판 = 좌표판({ w: 400, h: 400, x간격: 20, y간격: 20 });
    점들.forEach((p, i) => 판.g.위.append(점(판, ...p, { r: 6, fill: r ? 색[r.이름표[i]] : 회색, 굵기: 1 })));
    채우기(왼칸, 판.svg);

    if (!공개) {
      채우기(그래프칸, h('div', { class: 'panel', style: { width: '100%', textAlign: 'center', padding: '40px' } },
        h('div', { style: { fontSize: '48px' } }, '🔮'), h('h3', null, '몇 개의 군집이 가장 알맞을까요?'), h('p', { class: 'lead' }, '왼쪽 데이터를 보고 먼저 예상해 보세요. 그다음 실루엣 점수와 엘보 방법으로 확인해요.')));
      채우기(단계칸, 
        h('div', { class: 'row' }, h('b', null, '내 예상 k ='), [2, 3, 4, 5, 6].map(v => h('button', { class: 'btn' + (예상 === v ? ' primary' : ''), onClick: () => { 예상 = v; 그리기(); } }, v))),
        h('button', { class: 'btn primary', disabled: 예상 == null, onClick: () => { 공개 = true; 그리기(); } }, '📊 두 방법으로 확인하기'));
    } else {
      const 실판 = 좌표판({ w: 400, h: 270, x: [1.5, 8.5], y: [0, 1], x간격: 1, y간격: 0.25, x글: v => (Number.isInteger(v) ? v : ''), x이름: 'k →', y이름: '↑ 실루엣 점수' });
      실판.g.위.append(꺾은선(실판, 실목록.map(x => ({ x: x.k, y: x.점수 })), { 색: '#27ae60', 고른값: 실최고, 표시: [{ x: 예상, 색: '#8e44ad', 점선: true }], 값글: v => 수(v, 2) }));
      const { 최대, 간격 } = 보기좋은축(엘목록[0].응집도 * 1.08, 4);
      const 엘판 = 좌표판({ w: 410, h: 270, x: [0.5, 8.5], y: [0, 최대], x간격: 1, y간격: 간격, x글: v => (Number.isInteger(v) && v > 0 ? v : ''), y글: v => (v >= 10000 ? 수(v / 10000, 1) + '만' : v), x이름: 'k →', y이름: '↑ 응집도', pad: { l: 58, r: 14, t: 30, b: 44 } });
      엘판.g.위.append(꺾은선(엘판, 엘목록.map(x => ({ x: x.k, y: x.응집도 })), { 고른값: 엘최고, 표시: [{ x: 예상, 색: '#8e44ad', 점선: true }] }));
      채우기(그래프칸, h('div', { class: 'col', style: { gap: '2px' } }, h('b', null, `실루엣 점수 → 가장 높은 k = ${실최고}`), 실판.svg),
        h('div', { class: 'col', style: { gap: '2px' } }, h('b', null, `엘보 방법 → 꺾이는 k = ${엘최고}`), 엘판.svg));
      const 맞음 = 예상 === 실최고 || 예상 === 엘최고;
      if (!판정.find(x => x.씨앗 === 씨앗)) {
        판정.push({ 씨앗, 진짜, 퍼짐, 예상, 실루엣: 실최고, 엘보: 엘최고 });
        기록.set('최적k', 판정);
      }
      채우기(단계칸, 
        h('div', { class: 'fb ' + (맞음 ? 'ok' : 'info'), html: `내 예상 <b>${예상}</b> · 실루엣 <b>${실최고}</b> · 엘보 <b>${엘최고}</b> · 데이터를 만든 무리 수 <b>${진짜}</b>` + (실최고 !== 엘최고 ? '<br>두 방법의 답이 달라요! 군집 분석은 정답이 없어서 여러 기준을 <b>종합</b>해 판단해요.' : '') }),
        h('button', { class: 'btn primary', onClick: 새데이터 }, '🎲 새 데이터로 한 번 더'));
      if (판정.length >= 3) 도구.완료();
    }
    채우기(점수판, h('span', { class: 'badge' }, `해 본 횟수 ${판정.length}`),
      h('span', { class: 'badge' }, `예상이 두 방법 중 하나와 맞음 ${판정.filter(x => x.예상 === x.실루엣 || x.예상 === x.엘보).length}`));
  }
  const 비교표 = () => 대화상자('실루엣 계수 vs 엘보 방법', h('table', { class: 'grid', style: { width: '100%' } },
    h('tr', null, h('th', null, '구분'), h('th', null, '실루엣 계수'), h('th', null, '엘보 방법')),
    [['목적', '군집의 품질(잘 어울림/잘 구분됨)을 수치로 평가', '더 이상 군집을 늘릴 필요가 없는 지점 확인'],
      ['비유', '무리 안에서는 친하고, 다른 무리와는 달라야 함', '무리를 너무 많이 나누면 효율이 떨어짐'],
      ['기준', '실루엣 점수가 가장 높은 k (1에 가까울수록 좋음)', '그래프가 꺾이는 지점의 k'],
      ['바탕', '유사성과 상이성', '군집 내 유사성(응집도)']].map(([a, b, c]) => h('tr', null, h('th', null, a), h('td', null, b), h('td', null, c)))));

  el.append(
    h('div', { class: 'col' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, '최적의 k 찾기 실험실'), h('button', { class: 'btn sm', onClick: 비교표 }, '📋 두 방법 비교표')),
      왼칸,
      h('div', { class: 'row' },
        슬라이더({ 이름: '무리 안 퍼짐', min: 4, max: 16, 값: 퍼짐, onChange: v => { 퍼짐 = v; 예상 = null; 공개 = false; 그리기(); } }),
        h('button', { class: 'btn', onClick: 새데이터 }, '🎲 새 데이터'))),
    h('div', { class: 'col grow' },
      h('div', { class: 'tip', html: '💡 k 가 너무 <b>적으면</b> 여러 데이터가 크게 묶여 특성이 드러나지 않고, 너무 <b>많으면</b> 지나치게 잘게 나뉘어 숨은 구조를 보기 어려워요. 그래서 여러 번 시행착오를 거쳐요.' }),
      그래프칸, 단계칸, 점수판));
  그리기();
}

export default {
  id: 'eval', 이름: '군집 평가', 아이콘: '📊',
  카드: [
    { id: 'sil', 제목: '실루엣 계수', 그리기: 실루엣원리 },
    { id: 'silplot', 제목: '실루엣 그래프', 그리기: 실루엣그래프 },
    { id: 'elbow', 제목: '엘보 방법', 그리기: 엘보 },
    { id: 'bestk', 제목: '최적의 k 실험실', 그리기: 최적k },
  ],
};
