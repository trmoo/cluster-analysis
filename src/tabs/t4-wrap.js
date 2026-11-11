/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 4 정리 — 확인 문제 · 핵심 정리 빈칸 · 전체 학습 내용 PDF 내려받기
import { h, 채우기, 알림, 대화상자 } from '../lib/ui.js';
import { 기록 } from '../lib/store.js';
import { 확인문제, 정리빈칸, 정리낱말 } from '../data.js';
import 탭0 from './t0-open.js';
import 탭1, { 종류탭 } from './t1-cluster.js';
import 탭2 from './t2-similar.js';
import 탭3 from './t3-eval.js';

// ───────────────────────── 1. 확인 문제 ─────────────────────────
function 퀴즈(el, 수명, 도구) {
  const 결과 = 기록.get('퀴즈', 확인문제.map(() => null));   // true(첫 시도 정답) / false / null(아직)
  const 푼 = 기록.get('퀴즈푼', 확인문제.map(() => false));
  let 번 = Math.max(0, 푼.indexOf(false));
  const 점들 = h('div', { class: 'qdots' });
  const 본문 = h('div', { class: 'col grow' });
  const 점수 = h('div', { class: 'row' });

  function 그리기() {
    채우기(점들, ...확인문제.map((_, i) => h('button', {
      class: 'qdot' + (i === 번 ? ' on' : '') + (결과[i] === true ? ' ok' : 결과[i] === false ? ' bad' : ''),
      onClick: () => { 번 = i; 그리기(); },
    }, i + 1)));
    const q = 확인문제[번];
    const 피드백 = h('div', { class: 'fb' });
    const 보기들 = q.보기.map((t, i) => h('button', {
      class: 'opt' + (푼[번] && i === q.답 ? ' ok' : ''),
      onClick: e => {
        if (푼[번]) return;
        if (i === q.답) {
          if (결과[번] == null) 결과[번] = true;
          푼[번] = true;
          e.currentTarget.classList.add('ok');
          알림(피드백, '⭕ 정답! ' + q.해설, 'ok');
        } else {
          결과[번] = false;
          e.currentTarget.classList.add('bad');
          알림(피드백, '❌ 다시 골라 보세요. 💡 ' + q.힌트, 'bad');
        }
        기록.set('퀴즈', 결과); 기록.set('퀴즈푼', 푼);
        점그리기();
      },
    }, `${'①②③④'[i]} ${t}`));
    채우기(본문, 
      h('h2', null, `Q${번 + 1}. ${q.물음}`),
      h('div', { class: 'opts' }, 보기들),
      h('div', { class: 'row' },
        h('button', { class: 'btn sm', onClick: () => 알림(피드백, '💡 ' + q.힌트, 'info') }, '💡 힌트'),
        h('button', { class: 'btn sm', disabled: 번 === 0, onClick: () => { 번--; 그리기(); } }, '◀ 이전 문제'),
        h('button', { class: 'btn sm primary', disabled: 번 === 확인문제.length - 1, onClick: () => { 번++; 그리기(); } }, '다음 문제 ▶')),
      피드백);
    if (푼[번]) 알림(피드백, '⭕ ' + q.해설, 'ok');
    점그리기();
  }
  function 점그리기() {
    [...점들.children].forEach((b, i) => { b.className = 'qdot' + (i === 번 ? ' on' : '') + (결과[i] === true ? ' ok' : 결과[i] === false ? ' bad' : ''); });
    const 바로 = 결과.filter(x => x === true).length;
    채우기(점수, h('span', { class: 'badge' }, `푼 문제 ${푼.filter(Boolean).length}/${확인문제.length}`), h('span', { class: 'badge' }, `한 번에 맞힌 문제 ${바로}`));
    if (푼.every(Boolean)) 도구.완료();
  }
  el.append(h('div', { class: 'col grow' }, h('div', { class: 'row' }, h('b', null, '확인 문제'), 점들, 점수), 본문));
  그리기();
}

// ───────────────────────── 2. 핵심 정리 빈칸 ─────────────────────────
function 핵심정리(el, 수명, 도구) {
  const 채움 = 기록.get('정리', 정리빈칸.map(() => ''));
  let 고른 = 채움.findIndex(v => !v);
  const 문장칸 = h('div', { class: 'col', style: { gap: '7px', fontSize: '18px' } });
  const 낱말칸 = h('div', { class: 'row' });
  const 피드백 = h('div', { class: 'fb' });

  function 그리기() {
    채우기(문장칸, ...정리빈칸.map((b, i) => h('div', { class: 'panel', style: { padding: '6px 12px' } },
      h('b', { style: { color: 'var(--brand)' } }, `${i + 1}. `), b.앞,
      h('span', {
        class: 'blank' + (i === 고른 ? ' sel' : '') + (채움[i] ? (채움[i] === b.답 ? ' ok' : ' bad') : ''),
        onClick: () => { if (채움[i] !== b.답) { 고른 = i; 그리기(); } },
      }, 채움[i] || '　?　'),
      b.뒤)));
    채우기(낱말칸, h('b', null, '낱말 상자:'), 정리낱말.map(w => h('button', {
      class: 'chip', onClick: () => {
        if (고른 < 0) { 알림(피드백, '먼저 빈칸을 누르세요.', 'info'); return; }
        채움[고른] = w;
        if (w === 정리빈칸[고른].답) { 알림(피드백, '⭕ 맞아요!', 'ok'); 고른 = 채움.findIndex((v, j) => v !== 정리빈칸[j].답); }
        else 알림(피드백, '❌ 이 자리에는 다른 낱말이 들어가요. 다시 골라 보세요.', 'bad');
        기록.set('정리', 채움); 그리기();
      },
    }, w)));
    if (채움.every((v, i) => v === 정리빈칸[i].답)) { 알림(피드백, '🎉 핵심 정리 완성! 마지막 카드에서 PDF 로 내려받아 보세요.', 'ok'); 도구.완료(); }
  }
  el.append(h('div', { class: 'col grow' },
    h('h2', null, '핵심 정리 — 빈칸 채우기'),
    h('p', { class: 'lead' }, '빈칸을 누르고 낱말 상자에서 알맞은 낱말을 고르세요. (쓰이지 않는 낱말도 있어요)'),
    문장칸, 낱말칸, 피드백));
  그리기();
}

// ───────────────────────── 3. PDF 내려받기 ─────────────────────────
function PDF(el, 수명, 도구) {
  const 탭들 = [탭0, 탭1, 탭2, 종류탭, 탭3];
  const 전체 = 탭들.flatMap(t => t.카드.map(c => ({ 탭: t, c, 열쇠: `${t.id}/${c.id}` })))
    .concat([{ 탭: { 이름: '정리' }, c: { 제목: '확인 문제' }, 열쇠: 'wrap/quiz' }, { 탭: { 이름: '정리' }, c: { 제목: '핵심 정리' }, 열쇠: 'wrap/summary' }]);
  const 마친 = 전체.filter(x => 기록.완료됨(x.열쇠)).length;
  const 진행 = h('div', { class: 'col' });
  const 상태 = h('div', { class: 'fb' });
  const 단추 = h('button', { class: 'btn primary', style: { fontSize: '22px', padding: '14px 26px' } }, '📄 전체 학습 내용 PDF 내려받기');

  단추.addEventListener('click', async () => {
    단추.disabled = true;
    const 막대 = h('i', { style: { width: '2%' } });
    채우기(진행, h('div', { class: 'meter' }, 막대));
    알림(상태, 'PDF 를 만드는 중이에요… 잠시만 기다려 주세요.', 'info');
    try {
      const { PDF만들기 } = await import('../pdf.js');
      await PDF만들기((지금, 전체쪽) => { 막대.style.width = Math.round((지금 / 전체쪽) * 100) + '%'; });
      알림(상태, '✅ 「군집분석_학습정리.pdf」 파일을 내려받았어요. 브라우저의 내려받기 폴더를 확인하세요.', 'ok');
      도구.완료();
    } catch (e) {
      console.error(e);
      알림(상태, '😢 PDF 를 만들지 못했어요: ' + e.message, 'bad');
    } finally { 단추.disabled = false; }
  });

  el.append(
    h('div', { class: 'col', style: { width: '560px' } },
      h('h2', null, '📋 내 활동 현황'),
      h('div', { class: 'row' }, h('span', { class: 'big-num' }, `${마친} / ${전체.length}`), h('span', { class: 'muted' }, '활동 완료')),
      h('div', { class: 'meter' }, h('i', { style: { width: (마친 / 전체.length) * 100 + '%' } })),
      h('div', { class: 'panel progress-list' }, 전체.map(x => h('div', { class: 기록.완료됨(x.열쇠) ? 'ok' : 'no' }, (기록.완료됨(x.열쇠) ? '✔ ' : '○ ') + `${x.탭.이름} · ${x.c.제목}`)))),
    h('div', { class: 'col grow' },
      h('h2', null, '전체 학습 내용 PDF'),
      h('div', { class: 'panel', html: 'A4 6쪽으로 정리해 드려요.<br>① 표지·학습 목표·활동 현황 ② 생각 열기·군집 분석 개념·<b>내 군집화 그림</b> ③ 유사성과 상이성·<b>131쪽 실습 결과</b> ④ 군집 분석의 종류·계층적 군집·<b>내 k-평균 결과</b> ⑤ 실루엣 계수·엘보 방법·<b>내 실험 기록</b> ⑥ 확인 문제 결과·핵심 정리' }),
      h('div', { class: 'tip', html: '💡 아직 하지 않은 활동은 PDF 에 「아직 하지 않은 활동」으로 표시돼요. 이름·학번은 넣지 않아요 — 필요하면 출력한 뒤 손으로 적으세요.' }),
      단추, 진행, 상태,
      h('button', {
        class: 'btn sm warn', style: { alignSelf: 'flex-start', marginTop: 'auto' },
        onClick: () => 대화상자('내 기록을 지울까요?', '이 컴퓨터의 이 창에 남은 활동 기록이 모두 지워져요. 다음 학생이 쓰기 전에 누르세요.', [
          { 글: '그만두기' }, { 글: '모두 지우기', 주: true, 할일: () => { 기록.지우기(); location.hash = '#open/learn'; location.reload(); } }]),
      }, '🧹 내 기록 모두 지우기 (공용 컴퓨터)')),
  );
}

export default {
  id: 'wrap', 이름: '정리·PDF', 아이콘: '📄',
  카드: [
    { id: 'quiz', 제목: '확인 문제', 그리기: 퀴즈 },
    { id: 'summary', 제목: '핵심 정리', 그리기: 핵심정리 },
    { id: 'pdf', 제목: 'PDF 내려받기', 그리기: PDF },
  ],
};
