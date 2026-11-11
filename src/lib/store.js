/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 학생이 한 활동 기록 — PDF 에 담기 위해 모아 둔다.
// 이름·학번은 받지 않는다. 이 탭(sessionStorage)에만 남고 창을 닫으면 사라진다.

const 열쇠 = 'cluster-lab:v1';
let 상태 = {};
try { 상태 = JSON.parse(sessionStorage.getItem(열쇠) || '{}') || {}; } catch { 상태 = {}; }

const 듣는이 = new Set();
function 저장() {
  try { sessionStorage.setItem(열쇠, JSON.stringify(상태)); } catch { /* 사생활 보호 창 등 */ }
  듣는이.forEach(fn => { try { fn(); } catch { /* 무시 */ } });
}

export const 기록 = {
  get(k, 기본 = null) { return k in 상태 ? 상태[k] : 기본; },
  set(k, v) { 상태[k] = v; 저장(); },
  /** 활동 하나를 마쳤다고 표시 */
  완료(id) { const d = 상태.완료 || {}; if (!d[id]) { d[id] = true; 상태.완료 = d; 저장(); } },
  완료됨(id) { return !!(상태.완료 || {})[id]; },
  지우기() { 상태 = {}; 저장(); },
  /** 통째로 꺼내기·넣기 — 「다음 시간에 이어하기」 파일에 담았다가 다시 불러온다 */
  전부() { return JSON.parse(JSON.stringify(상태)); },
  불러오기(새것) { 상태 = 새것 && typeof 새것 === 'object' ? 새것 : {}; 저장(); },
  구독(fn) { 듣는이.add(fn); return () => 듣는이.delete(fn); },
};
