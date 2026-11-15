/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 1 군집 분석(개념 · 성적 데이터 손으로 군집화) + 탭 3 군집 분석의 종류(종류 · 계층적 군집 · k-평균 시뮬레이터 · 3차원 k-평균(three.js))
import { h, 채우기, s, 수, 알림, 고르기단추, 대화상자 } from '../lib/ui.js';
import { 기록 } from '../lib/store.js';
import { 좌표판, 점, 중심점, 옮기기, 군집영역, 선, 색, 회색 } from '../lib/plot.js';
import { 성적, 과목, 성적점, 예시군집, 종류분류, 삼차원과목, 삼차원점 } from '../data.js';
import { 삼차원판, 보기들 } from '../lib/three-plot.js';
import {
  거리, 배정, 중심갱신, 응집도, k평균, 최선k평균, 무작위중심, 난수, 덩어리, 가까운중심,
  계층군집, 묶음까지, 잎차례, 같은정도, 군집사이거리,
} from '../lib/cluster.js';

// ───────────────────────── 1. 군집 분석이란? ─────────────────────────
const 동물 = [
  { 그림: '🐻', 이름: '반달가슴곰', 자리: [[84, 82], [90, 74], [78, 88], [88, 90]] },
  { 그림: '🦦', 이름: '수달', 자리: [[48, 16], [55, 24], [44, 26], [58, 14]] },
  { 그림: '🐿️', 이름: '하늘다람쥐', 자리: [[14, 80], [20, 88], [10, 90], [22, 76]] },
];
// 정의 문장 — 글자는 그대로, { 답 } 자리가 빈칸이 된다. 답 첫 항목이 정답, 나머지는 함께 받아 주는 말
const 빈칸글 = [
  ['대표적인 ', { 답: ['비지도 학습', '비지도'] }, ' 방법으로, 데이터를 ', { 답: ['비슷한', '유사한'] },
    ' 것끼리 같은 군집으로 묶은 뒤 군집 ', { 답: ['내'] }, '·군집 ', { 답: ['간', '사이'] },
    ' 특징을 분석해요. 정답(', { 답: ['레이블', '라벨'] }, ')이 없으므로 관측값 사이의 ', { 답: ['유사성', '유사도'] }, '을 보고 군집을 만들어요.'],
  ['📏 군집은 ', { 답: ['거리'] }, '와 ', { 답: ['유사도', '유사성'] }, '를 이용해요. 개체 사이의 거리가 ',
    { 답: ['가깝다', '가까우면', '가깝'] }, ' = 유사도가 크다 → 같은 군집이 돼요.'],
];

// 한글 낱말의 초성 — 힌트로 보여 준다 (예: 비지도 학습 → ㅂㅈㄷ ㅎㅅ)
const 초성표 = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const 초성 = w => [...w].map(c => { const n = c.charCodeAt(0) - 0xac00; return n >= 0 && n < 11172 ? 초성표[Math.floor(n / 588)] : c; }).join('');
const 다듬기 = w => w.replace(/\s+/g, '');

/** 빈칸 글(문단 배열)을 적어 넣는 판으로 만든다. 다 맞히면 끝() 을 부른다. */
function 빈칸판(문단들, 열쇠, 끝) {
  const 칸들 = 문단들.flat().filter(x => typeof x === 'object');
  const 적은 = 기록.get(열쇠, 칸들.map(() => ''));
  const 맞나 = (b, v) => b.답.some(a => 다듬기(a) === 다듬기(v));
  const 다맞음 = () => 칸들.every((b, i) => 맞나(b, 적은[i] || ''));
  // 다 맞혔다는 알림은 따로 상자를 두지 않고 머리 줄 글을 바꾼다 — 상자를 두면 왼쪽 칸이 넘쳐 꼬리말과 겹쳤다
  const 안내 = h('span', { class: 'muted' });
  const 안내쓰기 = () => {
    const 다 = 다맞음();
    안내.textContent = 다 ? '🎉 빈칸을 모두 채웠어요! 오른쪽 그림에서 거리도 재 보세요.' : '✏️ 빈칸에 알맞은 핵심어를 적어 보세요.';
    안내.style.color = 다 ? 'var(--ok)' : '';
    안내.style.fontWeight = 다 ? '800' : '';
  };
  let 힌트켬 = false;
  const 입력들 = [];
  const 칠하기 = (inp, b, i) => {
    const v = 적은[i] || '';
    inp.className = 'fill' + (맞나(b, v) ? ' ok' : v && 다듬기(v).length >= 다듬기(b.답[0]).length ? ' bad' : '');
    inp.placeholder = 힌트켬 ? 초성(b.답[0]) : '';
  };
  let 번호 = 0;
  const 문단요소 = 문단들.map(조각들 => h('div', { class: 'panel fill-text' }, ...조각들.map(조각 => {
    if (typeof 조각 === 'string') return 조각;
    const i = 번호++;
    const inp = h('input', {
      value: 적은[i] || '', autocomplete: 'off', spellcheck: false,
      style: { width: (다듬기(조각.답[0]).length * 1.15 + 1.6) + 'em' },
      onInput: e => {
        적은[i] = e.target.value; 기록.set(열쇠, 적은); 칠하기(inp, 조각, i);
        안내쓰기();
        if (다맞음()) 끝();
      },
    });
    입력들.push([inp, 조각, i]);
    칠하기(inp, 조각, i);
    return inp;
  })));
  const 힌트단추 = h('button', {
    class: 'btn sm', onClick: () => {
      힌트켬 = !힌트켬; 힌트단추.textContent = 힌트켬 ? '💡 초성 숨기기' : '💡 초성 힌트';
      입력들.forEach(([inp, b, i]) => 칠하기(inp, b, i));
    },
  }, '💡 초성 힌트');
  const 판 = h('div', { class: 'col', style: { gap: '8px' } },
    h('div', { class: 'row', style: { justifyContent: 'space-between' } },
      안내, 힌트단추),
    ...문단요소);
  안내쓰기();
  return { 판, 다맞음 };
}

function 개념(el, 수명, 도구) {
  const 판 = 좌표판({ w: 520, h: 520, x간격: 50, y간격: 50, x글: v => (v === 0 ? '작다' : v === 100 ? '크다' : ''), y글: v => (v === 0 ? '물가' : v === 100 ? '숲·산' : ''), x이름: '크기 →', y이름: '↑ 서식지' });
  const 개체 = 동물.flatMap((a, g) => a.자리.map(p => ({ ...a, p, g })));
  const 글들 = 개체.map(o => {
    const t = s('text', { 'font-size': 34, 'text-anchor': 'middle', 'dominant-baseline': 'central', style: 'transition: transform .7s; cursor:pointer' }, o.그림);
    판.g.위.append(t);
    return t;
  });
  let 보기 = '둘', 고른 = [];
  const 피드백 = h('div', { class: 'fb' });
  const 위치 = o => (보기 === '크기' ? [o.p[0], 50] : 보기 === '서식지' ? [50, o.p[1]] : o.p);
  function 그리기() {
    판.비우기('아래', '가운데');
    // 지금 보는 속성으로 묶으면 몇 무리가 되는가
    const 무리 = 보기 === '크기' ? [[0], [1], [2]] : 보기 === '서식지' ? [[0, 2], [1]] : [[0], [1], [2]];
    무리.forEach((gs, i) => 판.g.아래.append(군집영역(판, 개체.filter(o => gs.includes(o.g)).map(위치), 색[i], 60)));
    개체.forEach((o, i) => { const [x, y] = 위치(o); 글들[i].setAttribute('transform', `translate(${판.sx(x)},${판.sy(y)})`); });
    if (고른.length === 2) {
      const [a, b] = 고른.map(i => 위치(개체[i]));
      판.g.가운데.append(선(판, a, b, { 색: '#111', 굵기: 3, 점선: true }));
      const d = 거리(a, b);
      const 같은무리 = 무리.some(gs => gs.includes(개체[고른[0]].g) && gs.includes(개체[고른[1]].g));
      알림(피드백, `${개체[고른[0]].그림}와 ${개체[고른[1]].그림} 사이 거리 <b>${수(d, 1)}</b> → ${같은무리 ? '가까워요 = <b>유사도가 커요</b> (같은 군집)' : '멀어요 = <b>유사도가 작아요</b> (다른 군집)'}`, 같은무리 ? 'ok' : 'info');
    }
  }
  // ── 정의 문장의 핵심어 빈칸(활동지 꼴) ──
  // 글자 수만큼 칸을 비워 두고 학생이 직접 적는다. 띄어쓰기는 보지 않는다.
  const 빈칸 = 빈칸판(빈칸글, '개념빈칸', () => { 빈칸다함 = true; 다했나(); });
  let 빈칸다함 = 빈칸.다맞음(), 거리잼 = false;
  const 다했나 = () => { if (빈칸다함 && 거리잼) 도구.완료(); };

  글들.forEach((t, i) => t.addEventListener('click', () => {
    고른 = 고른.length >= 2 ? [i] : [...고른, i];
    if (고른.length === 2) { 거리잼 = true; 다했나(); }
    else 알림(피드백, '한 마리 더 눌러 두 동물 사이 거리를 재 보세요.', 'info');
    그리기();
  }));
  el.append(
    h('div', { class: 'col', style: { width: '660px' } },
      h('h2', null, '군집 분석(Cluster Analysis)이란?'),
      빈칸.판,
      h('div', { class: 'panel col' },
        h('b', null, '어떤 속성으로 볼까요?'),
        고르기단추([{ 값: '크기', 글: '크기만' }, { 값: '서식지', 글: '서식지만' }, { 값: '둘', 글: '크기 + 서식지' }], 보기, v => { 보기 = v; 고른 = []; 피드백.textContent = ''; 그리기(); }),
        h('div', { class: 'tip', html: '💡 <b>서식지만</b> 보면 곰과 다람쥐가 한 군집이 돼요! <b>어떤 속성을 고르느냐</b>에 따라 군집이 달라져요.' })),
      h('p', { class: 'lead' }, '🐾 동물 두 마리를 눌러 거리를 재 보세요. (빈칸을 다 채우고 거리도 재면 완료)'),
      피드백),
    h('div', { class: 'plot-box' }, 판.svg),
  );
  그리기();
}

// ───────────────────────── 2. 성적 데이터 손으로 군집화 ─────────────────────────
// 카드 안을 네 단계로 나눈다 — ① 교과서 예시를 먼저 읽고 ② 축·군집 수를 정해 내가 묶고
// ③ 군집마다 특징을 말로 적은 뒤 ④ 컴퓨터(k-평균)와 견준다. 앞 단계를 마쳐야 다음 단계가 열린다.
const 손단계 = [
  { id: '예', 글: '① 교과서 예시' },
  { id: '나', 글: '② 내가 묶기' },
  { id: '특징', 글: '③ 특징 적기' },
  { id: '컴', 글: '④ k-평균 비교' },
];
function 손군집(el, 수명, 도구) {
  const 저장 = 기록.get('손군집', null);
  let x과목 = 저장?.x ?? '수학', y과목 = 저장?.y ?? '과학';
  let k = 저장?.k ?? null;
  let 칠함 = 저장?.칠함 ?? 성적.map(() => -1);
  let 기준 = 저장?.기준 ?? [];
  let 단계 = 저장?.단계 ?? '예';
  let 붓 = 0, 판보기 = '컴';   // ④ 에서 그림판에 무엇을 띄울지 (컴 / 나)
  const 피드백 = h('div', { class: 'fb' });
  const 표칸 = h('div');
  const 판칸 = h('div', { class: 'plot-box' });
  const 조절 = h('div', { class: 'col', style: { width: '400px' } });

  const 저장하기 = () => 기록.set('손군집', { x: x과목, y: y과목, k, 칠함, 기준, 단계, 같음: 기록.get('손군집')?.같음 ?? null });

  // 단계가 열렸는지 — 다 칠했고 군집을 모두 썼나 / 특징을 모두 적었나
  const 다칠함 = () => k != null && 칠함.every(v => v >= 0) && [...Array(k).keys()].every(g => 칠함.includes(g));
  const 다적음 = () => 다칠함() && [...Array(k).keys()].every(g => (기준[g] || '').trim());
  const 열림 = id => id === '예' || id === '나' || (id === '특징' && 다칠함()) || (id === '컴' && 다적음());

  function 지금묶음() {
    if (단계 === '예') {
      const 표 = 성적.map(() => -1);
      예시군집.묶음.forEach((m, g) => m.forEach(n => { 표[n - 1] = g; }));
      return { x: 예시군집.x, y: 예시군집.y, 이름표: 표, k: 3 };
    }
    if (단계 === '컴' && 판보기 === '컴') return { x: x과목, y: y과목, 이름표: 최선k평균(성적점(x과목, y과목), k, 3).이름표, k };
    return { x: x과목, y: y과목, 이름표: 칠함, k: k ?? 0 };
  }

  function 표그리기(x, y) {
    const 이름표 = 지금묶음().이름표;
    채우기(표칸, h('table', { class: 'grid' },
      h('tr', null, h('th', null, '번호'), 과목.map(c => h('th', { class: c === x || c === y ? 'hl' : '' }, c))),
      성적.map((r, i) => h('tr', null,
        h('td', { style: { color: '#fff', background: 이름표[i] >= 0 ? 색[이름표[i]] : 회색, fontWeight: 800 } }, r.번호),
        과목.map(c => h('td', { class: c === x || c === y ? 'hl' : '' }, r[c]))))));
  }

  function 판그리기() {
    const { x, y, 이름표, k: kk } = 지금묶음();
    const 판 = 좌표판({ w: 470, h: 470, x이름: x + ' →', y이름: '↑ ' + y });
    const 점들 = 성적점(x, y);
    for (let g = 0; g < kk; g++) 판.g.아래.append(군집영역(판, 점들.filter((_, i) => 이름표[i] === g), 색[g], 40));
    점들.forEach(([px, py], i) => {
      const 점g = 점(판, px, py, { r: 14, fill: 이름표[i] >= 0 ? 색[이름표[i]] : 회색, 글: 성적[i].번호 });
      점g.addEventListener('click', () => {
        if (단계 !== '나') { 알림(피드백, '점을 칠하는 것은 「② ✋ 내가 묶기」 단계에서 해요.', 'info'); return; }
        if (k == null) { 알림(피드백, '먼저 오른쪽에서 군집 수를 정하세요.', 'bad'); return; }
        칠함[i] = 칠함[i] === 붓 ? -1 : 붓; 저장하기(); 다시(); 검사(); 조절그리기();
      });
      판.g.위.append(점g);
    });
    채우기(판칸, 판.svg);
    표그리기(x, y);
  }

  function 검사() {
    if (단계 === '나' && k != null) {
      const 남음 = 칠함.filter(v => v < 0).length;
      const 빈무리 = [...Array(k).keys()].filter(g => !칠함.includes(g));
      if (남음) 알림(피드백, `붓을 고르고 점을 눌러 칠하세요. 남은 점 ${남음}개`, 'info');
      else if (빈무리.length) 알림(피드백, `군집 ${빈무리.map(g => g + 1).join(', ')} 이 비어 있어요. 정한 군집 수 ${k}개를 모두 쓰세요.`, 'bad');
      else 알림(피드백, '👏 다 묶었어요! 「③ ✍️ 군집별 특징」으로 넘어가 군집마다 어떤 학생들인지 적어 보세요.', 'ok');
    }
    if (단계 === '특징') {
      const 빈기준 = [...Array(k).keys()].filter(g => !(기준[g] || '').trim());
      if (빈기준.length) 알림(피드백, `군집 ${빈기준.map(g => g + 1).join(', ')} 의 특징을 적어 주세요.`, 'info');
      else 알림(피드백, '👏 완성! 「④ 🤖 k-평균과 비교」에서 컴퓨터는 어떻게 묶었는지 견주어 보세요.', 'ok');
    }
    if (다적음()) 도구.완료();
  }

  function 단계가기(id) {
    if (!열림(id)) {
      알림(피드백, id === '특징' ? '먼저 ② 단계에서 모든 점을 칠하고, 정한 군집을 모두 쓰세요.' : '먼저 ③ 단계에서 군집마다 특징을 적으세요.', 'bad');
      return;
    }
    단계 = id; 피드백.className = 'fb'; 피드백.textContent = ''; 저장하기(); 조절그리기(); 다시(); 검사();
    if (id === '컴') 비교알림();
  }

  function 비교알림() {
    const 컴 = 최선k평균(성적점(x과목, y과목), k, 3).이름표;
    const 같음 = 같은정도(칠함, 컴);
    기록.set('손군집', { ...기록.get('손군집'), 같음 });
    알림(피드백, `🤖 컴퓨터(k-평균)도 ${k}개로 묶었어요. 나와 같은 정도 <b>${Math.round(같음 * 100)}%</b>. 색(번호)보다 <b>누구끼리 묶였는지</b>를 견주세요. 특징은 컴퓨터가 아니라 내가 적은 것이에요!`, 'info');
  }

  /** 군집 하나의 학생 수와 두 과목 평균 — 특징을 말로 적을 때 근거로 쓴다 */
  function 군집요약(g, 이름표 = 칠함) {
    const 학생 = 성적.filter((_, i) => 이름표[i] === g);
    const 평균 = c => Math.round(학생.reduce((a, r) => a + r[c], 0) / (학생.length || 1));
    return { 학생, 글: `${학생.length}명 (${학생.map(r => r.번호).join(', ')}번) · ${x과목} 평균 ${평균(x과목)} · ${y과목} 평균 ${평균(y과목)}` };
  }

  const 단계줄 = () => h('div', { class: 'seg', style: { flexWrap: 'nowrap', alignSelf: 'stretch', justifyContent: 'space-between' } }, 손단계.map(d => h('button', {
    class: 'seg-b' + (단계 === d.id ? ' on' : ''), style: { opacity: 열림(d.id) ? 1 : 0.45, fontSize: '14px', padding: '6px 7px', whiteSpace: 'nowrap' },
    onClick: () => 단계가기(d.id),
  }, (열림(d.id) ? '' : '🔒 ') + d.글)));

  // ③ 의 「④ 로」 단추 — 칸을 고칠 때마다 패널을 다시 그리면 입력 칸의 커서가 날아가서, 단추만 켜고 끈다
  const 조절다음 = h('button', { class: 'btn sm primary', onClick: () => 단계가기('컴') }, '④ k-평균과 비교 ▶');
  const 조절막대 = () => { 조절다음.disabled = !다적음(); };

  function 조절그리기() {
    const 축고르기 = (값, 다른, 바꿈) => h('select', {
      class: 'txt', disabled: k != null, onChange: e => { 바꿈(e.target.value); 저장하기(); 다시(); },
    }, 과목.filter(c => c !== 다른).map(c => h('option', { value: c, selected: c === 값 }, c)));

    let 본문;
    if (단계 === '예') {
      본문 = h('div', { class: 'panel col' },
        h('b', null, '📖 교과서는 이렇게 묶었어요'),
        h('div', { class: 'row' }, h('span', { class: 'chip' }, '축: 가로 국어 · 세로 수학'), h('span', { class: 'chip' }, '군집 수: 3개')),
        ...예시군집.기준.map((t, g) => h('div', { class: 'row', style: { flexWrap: 'nowrap', alignItems: 'flex-start' } },
          h('span', { class: 'badge', style: { background: 색[g], color: '#fff', flex: 'none' } }, '군집 ' + (g + 1)),
          h('div', null, h('b', null, t), h('div', { class: 'muted', style: { fontSize: '14px' } }, `${예시군집.묶음[g].join(', ')}번 학생`)))),
        h('div', { class: 'tip', html: '💡 군집 분석은 <b>① 무엇을 볼지(축)</b> → <b>② 몇 개로 묶을지</b> → <b>③ 군집마다 어떤 특징인지 말하기</b> 차례로 해요. 이제 내가 해 볼 차례예요!' }),
        h('button', { class: 'btn primary', onClick: () => 단계가기('나') }, '② 내가 묶어 보기 ▶'));
    } else if (단계 === '나') {
      본문 = h('div', { class: 'panel col' },
        h('div', { class: 'row' }, h('b', null, '① 축'), '가로', 축고르기(x과목, y과목, v => { x과목 = v; }), '세로', 축고르기(y과목, x과목, v => { y과목 = v; })),
        h('div', { class: 'row' }, h('b', null, '② 군집 수'),
          k == null
            ? h('span', { class: 'row', style: { gap: '4px' } }, [2, 3, 4, 5, 6].map(v => h('button', {
              class: 'btn sm', onClick: () => { k = v; 저장하기(); 조절그리기(); 다시(); 검사(); },
            }, v)))
            : h('span', null, h('b', { class: 'big-num', style: { fontSize: '22px' } }, k + '개'), h('span', { class: 'muted' }, ' (한번 정하면 바꾸지 않아요)'))),
        k == null ? h('div', { class: 'muted' }, '축을 고르고 군집 수를 정하면 붓이 나와요.') : h('div', { class: 'col', style: { gap: '6px' } },
          h('b', null, '③ 붓을 고르고 점을 눌러 칠해요.'),
          h('div', { class: 'row', style: { gap: '6px' } }, [...Array(k).keys()].map(g => h('button', {
            class: 'btn sm', style: { background: 붓 === g ? 색[g] : '#fff', color: 붓 === g ? '#fff' : 색[g], borderColor: 색[g], minWidth: '74px' },
            onClick: () => { 붓 = g; 조절그리기(); },
          }, '군집 ' + (g + 1)))),
          h('div', { class: 'row' },
            h('button', { class: 'btn sm primary', disabled: !다칠함(), onClick: () => 단계가기('특징') }, '③ 특징 적기 ▶'),
            h('button', {
              class: 'btn sm warn', onClick: () => 대화상자('처음부터 다시 할까요?', '축·군집 수와 칠한 색, 적은 특징이 모두 지워져요.', [
                { 글: '그만두기' }, { 글: '지우기', 주: true, 할일: () => { k = null; 칠함 = 성적.map(() => -1); 기준 = []; 저장하기(); 조절그리기(); 다시(); 피드백.textContent = ''; } }]),
            }, '↺ 처음부터 다시'))));
    } else if (단계 === '특징') {
      // 군집이 5개 넘으면 자리가 모자라 요약을 한 줄로 줄이고 도움말 상자를 뺀다
      const 좁게 = k >= 5;
      본문 = h('div', { class: 'panel col', style: 좁게 ? { gap: '6px' } : {} },
        좁게 ? null : h('b', null, `군집마다 어떤 학생들인지 적어 보세요 (${x과목}·${y과목})`),
        ...[...Array(k).keys()].map(g => h('div', { class: 'col', style: { gap: 좁게 ? '1px' : '3px' } },
          h('div', { class: 'row', style: { flexWrap: 'nowrap' } },
            h('span', { class: 'badge', style: { background: 색[g], color: '#fff', flex: 'none' } }, '군집 ' + (g + 1)),
            h('span', { class: 'muted', style: { fontSize: '14px' } }, 군집요약(g).글)),
          h('input', { class: 'txt', style: 좁게 ? { padding: '4px 10px' } : {}, placeholder: '예) 수학·과학 모두 높은 학생', value: 기준[g] || '', onInput: e => { 기준[g] = e.target.value; 저장하기(); 검사(); 조절막대(); } }))),
        좁게 ? null : h('div', { class: 'tip', html: '💡 평균을 보고 <b>높음 · 중간 · 낮음</b>으로 말해 보세요. 교과서처럼 「수학 성적이 높은 학생」이면 충분해요.' }),
        조절다음);
      조절막대();
    } else {
      const 컴 = 최선k평균(성적점(x과목, y과목), k, 3).이름표;
      본문 = h('div', { class: 'panel col' },
        h('div', { class: 'row' }, h('b', null, '그림판'),
          고르기단추([{ 값: '나', 글: '✋ 내 군집' }, { 값: '컴', 글: '🤖 k-평균' }], 판보기, v => { 판보기 = v; 다시(); })),
        h('b', null, '내가 적은 특징 ↔ 컴퓨터 군집'),
        ...[...Array(k).keys()].map(g => h('div', { class: 'row', style: { flexWrap: 'nowrap', alignItems: 'flex-start', fontSize: '14.5px' } },
          h('span', { class: 'badge', style: { background: 색[g], color: '#fff', flex: 'none' } }, String(g + 1)),
          h('div', null, h('b', null, 기준[g] || '—'),
            h('div', { class: 'muted' }, '✋ ' + 군집요약(g).학생.map(r => r.번호).join(', ') + '번 · 🤖 ' + (군집요약(g, 컴).학생.map(r => r.번호).join(', ') || '없음') + (군집요약(g, 컴).학생.length ? '번' : ''))))));
    }
    채우기(조절, 단계줄(), 본문, 피드백);
  }
  function 다시() { 판그리기(); }

  el.append(
    h('div', { class: 'col', style: { width: '330px' } },
      h('h2', null, '✍️ 스스로 실습: 군집화하기'),
      h('p', { class: 'lead' }, '교과서 예시를 먼저 보고, 축과 군집 수를 정해 직접 묶은 뒤 특징을 말해 보세요.'),
      표칸),
    판칸, 조절);
  if (!열림(단계)) 단계 = '나';
  조절그리기(); 다시(); 검사();
  if (단계 === '컴') 비교알림();
}

// ───────────────────────── 3. 군집 분석의 종류 ─────────────────────────
function 종류(el, 수명, 도구) {
  const 놓은 = 기록.get('종류분류', {});
  let 고른 = null;
  const 피드백 = h('div', { class: 'fb' });
  const 남은칸 = h('div', { class: 'sort-cards' });
  const 통 = { 계층: h('div', { class: 'col', style: { gap: '5px' } }), 분할: h('div', { class: 'col', style: { gap: '5px' } }) };
  // 설명 문장의 빈칸 — 핵심 낱말을 학생이 직접 적는다(띄어쓰기는 무시)
  const 빈칸답 = { 순차: '순차적', 나무: '나무', 무작위: '무작위', 중심: '중심점' };
  const 적은 = { ...기록.get('종류빈칸', {}) };
  const 빈칸맞음 = 키 => (적은[키] || '').replace(/\s/g, '') === 빈칸답[키];
  let 힌트켬 = false;
  const 빈칸들 = [];
  const 빈칸 = 키 => {
    const 칸 = h('input', { class: 'fill', value: 적은[키] || '', style: { width: (빈칸답[키].length + 1.6) + 'em' }, onClick: e => e.stopPropagation() });
    const 색칠 = () => { 칸.classList.toggle('ok', 빈칸맞음(키)); };
    칸.addEventListener('input', () => { 적은[키] = 칸.value; 기록.set('종류빈칸', { ...적은 }); 색칠(); 다됐나(); });
    색칠();
    빈칸들.push([칸, 키]);
    return 칸;
  };
  const 힌트단추 = h('button', {
    class: 'btn sm', onClick: () => {
      힌트켬 = !힌트켬; 힌트단추.textContent = 힌트켬 ? '💡 초성 숨기기' : '💡 초성 힌트';
      빈칸들.forEach(([칸, 키]) => { 칸.placeholder = 힌트켬 ? 초성(빈칸답[키]) : ''; });
    },
  }, '💡 초성 힌트');
  function 다됐나() {
    const 카드끝 = Object.keys(놓은).length === 종류분류.length;
    const 빈칸끝 = Object.keys(빈칸답).every(빈칸맞음);
    if (카드끝 && 빈칸끝) {
      알림(피드백, '🎉 다 했어요! 계층적은 「가까운 것부터 차례로, 되돌리지 않음」, 분할적은 「k개로 나누고 중심을 옮기며 다시 나눔」.', 'ok');
      도구.완료();
    } else if (카드끝) 알림(피드백, '카드는 다 넣었어요! 이제 위 상자 설명의 <b>빈칸</b>을 채워 보세요.', 'info');
  }
  function 그리기() {
    채우기(남은칸, ...종류분류.map((c, i) => (i in 놓은 ? null : h('button', {
      class: 'scard' + (고른 === i ? ' sel' : ''), onClick: () => { 고른 = i; 그리기(); },
    }, c.글))));
    for (const n of ['계층', '분할']) 채우기(통[n], ...종류분류.map((c, i) => (i in 놓은 && c.답 === n ? h('div', { class: 'scard ok' }, c.글) : null)));
    다됐나();
  }
  function 넣기(n) {
    if (고른 == null) { 알림(피드백, '먼저 아래에서 카드를 하나 누르세요.', 'info'); return; }
    if (종류분류[고른].답 === n) { 놓은[고른] = true; 기록.set('종류분류', { ...놓은 }); 고른 = null; 알림(피드백, '⭕ 맞아요!', 'ok'); }
    else 알림(피드백, '❌ 다시! 힌트: 계층적 군집은 <b>한 번 묶으면 끝</b>, 분할적 군집은 <b>중심점을 옮기며 다시 나눠요</b>.', 'bad');
    그리기();
  }
  const 통상자 = (n, 제목, 방법, ...그림) => h('div', { class: 'bucket', onClick: () => 넣기(n) },
    h('h3', null, 제목), h('div', { class: 'muted' }, 방법), h('div', { style: { fontSize: '15px', lineHeight: 1.9 } }, ...그림), 통[n]);
  el.append(h('div', { class: 'col grow' },
    h('h2', null, '군집 분석의 종류 — 계층적 vs 분할적'),
    h('div', { class: 'row', style: { justifyContent: 'space-between' } },
      h('p', { class: 'lead', style: { margin: 0 } }, '상자 설명의 빈칸을 채우고, 아래 설명 카드를 누른 뒤 알맞은 상자를 누르세요.'), 힌트단추),
    h('div', { class: 'row', style: { alignItems: 'stretch', flex: 1, minHeight: 0 } },
      통상자('계층', '🌳 계층적 군집 분석', '단일 연결법 · 완전 연결법 · 평균 연결법 · 중심 연결법',
        '군집을 (', 빈칸('순차'), ')으로 할당 — 가까운 개체끼리 차례로 묶어 (', 빈칸('나무'), ') 모양을 만들어요.'),
      통상자('분할', '🧩 분할적 군집 분석', 'k-평균 군집 · 퍼지 군집 · 밀도 군집',
        '군집을 (', 빈칸('무작위'), ')로 할당한 뒤, (', 빈칸('중심'), ')을 옮기며 군집을 고쳐 나가요.')),
    남은칸,
    피드백));
  그리기();
}

// ───────────────────────── 5. k-평균 시뮬레이터 (카드 차례는 계층적 군집 다음) ─────────────────────────
const 데이터들 = {
  덩어리3: { 이름: '덩어리 3개', 만들기: () => 덩어리(21, 3, 9, 16).점들 },
  덩어리4: { 이름: '덩어리 4개', 만들기: () => 덩어리(8, 4, 9, 14).점들 },
  성적: { 이름: '성적(국어·수학)', 만들기: () => 성적점('국어', '수학') },
};
function k평균실험(el, 수명, 도구) {
  let 데이터 = '덩어리3', k = 3, 점들 = 데이터들[데이터].만들기();
  let 중심 = [], 이름표 = null, 단계 = '놓기', 반복 = 0, 지나온 = [];
  let 자동 = null, 실험결과 = null;
  const 판 = 좌표판({ w: 540, h: 540, x이름: 데이터 === '성적' ? '국어 →' : 'x →', y이름: '↑ y' });
  const 판칸 = h('div', { class: 'plot-box' }, 판.svg);
  const 단계목록 = h('ul', { class: 'steps tight' });
  const 상태 = h('div', { class: 'row' });
  const 피드백 = h('div', { class: 'fb' });
  const 실험칸 = h('div', { class: 'col', style: { gap: '4px' } });
  const 다음단추 = h('button', { class: 'btn primary', onClick: () => 다음() }, '다음 단계 ▶');
  const 자동단추 = h('button', { class: 'btn', onClick: () => 자동켜기() }, '⏵ 자동 재생');

  판.svg.addEventListener('click', e => {
    if (단계 !== '놓기') return;
    const p = 판.데이터좌표(e);
    if (!p.안 || 중심.length >= k) return;
    중심.push([p.x, p.y]); 그리기();
  });

  function 처음부터() {
    멈추기();
    중심 = []; 이름표 = null; 단계 = '놓기'; 반복 = 0; 지나온 = [];
    그리기();
  }
  function 무작위() {
    처음부터();
    중심 = 무작위중심(점들, k, 난수(Date.now() % 100000));
    그리기();
  }
  function 다음() {
    if (단계 === '놓기') {
      if (중심.length < k) { 알림(피드백, `그래프를 눌러 중심점 ${k}개를 놓거나 「🎲 무작위」를 누르세요. (${중심.length}/${k})`, 'bad'); return; }
      지나온 = [중심.map(c => c.slice())];
      이름표 = 배정(점들, 중심); 단계 = '배정';
    } else if (단계 === '배정') {
      const 새 = 중심갱신(점들, 이름표, 중심);
      const 움직임 = 새.some((c, j) => 거리(c, 중심[j]) > 1e-9);
      if (!움직임) { 단계 = '끝'; 끝냄(); }
      else { 중심 = 새; 지나온.push(새.map(c => c.slice())); 단계 = '이동'; 반복++; }
    } else if (단계 === '이동') {
      이름표 = 배정(점들, 중심); 단계 = '배정';
    }
    그리기();
  }
  function 끝냄() {
    멈추기();
    기록.set('k평균', { 데이터: 데이터들[데이터].이름, k, 반복, 응집도: 응집도(점들, 이름표, 중심), 점들, 이름표, 중심, 지나온 });
    도구.완료();
  }
  function 자동켜기() {
    if (자동) { 멈추기(); return; }
    if (단계 === '놓기' && 중심.length < k) 무작위();
    자동 = 수명.interval(() => { if (단계 === '끝') 멈추기(); else 다음(); }, 750);
    자동단추.textContent = '⏸ 멈추기';
  }
  function 멈추기() { if (자동) clearInterval(자동); 자동 = null; 자동단추.textContent = '⏵ 자동 재생'; }

  function 출발점실험() {
    // 출발점(처음 중심점)만 바꿔 10번 돌린다 → 결과가 늘 같을까?
    const 결과 = [];
    for (let t = 0; t < 10; t++) {
      const r = k평균(점들, 무작위중심(점들, k, 난수(1000 + t * 37 + k)));
      const 키 = Math.round(r.응집도);
      const 같은 = 결과.find(x => Math.abs(x.키 - 키) <= 1);
      if (같은) 같은.횟수++; else 결과.push({ 키, 횟수: 1, r });
    }
    결과.sort((a, b) => a.키 - b.키);
    실험결과 = 결과;
    기록.set('출발점실험', { k, 데이터: 데이터들[데이터].이름, 결과: 결과.map(x => ({ 응집도: x.키, 횟수: x.횟수 })) });
    실험그리기();
  }
  function 실험그리기() {
    if (!실험결과) { 채우기(실험칸, ); return; }
    채우기(실험칸, 
      // 결과가 여러 가지여도 두 줄 안에 들어가게 작은 단추로 (k=6 이면 10가지까지 나온다)
      h('div', { class: 'row', style: { gap: '4px', flexWrap: 'wrap' } },
        h('b', { style: { fontSize: '14px' } }, `결과 ${실험결과.length}가지`),
        h('span', { class: 'muted', style: { fontSize: '13px' } }, '(응집도 · 나온 횟수)'),
        실험결과.map((x, i) => h('button', {
        class: 'btn sm' + (i === 0 ? ' primary' : ''), style: { padding: '2px 8px', fontSize: '13.5px' },
        onClick: () => { 멈추기(); 중심 = x.r.중심; 이름표 = x.r.이름표; 지나온 = x.r.기록; 반복 = x.r.반복; 단계 = '끝'; 그리기(); },
      }, `${x.키} · ${x.횟수}번`))),
      h('div', { class: 'muted', style: { fontSize: '13.5px', lineHeight: 1.35 } }, 실험결과.length > 1
        ? '⚠ 출발점에 따라 결과가 달라졌어요! k-평균은 초기 중심점에 민감해서, 여러 번 돌려 응집도가 가장 작은 결과를 고르기도 해요.'
        : '이번에는 10번 모두 같은 결과였어요. k 를 바꾸거나 다른 데이터로 다시 해 보세요.'),
    );
  }

  function 그리기() {
    판.비우기('아래', '가운데', '위', '맨위');
    const 군집색 = i => (이름표 ? 색[이름표[i]] : 회색);
    // 점 → 중심점 연결선 (묶은 단계에서)
    if (이름표 && 단계 !== '놓기') 점들.forEach((p, i) => 판.g.아래.append(선(판, p, 중심[이름표[i]], { 색: 색[이름표[i]], 굵기: 1, cls: 'link' })));
    // 중심점이 지나온 길
    for (let j = 0; j < 중심.length; j++) {
      for (let t = 1; t < 지나온.length; t++) 판.g.가운데.append(선(판, 지나온[t - 1][j], 지나온[t][j], { 색: 색[j], 굵기: 2, 점선: true }));
      for (let t = 0; t < 지나온.length - 1; t++) 판.g.가운데.append(중심점(판, ...지나온[t][j], { fill: 색[j], 빈: true, 크기: 8 }));
    }
    점들.forEach((p, i) => 판.g.위.append(점(판, p[0], p[1], { r: 데이터 === '성적' ? 13 : 7, fill: 군집색(i), 글: 데이터 === '성적' ? i + 1 : null, 굵기: 1.5 })));
    중심.forEach((c, j) => 판.g.맨위.append(중심점(판, c[0], c[1], { fill: 이름표 ? 색[j] : '#d32f2f', 크기: 14 })));

    const 켜짐 = { 놓기: 0, 배정: 1, 이동: 2, 끝: 3 }[단계];
    채우기(단계목록, ...[
      `1. k개(${k}) 중심점을 임의로 정한다 — 그래프를 눌러 놓기`,
      '2. 각 데이터를 가장 가까운 중심점으로 묶는다',
      '3. 묶은 그룹의 평균 위치로 중심점을 옮긴다',
      '4. 중심점이 더 이상 안 움직이면 끝! (아니면 2·3 반복)',
    ].map((t, i) => h('li', { class: i === 켜짐 ? 'on' : i < 켜짐 ? 'done' : '' }, t)));
    채우기(상태, 
      h('span', { class: 'badge' }, `반복 ${반복}회`),
      h('span', { class: 'badge' }, 이름표 ? `응집도(SSE) ${수(응집도(점들, 이름표, 중심), 0)}` : '응집도 —'),
      h('span', { class: 'badge' }, `중심점 ${중심.length}/${k}`),
    );
    다음단추.disabled = 단계 === '끝';
    const 말 = {
      놓기: 중심.length < k ? `그래프의 빈 곳을 눌러 중심점(◆)을 ${k - 중심.length}개 더 놓으세요.` : '「다음 단계」를 누르면 가까운 중심점으로 묶어요.',
      배정: '각 점이 가장 가까운 중심점의 색으로 바뀌었어요. 이제 중심점을 평균 위치로 옮겨요.',
      이동: '◇ → ◆ 중심점이 평균 위치로 옮겨졌어요. 다시 묶으면 군집이 바뀔 수 있어요!',
      끝: `✅ 중심점이 더 이상 움직이지 않아 군집화가 끝났어요! (반복 ${반복}회)`,
    }[단계];
    알림(피드백, 말, 단계 === '끝' ? 'ok' : 'info');
  }

  el.append(
    판칸,
    h('div', { class: 'col grow', style: { gap: '6px' } },
      // 이름 속 뜻을 색으로 — K(빨강) = 군집의 개수 · means(파랑) = 각 군집의 중심(평균)과 데이터의 거리
      h('h2', { html: '<span style="color:#e53935">K</span>-<span style="color:#1e5bc6">means</span>(평균) 군집 시뮬레이터' }),
      h('div', { class: 'panel', style: { padding: '5px 12px', fontSize: '15px', lineHeight: 1.45 }, html:
        '· 주어진 데이터의 속성을 바탕으로 <b>K개의 그룹</b>으로 묶는(clustering) 방법<br>' +
        '· <b style="color:#e53935">K</b> 는 <b style="color:#e53935">군집의 개수</b>, ' +
        '<b style="color:#1e5bc6">means</b> 는 <b style="color:#1e5bc6">각 그룹의 중심(평균)과 데이터들 사이의 거리</b>를 뜻해요' }),
      h('div', { class: 'row' },
        고르기단추(Object.entries(데이터들).map(([값, d]) => ({ 값, 글: d.이름 })), 데이터, v => {
          데이터 = v; 점들 = 데이터들[v].만들기(); 실험결과 = null; 실험그리기();
          판.g.격자.querySelectorAll('.axis-name').forEach((t, i) => { t.textContent = v === '성적' ? (i ? '↑ 수학' : '국어 →') : (i ? '↑ y' : 'x →'); });
          처음부터();
        }),
        h('span', { class: 'row', style: { gap: '4px' } }, h('b', null, 'k ='),
          고르기단추([2, 3, 4, 5, 6].map(v => ({ 값: v, 글: v })), k, v => { k = v; 실험결과 = null; 실험그리기(); 처음부터(); }))),
      단계목록,
      h('div', { class: 'row' }, 다음단추, 자동단추,
        h('button', { class: 'btn', onClick: 무작위 }, '🎲 무작위로 놓기'),
        h('button', { class: 'btn', onClick: 처음부터 }, '↺ 처음부터')),
      상태, 피드백,
      h('div', { class: 'panel col', style: { gap: '4px', padding: '8px 12px' } },
        h('div', { class: 'row' }, h('b', null, '🔬 실험: 출발점이 다르면 결과도 다를까?'),
          h('button', { class: 'btn sm', onClick: 출발점실험 }, '다른 출발점으로 10번')),
        실험칸)),
  );
  그리기();
}

// ───────────────────────── 6. 3차원 k-평균 (three.js) ─────────────────────────
// 속성(과목)이 셋이면 점은 3차원 공간에 놓이고, 거리 공식에 항이 하나 더 붙을 뿐 k-평균은 똑같이 돈다.
// 이 카드의 발견: 위에서(수학·정보만) 보면 붙어 있던 두 무리가, 국어 축을 세우면 갈라진다.

/** 두 군집 결과에서 「서로 다르게 묶인 학생 수」 — 군집 번호는 이름일 뿐이므로 가장 잘 맞는 짝짓기로 견준다 */
function 다르게묶인수(가, 나, k) {
  let 최고 = 0;
  const 짝 = (남은, 차례) => {
    if (차례.length === k) {
      const 맞음 = 가.filter((g, i) => 차례[g] === 나[i]).length;
      if (맞음 > 최고) 최고 = 맞음;
      return;
    }
    남은.forEach((x, i) => 짝([...남은.slice(0, i), ...남은.slice(i + 1)], [...차례, x]));
  };
  짝([...Array(k).keys()], []);
  return 가.length - 최고;
}

function 삼차원실험(el, 수명, 도구) {
  const 점들 = 삼차원점();
  let k = 4, 중심 = [], 이름표 = null, 단계 = '전', 반복 = 0, 지나온 = [], 자동 = null;
  let 비교 = false, 이차원 = null, 고른 = null;
  const 답 = 기록.get('k평균3d답', { 위: null, 돌림: null });
  const 판칸 = h('div', { class: 'plot-box' });
  const 상태 = h('div', { class: 'row' });
  const 피드백 = h('div', { class: 'fb' });
  const 묻는칸 = h('div', { class: 'col', style: { gap: '6px' } });
  const 고른칸 = h('div', { class: 'col', style: { gap: '2px', fontSize: '15px' } });
  const 비교칸 = h('div', { class: 'row' });
  const 다음단추 = h('button', { class: 'btn sm primary', onClick: () => 다음() }, '다음 단계 ▶');
  const 자동단추 = h('button', { class: 'btn sm', onClick: () => 자동켜기() }, '⏵ 자동');

  const 판 = 삼차원판(판칸, 수명, { w: 560, h: 548, 축이름: 삼차원과목, 점누름: i => { 고른 = i; 그리기(); } });
  if (!판) { el.append(판칸); return; }

  const 지금색 = () => {
    if (비교 && 이차원) return 이차원.이름표.map(g => 색[g]);
    return 점들.map((_, i) => (이름표 ? 색[이름표[i]] : 회색));
  };

  function 출발() {
    멈추기(); 비교 = false; 이차원 = null;
    중심 = 무작위중심(점들, k, 난수(Date.now() % 100000));
    이름표 = null; 단계 = '놓기'; 반복 = 0; 지나온 = [중심.map(c => c.slice())];
    그리기(true);
  }
  function 처음() {
    멈추기(); 비교 = false; 이차원 = null;
    중심 = []; 이름표 = null; 단계 = '전'; 반복 = 0; 지나온 = []; 고른 = null;
    그리기(true);
  }
  function 다음() {
    if (단계 === '전') { 출발(); return; }
    if (단계 === '놓기' || 단계 === '이동') { 이름표 = 배정(점들, 중심); 단계 = '배정'; }
    else if (단계 === '배정') {
      const 새 = 중심갱신(점들, 이름표, 중심);
      if (!새.some((c, j) => 거리(c, 중심[j]) > 1e-9)) { 단계 = '끝'; 끝냄(); }
      else { 중심 = 새; 지나온.push(새.map(c => c.slice())); 단계 = '이동'; 반복++; }
    }
    그리기(true);
  }
  function 자동켜기() {
    if (자동) { 멈추기(); return; }
    if (단계 === '전' || 단계 === '끝') 출발();
    자동 = 수명.interval(() => { if (단계 === '끝') 멈추기(); else 다음(); }, 800);
    자동단추.textContent = '⏸ 멈추기';
  }
  function 멈추기() { if (자동) clearInterval(자동); 자동 = null; 자동단추.textContent = '⏵ 자동'; }
  function 끝냄() {
    멈추기();
    // 비교용: 국어를 빼고(수학·정보만) 같은 k 로 묶은 결과
    이차원 = 최선k평균(점들.map(p => [p[1], p[2]]), k);
    const 다름 = 다르게묶인수(이름표, 이차원.이름표, k);
    기록.set('k평균3d', { k, 반복, 응집도: 응집도(점들, 이름표, 중심), 다름, 답: { ...답 }, 사진: 판.사진() });
    if (답.돌림 != null) 도구.완료();
  }

  // 위에서 / 돌려서 몇 무리로 보이는지 묻기 — 정답을 강요하지 않고, 두 답이 다르면 그 까닭을 짚어 준다
  function 묻기그리기() {
    const 줄 = (열쇠, 글) => h('div', { class: 'row', style: { gap: '6px' } }, h('span', { style: { minWidth: '235px' } }, 글),
      고르기단추([2, 3, 4, 5].map(v => ({ 값: v, 글: `${v}무리` })), 답[열쇠], v => {
        if (열쇠 === '돌림' && !판.돌렸나) { 알림(피드백, '먼저 왼쪽 그림을 마우스로 끌어 이리저리 돌려 본 뒤 고르세요.', 'bad'); 묻기그리기(); return; }
        답[열쇠] = v; 기록.set('k평균3d답', { ...답 }); 묻기그리기(); 말하기();
        if (열쇠 === '돌림' && 단계 === '끝') { 기록.set('k평균3d', { ...기록.get('k평균3d', {}), 답: { ...답 } }); 도구.완료(); }
      }, 'sm'));
    채우기(묻는칸, 줄('위', '① ⬇ 위에서 보면 몇 무리로 보이나요?'), 줄('돌림', '② 끌어서 돌려 보면 몇 무리인가요?'));
  }
  function 말하기() {
    if (답.위 != null && 답.돌림 != null) {
      if (답.돌림 > 답.위) 알림(피드백, `🔎 위에서는 <b>${답.위}무리</b>로 보였는데 돌려 보니 <b>${답.돌림}무리</b>! 수학·정보가 비슷해 겹쳐 보이던 학생들이 <b>국어</b> 축에서 갈라졌어요. 속성을 하나 더 보면 안 보이던 군집이 드러나요.`, 'ok');
      else 알림(피드백, '🤔 「⬇ 위에서」 와 「⬅ 옆에서」 를 번갈아 눌러 보세요. 위에서 하나로 보이던 덩어리가 옆에서는 위아래로 갈라져 있지 않나요?', 'info');
    }
  }

  function 고른그리기() {
    if (고른 == null) { 채우기(고른칸, h('span', { class: 'muted' }, '🖱️ 그림을 끌면 돌아가요 · 👆 학생(공)을 누르면 중심점까지의 3차원 거리를 셈해 줘요.')); 판.고른점그리기(null, [], [], -1); return; }
    const p = 점들[고른];
    const 가장 = 중심.length ? 가까운중심(p, 중심) : -1;
    판.고른점그리기(고른, 중심, 색, 가장);
    채우기(고른칸,
      h('b', null, `학생 ${고른 + 1} — 국어 ${p[0]} · 수학 ${p[1]} · 정보 ${p[2]}`),
      // 줄 수가 k 에 따라 늘지 않게 — 가장 가까운 중심점만 식을 다 쓰고, 나머지는 거리만 적는다
      ...(중심.length ? [
        h('div', { style: { color: 색[가장], fontWeight: 800 }, html:
          `◆${가장 + 1}까지 <span class="sqrt">√<span>(${p[0]}−${수(중심[가장][0], 0)})² + (${p[1]}−${수(중심[가장][1], 0)})² + (${p[2]}−${수(중심[가장][2], 0)})²</span></span> = ${수(거리(p, 중심[가장]), 1)} ← 가장 가까움` }),
        h('div', { class: 'muted' }, '다른 중심점까지: ' + 중심.map((c, j) => (j === 가장 ? null : `◆${j + 1} ${수(거리(p, c), 1)}`)).filter(Boolean).join(' · ')),
      ] : [h('span', { class: 'muted' }, '「🎲 출발」로 중심점을 놓으면 거리를 셈해 줘요. 항이 하나 더 붙었을 뿐 2차원과 같은 공식이에요.')]));
  }

  function 그리기(점도 = false) {
    if (점도) 판.점그리기(점들, 지금색());
    판.중심그리기(비교 ? [] : 중심, 색, 비교 ? [] : 지나온);
    고른그리기();
    채우기(상태,
      h('span', { class: 'badge' }, `반복 ${반복}회`),
      h('span', { class: 'badge' }, 이름표 ? `응집도(SSE) ${수(응집도(점들, 이름표, 중심), 0)}` : '응집도 —'),
      h('span', { class: 'badge' }, { 전: '출발 전', 놓기: '1. 중심점 놓음', 배정: '2. 가까운 중심점으로 묶음', 이동: '3. 평균 위치로 옮김', 끝: '4. 끝 — 더 안 움직임' }[단계]));
    다음단추.disabled = 단계 === '끝';
    if (단계 === '끝' && 이차원) {
      const 다름 = 다르게묶인수(이름표, 이차원.이름표, k);
      채우기(비교칸,
        h('button', { class: 'btn sm' + (비교 ? ' primary' : ''), onClick: () => { 비교 = !비교; 그리기(true); } },
          비교 ? '◀ 3차원(세 과목) 결과로 돌아가기' : '🆚 국어를 빼고(수학·정보만) 묶으면?'),
        h('span', { class: 'muted' }, 비교 ? `세 과목으로 묶은 결과와 다르게 묶인 학생 ${다름}명` : ''));
    } else 채우기(비교칸);
    if (단계 === '전') {
      if (답.위 != null && 답.돌림 != null) 말하기();
      else 알림(피드백, '먼저 ①·② 에 답한 뒤, 「🎲 출발」 → 「다음 단계」로 3차원 k-평균을 돌려 보세요.', 'info');
    } else if (단계 !== '끝') {
      알림(피드백, { 놓기: '◆ 중심점 k개를 무작위로 놓았어요. 「다음 단계」로 묶어 보세요.', 배정: '각 학생이 3차원 거리로 가장 가까운 ◆의 색이 되었어요. 학생을 눌러 거리를 확인해 보세요.', 이동: '◆ 가 자기 무리의 평균 위치로 옮겨 갔어요.' }[단계], 'info');
    } else {
      // 출발점이 나빠 덜 좋은 결과에 멈췄으면 알려 준다 — 같은 k 로 여러 번 돌린 가장 좋은 응집도와 견준다
      const 지금 = 응집도(점들, 이름표, 중심), 최고 = 최선k평균(점들, k).응집도;
      const 아쉬움 = 지금 > 최고 * 1.05
        ? ` ⚠ 그런데 응집도 ${수(지금, 0)} — 같은 k 로 더 잘 묶으면 ${수(최고, 0)} 까지 내려가요. 출발점 때문이에요! 「🎲 출발」로 다시 해 보세요.` : '';
      알림(피드백, 비교
        ? (k === 4
          ? '국어를 빼면 <b>국어만 다른 두 무리</b>가 한 군집으로 합쳐지고, 대신 다른 무리가 억지로 쪼개져요. <b>어떤 속성을 넣느냐</b>가 군집을 바꿔요.'
          : '국어를 빼고 묶으면 묶이는 모양이 이렇게 달라져요. <b>어떤 속성을 넣느냐</b>가 군집을 바꿔요.')
        : `✅ 중심점이 더 이상 움직이지 않아 끝났어요 (반복 ${반복}회). 「🆚」 단추로 국어를 뺀 결과와 견주어 보세요.${아쉬움}`, 아쉬움 && !비교 ? 'info' : 'ok');
    }
  }

  el.append(
    판칸,
    h('div', { class: 'col grow', style: { gap: '8px' } },
      h('h2', { style: { margin: 0 } }, '🧊 3차원 k-평균 — 학생 40명의 국어·수학·정보'),
      h('div', { class: 'row', style: { gap: '6px' } },
        ...Object.entries(보기들).map(([이름, v]) => h('button', { class: 'btn sm', onClick: () => 판.보기(이름) }, v.글)),
        (() => { let 켬 = true; const b = h('button', { class: 'btn sm primary', onClick: () => { 켬 = !켬; 판.그림자(켬); b.classList.toggle('primary', 켬); } }, '바닥 그림자'); return b; })()),
      h('div', { class: 'panel', style: { padding: '8px 12px' } }, 묻는칸),
      h('div', { class: 'panel col', style: { padding: '8px 12px', gap: '6px' } },
        h('div', { class: 'row', style: { gap: '6px' } }, h('b', null, 'k ='),
          고르기단추([2, 3, 4, 5, 6].map(v => ({ 값: v, 글: v })), k, v => { k = v; 처음(); }, 'sm'),
          h('button', { class: 'btn sm', onClick: 출발 }, '🎲 출발'), 다음단추, 자동단추,
          h('button', { class: 'btn sm', onClick: 처음 }, '↺')),
        상태, 비교칸),
      h('div', { class: 'panel', style: { padding: '8px 12px' } }, 고른칸),
      피드백),
  );
  묻기그리기(); 그리기(true); 말하기();
}

// ───────────────────────── 4. 계층적 군집 ─────────────────────────
const 연결이름 = { single: '단일 연결법', complete: '완전 연결법', average: '평균 연결법', centroid: '중심 연결법' };
const 연결설명 = {
  single: '두 군집에서 <b>가장 가까운</b> 두 점 사이 거리',
  complete: '두 군집에서 <b>가장 먼</b> 두 점 사이 거리',
  average: '두 군집의 <b>모든 짝</b> 거리의 평균',
  centroid: '두 군집 <b>중심(평균 위치)</b> 사이 거리',
};
function 계층(el, 수명, 도구) {
  let 축 = ['국어', '수학'], 연결 = 'single', m = 0;
  const n = 성적.length;
  const 왼판칸 = h('div', { class: 'plot-box' });
  const 나무칸 = h('div', { class: 'plot-box' });
  const 표칸 = h('div', { class: 'dist-box' });
  const 설명칸 = h('div', { class: 'fb' });
  // 단일 연결법이 기본, 나머지 셋은 [심화] — 고른 연결법의 뜻을 덴드로그램 바로 위에 보여 준다
  const 연결풀이 = v => (v === 'single' ? '📏 ' : '📏 <b>[심화]</b> ') + `${연결이름[v]}: 군집 사이 거리 = ${연결설명[v]}`;
  const 연결글 = h('div', { class: 'tip', html: 연결풀이(연결) });
  const 상태 = h('div', { class: 'row' });

  // 지금 남은 군집끼리의 거리표 — 파란 칸이 가장 가까운 두 군집(= 다음에 묶일 짝)
  function 거리표(점들, 차례, 이름표, 잎) {
    // 군집을 덴드로그램 잎 차례(왼쪽 → 오른쪽)대로 늘어놓는다
    const 무리 = [];
    잎.forEach(i => {
      let g = 무리.find(x => x.이름 === 이름표[i]);
      if (!g) 무리.push(g = { 이름: 이름표[i], 구성원: [] });
      g.구성원.push(i);
    });
    const 머리 = g => h('span', { style: { color: 색[g.이름 % 색.length], fontWeight: 800 } }, `{${g.구성원.map(i => i + 1).sort((a, b) => a - b).join(',')}}`);
    if (무리.length < 2) {
      채우기(표칸, h('b', null, '지금 군집 사이의 거리'), h('div', { class: 'fb ok' }, '모두 하나의 군집으로 묶였어요. 더 견줄 군집이 없어요.'));
      return;
    }
    // 다음에 묶일 두 군집 = 차례[m] 의 구성원을 정확히 나눠 가진 두 무리
    const 다음 = 차례[m] ? 무리.filter(g => g.구성원.every(i => 차례[m].구성원.includes(i))) : [];
    const 칸 = (a, b) => {
      if (a === b) return h('td', { class: 'diag' }, '·');
      const 파랑 = 다음.includes(a) && 다음.includes(b);
      return h('td', { class: 파랑 ? 'next' : '' }, 수(군집사이거리(점들, a.구성원, b.구성원, 연결), 1));
    };
    채우기(표칸,
      h('b', null, '지금 군집 사이의 거리'),
      h('table', { class: 'dist' },
        h('tr', null, h('th'), 무리.map(g => h('th', null, 머리(g)))),
        무리.map(a => h('tr', null, h('th', null, 머리(a)), 무리.map(b => 칸(a, b))))),
      h('div', { class: 'muted', style: { fontSize: '12px' } }, `파란 칸이 지금 가장 가까운 두 군집(${연결이름[연결]})이에요 → 다음에 묶여요.`));
  }

  function 그리기() {
    const 점들 = 성적점(...축);
    const 차례 = 계층군집(점들, 연결);
    const 이름표 = 묶음까지(n, 차례, m);
    // 왼쪽 산점도
    const 판 = 좌표판({ w: 440, h: 440, x이름: 축[0] + ' →', y이름: '↑ ' + 축[1] });
    const 무리수 = Math.max(...이름표) + 1;
    for (let g = 0; g < 무리수; g++) {
      const 구성 = 점들.filter((_, i) => 이름표[i] === g);
      if (구성.length > 1) 판.g.아래.append(군집영역(판, 구성, 색[g % 색.length], 38));
    }
    if (m > 0) {
      // 방금 묶은 두 군집 사이 거리를 「연결법이 재는 그대로」 점선으로 보여 준다
      //   단일 = 가장 가까운 두 점 · 완전 = 가장 먼 두 점 · 평균 = 모든 짝(가는 선) · 중심 = 두 군집의 중심
      const c = 차례[m - 1];
      const 가 = 묶음까지(n, 차례, m - 1);
      const A = c.구성원.filter(i => 가[i] === 가[c.구성원[0]]);
      const B = c.구성원.filter(i => !A.includes(i));
      const 굵은점선 = (p, q) => 판.g.가운데.append(선(판, p, q, { 색: '#111', 굵기: 3, 점선: true }));
      let 무엇 = '';
      if (연결 === 'average') {
        for (const i of A) for (const j of B) 판.g.가운데.append(선(판, 점들[i], 점들[j], { 색: '#333', 굵기: 1.2, 점선: true }));
        무엇 = `점선 ${A.length * B.length}개 = 모든 짝의 거리, 그 평균`;
      } else if (연결 === 'centroid') {
        const 중 = M => [0, 1].map(d => M.reduce((t, i) => t + 점들[i][d], 0) / M.length);
        const [ca, cb] = [중(A), 중(B)];
        굵은점선(ca, cb);
        판.g.가운데.append(중심점(판, ...ca, { 크기: 8, fill: '#111' }), 중심점(판, ...cb, { 크기: 8, fill: '#111' }));
        무엇 = '점선 = 두 군집 중심(◆) 사이';
      } else {
        const 먼쪽 = 연결 === 'complete';
        let 짝 = [A[0], B[0]], 기준 = 먼쪽 ? -Infinity : Infinity;
        for (const i of A) for (const j of B) {
          const d = 거리(점들[i], 점들[j]);
          if (먼쪽 ? d > 기준 : d < 기준) { 기준 = d; 짝 = [i, j]; }
        }
        굵은점선(점들[짝[0]], 점들[짝[1]]);
        무엇 = `점선 = ${먼쪽 ? '가장 먼' : '가장 가까운'} ${짝[0] + 1}번–${짝[1] + 1}번`;
      }
      설명칸.className = 'fb info';
      설명칸.innerHTML = `${m}번째 묶음: <b>{${A.map(i => i + 1).join(', ')}}</b> + <b>{${B.map(i => i + 1).join(', ')}}</b> → 하나로 묶었어요. (${연결이름[연결]} 거리 ${수(c.높이, 1)} · ${무엇})`;
    } else { 설명칸.className = 'fb info'; 설명칸.innerHTML = '처음에는 학생 한 명 한 명이 각자 하나의 군집이에요. 「한 번 묶기」를 눌러 보세요.'; }
    점들.forEach((p, i) => 판.g.위.append(점(판, p[0], p[1], { r: 13, fill: 색[이름표[i] % 색.length], 글: i + 1 })));
    채우기(왼판칸, 판.svg);

    // 오른쪽 덴드로그램
    const W = 370, H = 300, 좌 = 36, 아래 = 34;
    const 나무 = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'plot' });
    const 잎 = 잎차례(n, 차례);
    const 최고 = 차례.at(-1).높이 || 1;
    const X = new Map(), Y = new Map();
    잎.forEach((id, i) => { X.set(id, 좌 + 20 + i * ((W - 좌 - 40) / (n - 1))); Y.set(id, H - 아래); });
    const sy = v => H - 아래 - (v / 최고) * (H - 아래 - 28);
    for (let t = 0; t <= 4; t++) {
      const v = (최고 * t) / 4;
      나무.append(s('line', { x1: 좌, x2: W - 6, y1: sy(v), y2: sy(v), class: 'grid' }));
      나무.append(s('text', { x: 좌 - 6, y: sy(v) + 4, class: 'tick', 'text-anchor': 'end' }, 수(v, 0)));
    }
    나무.append(s('text', { x: 4, y: 12, class: 'axis-name' }, '거리'));
    차례.forEach((c, t) => {
      const x1 = X.get(c.가), x2 = X.get(c.나), y = sy(c.높이);
      X.set(c.새번호, (x1 + x2) / 2); Y.set(c.새번호, y);
      const 보임 = t < m;
      const 색깔 = 보임 ? (t === m - 1 ? '#d32f2f' : '#1f6f5c') : '#d5dbe0';
      나무.append(s('path', { d: `M${x1},${Y.get(c.가)} V${y} H${x2} V${Y.get(c.나)}`, fill: 'none', stroke: 색깔, 'stroke-width': 보임 ? 3 : 2 }));
    });
    잎.forEach(id => {
      나무.append(s('circle', { cx: X.get(id), cy: H - 아래, r: 11, fill: 색[이름표[id] % 색.length] }));
      나무.append(s('text', { x: X.get(id), y: H - 아래 + 4, 'text-anchor': 'middle', fill: '#fff', class: 'pt-label', 'font-size': 12 }, id + 1));
    });
    if (m > 0 && m < n - 1) {
      // 지금 단계를 「자르는 높이」로 보여 준다
      const 높이 = (차례[m - 1].높이 + 차례[m].높이) / 2;
      나무.append(s('line', { x1: 좌, x2: W - 6, y1: sy(높이), y2: sy(높이), stroke: '#f39c12', 'stroke-width': 3, 'stroke-dasharray': '8 5' }));
      나무.append(s('text', { x: W - 8, y: sy(높이) - 6, 'text-anchor': 'end', fill: '#b36b00', 'font-weight': 800, 'font-size': 13 }, `여기서 자르면 군집 ${n - m}개`));
    }
    채우기(나무칸, 나무);
    거리표(점들, 차례, 이름표, 잎);
    채우기(상태, h('span', { class: 'badge' }, `묶은 횟수 ${m} / ${n - 1}`), h('span', { class: 'badge' }, `지금 군집 수 ${n - m}개`));
    if (m === n - 1) { 기록.set('계층', { 연결: 연결이름[연결], 축, 높이: 차례.map(c => c.높이) }); 도구.완료(); }
  }

  el.append(
    h('div', { class: 'col', style: { width: '448px' } },
      h('h2', null, '계층적 군집 분석'),
      왼판칸),
    h('div', { class: 'col grow' },
      h('div', { class: 'row' },
        h('b', null, '축'), 고르기단추([{ 값: '국어,수학', 글: '국어·수학' }, { 값: '수학,과학', 글: '수학·과학' }], 축.join(), v => { 축 = v.split(','); 그리기(); }),
        h('b', null, '연결'), 고르기단추(Object.entries(연결이름).map(([값, 글]) => ({ 값, 글: (값 === 'single' ? '' : '[심화] ') + 글.replace(' 연결법', '') })), 연결, v => { 연결 = v; 그리기(); 연결글.innerHTML = 연결풀이(v); })),
      연결글,
      h('div', { class: 'row', style: { alignItems: 'stretch', gap: '8px' } }, 나무칸, 표칸),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onClick: () => { if (m < n - 1) { m++; 그리기(); } } }, '한 번 묶기 ▶'),
        h('button', { class: 'btn', onClick: () => { if (m > 0) { m--; 그리기(); } } }, '◀ 한 번 풀기'),
        h('button', { class: 'btn', onClick: () => { m = n - 1; 그리기(); } }, '⏭ 모두 묶기'),
        h('button', { class: 'btn', onClick: () => { m = 0; 그리기(); } }, '↺ 처음'),
        상태),
      설명칸,
      h('div', { class: 'muted' }, '🌳 이 나무 그림을 덴드로그램이라 불러요. 가로선이 높을수록 먼 군집끼리 늦게 묶인 거예요. 군집 수를 미리 정하지 않고, 원하는 높이에서 잘라 군집을 정해요.')),
  );
  그리기();
}

// 차례: 군집 분석이란? → 손으로 묶기 → (탭 「유사성과 상이성」에서 거리를 배운 뒤) → 군집 분석의 종류
// 계층적·k-평균은 「거리」를 알아야 이해되므로 유사성 탭 뒤의 별도 탭으로 둔다 (2026-11-11 사용자 지시)
export default {
  id: 'cluster', 이름: '군집 분석', 아이콘: '🔵',
  카드: [
    { id: 'what', 제목: '군집 분석이란?', 그리기: 개념 },
    { id: 'hand', 제목: '손으로 군집화', 그리기: 손군집 },
  ],
};

export const 종류탭 = {
  id: 'kinds', 이름: '군집 분석의 종류', 아이콘: '🧩',
  카드: [
    { id: 'kinds', 제목: '계층적 vs 분할', 그리기: 종류 },
    { id: 'hier', 제목: '계층적 군집', 그리기: 계층 },
    { id: 'kmeans', 제목: 'k-평균 시뮬레이터', 그리기: k평균실험 },
    { id: 'kmeans3d', 제목: '3차원 k-평균', 그리기: 삼차원실험 },
  ],
};
