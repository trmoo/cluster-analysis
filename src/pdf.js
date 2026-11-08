/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 전체 학습 내용을 A4 PDF 로 만든다.
// A4 크기의 쪽을 화면 밖에 그린 뒤 html2canvas 로 그림을 떠서 jsPDF 로 묶는다(인터넷 필요 없음).
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { h, 수 } from './lib/ui.js';
import { 기록 } from './lib/store.js';
import { 좌표판, 점, 중심점, 군집영역, 선, 꺾은선, 색, 회색, 보기좋은축 } from './lib/plot.js';
import { 성적, 성적점, 실습131, 학습분류, 사례, 확인문제, 정리빈칸, 실루엣예시 } from './data.js';
import 탭0 from './tabs/t0-open.js';
import 탭1 from './tabs/t1-cluster.js';
import 탭2 from './tabs/t2-similar.js';
import 탭3 from './tabs/t3-eval.js';
import 탭4 from './tabs/t4-wrap.js';

const 쪽수 = 6;

// SVG 는 앱의 CSS 를 모르므로 필요한 모양을 그림 안에 넣어 그림 파일(img)로 바꾼다
const 그래프모양 = `
  .grid{stroke:#e3e8ec;stroke-width:1} .tick{font-size:13px;fill:#6b7783}
  .axis-name{font-size:14.5px;font-weight:800;fill:#3b4652} .pt-label{font-weight:800}
  .val{font-size:12px;fill:#3b4652;font-weight:700}
  text{font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif}`;
function 그림(svg, 폭) {
  const 복사 = svg.cloneNode(true);
  복사.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const 모양 = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  모양.textContent = 그래프모양;
  복사.prepend(모양);
  const 글 = new XMLSerializer().serializeToString(복사);
  const img = h('img', { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(글) });
  img.style.width = 폭 + 'px';
  img.style.display = 'block';
  return img;
}

const 안함 = 글 => h('div', { class: 'p-none' }, `⬜ 아직 하지 않은 활동입니다${글 ? ' — ' + 글 : ''}`);
const 제목 = (번, 글) => h('h2', { class: 'p-h2' }, h('span', null, 번), 글);

function 쪽(번호, ...내용) {
  return h('div', { class: 'p-page' },
    h('div', { class: 'p-head' }, h('b', null, '● 군집 분석 실험실'), h('span', null, '「데이터 과학」 Ⅲ. 데이터 모델링과 평가 — 군집 분석 모델의 개념')),
    h('div', { class: 'p-body' }, ...내용),
    h('div', { class: 'p-foot' }, h('span', null, '© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만 이용해 주세요'), h('span', null, `${번호} / ${쪽수}`)));
}

// ── 그림 만들기 (학생의 기록으로 다시 그린다) ──
function 군집그림(점들, 이름표, { k, 글, 중심, 지나온, 크기 = 330, 축 = ['', ''], 반지름 = 11 } = {}) {
  const 판 = 좌표판({ w: 크기, h: 크기, x이름: 축[0], y이름: 축[1], x간격: 20, y간격: 20 });
  for (let g = 0; g < k; g++) 판.g.아래.append(군집영역(판, 점들.filter((_, i) => 이름표[i] === g), 색[g], 30));
  if (지나온) for (let j = 0; j < 중심.length; j++) for (let t = 1; t < 지나온.length; t++) 판.g.가운데.append(선(판, 지나온[t - 1][j], 지나온[t][j], { 색: 색[j], 점선: true }));
  점들.forEach((p, i) => 판.g.위.append(점(판, p[0], p[1], { r: 반지름, fill: 이름표[i] >= 0 ? 색[이름표[i]] : 회색, 글: 글 ? 글(i) : null, 굵기: 1 })));
  if (중심) 중심.forEach((c, j) => 판.g.맨위.append(중심점(판, c[0], c[1], { fill: 색[j], 크기: 10 })));
  return 판.svg;
}

function 표(머리, 줄들, 넓이) {
  return h('table', { class: 'p-table', style: 넓이 ? { width: 넓이 } : null },
    h('tr', null, 머리.map(m => h('th', null, m))),
    줄들.map(r => h('tr', null, r.map(c => h('td', null, c)))));
}

function 쪽1() {
  const 탭들 = [탭0, 탭1, 탭2, 탭3, 탭4];
  const 목록 = 탭들.flatMap(t => t.카드.filter(c => c.id !== 'pdf').map(c => ({ 글: `${t.이름} · ${c.제목}`, 끝: 기록.완료됨(`${t.id}/${c.id}`) })));
  const 마친 = 목록.filter(x => x.끝).length;
  const 오늘 = new Date();
  return 쪽(1,
    h('div', { class: 'p-cover' },
      h('div', { class: 'p-dots' }, h('i'), h('i'), h('i')),
      h('h1', null, '군집 분석 모델의 개념'),
      h('div', { class: 'p-sub' }, '군집 분석 실험실 · 학습 정리'),
      h('div', { class: 'p-date' }, `${오늘.getFullYear()}년 ${오늘.getMonth() + 1}월 ${오늘.getDate()}일`),
      h('div', { class: 'p-name' }, '학번 ____________   이름 ____________')),
    제목('🎯', '학습 목표'),
    h('ul', null, h('li', null, '데이터 속성에 대한 유사성을 측정하고 분석하여 군집을 형성할 수 있다.'), h('li', null, '군집 분석 결과의 의미를 해석할 수 있다.')),
    제목('📋', `활동 현황 — ${마친} / ${목록.length} 완료`),
    h('div', { class: 'p-grid2' }, 목록.map(x => h('div', { class: x.끝 ? 'p-ok' : 'p-no' }, (x.끝 ? '✔ ' : '○ ') + x.글))),
    h('div', { class: 'p-tip' }, '이 문서는 「군집 분석 실험실」에서 내가 직접 한 활동 결과로 만들어졌습니다.'),
  );
}

function 쪽2() {
  const 분류 = 기록.get('학습분류', {});
  const 할 = 기록.get('할리갈리');
  const 사 = 기록.get('사례');
  const 손 = 기록.get('손군집');
  const 손다 = 손 && 손.k && 손.칠함.every(v => v >= 0);
  return 쪽(2,
    제목('Ⅰ', '생각 열기 — 지도 학습과 비지도 학습'),
    표(['구분', '뜻', '예'], [
      ['지도 학습', '문제와 정답(레이블)을 모두 알려 주고 학습', '스팸 메일 걸러 내기, 집값 예측'],
      ['비지도 학습', '정답 없이 데이터 속 숨은 패턴을 찾음', '고객 세분화, 비슷한 기사 묶기 → 군집 분석'],
    ]),
    h('p', null, `▸ 분류 놀이: ${Object.keys(분류).length}/${학습분류.length}장 분류, 처음에 바로 맞힌 카드 ${Object.values(분류).filter(Boolean).length}장`),
    h('div', { class: 'p-row' },
      h('div', { class: 'p-col' },
        h('h3', null, '🃏 할리갈리 카드 — 내가 정한 기준'),
        할 && 할.기준?.some(Boolean)
          ? h('ol', null, [...Array(할.k).keys()].map(g => h('li', null, `무리 ${g + 1}: ${할.기준[g] || '(적지 않음)'} — ${할.칠함.filter(v => v === g).length}장`)))
          : 안함(),
        할?.컴이름?.some(Boolean) ? h('p', null, '🤖 컴퓨터 그룹에 붙인 이름: ' + 할.컴이름.filter(Boolean).join(', ')) : null,
        h('p', { class: 'p-note' }, '인공지능은 그룹을 만들어 줄 뿐, 그 그룹의 의미는 알려 주지 않는다.')),
      h('div', { class: 'p-col' },
        h('h3', null, '🏙️ 군집 분석 활용 사례'),
        h('ul', null, 사례.map((c, i) => h('li', null, `${c.이름}: ${(사?.고른?.[i] || []).join(', ') || '—'}`))),
        h('p', null, '💭 우리 사회의 군집: ' + (사?.생각?.trim() || '(적지 않음)')))),
    제목('1', '군집 분석이란?'),
    h('p', null, '대표적인 비지도 학습 방법으로, 데이터를 비슷한 것끼리 같은 군집으로 묶은 뒤 군집 내·군집 간 특징을 분석한다. 정답(레이블)이 없으므로 관측값 사이의 유사성(거리)을 보고 군집을 만든다. 거리가 가까울수록 유사도가 크다.'),
    h('h3', null, '✍️ 스스로 실습: 성적 데이터 군집화하기'),
    손다
      ? h('div', { class: 'p-row' },
        그림(군집그림(성적점(손.x, 손.y), 손.칠함, { k: 손.k, 글: i => i + 1, 축: [손.x + ' →', '↑ ' + 손.y] }), 300),
        h('div', { class: 'p-col' },
          h('p', null, `축: 가로 ${손.x} · 세로 ${손.y} / 군집 수 ${손.k}개`),
          표(['군집', '학생 번호', '군집 기준'], [...Array(손.k).keys()].map(g => [
            h('b', { style: { color: 색[g] } }, `군집 ${g + 1}`),
            손.칠함.map((v, i) => (v === g ? i + 1 : null)).filter(Boolean).join(', '),
            손.기준[g] || '']), '100%'),
          손.같음 != null ? h('p', null, `🤖 k-평균 결과와 같은 정도: ${Math.round(손.같음 * 100)}%`) : null))
      : 안함('「군집 분석 › 손으로 군집화」'),
  );
}

function 쪽3() {
  const km = 기록.get('k평균');
  const 실 = 기록.get('출발점실험');
  const 계 = 기록.get('계층');
  return 쪽(3,
    제목('2', '군집 분석의 종류'),
    표(['구분', '계층적 군집 분석', '분할적 군집 분석'], [
      ['방법', '가장 가까운 개체끼리 차례로 묶기를 되풀이', 'k개 군집으로 나누고 중심점을 옮기며 고침'],
      ['예', '단일·완전·평균·중심 연결법', 'k-평균 군집, 퍼지 군집, 밀도 군집'],
      ['특징', '군집 수를 미리 정하지 않음, 한번 묶이면 못 바꿈, 큰 데이터에 어려움', '군집 수 k 를 미리 정함, 군집이 바뀔 수 있음, 초기 중심점에 민감'],
    ]),
    제목('3', 'k-평균(K-Means) 군집 분석'),
    h('ol', null,
      h('li', null, 'k개만큼 중심점을 (임의로) 정한다.'),
      h('li', null, '각 데이터를 가장 가까운 중심점의 군집으로 묶는다.'),
      h('li', null, '묶은 그룹의 평균 위치로 중심점을 옮긴다.'),
      h('li', null, '중심점이 더 이상 움직이지 않을 때까지 2와 3을 반복한다.')),
    km
      ? h('div', { class: 'p-row' },
        그림(군집그림(km.점들, km.이름표, { k: km.k, 중심: km.중심, 지나온: km.지나온, 반지름: km.점들.length <= 10 ? 11 : 6, 글: km.점들.length <= 10 ? i => i + 1 : null }), 310),
        h('div', { class: 'p-col' },
          h('h3', null, '🔵 내 k-평균 시뮬레이션'),
          h('p', null, `데이터: ${km.데이터} / k = ${km.k}`),
          h('p', null, `반복 ${km.반복}회 만에 중심점이 멈췄다.`),
          h('p', null, `응집도(SSE) = ${수(km.응집도, 1)}`),
          h('p', { class: 'p-note' }, '점선은 중심점이 지나온 길이다.'),
          실 ? h('div', null, h('b', null, `출발점 실험 (k=${실.k}, ${실.데이터})`),
            h('p', null, 실.결과.map(x => `응집도 ${x.응집도}: ${x.횟수}번`).join(' · ')),
            h('p', { class: 'p-note' }, 실.결과.length > 1 ? '출발점에 따라 결과가 달라졌다 → k-평균은 초기 중심점에 민감하다.' : '10번 모두 같은 결과가 나왔다.')) : null))
      : 안함('「군집 분석 › k-평균 시뮬레이터」'),
    제목('4', '계층적 군집 분석'),
    계 ? h('p', null, `${계.축.join('·')} 성적으로 ${계.연결}을 써서 10명을 9번 묶었다. 묶은 거리: ${계.높이.map(v => 수(v, 1)).join(' → ')}`) : 안함('「군집 분석 › 계층적 군집」'),
    h('p', { class: 'p-note' }, '덴드로그램을 원하는 높이에서 자르면 군집 수가 정해진다.'),
  );
}

function 쪽4() {
  const 실 = 기록.get('실습131');
  const 닮 = 기록.get('닮은친구');
  const 거 = 기록.get('거리문제', 0);
  let 실그림 = null;
  if (실) {
    const 점들 = 성적점(실습131.x, 실습131.y);
    const 이름표 = 점들.map((_, i) => 실.고름[i + 1] ?? -1);
    const svg = 군집그림(점들, 이름표, { k: 3, 글: i => i + 1, 축: ['수학 →', '↑ 과학'] });
    실그림 = svg;
  }
  return 쪽(4,
    제목('5', '유사성과 상이성'),
    표(['', '뜻'], [
      ['군집 내 유사성', '같은 군집의 데이터끼리 거리가 가까울수록 높다 (무리 안에서는 친하게)'],
      ['군집 간 상이성', '서로 다른 군집 사이의 거리가 멀수록 높다 (다른 무리와는 다르게)'],
    ]),
    h('h3', null, '📏 유클리디언 거리'),
    h('div', { class: 'p-formula' }, 'd = √( (a₁ − b₁)² + (a₂ − b₂)² )'),
    h('p', null, '두 점 사이의 직선 거리. 속성이 여러 개이면 속성마다 차이를 제곱해 모두 더한 뒤 제곱근을 구한다. (더 나아가기: 맨해튼 거리 = |a₁−b₁| + |a₂−b₂|)'),
    h('p', null, `▸ 직접 계산한 거리 문제: ${거} 개 맞힘`),
    닮 ? h('p', null, `▸ 가장 닮은 친구: ${닮.과목.join('·')} 기준으로 ${닮.학생}번과 가장 가까운 학생은 ${닮.짝}번 (거리 ${수(닮.거리, 2)}). 쓰는 속성을 바꾸면 결과가 달라질 수 있다.`) : null,
    h('h3', null, '✍️ 스스로 실습: 유사성을 기준으로 군집화하기 (교과서 131쪽)'),
    실
      ? h('div', { class: 'p-row' },
        그림(실그림, 300),
        h('div', { class: 'p-col' },
          h('p', null, `빨간 중심점 3개를 기준으로 10명을 가장 가까운 군집에 넣었다. 처음에 바로 맞힌 학생: ${실.점수}/10명`),
          표(['군집', '학생 번호'], [0, 1, 2].map(g => [h('b', { style: { color: 색[g] } }, `군집 ${g + 1}`), Object.entries(실.고름).filter(([, v]) => v === g).map(([n]) => n).join(', ')]), '100%'),
          h('p', { class: 'p-note' }, '데이터가 더해질수록 군집의 범위가 넓어져 군집 내 유사성이 떨어진다. 중심점을 평균으로 옮기며 다시 묶는 것이 k-평균이다.'),
          h('p', { class: 'p-note' }, '※ 교과서 본문은 「수학과 국어」라고 적었으나 실습 그림의 축은 수학–과학이다.')))
      : 안함('「유사성과 상이성 › 실습」'),
  );
}

function 쪽5() {
  const 실그 = 기록.get('실루엣그래프');
  const 엘 = 기록.get('엘보');
  const 최 = 기록.get('최적k', []);
  const a = 실루엣예시.같은군집.reduce((x, y) => x + y) / 3, b = 실루엣예시.가까운군집.reduce((x, y) => x + y) / 3;
  let 엘그림 = null;
  if (엘) {
    const { 최대, 간격 } = 보기좋은축(엘.목록[0] * 1.08, 4);
    const 판 = 좌표판({ w: 330, h: 220, x: [0.5, 8.5], y: [0, 최대], x간격: 1, y간격: 간격, x글: v => (Number.isInteger(v) && v > 0 ? v : ''), y글: v => (v >= 10000 ? 수(v / 10000, 1) + '만' : v), x이름: 'k →', y이름: '↑ SSE', pad: { l: 52, r: 12, t: 30, b: 40 } });
    판.g.위.append(꺾은선(판, 엘.목록.map((y, i) => ({ x: i + 1, y })), { 고른값: 엘.답 }));
    엘그림 = 판.svg;
  }
  return 쪽(5,
    제목('6', '군집 분석 결과 평가'),
    h('p', null, '군집 분석은 정답이 없으므로 군집의 지름, 분산, 거리 등을 종합적으로 고려해 평가한다. 대표적으로 실루엣 계수와 엘보 방법이 있다.'),
    h('h3', null, '실루엣 계수 — 유사성과 상이성을 바탕으로'),
    h('div', { class: 'p-formula' }, 's(i) = ( b(i) − a(i) ) / max( a(i), b(i) )'),
    h('p', null, 'a(i): 같은 군집의 다른 데이터들과의 평균 거리(군집 내 유사성) · b(i): 가장 가까운 다른 군집의 데이터들과의 평균 거리(군집 간 상이성)'),
    h('p', null, `예) a = (${실루엣예시.같은군집.join(' + ')}) / 3 = ${수(a, 2)}, b = (${실루엣예시.가까운군집.join(' + ')}) / 3 = ${수(b, 2)} → s = (${수(b, 2)} − ${수(a, 2)}) / ${수(b, 2)} ≈ ${수((b - a) / b, 2)}`),
    h('p', null, '1에 가까울수록 잘 나뉜 상태, 0에 가까우면 경계에 걸친 애매한 상태, 음수이면 잘못된 군집. 실루엣 점수(평균)가 0.5 이상이면 좋은 군집, 가장 높은 k 를 고른다.'),
    실그 ? h('p', null, `▸ 내 실루엣 그래프 실험: ${실그.데이터}, k = ${실그.k} → 실루엣 점수 ${수(실그.점수, 2)} / 좋은 군집화 조건 ${실그.조건.filter(Boolean).length}/4 충족`) : 안함('「군집 평가 › 실루엣 그래프」'),
    h('h3', null, '엘보 방법 — 군집 내 유사성(응집도)을 바탕으로'),
    h('div', { class: 'p-row' },
      엘그림 ? 그림(엘그림, 300) : 안함('「군집 평가 › 엘보 방법」'),
      h('div', { class: 'p-col' },
        h('p', null, '응집도(SSE) = 중심점과 실제 데이터 거리의 제곱을 모두 더한 값. k 가 커질수록 줄어드는데, 그래프가 팔꿈치처럼 꺾이는 지점의 k 를 고른다.'),
        엘 ? h('p', null, `▸ ${엘.데이터}: 내가 찾은 꺾이는 지점 k = ${엘.답}`) : null)),
    h('h3', null, '🔮 최적의 k 실험 기록'),
    최.length
      ? 표(['회', '내 예상', '실루엣', '엘보', '만든 무리 수'], 최.slice(0, 6).map((x, i) => [i + 1, x.예상, x.실루엣, x.엘보, x.진짜]))
      : 안함('「군집 평가 › 최적의 k 실험실」'),
  );
}

function 쪽6() {
  const 결과 = 기록.get('퀴즈', 확인문제.map(() => null));
  const 정 = 기록.get('정리', 정리빈칸.map(() => ''));
  return 쪽(6,
    제목('📝', `확인 문제 — 한 번에 맞힌 문제 ${결과.filter(x => x === true).length} / ${확인문제.length}`),
    표(['번', '물음', '결과', '정답 · 해설'], 확인문제.map((q, i) => [
      i + 1, q.물음,
      결과[i] === true ? '⭕' : 결과[i] === false ? '🔁' : '—',
      `${'①②③④'[q.답]} ${q.보기[q.답]} — ${q.해설}`])),
    h('p', { class: 'p-note' }, '⭕ 한 번에 맞힘 · 🔁 다시 풀어 맞힘 · — 풀지 않음'),
    제목('🔑', '핵심 정리'),
    h('ol', null, 정리빈칸.map((b, i) => h('li', null, b.앞, h('b', { class: 정[i] === b.답 ? 'p-fill' : 'p-blank' }, 정[i] === b.답 ? b.답 : `( ${b.답} )`), b.뒤))),
    h('p', { class: 'p-note' }, '괄호 속 낱말은 앱에서 채우지 않은 빈칸의 답이다.'),
  );
}

const PDF모양 = `
.p-wrap{position:fixed;left:-12000px;top:0;width:794px;font-family:'NanumSquareRound','Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;color:#1f2a37}
.p-page{width:794px;height:1123px;background:#fff;display:flex;flex-direction:column;box-sizing:border-box}
.p-head{display:flex;justify-content:space-between;align-items:center;padding:16px 40px;background:#1f6f5c;color:#fff;font-size:13px}
.p-head b{font-size:16px}
.p-body{flex:1;padding:18px 40px 8px;font-size:13.5px;line-height:1.55;overflow:hidden}
.p-body p{margin:5px 0}.p-body ul,.p-body ol{margin:4px 0;padding-left:22px}
.p-foot{display:flex;justify-content:space-between;padding:10px 40px;font-size:11px;color:#8a8270;border-top:1px solid #e3ddd0}
.p-h2{font-size:19px;color:#1f6f5c;margin:14px 0 6px;display:flex;gap:8px;align-items:center;border-bottom:2px solid #cfe4dc;padding-bottom:4px}
.p-h2 span{background:#1f6f5c;color:#fff;border-radius:8px;padding:0 8px;font-size:15px;min-width:22px;text-align:center}
.p-body h3{font-size:15px;margin:10px 0 4px}
.p-table{border-collapse:collapse;font-size:12.5px;margin:4px 0;width:100%}
.p-table th,.p-table td{border:1px solid #d5dbe0;padding:4px 7px;vertical-align:top}
.p-table th{background:#eef3f1;white-space:nowrap}
.p-row{display:flex;gap:16px;align-items:flex-start}.p-col{flex:1;min-width:0}
.p-note{color:#5b6876;font-size:12.5px}
.p-none{background:#f4f4f4;border:1px dashed #bbb;border-radius:8px;padding:8px 12px;color:#888;margin:4px 0}
.p-formula{font-family:'Cambria Math','Times New Roman','NanumSquareRound',serif;font-size:18px;background:#f3f6f8;border-radius:8px;padding:6px 10px;text-align:center;margin:4px 0}
.p-grid2{display:grid;grid-template-columns:1fr 1fr;gap:3px 18px;font-size:13px}
.p-ok{color:#1e8e4e;font-weight:700}.p-no{color:#a0a8b0}
.p-tip{margin-top:16px;background:#fff6d6;border:1px solid #f0dd9a;border-radius:8px;padding:8px 12px}
.p-cover{text-align:center;padding:40px 0 20px;border-bottom:2px solid #cfe4dc;margin-bottom:8px}
.p-cover h1{font-size:34px;margin:14px 0 6px;color:#1f6f5c}
.p-sub{font-size:17px;color:#5b6876}.p-date{margin-top:14px;font-size:14px}
.p-name{margin-top:22px;font-size:16px;letter-spacing:1px}
.p-dots{display:inline-flex;gap:8px}.p-dots i{width:22px;height:22px;border-radius:50%;background:#e4572e;display:block}
.p-dots i:nth-child(2){background:#2e86de}.p-dots i:nth-child(3){background:#27ae60}
.p-fill{color:#1e8e4e}.p-blank{color:#b36b00}`;

/** PDF 만들기 — 진행 알림(지금쪽, 전체쪽) 을 받아 막대를 채운다 */
export async function PDF만들기(진행, { 미리보기 = false } = {}) {
  const 모양 = h('style', null, PDF모양);
  const 틀 = h('div', { class: 'p-wrap' });
  document.head.append(모양);
  document.body.append(틀);
  try {
    const 쪽들 = [쪽1(), 쪽2(), 쪽3(), 쪽4(), 쪽5(), 쪽6()];
    틀.append(...쪽들);
    // 그림(img)이 다 읽힐 때까지 기다린다
    await Promise.all([...틀.querySelectorAll('img')].map(img => (img.complete ? null : new Promise(r => { img.onload = img.onerror = r; }))));
    if (document.fonts?.ready) await document.fonts.ready;
    const 그림들 = [];
    const 문서 = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    문서.setProperties({ title: '군집 분석 모델의 개념 — 학습 정리', author: '군집 분석 실험실 (© 2026 티쳐무)', subject: '데이터 과학 군집 분석' });
    for (let i = 0; i < 쪽들.length; i++) {
      const 캔버스 = await html2canvas(쪽들[i], { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
      if (i) 문서.addPage();
      const 자료 = 캔버스.toDataURL('image/jpeg', 0.92);
      그림들.push(자료);
      문서.addImage(자료, 'JPEG', 0, 0, 210, 297);
      진행?.(i + 1, 쪽들.length);
    }
    if (미리보기) return { 그림들, 크기: 문서.output('blob').size };   // 점검용: 파일로 저장하지 않는다
    문서.save('군집분석_학습정리.pdf');
  } finally {
    틀.remove(); 모양.remove();
  }
}
