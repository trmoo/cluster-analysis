/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 「다음 시간에 이어하기」 — 수업이 도중에 끝나면 지금까지의 활동 기록을 담은 HTML 파일을 내려받는다.
// 받은 파일은 이 앱 그대로(한 파일)에 기록만 <script type="application/json"> 으로 끼워 넣은 것이라,
// 다음 시간에 더블클릭해 열면 「이어서 할까요?」 를 묻고 기록을 되살린다. 서버로 보내는 것은 없다.
import { h, 대화상자 } from './ui.js';
import { 기록 } from './store.js';

const 표지 = 'cluster-saved';                 // 끼워 넣는 기록 상자의 id
const 불러옴열쇠 = 'cluster-lab:resumed';      // 같은 파일을 새로 고칠 때마다 다시 묻지 않게

// 앱이 화면을 그리기 전에 원래 HTML 을 떠 둔다 — 그려진 화면이 아니라 처음 받은 파일 그대로를 저장해야 한다
const 원본 = (() => {
  const 사본 = document.documentElement.cloneNode(true);
  사본.querySelector('#' + 표지)?.remove();
  사본.querySelector('#stage')?.replaceChildren();
  return '<!doctype html>\n' + 사본.outerHTML;
})();

/** 끼워 넣을 기록 — `<` 를 바꿔 적어 기록 속 글자가 </script> 로 상자를 닫지 못하게 한다 */
function 기록상자(자료) {
  const 글 = JSON.stringify(자료).replace(/</g, '\\u003c');
  return `<script type="application/json" id="${표지}">${글}</script>`;
}

const 두자리 = n => String(n).padStart(2, '0');

/** 지금까지의 기록을 담은 HTML 파일을 내려받는다 */
export function 이어하기저장(주소) {
  const 지금 = new Date();
  const 자료 = { 저장시각: 지금.toISOString(), 주소, 기록: 기록.전부() };
  // ⚠ 첫 번째 머리 닫는 태그를 찾으면 안 된다 — 앱 스크립트(이 코드 자체)가 head 안에 통째로 들어 있어
  //    그 글자가 스크립트 속에서 먼저 걸린다(실제로 스크립트가 잘려 화면에 코드가 찍혔다). 맨 끝의 body 닫는 태그 앞에 넣는다.
  const 끝 = 원본.lastIndexOf('</body>');
  const 글 = 원본.slice(0, 끝) + 기록상자(자료) + '\n' + 원본.slice(끝);
  const 이름 = `군집분석실험실_이어하기_${두자리(지금.getMonth() + 1)}${두자리(지금.getDate())}_${두자리(지금.getHours())}${두자리(지금.getMinutes())}.html`;
  const 주소글 = URL.createObjectURL(new Blob([글], { type: 'text/html;charset=utf-8' }));
  const a = h('a', { href: 주소글, download: 이름 });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(주소글), 10000);
  const 끝낸수 = Object.keys(기록.get('완료', {}) || {}).length;
  대화상자('💾 이어하기 파일을 내려받았어요',
    h('div', { html:
      `<b>${이름}</b><br>지금까지 한 활동 <b>${끝낸수}개</b>의 기록이 담겨 있어요.<br><br>` +
      '📁 내려받기 폴더에서 이 파일을 <b>USB · 구글 드라이브 · 메일</b> 등에 옮겨 두세요.<br>' +
      '▶ 다음 시간에 이 파일을 <b>더블클릭</b>해 열면 지금 화면부터 이어서 할 수 있어요.' }));
}

/** 받은 파일을 열었을 때 — 기록이 들어 있으면 이어서 할지 묻는다. 이어서 하면 되돌아갈(주소) 을 넘겨준다 */
export function 이어하기확인(되돌아가기) {
  const 상자 = document.getElementById(표지);
  if (!상자) return;
  let 자료;
  try { 자료 = JSON.parse(상자.textContent); } catch { return; }
  if (!자료?.기록) return;
  let 이미 = null;
  try { 이미 = sessionStorage.getItem(불러옴열쇠); } catch { /* 무시 */ }
  if (이미 === 자료.저장시각) return;   // 이 창에서 이미 답했다
  const 표시 = () => { try { sessionStorage.setItem(불러옴열쇠, 자료.저장시각); } catch { /* 무시 */ } };
  const 때 = new Date(자료.저장시각);
  const 끝낸수 = Object.keys(자료.기록.완료 || {}).length;
  대화상자('📂 지난 시간의 활동 기록이 있어요',
    h('div', { html: `${때.getMonth() + 1}월 ${때.getDate()}일 ${두자리(때.getHours())}:${두자리(때.getMinutes())} 에 저장한 기록이에요 (끝낸 활동 <b>${끝낸수}개</b>).<br>이어서 할까요?` }),
    [
      { 글: '처음부터 새로', 할일: 표시 },
      { 글: '▶ 이어서 하기', 주: true, 할일: () => { 표시(); 기록.불러오기(자료.기록); 되돌아가기(자료.주소); } },
    ]);
}
