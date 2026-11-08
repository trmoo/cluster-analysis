/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// 군집 분석 계산 모음 — 화면(DOM)을 쓰지 않으므로 node 시험에서도 그대로 불러 쓴다.
// 점은 언제나 숫자 배열이다. 예) 국어 50, 수학 90 → [50, 90]

/** 유클리디언 거리: 두 점 사이의 직선 거리 = √(Σ(aᵢ − bᵢ)²) */
export function 거리(a, b) {
  let 합 = 0;
  for (let i = 0; i < a.length; i++) 합 += (a[i] - b[i]) ** 2;
  return Math.sqrt(합);
}

/** 맨해튼 거리: 바둑판 길을 따라 걷는 거리 = Σ|aᵢ − bᵢ| (더 나아가기) */
export function 맨해튼(a, b) {
  let 합 = 0;
  for (let i = 0; i < a.length; i++) 합 += Math.abs(a[i] - b[i]);
  return 합;
}

/** 씨앗(seed)이 같으면 언제나 같은 난수가 나오는 생성기 — 시험과 재현을 위해 */
export function 난수(seed = 1) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
/** 정규분포 난수 (박스–뮬러 방법) */
function 정규(rand) {
  const u = Math.max(rand(), 1e-12), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** 점 p 와 가장 가까운 중심점의 번호 */
export function 가까운중심(p, 중심들) {
  let 최고 = 0, 최소 = Infinity;
  중심들.forEach((c, j) => {
    const d = 거리(p, c);
    if (d < 최소 - 1e-12) { 최소 = d; 최고 = j; }
  });
  return 최고;
}

/** k-평균 2단계: 모든 점을 가장 가까운 중심점의 군집으로 묶는다 */
export function 배정(점들, 중심들) {
  return 점들.map(p => 가까운중심(p, 중심들));
}

/** k-평균 3단계: 각 군집의 평균 위치로 중심점을 옮긴다 (빈 군집은 제자리) */
export function 중심갱신(점들, 이름표, 중심들) {
  return 중심들.map((c, j) => {
    const 무리 = 점들.filter((_, i) => 이름표[i] === j);
    if (!무리.length) return c.slice();
    return c.map((_, d) => 무리.reduce((s, p) => s + p[d], 0) / 무리.length);
  });
}

/** SSE(응집도): 각 점과 자기 중심점 사이 거리의 제곱을 모두 더한 값 */
export function 응집도(점들, 이름표, 중심들) {
  let 합 = 0;
  점들.forEach((p, i) => { 합 += 거리(p, 중심들[이름표[i]]) ** 2; });
  return 합;
}

/**
 * k-평균 군집 — 처음 중심점에서 출발해 [배정 → 이동] 을 중심점이 멈출 때까지 반복한다.
 * 돌려주는 값: 이름표(각 점의 군집), 중심, 반복 횟수, 중심점이 지나온 길(기록), 응집도
 */
export function k평균(점들, 처음중심, 최대 = 100) {
  let 중심 = 처음중심.map(c => c.slice());
  const 기록 = [중심];
  let 이름표 = 배정(점들, 중심);
  let 반복 = 0;
  while (반복 < 최대) {
    const 새중심 = 중심갱신(점들, 이름표, 중심);
    const 움직임 = 새중심.some((c, j) => 거리(c, 중심[j]) > 1e-9);
    if (!움직임) break;               // 4단계: 중심점이 더 이상 안 움직이면 끝
    중심 = 새중심; 기록.push(중심); 반복++;
    이름표 = 배정(점들, 중심);
  }
  return { 이름표, 중심, 반복, 기록, 응집도: 응집도(점들, 이름표, 중심) };
}

/** 처음 중심점을 데이터 가운데 k개를 무작위로 골라 정한다 */
export function 무작위중심(점들, k, rand) {
  const 번호 = 점들.map((_, i) => i);
  for (let i = 번호.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [번호[i], 번호[j]] = [번호[j], 번호[i]];
  }
  return 번호.slice(0, k).map(i => 점들[i].slice());
}

/** k-means++ 방식으로 처음 중심점을 서로 멀리 떨어지게 고른다 */
export function 멀리중심(점들, k, rand) {
  const 중심 = [점들[Math.floor(rand() * 점들.length)].slice()];
  while (중심.length < k) {
    const d2 = 점들.map(p => Math.min(...중심.map(c => 거리(p, c) ** 2)));
    const 합 = d2.reduce((a, b) => a + b, 0);
    let r = rand() * 합, i = 0;
    while (i < d2.length - 1 && r > d2[i]) { r -= d2[i]; i++; }
    중심.push(점들[i].slice());
  }
  return 중심;
}

/** 출발점을 여러 번 바꿔 돌린 뒤 응집도가 가장 작은 결과를 고른다 (라이브러리들이 하는 방식) */
export function 최선k평균(점들, k, seed = 7, 횟수 = 10) {
  const rand = 난수(seed);
  let 최고 = null;
  for (let t = 0; t < 횟수; t++) {
    const r = k평균(점들, 멀리중심(점들, k, rand));
    if (!최고 || r.응집도 < 최고.응집도 - 1e-9) 최고 = r;
  }
  return 최고;
}

/**
 * 실루엣 계수 — 점 하나하나마다
 *   a = 같은 군집의 다른 점들과의 평균 거리 (군집 내 유사성)
 *   b = 가장 가까운 다른 군집의 점들과의 평균 거리 (군집 간 상이성)
 *   s = (b − a) / max(a, b)
 */
export function 실루엣(점들, 이름표) {
  const 군집번호 = [...new Set(이름표)];
  return 점들.map((p, i) => {
    const 같은 = 점들.filter((_, j) => j !== i && 이름표[j] === 이름표[i]);
    if (!같은.length || 군집번호.length < 2) return { a: 0, b: null, s: 0, 이웃: -1 };
    const a = 같은.reduce((t, q) => t + 거리(p, q), 0) / 같은.length;
    let b = Infinity, 이웃 = -1;
    for (const c of 군집번호) {
      if (c === 이름표[i]) continue;
      const 남 = 점들.filter((_, j) => 이름표[j] === c);
      const m = 남.reduce((t, q) => t + 거리(p, q), 0) / 남.length;
      if (m < b) { b = m; 이웃 = c; }
    }
    return { a, b, s: (b - a) / Math.max(a, b), 이웃 };
  });
}
/** 실루엣 점수 = 모든 점의 실루엣 계수 평균 */
export function 실루엣점수(점들, 이름표) {
  const 목록 = 실루엣(점들, 이름표);
  return 목록.reduce((t, x) => t + x.s, 0) / 목록.length;
}

/**
 * 계층적 군집 — 가장 가까운 두 군집을 하나씩 차례로 묶는다.
 * 연결 방법: single(단일·가장 가까운 두 점), complete(완전·가장 먼 두 점),
 *            average(평균·모든 짝의 평균), centroid(중심·두 군집 중심 사이)
 * 돌려주는 값: 묶은 차례 [{가, 나, 새번호, 높이, 구성원}]
 */
export function 계층군집(점들, 연결 = 'single') {
  const n = 점들.length;
  let 군집 = 점들.map((_, i) => ({ 번호: i, 구성원: [i] }));
  const 차례 = [];
  let 새번호 = n;
  const 군집거리 = (A, B) => {
    if (연결 === 'centroid') {
      const 중 = M => 점들[0].map((_, d) => M.구성원.reduce((t, i) => t + 점들[i][d], 0) / M.구성원.length);
      return 거리(중(A), 중(B));
    }
    const ds = [];
    for (const i of A.구성원) for (const j of B.구성원) ds.push(거리(점들[i], 점들[j]));
    if (연결 === 'complete') return Math.max(...ds);
    if (연결 === 'average') return ds.reduce((a, b) => a + b, 0) / ds.length;
    return Math.min(...ds);
  };
  while (군집.length > 1) {
    let 최소 = Infinity, 짝 = [0, 1];
    for (let i = 0; i < 군집.length; i++)
      for (let j = i + 1; j < 군집.length; j++) {
        const d = 군집거리(군집[i], 군집[j]);
        if (d < 최소 - 1e-9) { 최소 = d; 짝 = [i, j]; }
      }
    const [A, B] = [군집[짝[0]], 군집[짝[1]]];
    const 새 = { 번호: 새번호++, 구성원: [...A.구성원, ...B.구성원] };
    차례.push({ 가: A.번호, 나: B.번호, 새번호: 새.번호, 높이: 최소, 구성원: 새.구성원.slice() });
    군집 = 군집.filter((_, i) => i !== 짝[0] && i !== 짝[1]).concat([새]);
  }
  return 차례;
}

/** 계층적 군집의 앞 m번 묶음까지만 적용했을 때 각 점의 군집 이름표 (0부터 차례로) */
export function 묶음까지(n, 차례, m) {
  const 부모 = Array.from({ length: n }, (_, i) => i);
  const 찾기 = i => (부모[i] === i ? i : (부모[i] = 찾기(부모[i])));
  for (let t = 0; t < m && t < 차례.length; t++) {
    const [첫, ...나머지] = 차례[t].구성원;
    for (const i of 나머지) 부모[찾기(i)] = 찾기(첫);
  }
  const 대표 = [];
  return Array.from({ length: n }, (_, i) => {
    const r = 찾기(i);
    let k = 대표.indexOf(r);
    if (k < 0) { 대표.push(r); k = 대표.length - 1; }
    return k;
  });
}

/** 덴드로그램에서 잎(점)을 늘어놓을 차례 */
export function 잎차례(n, 차례) {
  if (!차례.length) return [...Array(n).keys()];
  const 자식 = new Map(차례.map(c => [c.새번호, [c.가, c.나]]));
  const 순회 = id => (id < n ? [id] : 자식.get(id).flatMap(순회));
  return 순회(차례.at(-1).새번호);
}

/** 무리 수와 퍼짐을 정해 연습용 덩어리 데이터를 만든다 (값은 0~100) */
const 무리자리 = {
  1: [[50, 50]],
  2: [[30, 35], [70, 68]],
  3: [[25, 28], [75, 30], [50, 76]],
  4: [[26, 26], [74, 26], [26, 74], [74, 74]],
  5: [[20, 22], [80, 22], [50, 50], [20, 80], [80, 80]],
  6: [[18, 24], [50, 18], [82, 26], [18, 74], [50, 82], [82, 74]],
};
export function 덩어리(seed, 무리수 = 3, 퍼짐 = 8, 한무리 = 16) {
  const rand = 난수(seed);
  const 점들 = [], 정답 = [];
  (무리자리[무리수] || 무리자리[3]).forEach(([cx, cy], g) => {
    const x0 = cx + (rand() - 0.5) * 8, y0 = cy + (rand() - 0.5) * 8;
    for (let i = 0; i < 한무리; i++) {
      const x = Math.min(98, Math.max(2, x0 + 정규(rand) * 퍼짐));
      const y = Math.min(98, Math.max(2, y0 + 정규(rand) * 퍼짐));
      점들.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
      정답.push(g);
    }
  });
  return { 점들, 정답 };
}

/** k 를 1~최대 까지 바꿔 가며 응집도(SSE) 를 구한다 — 엘보 방법 */
export function 엘보목록(점들, 최대 = 8, seed = 11) {
  const 목록 = [];
  for (let k = 1; k <= 최대; k++) 목록.push({ k, 응집도: 최선k평균(점들, k, seed + k).응집도 });
  return 목록;
}
/** k 를 2~최대 까지 바꿔 가며 실루엣 점수를 구한다 */
export function 실루엣목록(점들, 최대 = 8, seed = 11) {
  const 목록 = [];
  for (let k = 2; k <= 최대; k++) {
    const r = 최선k평균(점들, k, seed + k);
    목록.push({ k, 점수: 실루엣점수(점들, r.이름표) });
  }
  return 목록;
}

/**
 * 엘보(팔꿈치) 지점 찾기 — 처음과 끝을 잇는 직선에서 가장 멀리 떨어진 k.
 * 그래프를 0~1 로 맞춘 뒤 재므로 축의 단위에 휘둘리지 않는다.
 */
export function 엘보찾기(목록) {
  const 처음 = 목록[0], 끝 = 목록.at(-1);
  const 폭 = 끝.k - 처음.k, 높이 = 처음.응집도 - 끝.응집도 || 1;
  let 최고 = 목록[1].k, 최대 = -1;
  for (const { k, 응집도: e } of 목록.slice(1, -1)) {
    const x = (k - 처음.k) / 폭, y = (e - 끝.응집도) / 높이;
    const d = Math.abs(x + y - 1) / Math.SQRT2;
    if (d > 최대) { 최대 = d; 최고 = k; }
  }
  return 최고;
}

/** 볼록 껍질 (군집을 감싸는 영역을 그릴 때 쓴다) — 단조 사슬 알고리즘 */
export function 볼록껍질(pts) {
  const p = pts.map(q => q.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const 외적 = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const 아래 = [], 위 = [];
  for (const q of p) { while (아래.length >= 2 && 외적(아래.at(-2), 아래.at(-1), q) <= 0) 아래.pop(); 아래.push(q); }
  for (const q of p.slice().reverse()) { while (위.length >= 2 && 외적(위.at(-2), 위.at(-1), q) <= 0) 위.pop(); 위.push(q); }
  return 아래.slice(0, -1).concat(위.slice(0, -1));
}

/** 두 군집 나누기가 얼마나 같은지 — 이름이 달라도 같은 무리면 같다고 본다 (짝 일치율) */
export function 같은정도(가, 나) {
  let 같음 = 0, 전체 = 0;
  for (let i = 0; i < 가.length; i++)
    for (let j = i + 1; j < 가.length; j++) {
      전체++;
      if ((가[i] === 가[j]) === (나[i] === 나[j])) 같음++;
    }
  return 전체 ? 같음 / 전체 : 1;
}
