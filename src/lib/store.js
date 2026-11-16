/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 학생이 한 활동 기록 — PDF 에 담기 위해 모아 둔다. 이름·학번은 받지 않는다.
//
// 기록은 두 군데에 둔다.
//  ① sessionStorage — 지금 이 탭의 기록. 새로 고침해도 남지만 탭을 닫으면 사라진다.
//  ② localStorage   — 「실수로 창을 닫았을 때」를 위한 비상 사본. 브라우저를 껐다 켜도 남는다.
//     컴퓨터실 PC 는 여러 학생이 함께 쓰므로 ② 를 저절로 불러오지 않는다.
//     새 탭에서 열면 「이어서 할까요?」를 먼저 묻고, 비상유효시간이 지난 사본은 묻지 않고 지운다
//     (같은 수업 안에서 닫은 경우만 살리고 다음 반 학생에게는 넘기지 않으려는 것).

const 열쇠 = 'cluster-lab:v1';
const 비상열쇠 = 'cluster-lab:backup:v1';
export const 비상유효시간 = 3 * 60 * 60 * 1000;   // 3시간

/** 기록이 비어 있는가 — 아무것도 안 했으면 비상 사본을 만들지도, 묻지도 않는다 */
export function 빈기록(상태) {
  return !상태 || typeof 상태 !== 'object' || Object.keys(상태).length === 0;
}

/** 비상 사본을 물어볼 만한가 — 'ask'(묻기) / 'expired'(지우기) / 'none'(없음) */
export function 비상판정(사본, 지금 = Date.now(), 유효 = 비상유효시간) {
  if (!사본 || typeof 사본 !== 'object' || 빈기록(사본.기록)) return 'none';
  const 때 = Date.parse(사본.시각);
  if (!Number.isFinite(때)) return 'none';
  if (지금 - 때 > 유효 || 때 - 지금 > 60 * 1000) return 'expired';   // 미래 시각(시계가 틀린 PC)도 믿지 않는다
  return 'ask';
}

const 읽기 = (저장소, k) => { try { return JSON.parse(globalThis[저장소]?.getItem(k) || 'null'); } catch { return null; } };
const 쓰기 = (저장소, k, v) => { try { globalThis[저장소]?.setItem(k, JSON.stringify(v)); } catch { /* 사생활 보호 창 등 */ } };
const 빼기 = (저장소, k) => { try { globalThis[저장소]?.removeItem(k); } catch { /* 무시 */ } };

let 상태 = 읽기('sessionStorage', 열쇠) || {};
if (typeof 상태 !== 'object') 상태 = {};
let 지금주소 = '';
let 비상꺼둠 = false;   // PDF 를 받아 다 마친 탭 — 그 뒤로는 비상 사본을 만들지 않는다

// 새 탭으로 열렸을 때(이 탭에 기록이 없을 때)만 비상 사본을 살펴본다 — 같은 탭 새로 고침이면 이 탭 기록을 그대로 쓴다
let 남은사본 = null;
{
  const 사본 = 읽기('localStorage', 비상열쇠);
  const 판정 = 비상판정(사본);
  if (판정 === 'expired') 빼기('localStorage', 비상열쇠);
  else if (판정 === 'ask' && 빈기록(상태)) 남은사본 = 사본;
}

function 비상저장() {
  // 남은 사본에 답하기 전에는 덮어쓰지 않는다 — 학생이 이어서 하기를 고르기 전에 사라지면 안 된다
  if (남은사본 || 비상꺼둠) return;
  if (빈기록(상태)) 빼기('localStorage', 비상열쇠);
  else 쓰기('localStorage', 비상열쇠, { 시각: new Date().toISOString(), 주소: 지금주소, 기록: 상태 });
}

const 듣는이 = new Set();
function 저장() {
  쓰기('sessionStorage', 열쇠, 상태);
  비상저장();
  듣는이.forEach(fn => { try { fn(); } catch { /* 무시 */ } });
}

export const 기록 = {
  get(k, 기본 = null) { return k in 상태 ? 상태[k] : 기본; },
  set(k, v) { 상태[k] = v; 저장(); },
  /** 활동 하나를 마쳤다고 표시 */
  완료(id) { const d = 상태.완료 || {}; if (!d[id]) { d[id] = true; 상태.완료 = d; 저장(); } },
  완료됨(id) { return !!(상태.완료 || {})[id]; },
  /** 이 탭과 비상 사본을 함께 지운다 (다음 학생·다른 반 수업 전에) */
  지우기() { 상태 = {}; 남은사본 = null; 비상꺼둠 = false; 저장(); 빼기('localStorage', 비상열쇠); },
  /** 통째로 꺼내기·넣기 — 「다음 시간에 이어하기」 파일에 담았다가 다시 불러온다 */
  전부() { return JSON.parse(JSON.stringify(상태)); },
  불러오기(새것) { 상태 = 새것 && typeof 새것 === 'object' ? 새것 : {}; 남은사본 = null; 저장(); },
  구독(fn) { 듣는이.add(fn); return () => 듣는이.delete(fn); },
  /** 지금 보고 있는 카드 주소 — 비상 사본에 함께 적어 두어 이어서 할 때 그 카드로 돌아간다 */
  위치(주소) { 지금주소 = 주소 || ''; if (!빈기록(상태)) 비상저장(); },
  /** 창을 닫기 전 남은 비상 사본 { 시각, 주소, 기록 } — 없으면 null */
  남은사본() { return 남은사본 ? JSON.parse(JSON.stringify(남은사본)) : null; },
  /** 「처음부터 새로」 — 남은 사본을 버린다 */
  사본버리기() { 남은사본 = null; 빼기('localStorage', 비상열쇠); 비상저장(); },
  /** 비상 사본만 지운다 (이 탭 기록은 그대로) — 다 마치고 PDF 를 받은 뒤, 다음 학생에게 묻지 않게 */
  비상지우기() { 남은사본 = null; 빼기('localStorage', 비상열쇠); 비상꺼둠 = true; },
};
