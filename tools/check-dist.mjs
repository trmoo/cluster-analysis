/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 빌드 결과 점검 — 크기 · 저작권 표시 · 바깥 자원 · 실제로 화면이 그려지는가
import { readFileSync, statSync } from 'node:fs';
const 경로 = 'dist/index.html';
const t = readFileSync(경로, 'utf8');
const 크기 = statSync(경로).size;
const 문제 = [];
if (크기 < 200_000) 문제.push(`크기가 너무 작다(${크기}바이트) — 개발용 껍데기가 아닌가?`);
const 저작권 = (t.match(/티쳐무/g) || []).length;
if (저작권 < 3) 문제.push(`「티쳐무」 가 ${저작권}번뿐 — HTML 주석·/*! 배너·푸터가 남아야 한다`);
// ⚠ 배너는 둘째 줄까지 함께 본다 — 첫 줄은 CSS·HTML 머리 주석과 겹쳐, Vite 8 이 스크립트 배너를 지워도 통과했다(2026-11-09 postBanner 로 고침)
const 배너 = "/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유\n * 학교 수업 목적으로만 이용해 주세요. 무단 배포·상업적 이용을 금합니다. */";
if (!t.includes(배너)) 문제.push('스크립트 /*! 배너가 지워졌다 — vite.config.js 의 output.postBanner 를 볼 것(Vite 8 은 banner 를 압축에서 지운다)');
if (/<script[^>]+src=["']https?:/i.test(t) || /<link[^>]+href=["']https?:/i.test(t)) 문제.push('바깥 자원(CDN)을 부른다 — 오프라인에서 안 열린다');
if (/src=["']\/src\//.test(t)) 문제.push('개발용 /src/ 경로가 남아 있다');
if (!t.includes('모든 권리 보유')) 문제.push('푸터 문구가 없다');
if (문제.length) { console.log('✗ 빌드 점검 실패\n  ' + 문제.join('\n  ')); process.exit(1); }
console.log(`빌드 점검 통과 ✔  ${(크기 / 1024).toFixed(0)}KB · 「티쳐무」 ${저작권}회`);
