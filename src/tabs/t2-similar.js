/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 2 유사성과 상이성 — 군집 내 유사성/군집 간 상이성 · 유클리디언 거리 · 닮은 친구 · 131쪽 실습
import { h, 채우기, s, 수, 알림, 고르기단추, 슬라이더 } from '../lib/ui.js';
import { 기록 } from '../lib/store.js';
import { 좌표판, 점, 중심점, 옮기기, 군집영역, 선, 색, 회색 } from '../lib/plot.js';
import { 성적, 과목, 성적점, 실습131 } from '../data.js';
import { 거리, 맨해튼, 난수, 실루엣점수, 가까운중심, 중심갱신 } from '../lib/cluster.js';

/** 점을 끌어 옮기기 — 화면이 확대·축소되어 있어도 데이터 좌표로 바꿔 준다 */
function 끌기(판, 대상, onMove) {
  대상.classList.add('drag');
  대상.addEventListener('pointerdown', e => {
    e.preventDefault();
    판.svg.setPointerCapture(e.pointerId);
    const 움직 = ev => { const p = 판.데이터좌표(ev); onMove(Math.min(100, Math.max(0, p.x)), Math.min(100, Math.max(0, p.y))); };
    const 끝 = () => { 판.svg.removeEventListener('pointermove', 움직); 판.svg.removeEventListener('pointerup', 끝); };
    판.svg.addEventListener('pointermove', 움직);
    판.svg.addEventListener('pointerup', 끝);
  });
}

// ───────────────────────── 1. 군집 내 유사성 · 군집 간 상이성 ─────────────────────────
const 무리그림 = ['🐻', '🦦', '🐿️'];
function 유사상이(el, 수명, 도구) {
  let 퍼짐 = 10, 간격 = 30, 고른 = [];
  const 도전 = 기록.get('유사상이도전', { 좋음: false, 나쁨: false });
  // 무리마다 같은 모양으로 흩어지도록 미리 정해 둔 방향(난수 고정)
  const r = 난수(42);
  const 모양 = 무리그림.map(() => Array.from({ length: 6 }, () => [r() * 2 - 1, r() * 2 - 1]));
  const 판 = 좌표판({ w: 520, h: 520, x간격: 20, y간격: 20 });
  const 수치 = h('div', { class: 'col' });
  const 피드백 = h('div', { class: 'fb' });
  const 도전칸 = h('div', { class: 'col' });
  let 점들 = [], 이름표 = [];

  function 계산() {
    점들 = []; 이름표 = [];
    무리그림.forEach((_, g) => {
      const 각 = -Math.PI / 2 + (g * 2 * Math.PI) / 3;
      const cx = 50 + Math.cos(각) * 간격, cy = 50 - Math.sin(각) * 간격 * -1;
      모양[g].forEach(([dx, dy]) => { 점들.push([cx + dx * 퍼짐, cy + dy * 퍼짐]); 이름표.push(g); });
    });
  }
  function 그리기() {
    계산();
    판.비우기('아래', '가운데', '위');
    무리그림.forEach((_, g) => 판.g.아래.append(군집영역(판, 점들.filter((_, i) => 이름표[i] === g), 색[g], 50)));
    점들.forEach((p, i) => {
      const t = s('text', { x: 판.sx(p[0]), y: 판.sy(p[1]), 'font-size': 28, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'cursor:pointer' }, 무리그림[이름표[i]]);
      if (고른.includes(i)) 판.g.가운데.append(s('circle', { cx: 판.sx(p[0]), cy: 판.sy(p[1]), r: 20, fill: '#fff3c4', stroke: '#111', 'stroke-width': 2 }));
      t.addEventListener('click', () => { 고른 = 고른.length >= 2 ? [i] : [...고른, i]; 그리기(); });
      판.g.위.append(t);
    });
    if (고른.length === 2) {
      const [a, b] = 고른;
      const 같음 = 이름표[a] === 이름표[b];
      판.g.가운데.append(선(판, 점들[a], 점들[b], { 색: 같음 ? '#1e8e4e' : '#d64545', 굵기: 3, 점선: true }));
      알림(피드백, `${같음 ? '같은 군집 — <b>군집 내 거리</b>' : '다른 군집 — <b>군집 간 거리</b>'} ${수(거리(점들[a], 점들[b]), 1)}`, 같음 ? 'ok' : 'bad');
    }
    // 수치 — 군집 내 평균 거리, 군집 간(중심 사이) 평균 거리, 실루엣 점수
    let 안합 = 0, 안수 = 0;
    for (let i = 0; i < 점들.length; i++) for (let j = i + 1; j < 점들.length; j++)
      if (이름표[i] === 이름표[j]) { 안합 += 거리(점들[i], 점들[j]); 안수++; }
    const 중심 = 중심갱신(점들, 이름표, [[0, 0], [0, 0], [0, 0]]);
    const 사이 = (거리(중심[0], 중심[1]) + 거리(중심[1], 중심[2]) + 거리(중심[0], 중심[2])) / 3;
    const 안 = 안합 / 안수;
    const 점수 = 실루엣점수(점들, 이름표);
    const 막대 = (이름, 값, 비율, c, 뜻) => h('div', null,
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('b', null, 이름), h('span', null, 뜻, ' ', h('b', null, 수(값, 1)))),
      h('div', { class: 'meter' }, h('i', { style: { width: Math.max(3, Math.min(100, 비율 * 100)) + '%', background: c } })));
    채우기(수치, 
      막대('군집 내 평균 거리', 안, 안 / 50, '#2e86de', '작을수록 유사성 ↑'),
      막대('군집 간 평균 거리', 사이, 사이 / 90, '#e4572e', '클수록 상이성 ↑'),
      h('div', { class: 'row' }, h('b', null, '실루엣 점수'), h('span', { class: 'big-num' }, 수(점수, 2)),
        h('span', { class: 'badge', style: { background: 점수 >= 0.5 ? '#c9efd6' : 점수 >= 0.25 ? '#ffe9b0' : '#f8caca' } },
          점수 >= 0.5 ? '좋은 군집' : 점수 >= 0.25 ? '애매한 군집' : '잘 안 나뉨')),
    );
    if (점수 >= 0.7) 도전.좋음 = true;
    if (점수 < 0.2) 도전.나쁨 = true;
    기록.set('유사상이도전', 도전);
    채우기(도전칸, 
      h('b', null, '🎯 도전 '),
      h('span', null, 도전.좋음 ? '✅' : '⬜', ' 실루엣 점수 0.7 이상 만들기 　'),
      h('span', null, 도전.나쁨 ? '✅' : '⬜', ' 0.2 미만(뒤섞인 군집) 만들기'));
    if (도전.좋음 && 도전.나쁨) 도구.완료();
  }

  el.append(
    h('div', { class: 'plot-box' }, 판.svg),
    h('div', { class: 'col grow' },
      h('h2', null, '유사성과 상이성'),
      h('div', { class: 'panel', html: '좋은 군집은 <b>무리 안에서는 친하고(군집 내 유사성 ↑)</b>, <b>다른 무리와는 달라야(군집 간 상이성 ↑)</b> 해요. 🐾 동물 두 마리를 누르면 거리를 재요.' }),
      h('div', { class: 'panel col' },
        슬라이더({ 이름: '🫧 무리 안 퍼짐', min: 2, max: 30, 값: 퍼짐, onInput: v => { 퍼짐 = v; 고른 = []; 그리기(); } }),
        슬라이더({ 이름: '↔ 무리 사이 거리', min: 0, max: 42, 값: 간격, onInput: v => { 간격 = v; 고른 = []; 그리기(); } }),
        수치),
      h('div', { class: 'panel' }, 도전칸),
      피드백));
  그리기();
}

// ───────────────────────── 2. 유클리디언 거리 계산기 ─────────────────────────
function 유클리디언(el, 수명, 도구) {
  let A = [30, 20], B = [80, 60], 방식 = '유클리디언';
  const 판 = 좌표판({ w: 500, h: 500, x이름: 'x →', y이름: '↑ y' });
  const 식칸 = h('div', { class: 'col' });
  const 문제칸 = h('div', { class: 'col' });
  let 맞힌수 = 기록.get('거리문제', 0), 문제 = null, 문제번호 = 0;

  const a점 = 점(판, ...A, { r: 15, fill: '#2e86de', 글: 'a' });
  const b점 = 점(판, ...B, { r: 15, fill: '#e4572e', 글: 'b' });
  판.g.위.append(a점, b점);
  끌기(판, a점, (x, y) => { A = [Math.round(x), Math.round(y)]; 그리기(); });
  끌기(판, b점, (x, y) => { B = [Math.round(x), Math.round(y)]; 그리기(); });

  function 그리기() {
    옮기기(a점, 판, ...A); 옮기기(b점, 판, ...B);
    판.비우기('아래', '가운데');
    const 모서리 = [B[0], A[1]];
    const dx = Math.abs(A[0] - B[0]), dy = Math.abs(A[1] - B[1]);
    if (방식 === '유클리디언') {
      판.g.아래.append(선(판, A, 모서리, { 색: '#2e86de', 굵기: 3, 점선: true }), 선(판, 모서리, B, { 색: '#e4572e', 굵기: 3, 점선: true }));
      판.g.가운데.append(선(판, A, B, { 색: '#1f6f5c', 굵기: 5 }));
    } else {
      // 맨해튼 거리: 바둑판 길(가로로 간 뒤 세로로)
      판.g.가운데.append(s('path', { d: `M${판.sx(A[0])},${판.sy(A[1])} H${판.sx(B[0])} V${판.sy(B[1])}`, fill: 'none', stroke: '#8e44ad', 'stroke-width': 5 }));
      판.g.아래.append(선(판, A, B, { 색: '#9aa5b1', 굵기: 2, 점선: true }));
    }
    판.g.가운데.append(
      s('text', { x: (판.sx(A[0]) + 판.sx(B[0])) / 2, y: 판.sy(A[1]) + (A[1] > B[1] ? -8 : 20), 'text-anchor': 'middle', fill: '#2e86de', 'font-weight': 800 }, `|a₁−b₁| = ${dx}`),
      s('text', { x: 판.sx(B[0]) + (B[0] >= A[0] && B[0] < 70 ? 8 : -8), y: (판.sy(A[1]) + 판.sy(B[1])) / 2, 'text-anchor': B[0] >= A[0] && B[0] < 70 ? 'start' : 'end', fill: '#e4572e', 'font-weight': 800 }, `|a₂−b₂| = ${dy}`));
    const d = 거리(A, B);
    채우기(식칸, 
      h('div', { class: 'row' }, h('span', { class: 'badge', style: { background: '#d6e8fa' } }, `a = (${A[0]}, ${A[1]})`), h('span', { class: 'badge', style: { background: '#fbdcd2' } }, `b = (${B[0]}, ${B[1]})`)),
      방식 === '유클리디언'
        ? h('div', { class: 'formula', html: `d = √((a₁−b₁)² + (a₂−b₂)²)<br>= √((${A[0]}−${B[0]})² + (${A[1]}−${B[1]})²)<br>= √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy}<br>= <b style="color:#1f6f5c;font-size:28px">${수(d, 2)}</b>` })
        : h('div', { class: 'formula', html: `d = |a₁−b₁| + |a₂−b₂|<br>= ${dx} + ${dy} = <b style="color:#8e44ad;font-size:28px">${맨해튼(A, B)}</b><br><span style="font-size:15px">(유클리디언 ${수(d, 2)} 보다 길어요)</span>` }),
    );
  }

  function 새문제() {
    const r = 난수(문제번호 * 97 + 13);
    const i = Math.floor(r() * 10); let j = Math.floor(r() * 9); if (j >= i) j++;
    const c1 = Math.floor(r() * 4); let c2 = Math.floor(r() * 3); if (c2 >= c1) c2++;
    문제 = { i, j, 과: [과목[c1], 과목[c2]] };
    문제번호++;
    문제그리기();
  }
  function 문제그리기() {
    const { i, j, 과 } = 문제;
    const 답 = 거리([성적[i][과[0]], 성적[i][과[1]]], [성적[j][과[0]], 성적[j][과[1]]]);
    const 입력 = h('input', { class: 'txt', style: { width: '120px' }, placeholder: '소수 둘째 자리' });
    const 피 = h('div', { class: 'fb' });
    const 확인 = () => {
      const v = Number(입력.value.replace(/,/g, ''));
      if (입력.value.trim() === '' || !isFinite(v)) { 알림(피, '숫자를 적어 주세요.', 'bad'); return; }
      if (Math.abs(v - 답) <= 0.1) {
        맞힌수++; 기록.set('거리문제', 맞힌수);
        알림(피, `⭕ 정답! ${수(답, 2)} (맞힌 문제 ${맞힌수}개)`, 'ok');
        if (맞힌수 >= 3) 도구.완료();
      } else {
        const d1 = 성적[i][과[0]] - 성적[j][과[0]], d2 = 성적[i][과[1]] - 성적[j][과[1]];
        알림(피, `💡 힌트: √((${d1})² + (${d2})²) = √(${d1 * d1} + ${d2 * d2}) — 계산기의 √ 를 써도 돼요.`, 'bad');
      }
    };
    입력.addEventListener('keydown', e => { if (e.key === 'Enter') 확인(); });
    채우기(문제칸, 
      h('b', null, `✍️ 직접 계산: ${i + 1}번과 ${j + 1}번 학생의 거리 (${과[0]}·${과[1]})`),
      h('div', { class: 'muted' }, `${i + 1}번 (${과[0]} ${성적[i][과[0]]}, ${과[1]} ${성적[i][과[1]]}) · ${j + 1}번 (${과[0]} ${성적[j][과[0]]}, ${과[1]} ${성적[j][과[1]]})`),
      h('div', { class: 'row' }, 입력, h('button', { class: 'btn primary sm', onClick: 확인 }, '확인'), h('button', { class: 'btn sm', onClick: 새문제 }, '다른 문제')),
      피);
  }

  el.append(
    h('div', { class: 'plot-box' }, 판.svg),
    h('div', { class: 'col grow' },
      h('h2', null, '유클리디언 거리 (Euclidean Distance)'),
      h('p', { class: 'lead' }, '두 점 a, b 를 끌어 보세요. 직각삼각형의 빗변이 바로 두 점 사이의 직선 거리예요.'),
      h('div', { class: 'row' }, 고르기단추([{ 값: '유클리디언', 글: '📏 유클리디언(직선)' }, { 값: '맨해튼', 글: '🏙️ 맨해튼(바둑판 길) — 더 나아가기' }], 방식, v => { 방식 = v; 그리기(); })),
      식칸,
      h('div', { class: 'tip', html: '💡 속성이 여러 개여도 같아요. 4과목이면 <b>√((국어차)²+(수학차)²+(정보차)²+(과학차)²)</b> — 다음 카드에서 확인해요.' }),
      h('div', { class: 'panel' }, 문제칸)));
  그리기(); 새문제();
}

// ───────────────────────── 3. 가장 닮은 친구 찾기 ─────────────────────────
function 닮은친구(el, 수명, 도구) {
  let 고른과목 = new Set(['국어', '수학']), 고른학생 = 0;
  const 본기준 = new Set();
  const 표칸 = h('div');
  const 풀이칸 = h('div', { class: 'col' });
  const 피드백 = h('div', { class: 'fb' });
  const 과목단추 = h('div', { class: 'row' });

  const 벡터 = r => [...고른과목].map(c => r[c]);
  function 그리기() {
    채우기(과목단추, h('b', null, '거리에 쓸 과목'), 과목.map(c => h('button', {
      class: 'chip' + (고른과목.has(c) ? ' on' : ''),
      onClick: () => { if (고른과목.has(c) && 고른과목.size === 1) return; 고른과목.has(c) ? 고른과목.delete(c) : 고른과목.add(c); 그리기(); },
    }, c)));
    const D = 성적.map(a => 성적.map(b => 거리(벡터(a), 벡터(b))));
    const 최대 = Math.max(...D.flat());
    const 가장 = D[고른학생].map((d, j) => (j === 고른학생 ? Infinity : d));
    const 짝 = 가장.indexOf(Math.min(...가장));
    채우기(표칸, h('table', { class: 'grid', style: { fontSize: '14.5px' } },
      h('tr', null, h('th', null, ''), 성적.map(r => h('th', null, r.번호))),
      D.map((줄, i) => h('tr', { class: i === 고른학생 ? 'hl' : '', style: { cursor: 'pointer' }, onClick: () => { 고른학생 = i; 그리기(); } },
        h('th', null, 성적[i].번호 + '번'),
        줄.map((d, j) => h('td', {
          style: {
            width: '50px', height: '34px',
            background: i === j ? '#eee' : `rgba(31,111,92,${(1 - d / 최대) ** 2 * 0.85})`,
            color: i !== j && 1 - d / 최대 > 0.6 ? '#fff' : '#333',
            outline: i === 고른학생 && j === 짝 ? '3px solid #f39c12' : null,
          },
        }, i === j ? '·' : 수(d, 0)))))));
    const a = 성적[고른학생], b = 성적[짝];
    const 줄들 = [...고른과목].map(c => ({ c, 차: a[c] - b[c] }));
    채우기(풀이칸, 
      h('h3', null, `${a.번호}번과 가장 닮은 친구: ⭐ ${b.번호}번`),
      h('table', { class: 'grid' },
        h('tr', null, h('th', null, '과목'), h('th', null, `${a.번호}번`), h('th', null, `${b.번호}번`), h('th', null, '차이²')),
        줄들.map(({ c, 차 }) => h('tr', null, h('td', null, c), h('td', null, a[c]), h('td', null, b[c]), h('td', null, 차 * 차)))),
      h('div', { class: 'formula', html: `√(${줄들.map(x => x.차 * x.차).join(' + ')}) = <b>${수(D[고른학생][짝], 2)}</b>` }),
    );
    const 열쇠 = [...고른과목].sort().join('·') + '|' + 고른학생;
    본기준.add([...고른과목].sort().join('·'));
    기록.set('닮은친구', { 학생: a.번호, 짝: b.번호, 과목: [...고른과목], 거리: D[고른학생][짝] });
    if (본기준.size >= 2) {
      알림(피드백, '👍 과목(속성)을 바꾸면 「가장 닮은 친구」가 달라질 수 있어요. <b>무엇으로 유사성을 재느냐</b>가 군집을 결정해요.', 'ok');
      도구.완료();
    } else 알림(피드백, '과목 단추를 바꿔 보세요. 가장 닮은 친구가 그대로일까요?', 'info');
    void 열쇠;
  }
  el.append(
    h('div', { class: 'col' },
      h('h2', null, '가장 닮은 친구 찾기 — 거리표'),
      과목단추,
      h('p', { class: 'lead' }, '줄(학생)을 누르면 그 학생과 가장 가까운(⭐ 주황 테두리) 친구를 찾아요. 진할수록 가까워요.'),
      표칸),
    h('div', { class: 'col grow' }, h('div', { class: 'panel col' }, 풀이칸), 피드백,
      h('div', { class: 'tip', html: '💡 거리가 <b>0에 가까울수록</b> 두 학생의 성적이 비슷해요(유사성 ↑). 군집 분석은 이런 거리를 모든 짝에 대해 따져 비슷한 학생끼리 묶어요.' })));
  그리기();
}

// ───────────────────────── 4. 교과서 131쪽 실습 ─────────────────────────
function 실습(el, 수명, 도구) {
  const { x, y, 중심: 처음중심, 처음, 더할 } = 실습131;
  const 차례 = [...처음, ...더할];          // 학생 번호 1~10 (앞의 5개는 처음부터 보인다)
  const 점들 = 성적점(x, y);
  let 중심 = 처음중심.map(c => c.slice());
  let 지금 = 0;
  const 고름 = {};                          // 학생번호 → 고른 군집
  const 첫맞힘 = {};
  let 옮김 = false;
  const 판 = 좌표판({ w: 520, h: 520, x이름: x + ' →', y이름: '↑ ' + y });
  const 피드백 = h('div', { class: 'fb' });
  const 단추칸 = h('div', { class: 'row' });
  const 끝칸 = h('div', { class: 'col' });
  const 정답 = 번호 => 가까운중심(점들[번호 - 1], 처음중심);

  function 그리기(보일선) {
    판.비우기('아래', '가운데', '위', '맨위');
    for (let g = 0; g < 3; g++) {
      const 구성 = Object.entries(고름).filter(([, v]) => v === g).map(([n]) => 점들[n - 1]);
      판.g.아래.append(군집영역(판, 구성, 색[g], 46));
    }
    const 보일 = 차례.slice(0, Math.max(5, 지금 + 1));
    보일.forEach(n => {
      const p = 점들[n - 1];
      const 현재 = n === 차례[지금] && !옮김;
      판.g.위.append(점(판, p[0], p[1], { r: 14, fill: n in 고름 ? 색[고름[n]] : 회색, 글: n, cls: 현재 ? 'pulse' : '' }));
    });
    if (보일선) {
      const p = 점들[보일선 - 1];
      중심.forEach((c, g) => {
        판.g.가운데.append(선(판, p, c, { 색: 색[g], 굵기: 2, 점선: true }));
        판.g.가운데.append(s('text', { x: (판.sx(p[0]) + 판.sx(c[0])) / 2 + 6, y: (판.sy(p[1]) + 판.sy(c[1])) / 2 - 4, fill: 색[g], 'font-weight': 800, 'font-size': 14 }, 수(거리(p, c), 1)));
      });
    }
    중심.forEach((c, g) => 판.g.맨위.append(중심점(판, c[0], c[1], { fill: '#d32f2f', 글: g + 1 })));
    채우기(단추칸, 
      지금 < 차례.length
        ? [h('b', null, `${차례[지금]}번 학생은?`), [0, 1, 2].map(g => h('button', {
          class: 'btn', style: { borderColor: 색[g], color: 색[g] }, onClick: () => 고르기(g),
        }, `군집 ${g + 1}`))]
        : h('b', null, '✅ 10명 모두 군집에 넣었어요!'));
  }
  function 고르기(g) {
    const n = 차례[지금];
    const 답 = 정답(n);
    if (g === 답) {
      if (!(n in 첫맞힘)) 첫맞힘[n] = true;
      고름[n] = g;
      알림(피드백, `⭕ ${n}번은 중심점 ${g + 1} 과의 거리(${수(거리(점들[n - 1], 처음중심[g]), 1)})가 가장 가까워서 <b>군집 ${g + 1}</b> 과 유사성이 높아요.`, 'ok');
      지금++;
      그리기(n);
      if (지금 >= 차례.length) 마무리();
    } else {
      첫맞힘[n] = false;
      알림(피드백, `❌ 점선 위의 거리를 견주어 보세요. 가장 <b>짧은</b> 거리의 중심점은 어느 것인가요?`, 'bad');
      그리기(n);
    }
  }
  function 마무리() {
    const 점수 = Object.values(첫맞힘).filter(Boolean).length;
    기록.set('실습131', { 고름: { ...고름 }, 점수 });
    도구.완료();
    채우기(끝칸, 
      h('div', { class: 'fb ok', html: `처음에 바로 맞힌 학생 <b>${점수}/10</b>명. 데이터가 들어갈수록 군집 1·3 의 범위가 넓어져 <b>군집 내 유사성</b>이 떨어져요(교과서 131쪽).` }),
      h('button', {
        class: 'btn primary', onClick: () => {
          if (옮김) return;
          옮김 = true;
          중심 = 중심갱신(점들, 점들.map((_, i) => 고름[i + 1]), 중심);
          그리기();
          알림(피드백, `🤔 중심점을 각 군집의 <b>평균 위치</b>로 옮겼어요 → 군집 1 (${중심[0].map(v => 수(v, 1)).join(', ')}), 군집 3 (${중심[2].map(v => 수(v, 1)).join(', ')}). 이렇게 「묶기 → 평균으로 옮기기」를 되풀이하는 것이 바로 <b>k-평균 군집</b>이에요!`, 'info');
        },
      }, '🤔 중심점을 군집의 평균으로 옮기면?'));
  }

  el.append(
    h('div', { class: 'plot-box' }, 판.svg),
    h('div', { class: 'col grow' },
      h('h2', null, '✍️ 스스로 실습: 유사성을 기준으로 군집화하기'),
      h('div', { class: 'panel', html: '성적 데이터를 <b>3개의 중심점(◆)</b>을 기준으로 군집에 넣어요. 먼저 ①~⑤ 를, 그다음 ⑥~⑩ 을 하나씩 더하며 <b>중심점과 가장 가까운 군집</b>에 넣어 보세요.' }),
      단추칸, 피드백, 끝칸,
      h('div', { class: 'tip', html: '📕 교과서 131쪽 본문에는 「수학과 국어 성적」이라고 적혀 있지만, 실습 그림의 축은 <b>수학(가로)–과학(세로)</b> 이에요. 이 앱은 그림을 따랐어요. 중심점 위치는 그림에서 읽은 값이에요.' })));
  그리기();
}

export default {
  id: 'similar', 이름: '유사성과 상이성', 아이콘: '📏',
  카드: [
    { id: 'sim', 제목: '유사성 vs 상이성', 그리기: 유사상이 },
    { id: 'euclid', 제목: '유클리디언 거리', 그리기: 유클리디언 },
    { id: 'nearest', 제목: '가장 닮은 친구', 그리기: 닮은친구 },
    { id: 'p131', 제목: '실습: 중심점으로 군집화', 그리기: 실습 },
  ],
};
