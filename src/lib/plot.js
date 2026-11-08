/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// SVG 좌표판(산점도·꺾은선 그래프) 도구 — 그래프 라이브러리 없이 직접 그린다.
import { s } from './ui.js';
import { 볼록껍질 } from './cluster.js';

/** 군집 색 (군집 1, 2, 3 …) */
export const 색 = ['#e4572e', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#c0392b', '#34495e'];
export const 회색 = '#9aa5b1';

/** 눈금 목록 만들기 */
function 눈금들(범위, 간격) {
  const 목록 = [];
  const 시작 = Math.ceil(범위[0] / 간격 - 1e-9) * 간격;
  for (let v = 시작; v <= 범위[1] + 1e-9; v += 간격) 목록.push(Math.round(v * 1e6) / 1e6);
  return 목록;
}

/**
 * 좌표판 만들기.
 * 돌려준 sx, sy 로 데이터 값을 화면 좌표로 바꾸고, 데이터좌표(e) 로 마우스 위치를 데이터 값으로 바꾼다.
 */
export function 좌표판(opt = {}) {
  const {
    w = 520, h = 480, x = [0, 100], y = [0, 100], pad = { l: 54, r: 16, t: 26, b: 46 },
    x간격 = 10, y간격 = 10, x이름 = '', y이름 = '', x글 = v => v, y글 = v => v, 격자 = true,
  } = opt;
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const sx = v => pad.l + ((v - x[0]) / (x[1] - x[0])) * iw;
  const sy = v => pad.t + ih - ((v - y[0]) / (y[1] - y[0])) * ih;
  const svg = s('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: 'plot' });
  const g = { 격자: s('g'), 아래: s('g'), 가운데: s('g'), 위: s('g'), 맨위: s('g') };

  svg.append(s('rect', { x: pad.l, y: pad.t, width: iw, height: ih, fill: '#fff', stroke: '#cfd6dd' }));
  for (const v of 눈금들(x, x간격)) {
    if (격자) g.격자.append(s('line', { x1: sx(v), x2: sx(v), y1: pad.t, y2: pad.t + ih, class: 'grid' }));
    g.격자.append(s('text', { x: sx(v), y: pad.t + ih + 20, class: 'tick', 'text-anchor': 'middle' }, x글(v)));
  }
  for (const v of 눈금들(y, y간격)) {
    if (격자) g.격자.append(s('line', { y1: sy(v), y2: sy(v), x1: pad.l, x2: pad.l + iw, class: 'grid' }));
    g.격자.append(s('text', { x: pad.l - 8, y: sy(v) + 5, class: 'tick', 'text-anchor': 'end' }, y글(v)));
  }
  if (x이름) g.격자.append(s('text', { x: pad.l + iw, y: h - 4, class: 'axis-name', 'text-anchor': 'end' }, x이름));
  if (y이름) g.격자.append(s('text', { x: 4, y: 15, class: 'axis-name' }, y이름));
  svg.append(g.격자, g.아래, g.가운데, g.위, g.맨위);

  const 데이터좌표 = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {
      x: x[0] + ((p.x - pad.l) / iw) * (x[1] - x[0]),
      y: y[0] + ((pad.t + ih - p.y) / ih) * (y[1] - y[0]),
      안: p.x >= pad.l && p.x <= pad.l + iw && p.y >= pad.t && p.y <= pad.t + ih,
    };
  };
  const 비우기 = (...이름) => 이름.forEach(n => g[n].replaceChildren());
  return { svg, sx, sy, g, 데이터좌표, 비우기, w, h, pad, iw, ih, x범위: x, y범위: y };
}

/** 점 하나 (동그라미 + 번호 글자) */
export function 점(판, x, y, { r = 10, fill = 회색, stroke = '#fff', 글, 글색 = '#fff', 굵기 = 2, cls = '' } = {}) {
  const g = s('g', { class: 'pt ' + cls, transform: `translate(${판.sx(x)},${판.sy(y)})` });
  g.append(s('circle', { r, fill, stroke, 'stroke-width': 굵기 }));
  if (글 != null) g.append(s('text', { class: 'pt-label', 'text-anchor': 'middle', y: r > 9 ? 5 : 4, fill: 글색, 'font-size': r > 9 ? 13 : 10 }, 글));
  return g;
}
/** 마름모 (중심점) */
export function 중심점(판, x, y, { fill = '#d32f2f', 빈 = false, 크기 = 13, 글 } = {}) {
  const g = s('g', { class: 'center', transform: `translate(${판.sx(x)},${판.sy(y)})` });
  g.append(s('path', {
    d: `M0,${-크기} L${크기},0 L0,${크기} L${-크기},0Z`,
    fill: 빈 ? '#fff' : fill, stroke: 빈 ? fill : '#fff', 'stroke-width': 빈 ? 2.5 : 2,
  }));
  if (글 != null) g.append(s('text', { class: 'pt-label', 'text-anchor': 'middle', y: 5, fill: '#fff', 'font-size': 12 }, 글));
  return g;
}
export function 옮기기(el, 판, x, y) { el.setAttribute('transform', `translate(${판.sx(x)},${판.sy(y)})`); }

/** 군집을 감싸는 둥근 영역 (교과서 그림의 색 타원처럼) */
export function 군집영역(판, 점목록, 채움, 두께 = 34) {
  if (!점목록.length) return s('g');
  if (점목록.length === 1) return s('circle', { cx: 판.sx(점목록[0][0]), cy: 판.sy(점목록[0][1]), r: 두께 / 2 + 4, fill: 채움, opacity: 0.22, class: 'hull' });
  const 껍질 = 볼록껍질(점목록).map(([x, y]) => `${판.sx(x)},${판.sy(y)}`).join(' ');
  return s('polygon', {
    points: 껍질, fill: 채움, stroke: 채움, 'stroke-width': 두께, 'stroke-linejoin': 'round',
    opacity: 0.22, class: 'hull',
  });
}

/** 선분 */
export function 선(판, a, b, { 색: c = '#555', 굵기 = 2, 점선 = false, cls = '' } = {}) {
  return s('line', {
    x1: 판.sx(a[0]), y1: 판.sy(a[1]), x2: 판.sx(b[0]), y2: 판.sy(b[1]),
    stroke: c, 'stroke-width': 굵기, 'stroke-dasharray': 점선 ? '6 5' : null, class: cls,
  });
}

/**
 * 꺾은선 그래프 (k 에 따른 응집도·실루엣 점수)
 * 목록: [{x, y}], 고른값: 강조할 x, 눌렀을 때 onPick(x)
 */
export function 꺾은선(판, 목록, { 색: c = '#2e86de', 고른값, 표시 = [], onPick, 값글 } = {}) {
  const g = s('g');
  const d = 목록.map((p, i) => `${i ? 'L' : 'M'}${판.sx(p.x)},${판.sy(p.y)}`).join(' ');
  g.append(s('path', { d, fill: 'none', stroke: c, 'stroke-width': 3 }));
  for (const p of 목록) {
    const 강조 = p.x === 고른값;
    const 표 = 표시.find(t => t.x === p.x);
    const 점g = s('g', { class: onPick ? 'pick-pt' : '', transform: `translate(${판.sx(p.x)},${판.sy(p.y)})` });
    if (표) 점g.append(s('circle', { r: 17, fill: 'none', stroke: 표.색, 'stroke-width': 3, 'stroke-dasharray': 표.점선 ? '4 3' : null }));
    점g.append(s('circle', { r: 강조 ? 10 : 7, fill: 강조 ? '#d32f2f' : c, stroke: '#fff', 'stroke-width': 2 }));
    if (값글) 점g.append(s('text', { y: -14, 'text-anchor': 'middle', class: 'val' }, 값글(p.y)));
    if (onPick) {
      점g.append(s('circle', { r: 20, fill: 'transparent' }));
      점g.addEventListener('click', () => onPick(p.x));
    }
    g.append(점g);
  }
  return g;
}

/** 눈금이 보기 좋게 떨어지도록 축의 최댓값과 간격을 정한다 (예: 50258 → 최대 60000, 간격 10000) */
export function 보기좋은축(값, 개수 = 5) {
  const 날 = 값 / 개수;
  const 자리 = 10 ** Math.floor(Math.log10(날));
  const 간격 = [1, 2, 2.5, 5, 10].map(m => m * 자리).find(s => s >= 날);
  return { 최대: Math.ceil(값 / 간격) * 간격, 간격 };
}
