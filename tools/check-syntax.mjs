/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 소스 전수 점검 — 시험(test)이 화면 파일(DOM)을 부르지 않으므로 문법과 규칙을 여기서 본다.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const 파일 = [];
(function 훑기(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) 훑기(p);
    else if (/\.(js|mjs)$/.test(f)) 파일.push(p);
  }
})('src');
let 문제 = 0;
const 탓 = (f, 글) => { 문제++; console.log(`✗ ${f}: ${글}`); };
for (const f of 파일) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { 탓(f, '문법 오류\n' + e.stderr.toString()); }
  const t = readFileSync(f, 'utf8');
  if (!t.startsWith('/*!') || !t.slice(0, 200).includes('티쳐무')) 탓(f, '머리 저작권 주석(/*! … 티쳐무)이 없다');
  if (/\b(alert|confirm|prompt)\s*\(/.test(t.replace(/\/\/.*$/gm, ''))) 탓(f, '브라우저 기본 대화상자 금지 — ui.js 의 대화상자() 를 쓸 것');
  if (f.includes('tabs')) {
    if (/\.replaceChildren\(/.test(t)) 탓(f, 'replaceChildren 대신 채우기() — null 이 「null」 글자로 찍힌다');
    if (/\bsetInterval\(/.test(t)) 탓(f, 'setInterval 대신 수명.interval() — 화면을 떠나도 타이머가 남는다');
    if (/addEventListener\(\s*['"]resize/.test(t)) 탓(f, 'resize 는 main.js 에서만');
    if (/[을은이과와]\([를는가와과]\)/.test(t)) 탓(f, '「을(를)」 같은 겹 조사 금지');
  }
}
for (const f of ['index.html', 'vite.config.js', 'LICENSE', 'README.md']) {
  try { if (!readFileSync(f, 'utf8').includes('티쳐무')) 탓(f, '저작권 표시가 없다'); } catch { 탓(f, '파일이 없다'); }
}
if (JSON.parse(readFileSync('package.json', 'utf8')).license !== 'UNLICENSED') 탓('package.json', 'license 는 UNLICENSED');
console.log(문제 ? `\n문제 ${문제}개` : `소스 ${파일.length}개 점검 통과 ✔`);
process.exit(문제 ? 1 : 0);
