/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 0 생각 열기 — 지도/비지도 학습 · 할리갈리 카드 묶기 · 군집 분석 사례
import { h, 채우기, s, 알림, 고르기단추 } from '../lib/ui.js';
import { 기록 } from '../lib/store.js';
import { 색 } from '../lib/plot.js';
import { 학습분류, 할리갈리, 과일, 사례 } from '../data.js';
import { k평균, 난수, 멀리중심 } from '../lib/cluster.js';

// ───────────────────────── 1. 지도 학습 vs 비지도 학습 ─────────────────────────
function 학습방법(el, 수명, 도구) {
  const 놓은 = 기록.get('학습분류', {});       // 카드번호 → 처음에 맞혔는가
  let 고른 = null;
  const 피드백 = h('div', { class: 'fb' });
  const 남은칸 = h('div', { class: 'sort-cards' });
  const 통 = { 지도: h('div'), 비지도: h('div') };

  // 그림 칸: 동물 그림 아래에 이름표(레이블)를 단다 — 지도 학습은 정답 이름표, 비지도 학습은 「?」
  const 동물칸 = 이름표들 => h('div', { class: 'label-row' }, 이름표들.map(([그림, 이름]) =>
    h('div', { class: 'label-item' }, h('span', { class: 'label-ico' }, 그림),
      h('span', { class: 'label-tag' + (이름 === '?' ? ' none' : '') }, 이름))));
  const 설명 = (제목, 이름표들, 글) => h('div', { class: 'panel' },
    h('h3', null, 제목), 동물칸(이름표들), h('p', { class: 'lead' }, 글));

  function 그리기() {
    채우기(남은칸, ...학습분류.map((c, i) => (i in 놓은 ? null : h('button', {
      class: 'scard' + (고른 === i ? ' sel' : ''),
      onClick: () => { 고른 = i; 알림(피드백, '이제 오른쪽 아래 상자 가운데 알맞은 곳을 누르세요.', 'info'); 그리기(); },
    }, c.글))));
    for (const 이름 of ['지도', '비지도']) {
      채우기(통[이름], ...학습분류.map((c, i) => (i in 놓은 && c.답 === 이름
        ? h('div', { class: 'scard ok' }, (놓은[i] ? '' : '🔁 ') + c.글) : null)));
    }
    const 다 = Object.keys(놓은).length === 학습분류.length;
    if (다) {
      const 맞힘 = Object.values(놓은).filter(Boolean).length;
      알림(피드백, `🎉 모두 분류했어요! 처음에 바로 맞힌 카드 ${맞힘} / ${학습분류.length}개. 핵심: <b>정답(레이블)이 있으면 지도 학습, 없으면 비지도 학습</b>`, 'ok');
      도구.완료();
    }
  }
  function 넣기(이름) {
    if (고른 == null) { 알림(피드백, '먼저 위에서 카드를 하나 누르세요.', 'info'); return; }
    const c = 학습분류[고른];
    if (c.답 === 이름) {
      if (!(고른 in 놓은)) 놓은[고른] = !c.틀림;
      알림(피드백, `⭕ 맞아요! ${c.까닭}`, 'ok');
      고른 = null; 기록.set('학습분류', { ...놓은 });
    } else {
      c.틀림 = true;
      알림(피드백, `❌ 다시 생각해 보세요. 이 데이터에 <b>정답(레이블)</b>이 붙어 있나요?`, 'bad');
    }
    그리기();
  }

  el.append(
    h('div', { class: 'col', style: { width: '400px' } },
      h('h2', null, '머신러닝의 두 가지 방법'),
      설명('📘 지도 학습', [['🐶', '강아지'], ['🐱', '고양이'], ['🐶', '강아지'], ['🐱', '고양이']], '문제와 정답(레이블)을 모두 알려 주고 학습시키는 방법'),
      설명('🔍 비지도 학습', [['🐶', '?'], ['🐱', '?'], ['🐶', '?'], ['🐱', '?']], '답을 알려 주지 않고, 데이터 안에 숨겨진 패턴(비슷함)을 찾아내게 하는 방법'),
      h('div', { class: 'tip', html: '💡 <b>군집 분석</b>은 대표적인 <b>비지도 학습</b>이에요. 무엇이 정답인지 모르는 채로 비슷한 것끼리 묶어요.' }),
    ),
    h('div', { class: 'col grow' },
      h('p', { class: 'lead' }, '카드를 누른 뒤, 아래 「지도 학습」 또는 「비지도 학습」 상자를 누르세요.'),
      남은칸,
      h('div', { class: 'row', style: { alignItems: 'stretch', flex: 1, minHeight: 0 } },
        h('div', { class: 'bucket', onClick: () => 넣기('지도') }, h('h3', null, '📘 지도 학습'), 통.지도),
        h('div', { class: 'bucket', onClick: () => 넣기('비지도') }, h('h3', null, '🔍 비지도 학습'), 통.비지도)),
      피드백),
  );
  그리기();
}

// ───────────────────────── 2. 할리갈리 카드 묶기 ─────────────────────────
/** 카드 한 장 그림 — 개수만큼 과일을 주사위 눈처럼 놓는다 */
const 눈자리 = {
  1: [[50, 50]], 2: [[32, 32], [68, 68]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
};
function 카드그림(카드) {
  const f = 과일[카드.과일];
  const 판 = s('svg', { viewBox: '0 0 100 125', width: '100%', height: '100%' });
  for (const [x, y] of 눈자리[카드.개수]) {
    const g = s('g', { transform: `translate(${x},${y + 4}) scale(1.35)` });
    if (f.이름 === '바나나') g.append(s('path', { d: 'M-13,-4 Q0,16 13,-6 Q2,6 -13,-4Z', fill: f.색, stroke: '#b8920a', 'stroke-width': 1.5 }));
    else if (f.이름 === '딸기') {
      g.append(s('path', { d: 'M-11,-6 Q0,-12 11,-6 Q8,10 0,14 Q-8,10 -11,-6Z', fill: f.색 }));
      g.append(s('path', { d: 'M-7,-8 L0,-4 L7,-8 L0,-13Z', fill: '#2e8b3a' }));
    } else {
      g.append(s('circle', { r: 11, fill: f.색 }));
      g.append(s('circle', { r: 3.5, cx: -4, cy: -4, fill: '#fff', opacity: 0.5 }));
    }
    판.append(g);
  }
  판.append(s('text', { x: 50, y: 119, 'text-anchor': 'middle', 'font-size': 12, fill: '#666', 'font-weight': 700 }, f.이름));
  return 판;
}

function 할리갈리묶기(el, 수명, 도구) {
  const 저장 = 기록.get('할리갈리', null);
  let k = 저장?.k ?? 3;
  let 칠함 = 저장?.칠함 ?? 할리갈리.map(() => -1);
  let 기준 = 저장?.기준 ?? [];
  let 붓 = 0, 보기 = '나';
  const 컴이름 = 저장?.컴이름 ?? [];

  const 판 = h('div', { class: 'hg-grid' });
  const 오른쪽 = h('div', { class: 'col', style: { width: '430px' } });
  const 피드백 = h('div', { class: 'fb' });

  /** 다른 기준으로 묶은 결과 */
  function 묶음(방식) {
    if (방식 === '종류') return 할리갈리.map(c => c.과일);
    if (방식 === '개수') return 할리갈리.map(c => (c.개수 <= 2 ? 0 : c.개수 === 3 ? 1 : 2));
    if (방식 === '컴') {
      // 컴퓨터는 과일 색(빨강·초록·파랑 값)과 개수를 숫자로만 본다 — 이름은 모른다
      const 숫자 = 할리갈리.map(c => {
        const hex = 과일[c.과일].색;
        return [parseInt(hex.slice(1, 3), 16) / 4, parseInt(hex.slice(3, 5), 16) / 4, parseInt(hex.slice(5, 7), 16) / 4, c.개수 * 14];
      });
      return k평균(숫자, 멀리중심(숫자, k, 난수(5))).이름표;
    }
    return 칠함;
  }

  function 저장하기() { 기록.set('할리갈리', { k, 칠함, 기준, 컴이름 }); }

  function 판그리기() {
    const 이름표 = 묶음(보기);
    // 다른 기준으로 볼 때는 같은 무리끼리 붙여 놓는다
    const 차례 = 할리갈리.map((_, i) => i);
    if (보기 !== '나') 차례.sort((a, b) => 이름표[a] - 이름표[b] || a - b);
    채우기(판, ...차례.map(i => {
      const g = 이름표[i];
      const 카드 = h('div', {
        class: 'hg', style: { borderColor: g >= 0 ? 색[g] : '#ddd' },
        onClick: () => {
          if (보기 !== '나') { 알림(피드백, '지금은 다른 기준을 구경하는 중이에요. 「✋ 내가 묶기」를 눌러 돌아가세요.', 'info'); return; }
          칠함[i] = 칠함[i] === 붓 ? -1 : 붓; 저장하기(); 판그리기(); 검사();
        },
      }, 카드그림(할리갈리[i]));
      if (g >= 0) 카드.append(h('span', { class: 'tag', style: { background: 색[g] } }, 보기 === '컴' ? 'ABCDEF'[g] : g + 1));
      return 카드;
    }));
  }

  function 검사() {
    if (보기 !== '나') return;
    const 남음 = 칠함.filter(v => v < 0).length;
    const 빈무리 = [...Array(k).keys()].filter(g => !칠함.includes(g));
    const 빈기준 = [...Array(k).keys()].filter(g => !(기준[g] || '').trim());
    if (남음) 알림(피드백, `아직 묶지 않은 카드 ${남음}장`, 'info');
    else if (빈무리.length) 알림(피드백, `무리 ${빈무리.map(g => g + 1).join(', ')} 에 카드가 없어요. ${k}개 무리를 모두 쓰세요.`, 'bad');
    else if (빈기준.length) 알림(피드백, `무리 ${빈기준.map(g => g + 1).join(', ')} 의 기준을 적어 주세요.`, 'info');
    else { 알림(피드백, '👏 잘 묶었어요! 이제 「다른 기준」 단추로 친구·컴퓨터는 어떻게 묶었는지 견주어 보세요.', 'ok'); 도구.완료(); }
  }

  function 오른쪽그리기() {
    const 설명 = {
      나: null,
      종류: h('div', { class: 'tip' }, '🍓 과일 종류로 묶으면 4무리 — 가장 흔한 생각이에요.'),
      개수: h('div', { class: 'tip' }, '🔢 과일 개수(1~2개 / 3개 / 4개 이상)로 묶으면 3무리. 게임에서는 이 기준이 더 중요하죠!'),
      컴: h('div', { class: 'col' },
        h('div', { class: 'fb bad' }, '🤖 인공지능은 그룹을 만들어 줄 뿐, 이 그룹에 어떤 의미가 있는지는 알려 주지 않아요! 「그룹 A」라는 이름뿐이에요.'),
        h('p', { class: 'lead' }, '컴퓨터가 만든 그룹에 사람이 이름을 붙여 보세요.'),
        ...[...Array(k).keys()].map(g => h('div', { class: 'row' },
          h('span', { class: 'badge', style: { background: 색[g], color: '#fff' } }, '그룹 ' + 'ABCDEF'[g]),
          h('input', {
            class: 'txt grow', placeholder: '예) 빨간 과일 무리', value: 컴이름[g] || '',
            onInput: e => { 컴이름[g] = e.target.value; 저장하기(); },
          })))),
    };
    채우기(오른쪽, 
      h('div', { class: 'panel col' },
        h('div', { class: 'row' }, h('b', null, '몇 무리로 묶을까요?'),
          고르기단추([2, 3, 4].map(v => ({ 값: v, 글: v + '개' })), k, v => {
            k = v; 칠함 = 칠함.map(g => (g >= k ? -1 : g)); 붓 = Math.min(붓, k - 1);
            저장하기(); 오른쪽그리기(); 판그리기(); 검사();
          })),
        h('div', { class: 'row' }, h('b', null, '보기'),
          고르기단추([{ 값: '나', 글: '✋ 내가 묶기' }, { 값: '종류', 글: '종류' }, { 값: '개수', 글: '개수' }, { 값: '컴', 글: '🤖 컴퓨터' }], 보기, v => {
            보기 = v; 오른쪽그리기(); 판그리기(); if (v === '나') 검사(); else 피드백.textContent = '';
          }))),
      보기 === '나' ? h('div', { class: 'panel col' },
        h('b', null, '붓을 고르고 카드를 누르세요. 무리마다 기준도 적어요.'),
        ...[...Array(k).keys()].map(g => h('div', { class: 'row' },
          h('button', {
            class: 'btn sm', style: { background: 붓 === g ? 색[g] : '#fff', color: 붓 === g ? '#fff' : 색[g], borderColor: 색[g], minWidth: '76px' },
            onClick: () => { 붓 = g; 오른쪽그리기(); },
          }, '무리 ' + (g + 1)),
          h('input', {
            class: 'txt grow', placeholder: '이 무리의 기준', value: 기준[g] || '',
            onInput: e => { 기준[g] = e.target.value; 저장하기(); 검사(); },
          })))) : 설명[보기],
    );
  }

  el.append(
    h('div', { class: 'col grow' },
      h('h2', null, '할리갈리 카드는 어떤 기준으로 구분할 수 있을까?'),
      h('p', { class: 'lead' }, '정답은 없어요. 내가 정한 기준으로 카드를 묶어 보세요 — 이것이 바로 군집 분석의 생각이에요.'),
      판, 피드백),
    오른쪽,
  );
  오른쪽그리기(); 판그리기(); 검사();
}

// ───────────────────────── 3. 군집 분석은 어디에 쓸까? ─────────────────────────
function 사례카드(el, 수명, 도구) {
  const 저장 = 기록.get('사례', { 고른: {}, 뒤집음: {}, 생각: '' });
  const 피드백 = h('div', { class: 'fb' });
  const 저장하기 = () => 기록.set('사례', 저장);
  const 다했나 = () => {
    if (사례.every((_, i) => 저장.뒤집음[i]) && 저장.생각.trim().length >= 5) {
      알림(피드백, '👍 좋아요! 군집 분석은 「비슷한 것끼리 묶어 맞춤으로 대응」하는 곳 어디에나 쓰여요.', 'ok');
      도구.완료();
    }
  };

  const 카드들 = 사례.map((c, i) => {
    // 고를 낱말: 쓸모 있는 속성 + 함정 을 섞는다 (늘 같은 차례)
    const 낱말 = [...c.속성, ...c.함정].sort((a, b) => (a.length * 7 + a.charCodeAt(0)) % 5 - (b.length * 7 + b.charCodeAt(0)) % 5);
    const 고른 = new Set(저장.고른[i] || []);
    const 겉 = h('div', { class: 'flip' + (저장.뒤집음[i] ? ' on' : ''), style: { height: '300px' } });
    const 칩들 = h('div', { class: 'row', style: { gap: '6px' } });
    const 결과 = h('div', { class: 'row', style: { gap: '6px' } });
    const 칩그리기 = () => {
      채우기(칩들, ...낱말.map(w => h('button', {
        class: 'chip' + (고른.has(w) ? ' on' : ''),
        onClick: () => { 고른.has(w) ? 고른.delete(w) : 고른.add(w); 저장.고른[i] = [...고른]; 저장하기(); 칩그리기(); },
      }, w)));
      채우기(결과, ...낱말.map(w => {
        const 쓸모 = c.속성.includes(w);
        if (!고른.has(w) && !쓸모) return null;
        return h('span', { class: 'chip ' + (쓸모 ? (고른.has(w) ? 'on' : '') : 'bad') }, (쓸모 ? (고른.has(w) ? '✔ ' : '＋ ') : '✖ ') + w);
      }));
    };
    칩그리기();
    겉.append(h('div', { class: 'flip-in' },
      h('div', { class: 'flip-face' },
        h('div', { style: { fontSize: '44px' } }, c.그림),
        h('h3', null, c.이름),
        h('p', { class: 'lead' }, '비슷한 것끼리 묶으려면 어떤 데이터가 필요할까? 골라 보세요.'),
        칩들,
        h('button', {
          class: 'btn primary', style: { marginTop: 'auto' },
          onClick: () => { 저장.뒤집음[i] = true; 저장하기(); 칩그리기(); 겉.classList.add('on'); 다했나(); },
        }, '뒤집어 확인하기 ↻')),
      h('div', { class: 'flip-face flip-back' },
        h('h3', null, c.그림 + ' ' + c.이름),
        h('p', { style: { margin: 0, fontSize: '15.5px' } }, c.설명),
        h('div', { class: 'muted' }, '✔ 고른 것 · ＋ 놓친 것 · ✖ 묶는 데 쓸모없는 것'),
        결과,
        h('button', { class: 'btn sm', style: { marginTop: 'auto' }, onClick: () => 겉.classList.remove('on') }, '앞면 보기'))));
    return 겉;
  });

  el.append(h('div', { class: 'col grow' },
    h('h2', null, '군집 분석은 어디에 쓸까?'),
    h('div', { class: 'row', style: { alignItems: 'stretch', gap: '14px' } }, 카드들),
    h('div', { class: 'panel col' },
      h('b', null, '🌱 생물 군집처럼, 우리 사회에서 「군집」을 이룬 것에는 어떤 것이 있을까요?'),
      h('textarea', {
        class: 'note', rows: 2, placeholder: '예) 취향이 비슷한 사람끼리 모이는 동아리, 비슷한 상품끼리 모아 둔 마트 진열대 …',
        onInput: e => { 저장.생각 = e.target.value; 저장하기(); 다했나(); },
      }, 저장.생각)),
    피드백));
  다했나();
}

export default {
  id: 'open', 이름: '생각 열기', 아이콘: '💡',
  카드: [
    { id: 'learn', 제목: '지도·비지도', 그리기: 학습방법 },
    { id: 'halli', 제목: '할리갈리 카드 묶기', 그리기: 할리갈리묶기 },
    { id: 'cases', 제목: '어디에 쓸까?', 그리기: 사례카드 },
  ],
};
