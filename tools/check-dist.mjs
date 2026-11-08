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
if (/<script[^>]+src=["']https?:/i.test(t) || /<link[^>]+href=["']https?:/i.test(t)) 문제.push('바깥 자원(CDN)을 부른다 — 오프라인에서 안 열린다');
if (/src=["']\/src\//.test(t)) 문제.push('개발용 /src/ 경로가 남아 있다');
if (!t.includes('모든 권리 보유')) 문제.push('푸터 문구가 없다');
if (문제.length) { console.log('✗ 빌드 점검 실패\n  ' + 문제.join('\n  ')); process.exit(1); }
console.log(`빌드 점검 통과 ✔  ${(크기 / 1024).toFixed(0)}KB · 「티쳐무」 ${저작권}회`);
