/*! 군집 분석 실험실 — © 2026 티쳐무 · 모든 권리 보유 */
// three.js 로 그리는 3차원 좌표판 — 점(학생)·중심점(◆)·중심점이 지나온 길·바닥 그림자를 그리고,
// 마우스로 끌어 돌려 보거나 「위에서·앞에서·옆에서」 보기로 카메라를 옮긴다.
//
// 축 배치 (세 과목 점수 0~100 을 -5 ~ +5 로 줄여 놓는다)
//   x(가로)  = 수학       → 오른쪽으로 갈수록 높다
//   y(위)    = 국어       → 위로 갈수록 높다
//   z(깊이)  = 정보       → 안쪽(-z)으로 갈수록 높다  ※ 위에서 내려다보면 정보가 화면 위쪽이 되게
// 그래서 「위에서 보기」 = 바닥(수학·정보)만 보는 것, 국어 축이 눈앞에서 사라진다.
// 축 이름에는 화살표를 달지 않는다 — 돌리면 화면 속 방향이 바뀌므로 눈금(0·50·100)으로 방향을 읽게 한다.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const 축 = v => (v - 50) / 10;          // 점수 → 장면 좌표
/** 점수 [국어, 수학, 정보] → 장면 좌표 (x=수학, y=국어, z=-정보) */
export const 장면좌표 = p => new THREE.Vector3(축(p[1]), 축(p[0]), -축(p[2]));

const 거리 = 22;
export const 보기들 = {
  비스듬히: { 위치: [13, 9, 15], 글: '🔄 비스듬히', 확대: 0.66 },   // 비스듬히 보면 상자가 더 넓게 퍼져 조금 물러선다
  위: { 위치: [0, 거리, 0.001], 글: '⬇ 위에서 (수학·정보)' },
  앞: { 위치: [0, 0, 거리], 글: '➡ 앞에서 (수학·국어)' },
  옆: { 위치: [거리, 0, 0], 글: '⬅ 옆에서 (정보·국어)' },
};

/** 글자를 그린 작은 그림(스프라이트) — 축 이름·눈금 */
function 글자(글, { 크기 = 0.9, 색 = '#3b4652', 굵게 = true } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const 글꼴 = `${굵게 ? 800 : 600} 64px "NanumSquareRound", "Malgun Gothic", sans-serif`;
  g.font = 글꼴;
  const 너비 = Math.ceil(g.measureText(글).width) + 24;
  c.width = 너비; c.height = 88;
  g.font = 글꼴; g.fillStyle = 색; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillText(글, 너비 / 2, 46);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(크기 * 너비 / 88, 크기, 1);
  s.renderOrder = 10;
  return s;
}

/**
 * 3차원 판을 만들어 el 에 붙인다. 카드를 떠나면 수명이 끝내며 GPU 자원까지 돌려준다.
 * 돌려주는 것: 점그리기 · 중심그리기 · 고른점그리기 · 보기 · 그림자 · 사진 · 지금보기 · 돌렸나
 */
export function 삼차원판(el, 수명, { w = 560, h = 540, 축이름 = ['국어', '수학', '정보'], 점누름 } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  } catch {
    el.append(Object.assign(document.createElement('div'), { className: 'fb bad', textContent: '이 컴퓨터의 브라우저가 3차원 그래픽(WebGL)을 지원하지 않아요. 다른 브라우저(크롬·엣지)로 열어 보세요.' }));
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.domElement.className = 'three-canvas';
  el.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#fbfdfc');
  // 원근이 없는 정사영 카메라 — 「위에서 보기」 가 정말로 수학·정보 두 축만 남긴 평면 그림이 된다
  // (원근 카메라는 가까운 점이 크고 바깥으로 밀려 보여, 겹친 두 무리가 갈라져 보이는 착시가 생겼다)
  const 반높이 = 7.6;
  const camera = new THREE.OrthographicCamera(-반높이 * w / h, 반높이 * w / h, 반높이, -반높이, 0.1, 200);
  camera.position.set(...보기들.위.위치);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;        // 손을 떼면 금방 멈추게
  controls.enablePan = false;
  controls.minZoom = 0.6; controls.maxZoom = 2.5;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8b0, 2.2));
  const 해 = new THREE.DirectionalLight(0xffffff, 1.5);
  해.position.set(8, 14, 6);
  scene.add(해);

  // ── 틀: 0~100 상자의 모서리 · 바닥(수학·정보) 격자 · 축 이름 · 눈금 ──
  const 틀 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10, 10, 10)), new THREE.LineBasicMaterial({ color: 0xb9c6cf }));
  scene.add(틀);
  const 격자 = new THREE.GridHelper(10, 10, 0xc9d4db, 0xe3e9ed);
  격자.position.y = -5;
  scene.add(격자);
  // 축 이름과 눈금(0·50·100)은 축마다 한 묶음 — 그 축을 정면으로 바라볼 때는(점 하나로 겹쳐 보일 때) 숨긴다
  const [국어, 수학, 정보] = 축이름;
  const 축묶음 = { x: new THREE.Group(), y: new THREE.Group(), z: new THREE.Group() };
  Object.values(축묶음).forEach(g => scene.add(g));
  const 붙이기 = (g, s, x, y, z) => { s.position.set(x, y, z); g.add(s); };
  붙이기(축묶음.x, 글자(수학, { 크기: 0.95, 색: '#1f6f5c' }), 2.5, -6.0, 6.5);
  붙이기(축묶음.z, 글자(정보, { 크기: 0.95, 색: '#1f6f5c' }), 6.5, -6.0, -2.5);   // 눈금 0·50·100 사이에 두어 겹치지 않게
  붙이기(축묶음.y, 글자(국어, { 크기: 0.95, 색: '#1f6f5c' }), -6.5, 2.5, 6.0);
  for (const v of [0, 50, 100]) {
    const 눈금 = () => 글자(String(v), { 크기: 0.55, 색: '#8a96a0', 굵게: false });
    붙이기(축묶음.x, 눈금(), 축(v), -5.6, 5.6);
    붙이기(축묶음.z, 눈금(), 5.6, -5.6, -축(v));
    붙이기(축묶음.y, 눈금(), -5.6, 축(v), 5.6);
  }
  const 축방향 = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
  const 시선 = new THREE.Vector3();

  // ── 점 · 그림자 · 중심점 · 지나온 길 · 고른 점의 거리선을 담을 묶음 ──
  const 점묶음 = new THREE.Group(), 그림자묶음 = new THREE.Group(), 중심묶음 = new THREE.Group(), 길묶음 = new THREE.Group(), 선묶음 = new THREE.Group();
  scene.add(점묶음, 그림자묶음, 중심묶음, 길묶음, 선묶음);
  const 공 = new THREE.SphereGeometry(0.24, 22, 16);
  const 마름모 = new THREE.OctahedronGeometry(0.5);
  const 그림자점 = new THREE.CircleGeometry(0.16, 18);
  let 점메시 = [];

  /** 묶음 안의 것들을 걷어 내고 GPU 자원도 돌려준다 (공용 도형은 남긴다) */
  function 비우기(g) {
    for (const o of [...g.children]) {
      g.remove(o);
      o.traverse(x => {
        if (x.geometry && ![공, 마름모, 그림자점].includes(x.geometry)) x.geometry.dispose();
        if (x.material) { x.material.map?.dispose(); x.material.dispose(); }
      });
    }
  }

  function 점그리기(점들, 색들) {
    비우기(점묶음); 비우기(그림자묶음);
    점메시 = 점들.map((p, i) => {
      const m = new THREE.Mesh(공, new THREE.MeshStandardMaterial({ color: 색들[i], roughness: 0.45, metalness: 0.05 }));
      m.position.copy(장면좌표(p));
      m.userData.번호 = i;
      점묶음.add(m);
      // 바닥(수학·정보 평면)으로 떨어뜨린 그림자 — 위에서 보면 학생들이 이렇게 보인다
      const 바닥 = m.position.clone(); 바닥.y = -4.98;
      const 줄 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([m.position, 바닥]), new THREE.LineBasicMaterial({ color: 색들[i], transparent: true, opacity: 0.35 }));
      const 점자국 = new THREE.Mesh(그림자점, new THREE.MeshBasicMaterial({ color: 색들[i], transparent: true, opacity: 0.55 }));
      점자국.rotation.x = -Math.PI / 2; 점자국.position.copy(바닥);
      그림자묶음.add(줄, 점자국);
      return m;
    });
  }

  // 중심점은 한 단계 넘어갈 때 미끄러지듯 옮긴다(목표 위치로 조금씩 다가감)
  let 중심메시 = [];
  function 중심그리기(중심들, 색들, 지나온 = []) {
    if (중심메시.length !== 중심들.length) {
      비우기(중심묶음);
      중심메시 = 중심들.map(() => {
        const m = new THREE.Mesh(마름모, new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.1, emissive: 0x111111 }));
        const 테 = new THREE.LineSegments(new THREE.EdgesGeometry(마름모), new THREE.LineBasicMaterial({ color: 0x1b2730 }));
        m.add(테);
        중심묶음.add(m);
        return m;
      });
      중심들.forEach((c, j) => 중심메시[j].position.copy(장면좌표(c)));
    }
    중심들.forEach((c, j) => { 중심메시[j].userData.목표 = 장면좌표(c); 중심메시[j].material.color.set(색들[j]); });
    // 지나온 길 — 단계마다의 중심점 위치를 잇는다
    비우기(길묶음);
    for (let j = 0; j < 중심들.length; j++) {
      if (지나온.length < 2) continue;
      const 길 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(지나온.map(t => 장면좌표(t[j]))), new THREE.LineBasicMaterial({ color: 색들[j], transparent: true, opacity: 0.85 }));
      길묶음.add(길);
      지나온.slice(0, -1).forEach(t => {
        const 흔적 = new THREE.Mesh(마름모, new THREE.MeshBasicMaterial({ color: 색들[j], transparent: true, opacity: 0.25 }));
        흔적.scale.setScalar(0.5); 흔적.position.copy(장면좌표(t[j]));
        길묶음.add(흔적);
      });
    }
  }

  /** 고른 점에서 각 중심점까지 선을 긋는다 (가장 가까운 것만 굵고 진하게) */
  function 고른점그리기(번호, 중심들, 색들, 가장가까운) {
    비우기(선묶음);
    점메시.forEach((m, i) => m.scale.setScalar(i === 번호 ? 1.7 : 1));
    if (번호 == null) return;
    const a = 점메시[번호].position;
    중심들.forEach((c, j) => {
      const 진하게 = j === 가장가까운;
      const 줄 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, 장면좌표(c)]),
        new THREE.LineBasicMaterial({ color: 색들[j], transparent: true, opacity: 진하게 ? 1 : 0.4 }));
      선묶음.add(줄);
    });
  }

  // ── 카메라 옮기기(보기 단추) ──
  let 이동 = null, 지금 = '위', 돌림 = false;
  function 보기(이름) {
    const 끝 = new THREE.Vector3(...보기들[이름].위치);
    이동 = { 처음: camera.position.clone(), 끝, t: 0, 처음확대: camera.zoom, 끝확대: 보기들[이름].확대 ?? 1 };
    지금 = 이름;
  }
  // 사람이 직접 끌어 돌렸는가 — 「돌려 보세요」 활동을 확인할 때 쓴다
  let 누른곳 = null;
  const 눌림 = e => { 누른곳 = [e.clientX, e.clientY]; };
  const 뗌 = e => {
    if (!누른곳) return;
    // 위에서 보다가 처음 돌리면 상자 모서리가 잘리지 않게 한 걸음 물러선다
    if (camera.zoom > 0.7 && Math.hypot(e.clientX - 누른곳[0], e.clientY - 누른곳[1]) > 6 && !돌림) { camera.zoom = 0.7; camera.updateProjectionMatrix(); }
    const 움직임 = Math.hypot(e.clientX - 누른곳[0], e.clientY - 누른곳[1]);
    누른곳 = null;
    if (움직임 > 6) { 돌림 = true; 지금 = '직접'; return; }
    // 거의 안 움직였으면 「누름」 — 광선을 쏘아 맞은 점을 찾는다
    const r = renderer.domElement.getBoundingClientRect();       // 무대가 CSS 로 줄어 있어도 실제 크기로 잰다
    const 마우스 = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const 광선 = new THREE.Raycaster();
    광선.setFromCamera(마우스, camera);
    const 맞음 = 광선.intersectObjects(점메시, false)[0];
    점누름?.(맞음 ? 맞음.object.userData.번호 : null);
  };
  수명.on(renderer.domElement, 'pointerdown', 눌림);
  수명.on(renderer.domElement, 'pointerup', 뗌);

  // ── 그리기 반복 ──
  let 틀번호 = 0, 지난시각 = performance.now();
  function 한틀(시각) {
    const dt = Math.min(0.05, (시각 - 지난시각) / 1000); 지난시각 = 시각;
    if (이동) {
      이동.t = Math.min(1, 이동.t + dt / 0.7);
      const e = 1 - (1 - 이동.t) ** 3;                 // 끝에서 천천히 멈추게
      camera.position.lerpVectors(이동.처음, 이동.끝, e);
      camera.zoom = 이동.처음확대 + (이동.끝확대 - 이동.처음확대) * e;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);
      if (이동.t >= 1) { 이동 = null; controls.update(); }
    } else controls.update();
    for (const m of 중심메시) if (m.userData.목표) m.position.lerp(m.userData.목표, Math.min(1, dt * 7));
    camera.getWorldDirection(시선);
    for (const a of ['x', 'y', 'z']) 축묶음[a].visible = Math.abs(시선.dot(축방향[a])) < 0.93;
    renderer.render(scene, camera);
    틀번호 = requestAnimationFrame(한틀);
  }
  틀번호 = requestAnimationFrame(한틀);

  수명.치우기(() => {
    cancelAnimationFrame(틀번호);
    controls.dispose();
    [점묶음, 그림자묶음, 중심묶음, 길묶음, 선묶음].forEach(비우기);
    scene.traverse(x => { x.geometry?.dispose(); if (x.material) { x.material.map?.dispose(); x.material.dispose(); } });
    [공, 마름모, 그림자점].forEach(g => g.dispose());
    renderer.dispose();
    renderer.forceContextLoss();          // 카드를 오가도 WebGL 맥락이 쌓이지 않게
  });

  return {
    점그리기, 중심그리기, 고른점그리기, 보기,
    그림자(켬) { 그림자묶음.visible = 켬; },
    사진(너비 = 360) {                      // PDF 에 담을 지금 모습 (JPEG)
      renderer.render(scene, camera);
      const c = document.createElement('canvas');
      c.width = 너비; c.height = Math.round(너비 * h / w);
      c.getContext('2d').drawImage(renderer.domElement, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.85);
    },
    get 지금보기() { return 지금; },
    get 돌렸나() { return 돌림; },
  };
}
