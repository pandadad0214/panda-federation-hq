import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

const QS = new URLSearchParams(location.search);

// ---------- team ----------
const TEAM = [ // colors + looks follow each bot's own profile picture
  { id: 'overlord', name: 'Overlord Boss', short: 'Overlord', color: '#6a3c9c', dept: 'Leadership', acc: 'club' },
  { id: 'moneybot', name: 'Moneybot', short: 'Moneybot', color: '#2fbf4a', dept: 'Money Lab', acc: 'coin' },
  { id: 'stockbot', name: 'Stockbot', short: 'Stockbot', color: '#d6dbe2', dept: 'Money Lab', acc: 'tablet' },
  { id: 'superseller', name: 'Superseller Mini', short: 'Superseller', color: '#3a6fc4', dept: 'Sales', acc: 'box' },
  { id: 'ledger', name: 'Family Ledger', short: 'Ledger', color: '#2f7a5a', dept: 'Family Finance', acc: 'book' },
  { id: 'shadow', name: 'Gatewalkers Shadow', short: 'Shadow', color: '#3f6fd0', dept: 'School', acc: 'backpack' },
  { id: 'eraser', name: 'Eraser', short: 'Eraser', color: '#cfe3ff', dept: 'Identity Security', acc: 'eraser' },
  { id: 'kimchi', name: 'Kimchi', short: 'Kimchi', color: '#a08a3a', dept: 'Identity Security', acc: 'none' },
  { id: 'scribe', name: 'Soulrot Scribe', short: 'Scribe', color: '#d9a640', dept: "Writers' Den", acc: 'portal' },
  { id: 'planner', name: 'Family Planner', short: 'Planner', color: '#c2346b', dept: 'Front Desk', acc: 'planner' },
];
// per-bot outfit: vertex colors by body part (head, torso, chest front, arms, hands, legs) + eye style
const LOOKS = {
  overlord: { head: '#c9956f', torso: '#5b2d8a', chest: '#c9956f', arms: '#5b2d8a', hands: '#c9956f', legs: '#4a2a6e', eyes: 'dot' },
  moneybot: { head: '#2f7d44', torso: '#245e34', chest: '#14301f', arms: '#2f8a4c', hands: '#1a3d27', legs: '#1a3d27', eyes: 'glow', eyeColor: '#7dff6a' },
  stockbot: { head: '#eef1f4', torso: '#e8ebef', chest: '#1e2530', arms: '#b8bec7', hands: '#59616d', legs: '#4a5058', eyes: 'glow', eyeColor: '#5ff3ff' },
  superseller: { head: '#e6b994', torso: '#3d424b', chest: '#f1f1f1', arms: '#3d424b', hands: '#e6b994', legs: '#353a42', eyes: 'dot' },
  ledger: { head: '#e8c4a0', torso: '#2f6e55', chest: '#efe6cf', arms: '#2f6e55', hands: '#e8c4a0', legs: '#1f4a3a', eyes: 'dot' },
  shadow: { head: '#f3d1b0', torso: '#8a5a36', chest: '#8a5a36', arms: '#8a5a36', hands: '#d23a3a', legs: '#3b5fa8', eyes: 'googly' },
  eraser: { head: '#f7fbff', torso: '#eef5ff', chest: '#ffffff', arms: '#eef5ff', hands: '#f7fbff', legs: '#d6e6fb', eyes: 'dot' },
  kimchi: { head: '#9a8233', torso: '#8f782e', chest: '#9a8233', arms: '#8f782e', hands: '#7d6828', legs: '#7d6828', eyes: 'googly' },
  scribe: { head: '#1c2036', torso: '#232842', chest: '#1a1e33', arms: '#232842', hands: '#2e3352', legs: '#1a1e33', eyes: 'glow', eyeColor: '#ffc65a' },
  planner: { head: '#f2c7a8', torso: '#c2346b', chest: '#f3e9d8', arms: '#c2346b', hands: '#f2c7a8', legs: '#3b2f3a', eyes: 'dot' },
};

// desk chair spots (bot faces +z, desk in front of it)
const DESKS = {
  overlord: [-16, -9.1], moneybot: [-9.5, -9.1], stockbot: [-5.5, -9.1], superseller: [-0.2, -9.1], ledger: [6, -9.1],
  shadow: [-16.5, 6.0], eraser: [-10.5, 6.0], kimchi: [-6.5, 6.0], scribe: [-1, 6.0],
  planner: [-18.2, -1.6], // front desk just outside Leadership, facing into the hall
};
// lounge: U-shaped sofas. [x, z, facing]
const SEATS = [[3.69, 5.3, 0], [5.11, 5.3, 0], [6.64, 5.3, 0], [8.06, 5.3, 0], [9.59, 5.3, 0], [11.01, 5.3, 0],
  [3.3, 8.1, Math.PI / 2], [11.1, 7.5, -Math.PI / 2, 1], [3.3, 9.5, Math.PI / 2], [11.1, 8.7, -Math.PI / 2, 1]];
const TRAY = [-14.4, -7.0];
const KIT = 2.4; // Kenney furniture kit scale

// ---------- renderer / scene ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(window.devicePixelRatio); // never lower than the screen
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const labels = new CSS2DRenderer();
labels.setSize(innerWidth, innerHeight);
Object.assign(labels.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
app.appendChild(labels.domElement);

const scene = new THREE.Scene();
const BG = new THREE.Color('#070b16');
scene.background = BG;
const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
const ISO_DIR = new THREE.Vector3(-Math.sin(Math.PI / 4), Math.tan(THREE.MathUtils.degToRad(35)), Math.cos(Math.PI / 4)).normalize();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false; controls.enableDamping = true; controls.dampingFactor = 0.15;
controls.screenSpacePanning = true; controls.minZoom = 1; controls.maxZoom = 4;
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };

const hemi = new THREE.HemisphereLight(0xffe9cf, 0x5a4636, 1.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dc, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 26, bottom: -26, near: 1, far: 120 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 4;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xbcd2ff, 0.35); fill.position.set(30, 20, 10); scene.add(fill);

// ---------- helpers ----------
const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...opts }));
  return matCache.get(key);
}
function rbox(w, h, d, color, x = 0, y = 0, z = 0, parent = scene, opts, r = 0.04) {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
  const m = new THREE.Mesh(g, typeof color === 'string' ? mat(color, opts) : color);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(w, h, d, color, x = 0, y = 0, z = 0, parent = scene, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color, opts) : color);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function cyl(rt, rb, h, color, x, y, z, parent = scene, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === 'string' ? mat(color) : color);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO; t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.userData = { c, g }; return t;
}
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const rand = (a, b) => a + Math.random() * (b - a);
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }

// ---------- models ----------
const gltf = new GLTFLoader();
const FURN = ['desk', 'chairDesk', 'computerScreen', 'computerKeyboard', 'loungeSofa', 'tableCoffee', 'pottedPlant', 'plantSmall1',
  'bookcaseOpen', 'kitchenCabinet', 'kitchenCoffeeMachine', 'kitchenFridgeLarge', 'kitchenMicrowave', 'tableRound', 'chair', 'stoolBar',
  'lampRoundFloor', 'laptop', 'sideTable'];
const models = {};
let charGltf = null;
await Promise.all([
  ...FURN.map((n) => gltf.loadAsync(`/models/furniture/${n}.glb`).then((g) => { models[n] = g.scene; }).catch(() => {})),
  gltf.loadAsync('/models/characters/character-male-a.glb').then((g) => { charGltf = g; }).catch(() => {}),
]);
// Kenney furniture palette, nudged to matte + saturated
const KMAT = { wood: '#c98c55', woodDark: '#8a5a36', metal: '#2f3540', metalDark: '#1f232b', metalMedium: '#59616d', metalLight: '#c9ced6',
  carpet: '#3a8f8a', carpetWhite: '#e8e2d6', carpetDarker: '#2b6b67', plant: '#4fa356', lamp: '#ffe6b0', _defaultMat: '#c98c55' };
// place a furniture model: footprint centered on (x,z), on the floor, rotated ry. recolor: {matName: color}
const propMats = new Map();
function prop(name, x, z, ry = 0, { s = KIT, y = 0, recolor = {}, parent = scene, shadow = true } = {}) {
  const src = models[name]; if (!src) return null;
  const inner = src.clone(true);
  inner.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.material.name; const col = recolor[n] || KMAT[n] || '#' + o.material.color.getHexString();
    const key = n + '|' + col; // shared per (slot, color): props never mutate their materials
    if (!propMats.has(key)) propMats.set(key, new THREE.MeshStandardMaterial({ color: col, roughness: n === 'lamp' ? 0.6 : 0.85, metalness: 0,
      emissive: n === 'lamp' ? '#ffcf87' : '#000000', emissiveIntensity: n === 'lamp' ? 1.6 : 0 }));
    o.material = propMats.get(key);
    o.castShadow = shadow; o.receiveShadow = true;
  });
  inner.scale.setScalar(s);
  const bb = new THREE.Box3().setFromObject(inner);
  const c = bb.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -bb.min.y, -c.z);
  const g = new THREE.Group(); g.add(inner); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  g.userData.size = bb.getSize(new THREE.Vector3());
  return g;
}

// ---------- room: floor slab, back walls, window wall ----------
const W = 40, D = 28, WH = 3.9;
const floorTex = canvasTex(2048, 2048, (g, w, h) => {
  const rows = 16, rh = h / rows;
  const tones = ['#d2843f', '#c87a39', '#da9048', '#cd8040', '#c27434', '#d68b45'];
  for (let r = 0; r < rows; r++) {
    let x = -((r * 397) % 700);
    while (x < w) {
      const len = 520 + ((r * 131 + x) % 380);
      g.fillStyle = tones[(r * 7 + Math.abs(Math.floor(x / 97))) % tones.length]; g.fillRect(x, r * rh, len, rh);
      g.globalAlpha = 0.08; g.fillStyle = '#6b3d1c';
      for (let k = 0; k < 6; k++) g.fillRect(x + 20, r * rh + 12 + k * (rh - 24) / 6, len - 40, 2);
      g.globalAlpha = 1; g.fillStyle = 'rgba(70,38,16,.55)'; g.fillRect(x, r * rh, 4, rh);
      x += len;
    }
    g.fillStyle = 'rgba(70,38,16,.6)'; g.fillRect(0, r * rh, w, 4);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(W / 9, D / 9);
const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.7, D + 0.6), [
  mat('#4a5466'), mat('#4a5466'), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.78, metalness: 0 }), mat('#2a3140'), mat('#556074'), mat('#4a5466')]);
slab.position.set(0, -0.35, 0); slab.receiveShadow = true; scene.add(slab);

const SLATE = '#2c3546';
// north (back-left on screen): dark slate accent wall
rbox(W + 0.6, WH, 0.35, SLATE, 0, WH / 2, -14.17, scene, { roughness: 0.95 }, 0.05);
box(W + 0.6, 0.16, 0.38, '#1c222d', 0, 0.08, -13.98); // baseboard
box(W + 0.6, 0.08, 0.4, '#3c4759', 0, WH + 0.04, -14.17); // cap
// east (back-right on screen): full-height window wall
const SKY = { day: ['#5aa6ea', '#bfe1fb'], evening: ['#3a3f86', '#f08a5b'], night: ['#060b1f', '#1b2552'] };
const skyTex = canvasTex(4096, 640, () => {});
const city = Array.from({ length: 70 }, (_, i) => ({ x: i * 62 + rand(-10, 10), w: rand(40, 90), h: rand(90, 330), lit: Array.from({ length: 30 }, () => Math.random()) }));
function drawSky(mode) {
  const { g, c } = skyTex.userData, w = c.width, h = c.height;
  const [top, bot] = SKY[mode]; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (mode === 'night') { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 120; i++) g.fillRect((i * 733) % w, (i * 197) % (h * 0.55), 3, 3); }
  if (mode === 'day') { g.fillStyle = 'rgba(255,255,255,.85)'; for (const [cx, cy] of [[500, 120], [1500, 80], [2600, 150], [3500, 100]]) { for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx + k * 55, cy - (k % 2) * 18, 70, 30, 0, 0, 7); g.fill(); } } }
  if (mode !== 'night') { g.fillStyle = mode === 'day' ? 'rgba(255,248,214,.95)' : 'rgba(255,190,120,.9)'; g.beginPath(); g.arc(3200, mode === 'day' ? 140 : 380, 70, 0, 7); g.fill(); }
  const bcol = mode === 'day' ? '#7d94ad' : mode === 'evening' ? '#33315a' : '#0d1328';
  for (const b of city) {
    g.fillStyle = bcol; g.fillRect(b.x, h - b.h, b.w, b.h);
    const lit = mode === 'night' ? 0.45 : mode === 'evening' ? 0.3 : 0;
    g.fillStyle = mode === 'night' ? '#ffd88a' : '#ffc77a';
    let k = 0; for (let yy = h - b.h + 14; yy < h - 14; yy += 26) for (let xx = b.x + 8; xx < b.x + b.w - 10; xx += 18) { if (b.lit[k++ % 30] < lit) g.fillRect(xx, yy, 8, 12); }
  }
  skyTex.needsUpdate = true;
}
const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, color: new THREE.Color(0.9, 0.9, 0.9) });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(D, WH - 0.35), skyMat);
sky.rotation.y = -Math.PI / 2; sky.position.set(20.3, 0.2 + (WH - 0.35) / 2, 0); scene.add(sky);
const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(D, WH - 0.35), new THREE.MeshStandardMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.08, roughness: 0.15, metalness: 0, depthWrite: false }));
glassPane.rotation.y = -Math.PI / 2; glassPane.position.set(20.05, 0.2 + (WH - 0.35) / 2, 0); scene.add(glassPane);
const FRAME = '#1d232e';
box(0.3, 0.2, D + 0.6, FRAME, 20.15, 0.1, 0); box(0.3, 0.16, D + 0.6, FRAME, 20.15, WH - 0.08, 0);
for (let i = 0; i <= 8; i++) box(0.16, WH, 0.12, FRAME, 20.12, WH / 2, -14 + i * (D / 8));
box(0.12, 0.06, D, FRAME, 20.1, 1.0, 0);


// ---------- the tower: we're mid-way up a skyscraper (facade + floors below, distant skyline) ----------
// decor only: the lit windows are other floors of the building, not status data
let seed = 7; const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const FLOOR_H = 4.3, FLOORS = 12, TOWER_H = FLOOR_H * FLOORS;
function facadeTex(widthW, cols) {
  const PXW = 40, w = Math.round(widthW * PXW), h = Math.round(TOWER_H * PXW);
  const base = canvasTex(w, h, () => {}), glow = canvasTex(w, h, () => {});
  const g = base.userData.g, e = glow.userData.g;
  g.fillStyle = '#2a3242'; g.fillRect(0, 0, w, h); e.fillStyle = '#000'; e.fillRect(0, 0, w, h);
  const fh = FLOOR_H * PXW, band = 0.9 * PXW, cw = w / cols;
  for (let f = 0; f < FLOORS; f++) {
    const y0 = f * fh + band, gh = fh - band;
    for (let c = 0; c < cols; c++) {
      const x0 = c * cw + 3, ww = cw - 6;
      const gr = g.createLinearGradient(0, y0, 0, y0 + gh); gr.addColorStop(0, '#5a7394'); gr.addColorStop(1, '#2b3b55'); g.fillStyle = gr; g.fillRect(x0, y0, ww, gh);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(x0 + ww * 0.15, y0); g.lineTo(x0 + ww * 0.45, y0); g.lineTo(x0 + ww * 0.1, y0 + gh); g.lineTo(x0, y0 + gh); g.lineTo(x0, y0 + gh * 0.6); g.fill();
      if (srand() < 0.42 - f * 0.012) { // lit office glimpse
        const warm = srand() < 0.75, wall = warm ? ['#ffe2a8', '#f2c47c'] : ['#d8ecff', '#a9c9f0'];
        const ig = e.createLinearGradient(0, y0, 0, y0 + gh); ig.addColorStop(0, wall[0]); ig.addColorStop(1, wall[1]); e.fillStyle = ig; e.fillRect(x0, y0, ww, gh);
        e.fillStyle = 'rgba(255,255,255,.9)'; e.fillRect(x0 + ww * 0.1, y0 + 4, ww * 0.8, 4); // ceiling light
        e.fillStyle = 'rgba(60,40,30,.55)'; e.fillRect(x0, y0 + gh * 0.82, ww, gh * 0.18); // floor
        const k = srand();
        if (k < 0.55) { e.fillStyle = 'rgba(70,48,32,.85)'; e.fillRect(x0 + ww * 0.2, y0 + gh * 0.6, ww * 0.55, gh * 0.08); e.fillRect(x0 + ww * 0.24, y0 + gh * 0.68, 4, gh * 0.16); e.fillRect(x0 + ww * 0.7, y0 + gh * 0.68, 4, gh * 0.16);
          e.fillStyle = '#7fd0ff'; e.fillRect(x0 + ww * 0.38, y0 + gh * 0.42, ww * 0.2, gh * 0.16); }
        if (k > 0.35 && k < 0.8) { const px = x0 + ww * (0.15 + srand() * 0.6); e.fillStyle = 'rgba(40,30,40,.8)'; e.beginPath(); e.arc(px, y0 + gh * 0.45, ww * 0.06, 0, 7); e.fill(); e.fillRect(px - ww * 0.07, y0 + gh * 0.52, ww * 0.14, gh * 0.3); }
        if (k > 0.7) { e.fillStyle = 'rgba(40,110,60,.8)'; e.beginPath(); e.arc(x0 + ww * 0.85, y0 + gh * 0.62, ww * 0.08, 0, 7); e.fill(); e.fillRect(x0 + ww * 0.82, y0 + gh * 0.66, ww * 0.06, gh * 0.16); }
        if (srand() < 0.25) { e.fillStyle = 'rgba(0,0,0,.25)'; for (let yy = y0; yy < y0 + gh * 0.5; yy += 7) e.fillRect(x0, yy, ww, 3); } // blinds
        g.fillStyle = '#c9d6e6'; g.fillRect(x0, y0, ww, gh);
      }
      g.fillStyle = '#1b222e'; g.fillRect(c * cw, y0, 6, gh); // mullion
    }
    g.fillStyle = '#394356'; g.fillRect(0, f * fh, w, band); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, f * fh, w, 3);
  }
  for (const c of [g, e]) { const fade = c.createLinearGradient(0, h * 0.35, 0, h); fade.addColorStop(0, 'rgba(7,11,22,0)'); fade.addColorStop(1, 'rgba(7,11,22,1)'); c.fillStyle = fade; c.fillRect(0, 0, w, h); }
  base.needsUpdate = glow.needsUpdate = true; glow.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: base, emissiveMap: glow, emissive: '#ffffff', emissiveIntensity: 1, roughness: 0.5, metalness: 0.1 });
}
const facadeX = facadeTex(D + 0.6, 12), facadeZ = facadeTex(W + 0.6, 17), towerDark = mat('#141a26');
const tower = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, TOWER_H, D + 0.6), [towerDark, facadeX, towerDark, towerDark, facadeZ, towerDark]);
tower.position.set(0, -0.7 - TOWER_H / 2, 0); scene.add(tower);
box(W + 1.0, 0.18, D + 1.0, '#5b6678', 0, -0.62, 0); // floor-plate ledge under our office
// distant towers (cheap boxes sharing one window texture), behind the room from the camera's view
const skyWin = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  for (let y = 6; y < h; y += 16) for (let x = 6; x < w; x += 14) if (srand() < 0.14) { g.fillStyle = srand() < 0.8 ? '#ffd48a' : '#bfe0ff'; g.fillRect(x, y, 6, 8); } });
skyWin.wrapS = skyWin.wrapT = THREE.RepeatWrapping;
const skyline = [];
for (const [x, z, w, d, top] of [[-34, -40, 5, 5, 6], [-16, -52, 6, 5, 14], [4, -46, 4, 6, 3], [16, -58, 7, 7, 20], [32, -44, 5, 5, 9], [46, -26, 6, 7, 16],
  [54, -2, 5, 5, 4], [50, 18, 7, 6, 12], [62, 36, 6, 6, 18], [-28, -70, 8, 6, 22], [30, -80, 7, 7, 26], [72, -40, 8, 8, 24]]) {
  const hgt = top + 70; const g = new THREE.BoxGeometry(w, hgt, d);
  const m = new THREE.MeshStandardMaterial({ color: '#1c2638', emissiveMap: skyWin, emissive: '#ffffff', emissiveIntensity: 0.8, roughness: 0.8, metalness: 0 });
  m.emissiveMap = skyWin.clone(); m.emissiveMap.repeat.set(w / 12, hgt / 24); m.emissiveMap.needsUpdate = true;
  const t = new THREE.Mesh(g, m); t.position.set(x, top - hgt / 2, z); scene.add(t); skyline.push(m);
  if (srand() < 0.6) { const ant = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), mat('#2a3346')); ant.position.set(x, top + 2, z); scene.add(ant);
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.4, 0.3) })); bl.position.set(x, top + 4.2, z); scene.add(bl); }
}

// ---------- department rugs with glowing edges + lettering ----------
const ZONES = [
  { name: 'LEADERSHIP', x0: -20, x1: -12, z0: -14, z1: -3, color: '#6a3c9c', glow: '#b48cff', back: true },
  { name: 'MONEY LAB', x0: -12, x1: -3, z0: -14, z1: -3, color: '#2f8a4c', glow: '#7dff9e' },
  { name: 'SALES', x0: -3, x1: 3, z0: -14, z1: -3, color: '#2d5fb4', glow: '#7fb4ff' },
  { name: 'FAMILY FINANCE', x0: 3, x1: 9, z0: -14, z1: -3, color: '#1c8a86', glow: '#6ff7ea' },
  { name: 'RESEARCH', x0: 9, x1: 20, z0: -14, z1: -3, color: '#24386c', glow: '#5f8dff' },
  { name: 'FRONT DESK', x0: -20, x1: -15.6, z0: -3, z1: 3, color: '#7d5cc4', glow: '#c9b2ff' },
  { name: 'SCHOOL', x0: -20, x1: -13, z0: 3, z1: 14, color: '#7a3f9a', glow: '#e08cff' },
  { name: 'IDENTITY SECURITY', x0: -13, x1: -4, z0: 3, z1: 14, color: '#2f4a6e', glow: '#6fd3ff' },
  { name: "WRITERS' DEN", x0: -4, x1: 2, z0: 3, z1: 14, color: '#b0532a', glow: '#ffae6b' },
  { name: 'LOUNGE', x0: 2, x1: 12, z0: 3, z1: 14, color: '#2f9a4f', glow: '#86ff8a', round: true },
  { name: 'BREAK ROOM', x0: 12, x1: 20, z0: 3, z1: 14, color: '#9aa0a6', glow: null, tile: true },
  { name: 'GYM', x0: 12, x1: 20, z0: -3, z1: 3, color: '#343a46', glow: '#ff8a5c' },
];
const glowMats = [];
for (const z of ZONES) {
  const inset = z.x1 === 20 ? 0.9 : 0.75;
  const x0 = z.x0 + (z.x0 === -20 ? 0.5 : 0.75), x1 = z.x1 - inset, z0 = z.z0 + (z.z0 === -14 ? 0.9 : 0.75), z1 = z.z1 - (z.z1 === 14 ? 0.5 : 0.75);
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const PX = 200; // texels per world unit
  const cw = Math.min(4096, Math.round(w * PX)), ch = Math.min(4096, Math.round(d * PX)), sx = cw / w, sy = ch / d;
  const band = 1.25; // lettering band depth (world)
  const tex = canvasTex(cw, ch, (g) => {
    g.clearRect(0, 0, cw, ch);
    const r = z.round ? Math.min(cw, ch) / 2.2 : 0.35 * sx;
    if (z.tile) {
      g.fillStyle = '#b7bcc2'; g.fillRect(0, 0, cw, ch);
      g.strokeStyle = 'rgba(90,96,104,.45)'; g.lineWidth = 4;
      for (let x = 0; x < cw; x += 0.8 * sx) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ch); g.stroke(); }
      for (let y = 0; y < ch; y += 0.8 * sy) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
    } else {
      rr(g, 6, 6, cw - 12, ch - 12, r); g.fillStyle = z.color; g.fill();
      g.globalAlpha = 0.12; g.strokeStyle = '#000'; g.lineWidth = 3;
      for (let y = 20; y < ch; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
      g.globalAlpha = 1;
      rr(g, 0.28 * sx, 0.28 * sy, cw - 0.56 * sx, ch - 0.56 * sy, Math.max(4, r - 0.28 * sx)); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 5; g.stroke();
    }
    // lettering along the front (camera-side) edge
    let size = band * sy * 0.56; const sp = 0.12;
    const setF = () => { g.font = `800 ${size}px ${FONT}`; if ('letterSpacing' in g) g.letterSpacing = `${size * sp}px`; };
    setF(); const maxW = (z.round ? 0.55 : 0.86) * cw; const tw = g.measureText(z.name).width;
    if (tw > maxW) { size *= maxW / tw; setF(); }
    g.fillStyle = z.tile ? 'rgba(52,58,66,.85)' : 'rgba(255,255,255,.9)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(z.name, cw / 2, z.back ? band * 0.62 * sy : ch - (z.round ? band * 1.5 : band * 0.62) * sy);
  });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(cx, 0.012, cz); rug.receiveShadow = true; scene.add(rug);
  if (z.glow) { // emissive edge strip
    const et = canvasTex(1024, Math.round(1024 * d / w), (g, ew, eh) => {
      const r = z.round ? Math.min(ew, eh) / 2.2 : 0.35 * ew / w; rr(g, 6, 6, ew - 12, eh - 12, r); g.strokeStyle = '#fff'; g.lineWidth = Math.max(8, 0.1 * ew / w); g.stroke();
    });
    const em = new THREE.MeshBasicMaterial({ color: new THREE.Color(z.glow).multiplyScalar(1.7), alphaMap: et, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    et.colorSpace = THREE.NoColorSpace;
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(w, d), em); edge.rotation.x = -Math.PI / 2; edge.position.set(cx, 0.018, cz); scene.add(edge);
    glowMats.push({ m: em, base: new THREE.Color(z.glow) });
  }
}

// ---------- glass corner office ----------
const glass = new THREE.MeshStandardMaterial({ color: '#cfe6ef', transparent: true, opacity: 0.14, roughness: 0.2, metalness: 0, depthWrite: false });
function glassWall(x0, z0, x1, z1, h = 2.6) {
  const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ang = Math.atan2(z1 - z0, x1 - x0);
  const g = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.04), glass); g.position.set(cx, h / 2, cz); g.rotation.y = -ang; scene.add(g);
  for (const yy of [0.04, h]) { const b = box(len, 0.07, 0.08, FRAME, cx, yy, cz); b.rotation.y = -ang; }
  for (const [px, pz] of [[x0, z0], [x1, z1]]) box(0.08, h, 0.08, FRAME, px, h / 2, pz);
}
glassWall(-12, -14, -12, -3); glassWall(-20, -3, -14.7, -3); glassWall(-13.1, -3, -12, -3);

// ---------- office partitions: framed glass with doorways, so every department is its own room ----------
const frost = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.38, roughness: 0.5, metalness: 0, depthWrite: false });
function partition(x0, z0, x1, z1, doors = [], h = 2.6) { // axis-aligned wall from (x0,z0) to (x1,z1); doors: [from,to] along the wall
  const alongX = z0 === z1, a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1;
  const at = (a, y, len, hh, d, m) => { const g = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len : d, hh, alongX ? d : len), m);
    g.position.set(alongX ? a : x0, y, alongX ? z0 : a); scene.add(g); return g; };
  const cuts = [a0, ...doors.flat(), a1];
  for (let i = 0; i < cuts.length; i += 2) {
    const s0 = cuts[i], s1 = cuts[i + 1], len = s1 - s0, mid = (s0 + s1) / 2; if (len <= 0.05) continue;
    at(mid, h / 2, len, h, 0.04, glass); at(mid, 1.35, len, 0.22, 0.05, frost);
    for (const yy of [0.04, h]) { const b = at(mid, yy, len, 0.07, 0.08, mat(FRAME)); b.castShadow = true; }
    for (const p of [s0, s1]) { const b = at(p, h / 2, 0.08, h, 0.08, mat(FRAME)); b.castShadow = true; }
  }
  for (const [d0, d1] of doors) at((d0 + d1) / 2, h - 0.18, d1 - d0, 0.3, 0.06, mat(FRAME)); // door header
}
// north row (hall side z = -3) + side walls
partition(-12, -3, 20, -3, [[-8.9, -7.6], [-4.9, -3.6], [0.4, 1.7], [6.6, 7.9], [10.0, 11.4]]);
partition(-3.3, -14, -3.3, -3); partition(3, -14, 3, -3); partition(9, -14, 9, -3);
// south row (hall side z = 3) + side walls; Writers' Den has an open front, lounge is reached through its side door
partition(-20, 3, -1.7, 3, [[-17.15, -15.85], [-11.2, -9.8], [-7.2, -5.8]]);
partition(2, 3, 20, 3, [[12.3, 13.8]]);
partition(-13, 3, -13, 14); partition(-4, 3, -4, 14); partition(2, 3, 2, 14, [[10.2, 11.6]]); partition(12, 3, 12, 14, [[10.4, 12.0]]);

// ---------- desks ----------
const deskScreens = {};
// shared bits for desk perks (one geometry/material each, reused on every desk)
const MUG_GEO = new THREE.CylinderGeometry(0.07, 0.06, 0.15, 16), MUG_HANDLE = new THREE.TorusGeometry(0.045, 0.014, 6, 12);
const TROPHY_CUP = new THREE.CylinderGeometry(0.11, 0.05, 0.17, 16), TROPHY_STEM = new THREE.CylinderGeometry(0.025, 0.025, 0.09, 8), TROPHY_BASE = new THREE.BoxGeometry(0.17, 0.06, 0.17);
const GOLD = mat('#e8b93a', { roughness: 0.4, metalness: 0.3 });
function mug(color, x, y, z, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; scene.add(g);
  const m = new THREE.Mesh(MUG_GEO, mat(color, { roughness: 0.55 })); m.position.y = 0.075; m.castShadow = true; g.add(m);
  const h = new THREE.Mesh(MUG_HANDLE, m.material); h.position.set(0.075, 0.08, 0); g.add(h);
  return g;
}
function trophy(x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g);
  const b = new THREE.Mesh(TROPHY_BASE, mat('#3a2a1e')); b.position.y = 0.03; const st = new THREE.Mesh(TROPHY_STEM, GOLD); st.position.y = 0.105;
  const c = new THREE.Mesh(TROPHY_CUP, GOLD); c.position.y = 0.235; for (const m of [b, st, c]) { m.castShadow = true; g.add(m); }
}
const DESK_TOP = 0.91;
function workstation(id, x, z, color) { // chair at (x,z) facing +z, desk in front
  const boss = id === 'overlord';
  const dz = z + 1.15;
  const desk = prop('desk', x, dz, Math.PI, boss ? { recolor: { wood: '#7a4a2a', woodDark: '#4e2c18' } } : {});
  if (boss && desk) desk.scale.x = 1.45; // wide executive desk (depth unchanged so the chair still tucks in)
  const mon = prop('computerScreen', x, dz + 0.12, Math.PI, { y: DESK_TOP });
  prop('computerKeyboard', x, dz - 0.18, Math.PI, { y: DESK_TOP });
  prop('chairDesk', x, z - 0.1, 0, { shadow: true, recolor: boss ? { carpet: '#c0282f', metalMedium: '#2a1d1d' } : {} }); // Kenney chairs face +z
  // monitor glow surface (faces the bot, -z)
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.46), new THREE.MeshBasicMaterial({ color: '#2a3a4c' }));
  scr.position.set(x, 1.3, dz + 0.12 - 0.08); scr.rotation.y = Math.PI; scene.add(scr);
  deskScreens[id] = scr;
  if (boss) {
    // plush high-back: tufted red headrest above the chair back
    rbox(0.66, 0.5, 0.14, '#c0282f', x, 1.2, z - 0.47, scene, { roughness: 0.95 }, 0.07);
    rbox(0.72, 0.06, 0.16, '#e8b93a', x, 1.47, z - 0.47, scene, { roughness: 0.4, metalness: 0.3 }, 0.02);
    // desk lamp, gold nameplate facing visitors, boss mug
    prop('lampRoundFloor', x - 1.05, dz + 0.15, 0, { s: 0.75, y: DESK_TOP });
    const np = rbox(0.62, 0.13, 0.05, '#2a1a12', x + 0.75, DESK_TOP + 0.07, dz + 0.42, scene, {}, 0.02);
    const npTex = canvasTex(512, 108, (g, w, h) => { g.fillStyle = '#2a1a12'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8b93a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#f2cf63'; g.font = `800 52px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OVERLORD BOSS', w / 2, h / 2 + 2); });
    const npFace = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.12), new THREE.MeshBasicMaterial({ map: npTex })); npFace.position.set(0, 0, 0.027); np.add(npFace);
    mug(color, x + 0.95, DESK_TOP, dz - 0.15, -0.6);
  } else {
    // trickle-down perks: a little plant and a mug in the bot's own color
    prop('plantSmall1', x + 0.72, dz + 0.1, 0, { s: 1.5, y: DESK_TOP });
    mug(color, x - 0.7, DESK_TOP, dz - 0.12, 0.5);
  }
}
for (const id in DESKS) { const [x, z] = DESKS[id]; workstation(id, x, z, TEAM.find((t) => t.id === id).color); }
// lead's in-tray and side cabinet
const trayBase = rbox(0.5, 0.06, 0.38, '#2b303a', TRAY[0], 0.92, TRAY[1] + 0.0);
prop('sideTable', TRAY[0], TRAY[1], 0, { s: 1.9 }); trayBase.position.y = 0.74;
const trayPapers = new THREE.Group(); scene.add(trayPapers);
prop('bookcaseOpen', -19.3, -9.0, Math.PI / 2); prop('lampRoundFloor', -19.2, -5.2, 0);

// ---------- decor ----------
const pl = (x, z, big) => prop(big ? 'pottedPlant' : 'plantSmall1', x, z, rand(0, 6), { s: big ? 2.6 : 2.4 });
[[-12.6, -13.3, 1], [-3.9, -13.3, 1], [3.6, -13.3, 0], [8.4, -13.3, 1], [-13.6, 13.4, 1], [-3.4, 13.4, 0], [2.6, 13.4, 1], [12.6, 13.4, 1],
  [19.2, 13.3, 1], [-19.7, 0.7, 1], [-19.55, -0.75, 0], [11.6, 3.4, 0]].forEach(([x, z, b]) => pl(x, z, b));
prop('bookcaseOpen', -18.6, 3.7, 0); prop('bookcaseOpen', -17.6, 3.7, 0);
// writers' den whiteboard + identity file cabinets
rbox(0.6, 1.1, 0.6, '#505a6a', -12.4, 0.55, 4.0, scene, {}, 0.06); rbox(0.6, 1.1, 0.6, '#505a6a', -12.4, 0.55, 4.7, scene, {}, 0.06);
prop('bookcaseOpen', -3.4, 4.0, Math.PI / 2); prop('lampRoundFloor', 0.6, 13.0, 0);
prop('lampRoundFloor', 2.9, 4.4, 0); prop('lampRoundFloor', 18.6, -3.8, 0); prop('lampRoundFloor', -11.0, -3.8, 0);

// crests (Sean's) on the slate wall
const texLoader = new THREE.TextureLoader();
function crest(url, x, y, s) {
  const t = texLoader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
  rbox(s + 0.16, s + 0.16, 0.06, '#151a22', x, y, -13.96, scene, {}, 0.03);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, metalness: 0 }));
  m.position.set(x, y, -13.92); scene.add(m);
}
crest('/crest-main.jpg', -16, 2.3, 1.5);
rbox(1.82, 1.82, 0.04, '#e8b93a', -16, 2.3, -13.985, scene, { roughness: 0.4, metalness: 0.3 }, 0.03); // gold trim behind the main crest

// ---------- Family Planner front desk: backdrop with a real wall calendar and an outings map ----------
rbox(3.2, 1.75, 0.12, '#e9e3f5', -18.3, 0.875, -2.72, scene, { roughness: 0.95 }, 0.04); // low lavender divider in front of the glass
box(3.3, 0.06, 0.16, '#7d5cc4', -18.3, 1.78, -2.72);
const calTex = canvasTex(512, 560, () => {});
let calDay = '';
function drawCalendar() { // current Arizona month, today ringed; no events are invented
  const now = new Date(), key = fmtAZ(now, { year: 'numeric', month: 'numeric', day: 'numeric' }); if (key === calDay) return; calDay = key;
  const [mo, dd, yy] = key.split('/').map(Number);
  const { g, c } = calTex.userData, w = c.width, h = c.height;
  g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, w, h); g.fillStyle = '#a77de0'; g.fillRect(0, 0, w, 120);
  g.fillStyle = '#fff'; g.font = `800 64px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(fmtAZ(now, { month: 'long' }).toUpperCase() + ' ' + yy, w / 2, 64);
  const first = new Date(Date.UTC(yy, mo - 1, 1)).getUTCDay(), days = new Date(Date.UTC(yy, mo, 0)).getUTCDate();
  const cw = (w - 40) / 7, ch = (h - 190) / 6;
  g.font = `700 30px ${FONT}`; g.fillStyle = '#8a7fa6'; 'SMTWTFS'.split('').forEach((d, i) => g.fillText(d, 20 + cw * (i + 0.5), 152));
  for (let d = 1; d <= days; d++) { const k = first + d - 1, cx = 20 + cw * (k % 7 + 0.5), cy = 190 + ch * (Math.floor(k / 7) + 0.5);
    if (d === dd) { g.fillStyle = '#a77de0'; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; } else g.fillStyle = '#3b3550';
    g.font = `700 34px ${FONT}`; g.fillText(String(d), cx, cy); }
  calTex.needsUpdate = true;
}
drawCalendar(); setInterval(drawCalendar, 10 * 60000);
{ const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.9), new THREE.MeshBasicMaterial({ map: calTex, color: new THREE.Color(1.05, 1.05, 1.05) }));
  cal.position.set(-19.25, 1.15, -2.64); scene.add(cal); rbox(0.88, 0.96, 0.02, '#3b3550', -19.25, 1.15, -2.655, scene, {}, 0.01);
  // cork map: a stylized local map with pins on the towns Sean named (decor only, not status data)
  const mapTex = canvasTex(768, 512, (g, w, h) => {
    g.fillStyle = '#c99a63'; g.fillRect(0, 0, w, h); g.fillStyle = '#efe6cf'; g.fillRect(26, 26, w - 52, h - 52);
    g.fillStyle = '#d9c99c'; g.beginPath(); g.moveTo(26, 330); g.bezierCurveTo(200, 260, 330, 420, 520, 300); g.lineTo(w - 26, 360); g.lineTo(w - 26, h - 26); g.lineTo(26, h - 26); g.fill();
    g.strokeStyle = '#6fb3e0'; g.lineWidth = 14; g.beginPath(); g.moveTo(120, 26); g.bezierCurveTo(90, 180, 150, 320, 110, h - 26); g.stroke(); // river
    g.strokeStyle = '#b9a98a'; g.lineWidth = 8; g.beginPath(); g.moveTo(110, 300); g.lineTo(450, 210); g.lineTo(w - 26, 150); g.stroke(); g.beginPath(); g.moveTo(450, 210); g.lineTo(560, h - 26); g.stroke();
    const pin = (x, y, col, label) => { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + 4, y + 6, 15, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4, y - 4, 4, 0, 7); g.fill(); g.fillStyle = '#3b3550'; g.font = `700 30px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(label, x + 24, y); };
    pin(450, 210, '#e0533d', 'Kingman'); pin(330, 300, '#a77de0', 'Golden Valley'); pin(130, 160, '#3a8fd9', 'Bullhead');
  });
  const map = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.9), new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.9, metalness: 0 }));
  map.position.set(-17.75, 1.15, -2.645); scene.add(map);
}

// ---------- Overlord office glow-up ----------
{ // round red rug with a gold rim under the boss desk (clear of the LEADERSHIP lettering at the back)
  const rugTex = canvasTex(512, 512, (g, w) => { g.fillStyle = '#e8b93a'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill();
    g.fillStyle = '#a3222a'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 22, 0, 7); g.fill();
    g.strokeStyle = 'rgba(232,185,58,.55)'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 60, 0, 7); g.stroke(); });
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.0, 48), new THREE.MeshStandardMaterial({ map: rugTex, transparent: true, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -3 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-16.6, 0.024, -8.4); rug.receiveShadow = true; scene.add(rug);
}
// trophy case: second bookcase with gold trophies on top (kept off the back lettering band)
const tcase = prop('bookcaseOpen', -19.3, -7.1, Math.PI / 2, { recolor: { wood: '#7a4a2a', woodDark: '#4e2c18' } });
if (tcase) { const th = tcase.userData.size.y; trophy(-19.3, th, -7.55, 1.1); trophy(-19.3, th, -7.1, 1.35); trophy(-19.3, th, -6.65, 1.0); }
// mini-fridge + coffee machine nook by the glass wall
prop('kitchenFridgeLarge', -12.75, -12.0, -Math.PI / 2, { s: 1.25 });
prop('sideTable', -12.75, -10.85, -Math.PI / 2, { s: 1.9 }); prop('kitchenCoffeeMachine', -12.75, -10.85, -Math.PI / 2, { s: 1.6, y: 0.74 });
prop('pottedPlant', -19.3, -3.8, 0, { s: 2.6 });
// two small square windows flanking the crest, view follows the time of day
const bossWinTex = canvasTex(1024, 512, () => {});
function drawBossWindows(mode) {
  const { g, c } = bossWinTex.userData, w = c.width, h = c.height;
  const [top, bot] = SKY[mode]; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (mode === 'night') { g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 40; i++) g.fillRect((i * 389) % w, (i * 151) % (h * 0.5), 3, 3); g.fillStyle = '#f4f1dc'; g.beginPath(); g.arc(820, 110, 34, 0, 7); g.fill(); }
  else { g.fillStyle = mode === 'day' ? '#fff6cf' : '#ffb27a'; g.beginPath(); g.arc(800, mode === 'day' ? 120 : 250, 46, 0, 7); g.fill();
    if (mode === 'day') { g.fillStyle = 'rgba(255,255,255,.9)'; for (const [cx, cy] of [[180, 110], [560, 80]]) for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx + k * 40, cy - (k % 2) * 12, 52, 22, 0, 0, 7); g.fill(); } } }
  const hills = { day: ['#7cc46a', '#4f9e4c', '#3a7d3d'], evening: ['#6a5a7e', '#4b3f63', '#33294a'], night: ['#1d2a40', '#15203a', '#0e1628'] }[mode];
  [[330, 120, 0], [380, 95, 1], [430, 70, 2]].forEach(([base, amp, k]) => { g.fillStyle = hills[k]; g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) g.lineTo(x, base - Math.sin(x / (150 + k * 40) + k * 1.7) * amp * 0.5 - amp * 0.3); g.lineTo(w, h); g.fill(); });
  bossWinTex.needsUpdate = true;
}
{
  const S = 1.15, WIN_Y = 2.3, wm = new THREE.MeshBasicMaterial({ map: bossWinTex, color: new THREE.Color(1.15, 1.15, 1.15) });
  [-18.35, -13.65].forEach((wx, i) => {
    const geo = new THREE.PlaneGeometry(S, S); const uv = geo.attributes.uv; // each window shows its half of the landscape
    for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * 0.5 + i * 0.5);
    const pane = new THREE.Mesh(geo, wm); pane.position.set(wx, WIN_Y, -13.975); scene.add(pane);
    const F = '#f1ece2', t = 0.09, d = 0.1, fz = -13.95;
    box(S + 2 * t, t, d, F, wx, WIN_Y + S / 2 + t / 2, fz); box(S + 2 * t, t, d, F, wx, WIN_Y - S / 2 - t / 2, fz);
    box(t, S, d, F, wx - S / 2 - t / 2, WIN_Y, fz); box(t, S, d, F, wx + S / 2 + t / 2, WIN_Y, fz);
    box(0.04, S, 0.05, F, wx, WIN_Y, fz + 0.01); box(S, 0.04, 0.05, F, wx, WIN_Y, fz + 0.01); // muntins
    box(S + 0.36, 0.06, 0.2, F, wx, WIN_Y - S / 2 - 0.1, -13.88); // sill
  });
}
crest('/crest-samurai.jpg', -5.2, 2.3, 1.3);
crest('/crest-samurai.jpg', 6, 2.3, 1.3);

// lounge
const SOFA = '#1f9e9a';
for (const x of [4.4, 7.35, 10.3]) prop('loungeSofa', x, 5.0, 0, { s: 2.9, recolor: { carpet: SOFA } });
prop('loungeSofa', 3.0, 8.8, Math.PI / 2, { s: 2.9, recolor: { carpet: SOFA } });
prop('loungeSofa', 11.4, 8.1, -Math.PI / 2, { s: 2.4, recolor: { carpet: SOFA } });
prop('tableCoffee', 7.35, 8.0, 0, { s: 2.6 });
// wall TV in the lounge (shows the Arizona clock, which is real)
const tvTex = canvasTex(1024, 576, () => {});
rbox(2.75, 1.6, 0.1, '#0c0f15', -9.6, 2.25, -13.92, scene, {}, 0.05);
const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.46), new THREE.MeshBasicMaterial({ map: tvTex, color: new THREE.Color(1.4, 1.4, 1.4) }));
tvScr.position.set(-9.6, 2.25, -13.86); scene.add(tvScr);
box(0.9, 0.05, 0.2, '#0c0f15', -9.6, 1.42, -13.85);

// break room: coffee bar island, fridge, table
const bar = [];
for (let i = 0; i < 5; i++) bar.push(prop('kitchenCabinet', 14.6 + i * 1.03, 4.0, Math.PI));
rbox(5.4, 0.08, 1.2, '#eceae6', 16.66, 1.1, 4.0, scene, { roughness: 0.6 }, 0.03);
const cm = prop('kitchenCoffeeMachine', 17.6, 3.8, Math.PI, { y: 1.14 });
prop('kitchenMicrowave', 15.4, 3.8, Math.PI, { y: 1.14 });
for (let i = 0; i < 4; i++) prop('stoolBar', 14.9 + i * 1.25, 5.25, 0, { s: 2.2 });
prop('kitchenFridgeLarge', 19.2, 7.0, -Math.PI / 2);
prop('tableRound', 16, 9.6, 0, { s: 2.3 });
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; prop('chair', 16 + Math.cos(a) * 1.35, 9.6 + Math.sin(a) * 1.35, -a - Math.PI / 2); }
const brew = rbox(0.06, 0.06, 0.02, '#6fae7a', 17.6, 1.6, 4.45, scene, { emissive: '#3eff6c', emissiveIntensity: 1.2 }, 0.01);
// "COFFEE BAR" sign on the slate wall? (break room is by the window) — put a small neon sign over the bar
const signTex = canvasTex(1024, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.font = `800 150px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; if ('letterSpacing' in g) g.letterSpacing = '18px'; g.fillText('COFFEE BAR', w / 2, h / 2); });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: signTex, color: new THREE.Color(2.4, 1.6, 0.8), transparent: true, depthWrite: false }));
sign.position.set(16.66, 2.3, 3.45); sign.rotation.y = 0; scene.add(sign);
rbox(2.7, 0.8, 0.06, '#151a22', 16.66, 2.3, 3.4, scene, {}, 0.03);


// ---------- gym corner (by the windows, between Research and the break room) ----------
{
  const RUB = '#22262e', STEEL = mat('#9aa3ae', { roughness: 0.4, metalness: 0.5 }), BLK = '#1b1e24';
  // treadmill facing the windows
  rbox(2.0, 0.2, 0.86, '#2c313b', 17.4, 0.1, -1.6, scene, {}, 0.05); box(1.7, 0.04, 0.64, RUB, 17.3, 0.22, -1.6);
  for (const sz of [-1, 1]) { box(0.08, 1.15, 0.08, '#3a404c', 18.3, 0.75, -1.6 + sz * 0.38); box(1.0, 0.06, 0.06, '#3a404c', 17.85, 1.1, -1.6 + sz * 0.38); }
  const con = rbox(0.28, 0.32, 0.86, '#2c313b', 18.35, 1.38, -1.6, scene, {}, 0.04); con.rotation.z = 0.35;
  // weight bench with barbell on uprights
  rbox(1.3, 0.14, 0.38, '#b8433a', 14.6, 0.5, -1.3, scene, { roughness: 0.8 }, 0.05);
  for (const sx of [-0.5, 0.5]) box(0.08, 0.44, 0.3, '#3a404c', 14.6 + sx, 0.22, -1.3);
  for (const sz of [-0.42, 0.42]) box(0.08, 1.2, 0.08, '#3a404c', 13.95, 0.6, -1.3 + sz);
  const bar = cyl(0.025, 0.025, 1.9, STEEL, 13.95, 1.12, -1.3, scene, 10); bar.rotation.x = Math.PI / 2;
  for (const sz of [-0.75, 0.75]) { const pl = cyl(0.24, 0.24, 0.07, BLK, 13.95, 1.12, -1.3 + sz, scene, 18); pl.rotation.x = Math.PI / 2; const p2 = cyl(0.18, 0.18, 0.06, '#c4473d', 13.95, 1.12, -1.3 + sz * 1.1, scene, 16); p2.rotation.x = Math.PI / 2; }
  // dumbbell rack along the break-room wall
  rbox(2.6, 0.08, 0.5, '#3a404c', 15.6, 0.45, 2.3, scene, {}, 0.02); rbox(2.6, 0.08, 0.5, '#3a404c', 15.6, 0.85, 2.3, scene, {}, 0.02);
  for (const sx of [-1.25, 1.25]) box(0.08, 0.9, 0.5, '#2c313b', 15.6 + sx, 0.45, 2.3);
  const DB = ['#c4473d', '#3a6fc4', '#e8b93a', '#2f9a4f', '#1b1e24'];
  for (let tier = 0; tier < 2; tier++) for (let k = 0; k < 5; k++) { const x = 14.6 + k * 0.5, y = 0.58 + tier * 0.4, c = DB[(k + tier * 2) % 5];
    const hnd = cyl(0.02, 0.02, 0.32, STEEL, x, y, 2.3, scene, 8); hnd.rotation.x = Math.PI / 2;
    for (const dz of [-0.14, 0.14]) { const hd = cyl(0.07, 0.07, 0.09, c, x, y, 2.3 + dz, scene, 6); hd.rotation.x = Math.PI / 2; } }
  // yoga mat, exercise ball, kettlebells
  rbox(2.0, 0.03, 0.8, '#2a9d8f', 17.2, 0.03, 0.9, scene, { roughness: 1 }, 0.01);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), mat('#7d5cc4', { roughness: 0.5 })); ball.position.set(13.3, 0.34, 1.4); ball.castShadow = true; scene.add(ball);
  for (const [x, z, r] of [[19.2, 1.4, 0.16], [19.2, 1.9, 0.19], [19.25, 0.9, 0.14]]) {
    const kb = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(BLK, { roughness: 0.6 })); kb.position.set(x, r * 0.9, z); kb.castShadow = true; scene.add(kb);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(r * 0.6, r * 0.14, 6, 14, Math.PI), kb.material); hd.position.set(x, r * 1.7, z); hd.rotation.y = Math.PI / 2; scene.add(hd); }
  prop('pottedPlant', 12.6, -2.4, 0, { s: 2.6 });
}

// ---------- research: animated screens + server racks ----------
const SCR_W = 1024, SCR_H = 576;
const screens = [];
function screen(x, draw) {
  rbox(2.95, 1.75, 0.1, '#11151c', x, 2.15, -13.92, scene, {}, 0.04);
  const tex = canvasTex(SCR_W, SCR_H, () => {});
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.78, 1.57), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.5, 1.5, 1.5) }));
  m.position.set(x, 2.15, -13.86); scene.add(m);
  screens.push({ tex, draw });
}
const US = [[-124.7,48.4],[-123,48.2],[-122.8,49],[-95.2,49],[-94.8,49.4],[-89.6,48],[-84.8,46.5],[-83.4,45.8],[-82.4,43],[-79,43.3],[-79.2,42.5],[-76.8,43.6],[-75,45],[-71.5,45],[-70,46.7],[-68.2,47.4],[-67.1,45.2],[-70.6,43],[-70.6,41.6],[-74,40.6],[-74.9,38.9],[-75.9,37.2],[-75.5,35.2],[-77.9,33.8],[-81,32],[-81.4,30.4],[-80.1,26.8],[-80.6,25.2],[-81.8,26.1],[-82.8,27.9],[-84.3,30],[-86.5,30.4],[-89.6,30.2],[-89.4,29.1],[-91.3,29.3],[-94,29.7],[-97.2,27.7],[-97.4,25.9],[-99.2,26.5],[-100.3,28.2],[-101.4,29.8],[-103.2,29],[-104.5,29.7],[-106.5,31.8],[-108.2,31.8],[-111.1,31.3],[-114.8,32.5],[-117.1,32.5],[-118.5,34],[-120.6,34.6],[-121.9,36.6],[-123.7,38.9],[-124.2,41],[-124.5,43],[-124.1,46.2],[-124.7,48.4]];
const chartData = Array.from({ length: 60 }, (_, i) => 0.5 + 0.25 * Math.sin(i / 6) + rand(-0.05, 0.05));
const termLines = [];
const TERM_POOL = ['indexing workspace', 'syncing task queue', 'compiling notes', 'checking routines', 'reviewing handoffs', 'scanning feeds', 'summarizing threads',
  'planning next steps', 'verifying sources', 'drafting outline', 'running checks', 'cleaning cache', 'ranking ideas', 'linking references'];
function drawChart(g, w, h) {
  g.fillStyle = '#0d1a2e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,170,255,.14)'; g.lineWidth = 2;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(40, i * h / 6); g.lineTo(w - 30, i * h / 6); g.stroke(); }
  chartData.shift(); chartData.push(Math.min(0.92, Math.max(0.08, chartData[chartData.length - 1] + rand(-0.06, 0.065) + (0.5 - chartData[chartData.length - 1]) * 0.05)));
  const bw = (w - 80) / chartData.length;
  chartData.forEach((v, i) => { g.fillStyle = 'rgba(70,200,255,.25)'; g.fillRect(40 + i * bw, h - 30 - v * (h - 90) * 0.5, bw - 3, v * (h - 90) * 0.5); });
  g.strokeStyle = '#5ff0a0'; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath();
  chartData.forEach((v, i) => { const x = 40 + i * bw + bw / 2, y = h - 40 - v * (h - 100); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = '#d6f5e3'; g.font = `700 34px ${FONT}`; g.fillText('TREND', 44, 50);
}
function drawMap(g, w, h, t) {
  g.fillStyle = '#0e1630'; g.fillRect(0, 0, w, h);
  const px = (lon) => 70 + (lon + 125) / 58 * (w - 140), py = (lat) => 60 + (49.5 - lat) / 25 * (h - 120);
  g.fillStyle = 'rgba(90,140,255,.22)'; g.strokeStyle = '#8fb8ff'; g.lineWidth = 4; g.lineJoin = 'round';
  g.beginPath(); US.forEach(([lo, la], i) => (i ? g.lineTo(px(lo), py(la)) : g.moveTo(px(lo), py(la)))); g.closePath(); g.fill(); g.stroke();
  const hx = px(-112.07), hy = py(33.45), r = 10 + 14 * ((t * 0.6) % 1);
  g.strokeStyle = `rgba(255,170,110,${1 - ((t * 0.6) % 1)})`; g.lineWidth = 4; g.beginPath(); g.arc(hx, hy, r, 0, 7); g.stroke();
  g.fillStyle = '#ffa86e'; g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fill();
  g.fillStyle = '#dbe6ff'; g.font = `700 34px ${FONT}`; g.fillText('HOME BASE · AZ', 44, h - 28);
}
function drawTerm(g, w, h, t) {
  g.fillStyle = '#07120c'; g.fillRect(0, 0, w, h);
  if (!drawTerm.next || t > drawTerm.next) {
    termLines.push(`> ${TERM_POOL[Math.floor(Math.random() * TERM_POOL.length)]} ${'.'.repeat(1 + Math.floor(Math.random() * 3))} ${Math.random() < 0.85 ? 'ok' : 'retry'}`);
    if (termLines.length > 11) termLines.shift(); drawTerm.next = t + rand(0.5, 1.1);
  }
  g.font = `500 36px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`; g.fillStyle = '#7dffa0';
  termLines.forEach((l, i) => g.fillText(l, 36, 60 + i * 46));
  if (Math.floor(t * 2) % 2) g.fillRect(36, 60 + termLines.length * 46 - 30, 20, 36);
}
screen(11.4, drawChart); screen(14.6, drawMap); screen(17.8, drawTerm);
// research desks (shared)
prop('desk', 13.0, -8.6, Math.PI); prop('desk', 16.2, -8.6, Math.PI);
prop('laptop', 13.0, -8.6, Math.PI, { y: 0.91, s: 1.6 }); prop('computerScreen', 16.2, -8.5, Math.PI, { y: 0.91 });
const leds = [];
for (let r = 0; r < 4; r++) {
  const z = -12.9 + r * 1.2;
  rbox(1.0, 2.3, 1.05, '#161a21', 19.2, 1.15, z, scene, {}, 0.05);
  for (let i = 0; i < 14; i++) {
    const on = new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? new THREE.Color(2.2, 1.4, 0.4) : new THREE.Color(0.4, 2.2, 0.9) });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.07), on);
    led.position.set(18.69, 0.35 + i * 0.14, z - 0.3 + (i % 3) * 0.2); scene.add(led); leds.push({ led, on: on.color.clone() });
  }
}

// ---------- usage board (slate wall, Sales) ----------
rbox(5.9, 2.9, 0.1, '#11151c', -0.2, 2.15, -13.92, scene, {}, 0.05);
const usageTex = canvasTex(2048, 970, () => {});
const usageBoard = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 2.7), new THREE.MeshBasicMaterial({ map: usageTex, color: new THREE.Color(1.25, 1.25, 1.25) }));
usageBoard.position.set(-0.2, 2.15, -13.86); scene.add(usageBoard);
const AZ = 'America/Phoenix';
function fmtAZ(d, opts) { return new Intl.DateTimeFormat('en-US', { timeZone: AZ, ...opts }).format(d); }
function drawUsage(u) {
  const { g, c } = usageTex.userData, w = c.width, h = c.height;
  g.fillStyle = '#0f1520'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9fb0c6'; g.font = `700 104px ${FONT}`; g.textAlign = 'center'; g.fillText('WEEKLY USAGE', w / 2, 150);
  if (!u) {
    g.fillStyle = '#d7dde2'; g.font = `700 210px ${FONT}`; g.fillText('no reading yet', w / 2, 540);
    g.fillStyle = '#8b949d'; g.font = `500 84px ${FONT}`; g.fillText('waiting for the first usage check', w / 2, 730);
  } else {
    const used = Math.min(100, Math.max(0, u.percentUsed)), left = 100 - used;
    const f1 = (n) => n.toFixed(n % 1 ? 1 : 0);
    const fit = (t, wt, px, y) => { g.font = `${wt} ${px}px ${FONT}`; const m = g.measureText(t).width, max = w - 160; if (m > max) g.font = `${wt} ${Math.floor(px * max / m)}px ${FONT}`; g.fillText(t, w / 2, y); };
    const col = used < 60 ? '#5ff0a0' : used < 85 ? '#ffd166' : '#ff7b6e';
    g.fillStyle = col; fit(`${f1(used)}% used`, 800, 270, 440);
    g.fillStyle = '#26303d'; g.fillRect(260, 505, w - 520, 54);
    g.fillStyle = col; g.fillRect(260, 505, (w - 520) * used / 100, 54);
    g.fillStyle = '#d7dde2';
    fit(`${f1(Math.round(left * 10) / 10)}% left · resets ${fmtAZ(new Date(u.resetsAt), { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} AZ`, 600, 76, 690);
    g.fillStyle = '#8b949d';
    fit(`as of ${fmtAZ(new Date(u.recordedAt), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} AZ (last check, not live)`, 500, 66, 840);
  }
  usageTex.needsUpdate = true;
}
drawUsage(null);
function drawTV() {
  const { g, c } = tvTex.userData, w = c.width, h = c.height;
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a1f4a'); gr.addColorStop(1, '#3a1d4f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.fillStyle = '#f2e9ff'; g.font = `800 150px ${FONT}`;
  g.fillText(fmtAZ(new Date(), { hour: 'numeric', minute: '2-digit' }), w / 2, 300);
  g.fillStyle = '#b9a8e0'; g.font = `600 52px ${FONT}`; g.fillText(fmtAZ(new Date(), { weekday: 'long', month: 'short', day: 'numeric' }) + ' · AZ', w / 2, 390);
  g.fillStyle = '#ffd27a'; g.font = `800 44px ${FONT}`; if ('letterSpacing' in g) g.letterSpacing = '6px'; g.fillText('PANDA FEDERATION H.Q.', w / 2, 500); if ('letterSpacing' in g) g.letterSpacing = '0px';
  tvTex.needsUpdate = true;
}
drawTV(); setInterval(drawTV, 20000);

// ---------- small warm lamps ----------
const lamps = [];
for (const [x, y, z, inten] of [[-19.2, 2.0, -5.2, 6], [0.6, 2.0, 13.0, 5], [2.9, 2.0, 4.4, 5], [18.6, 2.0, -3.8, 5], [-11, 2.0, -3.8, 5], [16.66, 2.2, 4.6, 5], [14.6, 2.4, -12.4, 4], [7.35, 2.4, 9.5, 3]]) {
  const p = new THREE.PointLight(0xffc98a, inten, 7, 1.6); p.position.set(x, y, z); scene.add(p); lamps.push({ p, base: inten });
}

// ---------- chibi bots (Kenney Mini Characters, recolored) ----------
function accessory(kind) {
  const g = new THREE.Group();
  switch (kind) {
    case 'calculator': rbox(0.2, 0.28, 0.05, '#e8e4da', 0, 0, 0, g, {}, 0.02); rbox(0.15, 0.06, 0.01, '#2f8a4c', 0, 0.08, 0.026, g, {}, 0.004);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) box(0.035, 0.03, 0.01, '#55585e', -0.05 + i * 0.05, -0.0 - j * 0.05, 0.026, g); break;
    case 'tablet': { rbox(0.32, 0.23, 0.03, '#1d2128', 0, 0, 0, g, {}, 0.02);
      const t = canvasTex(256, 192, (c, w, h) => { c.fillStyle = '#0d1a2e'; c.fillRect(0, 0, w, h); c.strokeStyle = '#5ff0a0'; c.lineWidth = 10; c.beginPath();
        [150, 120, 135, 90, 105, 60, 75, 40].forEach((y, i) => (i ? c.lineTo(20 + i * 31, y) : c.moveTo(20, y))); c.stroke(); });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.19), new THREE.MeshBasicMaterial({ map: t })); s.position.z = 0.017; g.add(s); break; }
    case 'box': rbox(0.34, 0.3, 0.34, '#b8864f', 0, 0, 0, g, {}, 0.02); box(0.35, 0.05, 0.09, '#e0c98f', 0, 0.14, 0, g); break;
    case 'book': rbox(0.24, 0.31, 0.07, '#2f6e55', 0, 0, 0, g, {}, 0.015); box(0.21, 0.29, 0.072, '#f0ead9', 0.016, 0, 0, g); box(0.245, 0.03, 0.074, '#d9b24a', 0, 0.1, 0, g); box(0.245, 0.03, 0.074, '#d9b24a', 0, -0.1, 0, g); break;
    case 'eraser': rbox(0.17, 0.44, 0.13, '#f08aa0', 0, 0, 0, g, {}, 0.03); rbox(0.175, 0.12, 0.135, '#ffc9d6', 0, -0.15, 0, g, {}, 0.02); break;
    case 'shield': { const s = cyl(0.22, 0.22, 0.05, '#1e8fa3', 0, 0, 0, g, 28); s.rotation.x = Math.PI / 2; const e = cyl(0.1, 0.1, 0.055, '#e8f6f8', 0, 0, 0.005, g, 20); e.rotation.x = Math.PI / 2; break; }
    case 'clipboard': rbox(0.24, 0.32, 0.03, '#8a5a36', 0, 0, 0, g, {}, 0.015); box(0.2, 0.25, 0.032, '#f6f2ea', 0, -0.015, 0, g);
      rbox(0.1, 0.045, 0.045, '#c9ced6', 0, 0.15, 0.01, g, {}, 0.01); for (let i = 0; i < 4; i++) box(0.13, 0.012, 0.034, '#a77de0', -0.01, 0.06 - i * 0.05, 0, g); break;
    case 'club': { // Kaido's studded kanabo, resting on the shoulder
      const k = new THREE.Group(); k.rotation.z = 0.5; g.add(k);
      cyl(0.045, 0.035, 0.32, '#3a2a1e', 0, -0.2, 0, k, 10); const head = cyl(0.11, 0.075, 0.7, '#2a2d33', 0, 0.3, 0, k, 10); head.material = mat('#2a2d33', { roughness: 0.5, metalness: 0.4 });
      for (let i = 0; i < 12; i++) { const a = i * 2.4, yy = 0.05 + (i % 4) * 0.16; const st = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 5), mat('#c9ced6', { metalness: 0.5, roughness: 0.4 })); st.position.set(Math.cos(a) * 0.1, yy, Math.sin(a) * 0.1); st.rotation.z = -Math.cos(a) * Math.PI / 2; st.rotation.x = Math.sin(a) * Math.PI / 2; k.add(st); }
      break; }
    case 'coin': { const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24), [mat('#c99a2e', { roughness: 0.4, metalness: 0.4 }), new THREE.MeshStandardMaterial({ map: coinTex, roughness: 0.4, metalness: 0.3 }), new THREE.MeshStandardMaterial({ map: coinTex, roughness: 0.4, metalness: 0.3 })]);
      cn.rotation.x = Math.PI / 2; cn.castShadow = true; g.add(cn); break; }
    case 'portal': { // swirling gold-blue gate held up in the hand (glows)
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.7, 0.6) })); g.add(r1);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 6, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.4, 2.6) })); g.add(r2);
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), new THREE.MeshBasicMaterial({ color: '#3a4fb0', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); g.add(d);
      g.userData.spin = [r1, r2]; break; }
    case 'planner': rbox(0.26, 0.32, 0.06, '#d94f86', 0, 0, 0, g, {}, 0.02); box(0.23, 0.3, 0.062, '#f6efe4', 0.016, 0, 0, g); box(0.16, 0.04, 0.064, '#b02a60', 0, 0.06, 0, g); break;
    case 'quill': { const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.48, 12), mat('#f4efe4')); f.position.y = 0.14; f.rotation.z = 0.25; f.castShadow = true; g.add(f);
      box(0.018, 0.14, 0.018, '#2b2b2e', 0.035, -0.14, 0, g); break; }
  }
  return g;
}
const CHAR_H = 1.32;
let charScale = 1, eyeSpec = null, headBox = null, torsoBox = null;
if (charGltf) {
  const tmp = charGltf.scene; tmp.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(tmp); charScale = CHAR_H / (bb.max.y - bb.min.y);
  const headMesh = tmp.getObjectByName('head-mesh');
  const hb = headMesh ? new THREE.Box3().setFromObject(headMesh) : null; headBox = hb;
  eyeSpec = hb ? { y: (hb.min.y + hb.max.y) / 2 - (hb.max.y - hb.min.y) * 0.06, z: hb.max.z + 0.002, dx: (hb.max.x - hb.min.x) * 0.17, r: (hb.max.x - hb.min.x) * 0.06, top: hb.max.y } : null;
}
// paint the shared body mesh per bot: each vertex takes its body part's color (by dominant bone)
function paintBody(mesh, look) {
  const g = mesh.geometry.clone(); mesh.geometry = g;
  const pos = g.attributes.position, ji = g.attributes.skinIndex, jw = g.attributes.skinWeight;
  const names = mesh.skeleton ? mesh.skeleton.bones.map((b) => b.name) : [];
  const col = new Float32Array(pos.count * 3), c = new THREE.Color();
  let tz = -1e9; for (let i = 0; i < pos.count; i++) tz = Math.max(tz, pos.getZ(i));
  for (let i = 0; i < pos.count; i++) {
    let best = 0, bw = -1; if (ji) for (let k = 0; k < 4; k++) { const w = jw.getComponent(i, k); if (w > bw) { bw = w; best = ji.getComponent(i, k); } }
    const n = names[best] || 'torso', x = pos.getX(i), z = pos.getZ(i);
    let part = 'torso';
    if (n.startsWith('leg')) part = 'legs';
    else if (n.startsWith('arm')) part = Math.abs(x) > 0.29 ? 'hands' : 'arms';
    else if (n === 'head') part = 'head';
    else if (z > tz - 0.035 && Math.abs(x) < 0.09) part = 'chest';
    c.set(look[part] || look.torso).convertSRGBToLinear(); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  mesh.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
}
// flag texture for Superseller's open-shirt reveal
const flagTex = canvasTex(256, 168, (g, w, h) => { for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#f4f4f4' : '#c8262e'; g.fillRect(0, i * h / 7, w, h / 7 + 1); }
  g.fillStyle = '#23407e'; g.fillRect(0, 0, w * 0.45, h * 4 / 7); g.fillStyle = '#fff'; for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) g.fillRect(8 + k * 21 + (r % 2) * 10, 8 + r * 22, 6, 6); });
const coinTex = canvasTex(128, 128, (g, w) => { g.fillStyle = '#e8b93a'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill(); g.strokeStyle = '#a87a1c'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#7a5410'; g.font = `900 84px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', w / 2, w / 2 + 4); });
// head/torso-anchored decorations. Offsets are world units from the head center (y up, z toward the face).
function decorate(id, put, putT) {
  const M = (c, o) => mat(c, o);
  const sph = (r, c, x, y, z, sx = 1, sy = 1, sz = 1, o) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), M(c, o)); m.scale.set(sx, sy, sz); m.castShadow = true; return put(m, x, y, z); };
  const bx = (w, h, d, c, x, y, z, o, r = 0.03) => put(rbox(w, h, d, c, 0, 0, 0, new THREE.Group(), o, r).parent, x, y, z);
  const cone = (r, h, c, x, y, z, rx = 0, rz = 0, seg = 8) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), M(c)); m.rotation.set(rx, 0, rz); m.castShadow = true; return put(m, x, y, z); };
  switch (id) {
    case 'overlord': { // Kaido: big curved horns, long black hair + beard, feathered purple collar, white rope belt
      const HR = 0.3, hornG = new THREE.TorusGeometry(HR, 0.075, 8, 14, Math.PI / 2), hornM = M('#e8e1cf', { roughness: 0.55 });
      for (const sd of [-1, 1]) { // sweep out from the temples, then up (Kaido's horns)
        const h = new THREE.Mesh(hornG, hornM); h.rotation.set(0, sd < 0 ? Math.PI : 0, -Math.PI / 2); h.castShadow = true; put(h, sd * 0.36, 0.1 + HR, -0.04);
        cone(0.075, 0.3, '#e8e1cf', sd * (0.36 + HR), 0.1 + HR + 0.14, -0.04, 0, -sd * 0.12); }
      bx(0.94, 0.1, 0.7, '#17131c', 0, 0.31, -0.04, { roughness: 0.95 }, 0.04); // hair
      bx(0.9, 0.85, 0.22, '#17131c', 0, -0.22, -0.36, { roughness: 0.95 }, 0.09); // long hair down the back
      for (const sd of [-1, 1]) bx(0.14, 0.62, 0.3, '#17131c', sd * 0.47, -0.12, -0.08, { roughness: 0.95 }, 0.06);
      cone(0.2, 0.42, '#17131c', 0, -0.42, 0.28, Math.PI, 0); // beard
      bx(0.5, 0.06, 0.06, '#17131c', 0, -0.1, 0.35, {}, 0.02); // moustache
      for (let k = 0; k < 9; k++) { const a = -Math.PI * 0.85 + k * Math.PI * 1.7 / 8; cone(0.09, 0.34, '#8a5cc4', Math.sin(a) * 0.5, -0.38, Math.cos(a) * 0.34 - 0.04, -Math.cos(a) * 0.9, Math.sin(a) * 0.9, 5); }
      putT(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 6, 18), M('#f1ece2')), 0, -0.16, 0.02, Math.PI / 2); // rope belt
      for (const [x, y] of [[-0.1, 0.06], [0.08, 0.1], [0.02, -0.04]]) putT(new THREE.Mesh(new THREE.CircleGeometry(0.04, 6), M('#3c5a8a')), x, y, 0.19); // scale tattoo hints
      break; }
    case 'planner': // SecretaryBot: big curly auburn hair, glasses
      for (const [x, y, z, r] of [[0, 0.34, -0.05, 0.3], [-0.32, 0.25, -0.05, 0.25], [0.32, 0.25, -0.05, 0.25], [-0.46, 0.0, -0.08, 0.24], [0.46, 0.0, -0.08, 0.24], [-0.44, -0.3, -0.12, 0.22], [0.44, -0.3, -0.12, 0.22],
        [0, 0.12, -0.35, 0.36], [-0.25, -0.25, -0.33, 0.26], [0.25, -0.25, -0.33, 0.26], [0, -0.4, -0.3, 0.24], [-0.18, 0.36, 0.18, 0.16], [0.18, 0.38, 0.16, 0.17]]) sph(r, '#c4552a', x, y, z, 1, 1, 1, { roughness: 0.95 });
      for (const sd of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 6, 16), M('#7a3a2a')); put(ring, sd * 0.15, -0.03, 0.36); }
      bx(0.1, 0.02, 0.02, '#7a3a2a', 0, -0.02, 0.36, {}, 0.005);
      break;
    case 'superseller': { // eBay Superbot: neat dark hair, suit jacket open over a flag shirt, red tie knot
      bx(0.93, 0.09, 0.7, '#3a2a20', 0, 0.31, -0.03, {}, 0.04); bx(0.93, 0.36, 0.08, '#3a2a20', 0, 0.12, -0.33, {}, 0.03); bx(0.6, 0.08, 0.06, '#3a2a20', 0.1, 0.25, 0.33, {}, 0.03);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.22), new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.8 })); putT(f, 0, 0.02, 0.201);
      break; }
    case 'shadow': // Schoolbot (South Park kid): blue beanie, red brim + pom
      sph(0.47, '#3f6fd0', 0, 0.12, -0.02, 1, 0.62, 0.78, { roughness: 0.95 });
      { const brim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.06, 8, 24), M('#d23a3a')); brim.rotation.x = Math.PI / 2; brim.scale.set(1, 0.8, 1); put(brim, 0, 0.14, -0.02); }
      sph(0.09, '#d23a3a', 0, 0.44, -0.02);
      break;
    case 'stockbot': // panda robot: black ears, black eye patches, headphones
      for (const sd of [-1, 1]) { sph(0.13, '#16181c', sd * 0.33, 0.34, -0.05, 1, 1, 0.6); sph(0.13, '#16181c', sd * 0.16, -0.02, 0.31, 1, 1.15, 0.35);
        const cup = cyl(0.13, 0.13, 0.09, '#59616d', 0, 0, 0, new THREE.Group(), 16); cup.rotation.z = Math.PI / 2; put(cup.parent, sd * 0.47, -0.02, -0.02); }
      { const band = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.035, 6, 20, Math.PI), M('#59616d')); put(band, 0, -0.02, -0.02); }
      break;
    case 'ledger': // Family Ledger: green accountant's visor
      { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.06, 20, 1, true, -Math.PI * 0.55, Math.PI * 1.1), new THREE.MeshStandardMaterial({ color: '#2f9a6a', transparent: true, opacity: 0.8, side: THREE.DoubleSide, roughness: 0.6 }));
        put(v, 0, 0.18, 0); const bill = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16, 0, Math.PI), v.material); bill.rotation.x = -Math.PI / 2 + 0.15; put(bill, 0, 0.16, 0.34); }
      bx(0.92, 0.08, 0.68, '#5a3a22', 0, 0.31, -0.04, {}, 0.03);
      break;
    case 'eraser': // Cloudy: fluffy cloud puffs + rosy cheeks
      for (const [x, y, z, r] of [[0, 0.32, 0, 0.26], [-0.3, 0.24, 0.02, 0.22], [0.3, 0.24, 0.02, 0.22], [-0.48, -0.02, 0, 0.2], [0.48, -0.02, 0, 0.2], [0, 0.2, -0.3, 0.26], [-0.18, 0.36, 0.18, 0.15], [0.2, 0.36, 0.14, 0.16]]) sph(r, '#ffffff', x, y, z, 1, 1, 1, { roughness: 1 });
      for (const sd of [-1, 1]) sph(0.06, '#ff9fb4', sd * 0.27, -0.13, 0.33, 1, 0.6, 0.3);
      break;
    case 'kimchi': // fuzzy golden blob with a little thought-bubble trail
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; sph(0.11, k % 2 ? '#8a7430' : '#a8913c', Math.cos(a) * 0.46, Math.sin(a) * 0.3 + 0.02, -0.02, 1, 1, 1.6, { roughness: 1 }); }
      sph(0.06, '#a8913c', 0.6, 0.45, 0.05); sph(0.04, '#a8913c', 0.7, 0.58, 0.05);
      break;
    case 'moneybot': // cyber jackrabbit: tall ears, gold spiked mohawk
      for (const sd of [-1, 1]) { const e = bx(0.13, 0.55, 0.08, '#2f7d44', sd * 0.22, 0.55, -0.05, {}, 0.05); e.rotation.z = -sd * 0.18; bx(0.06, 0.4, 0.03, '#7dff6a', sd * 0.22, 0.56, -0.005, { emissive: '#3eff6c', emissiveIntensity: 0.6 }, 0.02).rotation.z = -sd * 0.18; }
      for (let k = 0; k < 5; k++) cone(0.08, 0.3, '#e8b93a', 0, 0.38 - Math.abs(k - 2) * 0.03, -0.25 + k * 0.12, -0.3 + k * 0.15, 0, 5);
      break;
    case 'scribe': // Gatewalkers Guide: deep hood
      sph(0.56, '#151829', 0, 0.04, -0.08, 1, 0.92, 0.9, { roughness: 1, side: THREE.BackSide });
      sph(0.57, '#232842', 0, 0.06, -0.12, 1, 0.94, 0.86, { roughness: 1 });
      cone(0.2, 0.34, '#232842', 0, 0.48, -0.25, -0.7, 0);
      break;
  }
}
function makeBot(def, i) {
  const root = new THREE.Group(); scene.add(root);
  const c = def.color, look = LOOKS[def.id] || {};
  const skin = new THREE.MeshStandardMaterial({ color: look.head || c, roughness: 0.92, metalness: 0 });
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.62), roughness: 0.92, metalness: 0 });
  const bot = { def, i, root, loc: 'lounge', path: [], onArrive: null, want: 'idle', info: null, handled: null, seat: SEATS[i], desk: DESKS[def.id], lane: (i - 4) * 0.24 };
  let model, mixer = null, acts = {}, bones = {};
  let put = null, putT = null;
  if (charGltf) {
    model = SkeletonUtils.clone(charGltf.scene); model.scale.setScalar(charScale);
    model.traverse((o) => { if (o.isMesh) { if (o.name.includes('body')) paintBody(o, look); else o.material = skin; o.castShadow = true; o.receiveShadow = true; } if (o.isBone || o.type === 'Object3D') bones[o.name] = o; });
    mixer = new THREE.AnimationMixer(model);
    for (const n of ['static', 'sit', 'walk', 'holding-both']) { const cl = THREE.AnimationClip.findByName(charGltf.animations, n); if (cl) acts[n] = mixer.clipAction(cl); }
    const head = model.getObjectByName('head');
    if (head && eyeSpec) { // eyes, parented to the head bone (in model space units)
      const inv = new THREE.Matrix4(); charGltf.scene.getObjectByName('head').updateMatrixWorld(true); inv.copy(charGltf.scene.getObjectByName('head').matrixWorld).invert();
      const ES = look.eyes || 'dot';
      const eyeM = ES === 'glow' ? new THREE.MeshBasicMaterial({ color: new THREE.Color(look.eyeColor).multiplyScalar(2.2) }) : new THREE.MeshBasicMaterial({ color: ES === 'googly' ? '#ffffff' : '#14161b' });
      const pupM = new THREE.MeshBasicMaterial({ color: '#111216' });
      for (const s of [-1, 1]) {
        const r = eyeSpec.r * (ES === 'googly' ? 2.1 : ES === 'glow' ? 1.25 : 1);
        const e = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), eyeM); e.scale.z = 0.45; e.position.set(s * eyeSpec.dx * (ES === 'googly' ? 1.15 : 1), eyeSpec.y, eyeSpec.z).applyMatrix4(inv); head.add(e);
        if (ES === 'googly') { const pp = new THREE.Mesh(new THREE.SphereGeometry(eyeSpec.r * 0.85, 10, 8), pupM); pp.scale.z = 0.4; pp.position.set(s * eyeSpec.dx * 1.15 + s * eyeSpec.r * 0.5, eyeSpec.y - eyeSpec.r * 0.3, eyeSpec.z + eyeSpec.r * 0.5).applyMatrix4(inv); head.add(pp); }
      }
      bot.headTopLocal = new THREE.Vector3(0, eyeSpec.top, 0).applyMatrix4(inv);
      bot.headBone = head;
      const hc = headBox.getCenter(new THREE.Vector3());
      put = (obj, x, y, z) => { obj.scale.multiplyScalar(1 / charScale); obj.position.set(hc.x + x / charScale, hc.y + y / charScale, hc.z + z / charScale).applyMatrix4(inv); head.add(obj); return obj; };
    }
    const torsoB = model.getObjectByName('torso');
    if (torsoB) { // torso-anchored: offsets in world units from the torso bone, z toward the front
      const tinv = new THREE.Matrix4(); const t0 = charGltf.scene.getObjectByName('torso'); t0.updateMatrixWorld(true); tinv.copy(t0.matrixWorld).invert();
      const tw = new THREE.Vector3().setFromMatrixPosition(t0.matrixWorld);
      putT = (obj, x, y, z, rx = 0) => { obj.scale.multiplyScalar(1 / charScale); obj.rotation.x += rx; obj.position.set(tw.x + x / charScale, tw.y + (0.2 + y) / charScale, z / charScale).applyMatrix4(tinv); obj.castShadow = true; torsoB.add(obj); return obj; };
    }
  } else { // fallback: code-built chibi
    model = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.3, 6, 16), skin); body.position.y = 0.5; model.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), skin); head.position.y = 1.08; model.add(head);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat('#14161b')); e.position.set(s * 0.13, 1.1, 0.38); model.add(e); }
    model.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }
  root.add(model);
  if (put && putT) decorate(def.id, put, putT);
  // accessory: backpack on the back; others held in front
  const torso = model.getObjectByName('torso');
  const att = (obj, parent, pos) => { const inv = 1 / charScale; obj.scale.setScalar(inv); obj.position.copy(pos).multiplyScalar(inv); parent.add(obj); };
  if (def.acc === 'backpack') {
    const bp = new THREE.Group(); rbox(0.44, 0.46, 0.2, '#4a6fb0', 0, 0, 0, bp, {}, 0.06); rbox(0.32, 0.16, 0.06, '#3a5a94', 0, -0.1, -0.11, bp, {}, 0.03);
    if (torso) att(bp, torso, new THREE.Vector3(0, 0.22, -0.24)); else { bp.position.set(0, 0.55, -0.3); model.add(bp); }
  } else if (def.acc !== 'none') {
    const a = accessory(def.acc); a.rotation.x = -0.15;
    if (torso) att(a, torso, new THREE.Vector3(def.acc === 'portal' ? -0.3 : 0.3, def.acc === 'club' ? 0.3 : 0.12, 0.18)); else { a.position.set(0.32, 0.55, 0.28); model.add(a); }
  }
  const paper = rbox(0.24, 0.02, 0.3, '#f4efe4', 0, 0, 0, new THREE.Group(), {}, 0.005);
  const paperG = paper.parent; paperG.visible = false;
  if (torso) att(paperG, torso, new THREE.Vector3(0, 0.3, 0.3)); else { paperG.position.set(0, 0.8, 0.35); model.add(paperG); }
  Object.assign(bot, { model, mixer, acts, paper: paperG, skin, dark });

  // name tag
  const el = document.createElement('div'); el.className = 'tag';
  el.innerHTML = '<span class="short"><span class="mk" hidden></span><span class="nm"></span></span><span class="full"><b></b><span class="st"></span><span class="tx"></span></span>';
  el.querySelector('.nm').textContent = def.short; el.querySelector('.full b').textContent = def.name;
  const tag = new CSS2DObject(el); tag.position.set(0, CHAR_H + (i % 2 ? 0.75 : 0.3), 0); root.add(tag);
  el.addEventListener('pointerenter', () => el.classList.add('open'));
  el.addEventListener('pointerleave', () => { if (!el.dataset.pinned) el.classList.remove('open'); });
  el.addEventListener('click', (e) => { e.stopPropagation(); el.dataset.pinned = el.dataset.pinned ? '' : '1'; el.classList.toggle('open', !!el.dataset.pinned); });
  bot.el = el; bot.tag = tag;
  root.traverse((o) => { if (o.isMesh) o.userData.bot = bot; });
  return bot;
}
const bots = TEAM.map(makeBot);
const byId = Object.fromEntries(bots.map((b) => [b.def.id, b]));

function setClip(b, name, paused = true) {
  if (!b.mixer) return;
  if (b.clip === name) return; b.clip = name;
  b.mixer.stopAllAction();
  const a = b.acts[name] || b.acts.static; if (!a) return;
  a.reset(); a.setLoop(THREE.LoopRepeat); a.play();
  a.paused = false; b.mixer.update(0); a.paused = paused; // static poses: freeze on the first frame, no bob
}

// ---------- routing ----------
const V = (x, z) => new THREE.Vector3(x, 0, z);
function seatFront(b) { const [sx, sz, f] = b.seat; return [sx + Math.sin(f) * 0.95, sz + Math.cos(f) * 0.95]; }
function routeTo(b, dest) {
  const lz = b.lane, out = [];
  const exitLounge = () => { const [fx, fz] = seatFront(b); const pts = [[fx, fz]]; if (fz < 6.8) pts.push([fx, 6.8], [fx < 7.35 ? 4.7 : 10.0, 6.8]); const ex = pts[pts.length - 1][0];
    pts.push([ex, 10.9], [1.5, 10.9], [1.5, lz]); return pts; };
  const exit = { lounge: exitLounge,
    desk: () => { const [dx, dz] = b.desk; if (b.def.id === 'overlord') return [[-14.0, dz], [-13.9, -3], [-13.9, lz]]; if (b.def.id === 'planner') return [[-16.6, dz], [-16.6, lz]]; return dz < 0 ? [[dx + 1.25, dz], [dx + 1.25, lz]] : [[dx, lz]]; },
    tray: () => [[-13.9, -5.5], [-13.9, -3], [-13.9, lz]] };
  const enter = { lounge: () => exitLounge().reverse().concat([[b.seat[0], b.seat[1]]]),
    desk: () => { const [dx, dz] = b.desk; if (b.def.id === 'overlord') return [[-13.9, lz], [-13.9, -3], [-14.0, dz], [dx, dz]]; if (b.def.id === 'planner') return [[-16.6, lz], [-16.6, dz], [dx, dz]]; return dz < 0 ? [[dx + 1.25, lz], [dx + 1.25, dz], [dx, dz]] : [[dx, lz], [dx, dz]]; },
    tray: () => [[-13.9, lz], [-13.9, -3], [-13.9, -5.5], [TRAY[0], TRAY[1] + 0.85]] };
  out.push(...exit[b.loc](), ...enter[dest]());
  return out.map(([x, z]) => V(x, z));
}
// seat cushion offsets (tuned so the sit pose rests on top of the cushion, not inside it)
const SEAT_FIT = { sofa: { y: 0.62, f: 0.22 }, sofaSmall: { y: 0.55, f: 0.2 }, chair: { y: 0.6, f: 0.16 } };
function place(b, where) {
  b.loc = where; b.path = [];
  let [x, z] = where === 'lounge' ? b.seat : where === 'desk' ? b.desk : [TRAY[0], TRAY[1] + 0.85];
  const sitting = where === 'lounge' || (where === 'desk' && b.want === 'working');
  let y = 0;
  if (sitting && where === 'lounge') { const fit = SEAT_FIT[b.seat[3] ? 'sofaSmall' : 'sofa']; x += Math.sin(b.seat[2]) * fit.f; z += Math.cos(b.seat[2]) * fit.f; y = fit.y; }
  else if (sitting) { z += SEAT_FIT.chair.f; y = SEAT_FIT.chair.y; }
  b.root.position.set(x, y, z);
  b.root.rotation.y = where === 'lounge' ? b.seat[2] : where === 'tray' ? Math.PI : 0;
  setClip(b, sitting ? 'sit' : 'static', true);
}
function go(b, dest, onArrive) {
  if (b.loc === dest && !b.path.length) { onArrive && onArrive(); return; }
  b.path = routeTo(b, dest); b.dest = dest; b.onArrive = onArrive; b.root.position.y = 0;
  setClip(b, b.paper.visible ? 'walk' : 'walk', false);
}
function decide(b) {
  if (b.path.length) return;
  const s = b.want;
  if (s === 'working' || s === 'waiting' || s === 'error') {
    if (b.loc !== 'desk') go(b, 'desk');
    else { const sit = s === 'working'; if ((b.clip === 'sit') !== sit) place(b, 'desk'); }
    return;
  }
  if (s === 'done' && b.handled !== b.doneKey && b.def.id !== 'overlord') {
    b.handled = b.doneKey; b.paper.visible = true;
    go(b, 'tray', () => { b.paper.visible = false; dropPaper(); b.pauseUntil = performance.now() + 700; });
    return;
  }
  if (b.pauseUntil && performance.now() < b.pauseUntil) return;
  if (b.loc !== 'lounge') go(b, 'lounge');
}
const PAPER_GEO = new THREE.BoxGeometry(0.26, 0.008, 0.32);
function dropPaper() {
  const p = new THREE.Mesh(PAPER_GEO, mat('#f4efe4')); // shared geometry + cached material: nothing to dispose
  p.position.set(TRAY[0] + rand(-0.04, 0.04), 0.8 + trayPapers.children.length * 0.01, TRAY[1] + rand(-0.03, 0.03)); p.rotation.y = rand(-0.2, 0.2);
  trayPapers.add(p); if (trayPapers.children.length > 8) trayPapers.remove(trayPapers.children[0]);
}
const SPEED = 2.4;
const STEP_V = new THREE.Vector3();
function step(b, dt) {
  if (b.path.length) {
    const target = b.path[0], pos = b.root.position;
    const d = STEP_V.copy(target).sub(pos); d.y = 0; const dist = d.length();
    if (dist < 0.02) b.path.shift();
    else {
      pos.addScaledVector(d.normalize(), Math.min(dist, SPEED * dt));
      const ang = Math.atan2(d.x, d.z); let da = ang - b.root.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
      b.root.rotation.y += da * Math.min(1, dt * 12);
      if (b.mixer) b.mixer.update(dt);
    }
    if (!b.path.length) { b.loc = b.dest; place(b, b.loc); const cb = b.onArrive; b.onArrive = null; cb && cb(); }
  }
  decide(b);
}

// ---------- side panel (real data only) ----------
const panel = document.getElementById('panel');
const teamEl = document.getElementById('team'), actEl = document.getElementById('activity'), actSec = document.getElementById('actsec');
const STATE_LABEL = { working: 'Working', waiting: 'Needs you', error: 'Error', done: 'Done', idle: 'Idle' };
teamEl.innerHTML = TEAM.map((t) => `<li data-id="${t.id}"><i style="background:${t.color}"></i><div><b><span class="nf">${t.name}</span><span class="ns">${t.short}</span></b><small>${t.dept}</small><em></em></div><span class="chip"></span></li>`).join('');
const activity = { live: [], sim: [] }; const lastSeen = {};
function renderPanel(src, isSim) {
  for (const t of TEAM) {
    const li = teamEl.querySelector(`[data-id="${t.id}"]`); const r = src[t.id] || {}; const eff = r.effective || r.state || 'idle';
    li.querySelector('em').textContent = r.text || ''; const chip = li.querySelector('.chip'); chip.textContent = STATE_LABEL[eff] || eff; chip.className = 'chip ' + eff;
  }
  const list = isSim ? activity.sim : activity.live;
  actSec.hidden = !list.length;
  actEl.innerHTML = list.slice(0, 12).map((a) => `<li><time>${a.sim ? 'sim' : fmtAZ(new Date(a.at), { hour: 'numeric', minute: '2-digit' })}</time><i style="background:${byId[a.bot].def.color}"></i><div><b>${byId[a.bot].def.short}</b> ${STATE_LABEL[a.state] || a.state}${a.text ? ' · ' + escapeHtml(a.text) : ''}</div></li>`).join('');
  document.getElementById('actlabel').textContent = isSim ? 'Activity (Simulation)' : 'Activity';
}
function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function trackLive(src) {
  for (const id in src) { const r = src[id]; if (!r || !r.updatedAt) continue; if (lastSeen[id] === r.updatedAt) continue; lastSeen[id] = r.updatedAt;
    activity.live.unshift({ bot: id, state: r.state, text: r.text, at: r.updatedAt }); }
  activity.live.sort((a, b) => b.at - a.at); activity.live.length = Math.min(activity.live.length, 30);
}

// ---------- status data ----------
const feedEl = document.getElementById('feed'), feedText = document.getElementById('feedtext'), warnEl = document.getElementById('warn');
let live = { bots: {}, usage: null }, sim = null, firstLoad = true;
const ago = (ms) => { const m = Math.round(ms / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`; };
function applyStates(src, isSim) {
  const now = Date.now();
  for (const b of bots) {
    const r = src[b.def.id] || { effective: 'idle', state: 'idle', text: '' };
    const eff = r.effective || r.state;
    b.want = eff;
    if (eff === 'done') b.doneKey = r.updatedAt;
    b.info = r;
    const mk = b.el.querySelector('.mk');
    mk.hidden = !(eff === 'waiting' || eff === 'error');
    mk.className = 'mk ' + (eff === 'error' ? 'err' : 'wait'); mk.textContent = eff === 'error' ? '!' : '?';
    b.el.querySelector('.st').textContent = `${b.def.dept} · ${eff}${r.updatedAt && !isSim ? ' · ' + ago(now - r.updatedAt) : ''}`;
    b.el.querySelector('.tx').textContent = r.text || '';
    const scr = deskScreens[b.def.id]; if (scr) scr.material.color.set(eff === 'working' ? '#9fd4ff' : eff === 'error' ? '#ff8a7a' : eff === 'waiting' ? '#ffd27a' : '#2a3a4c').multiplyScalar(eff === 'idle' || eff === 'done' ? 1 : 1.6);
    if (firstLoad && !isSim) {
      if (eff === 'done') b.handled = b.doneKey;
      place(b, ['working', 'waiting', 'error'].includes(eff) ? 'desk' : 'lounge');
    }
  }
  renderPanel(src, isSim);
  if (!isSim) firstLoad = false;
}
let polling = false, pollTimer = 0;
async function poll() {
  if (polling) return; polling = true; clearTimeout(pollTimer);
  let ok = false;
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), 12000);
  try {
    const r = await fetch('/api/state', { cache: 'no-store', credentials: 'same-origin', signal: ac.signal });
    if (r.status === 401) { location.replace('/login'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    live = await r.json();
    drawUsage(live.usage);
    trackLive(live.bots);
    if (!sim) applyStates(live.bots, false);
    const active = Object.values(live.bots).filter((x) => ['working', 'waiting', 'error'].includes(x.effective)).length;
    feedEl.className = 'feed ' + (live.feed.quiet ? 'bad' : 'ok');
    feedText.textContent = active ? `live · ${active} active` : 'live · all idle';
    warnEl.hidden = !live.feed.quiet;
    if (live.feed.quiet) warnEl.textContent = 'Status feed has been quiet for 45+ minutes (no heartbeat).';
    ok = true;
  } catch (e) {
    feedEl.className = 'feed bad'; feedText.textContent = 'feed error';
    warnEl.hidden = false; warnEl.textContent = 'Status feed unreachable — showing last known state.';
    if (firstLoad) applyStates({}, false);
  } finally {
    clearTimeout(to); polling = false;
    // keep polling forever; retry sooner after a network blip
    pollTimer = setTimeout(poll, ok ? 15000 : 5000);
  }
}
poll();
addEventListener('online', () => poll());
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

// ---------- simulate work (browser only, never written to the API) ----------
const SIM_TEXT = ['Researching a topic', 'Drafting a document', 'Reviewing a checklist', 'Updating a report', 'Checking a routine', 'Organizing files', 'Comparing options', 'Writing a summary'];
const simBtn = document.getElementById('simbtn'), simLabel = document.getElementById('simlabel');
function startSim() {
  sim = { states: {}, next: {} }; activity.sim = [];
  const t0 = performance.now();
  bots.forEach((b, i) => { sim.states[b.def.id] = { state: 'idle', effective: 'idle', text: '' }; sim.next[b.def.id] = t0 + 300 + i * 450; });
  simBtn.textContent = 'Stop Simulation'; simBtn.classList.add('on'); simLabel.hidden = false;
  applyStates(sim.states, true);
}
function stopSim() {
  sim = null; simBtn.textContent = 'Simulate Work'; simBtn.classList.remove('on'); simLabel.hidden = true;
  applyStates(live.bots || {}, false);
}
function tickSim(now) {
  if (!sim) return;
  let changed = false;
  for (const b of bots) {
    const id = b.def.id; if (now < sim.next[id]) continue;
    const cur = sim.states[id].state; let nxt, dur;
    if (cur === 'idle' || cur === 'done') { nxt = 'working'; dur = rand(9000, 16000); }
    else if (cur === 'working') { const r = Math.random(); nxt = r < 0.15 ? 'waiting' : r < 0.2 ? 'error' : 'done'; dur = nxt === 'done' ? rand(7000, 9000) : rand(4000, 6000); }
    else { nxt = 'working'; dur = rand(5000, 9000); }
    if (cur === 'done') { nxt = Math.random() < 0.5 ? 'idle' : 'working'; dur = nxt === 'idle' ? rand(4000, 8000) : rand(9000, 15000); }
    sim.states[id] = { state: nxt, effective: nxt, text: nxt === 'idle' ? '' : nxt === 'waiting' ? 'Waiting on a decision' : nxt === 'error' ? 'Hit a snag, retrying' : SIM_TEXT[Math.floor(Math.random() * SIM_TEXT.length)], updatedAt: now };
    activity.sim.unshift({ bot: id, state: nxt, text: sim.states[id].text, sim: true }); activity.sim.length = Math.min(activity.sim.length, 30);
    sim.next[id] = now + dur; changed = true;
  }
  if (changed) applyStates(sim.states, true);
}
simBtn.addEventListener('click', () => (sim ? stopSim() : startSim()));
if (QS.get('simulate') === '1') startSim();

// ---------- tap/hover on bots ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downAt = null, hovered = null;
function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(bots.map((b) => b.root), true)[0]; return hit && hit.object.userData.bot;
}
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  const b = pick(e);
  for (const o of bots) if (o !== b) { o.el.dataset.pinned = ''; o.el.classList.remove('open'); }
  if (b) { b.el.dataset.pinned = b.el.dataset.pinned ? '' : '1'; b.el.classList.toggle('open', !!b.el.dataset.pinned); }
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const b = pick(e);
  if (hovered && hovered !== b && !hovered.el.dataset.pinned) hovered.el.classList.remove('open');
  if (b) b.el.classList.add('open'); hovered = b; renderer.domElement.style.cursor = b ? 'pointer' : '';
});

// ---------- time of day ----------
const TOD = {
  day: { hemi: [0xffefd8, 0x6a5240, 1.5], sun: [0xfff1dc, 2.3], exp: 1.25, lamp: 0.35, glow: 1.0, sunPos: [-14, 34, 22] },
  evening: { hemi: [0xffc9a0, 0x4a3448, 1.05], sun: [0xff9a5c, 1.5], exp: 1.2, lamp: 1.0, glow: 1.2, sunPos: [22, 16, 20] },
  night: { hemi: [0x9fb0ff, 0x2a2238, 0.55], sun: [0x8fa6ff, 0.55], exp: 1.15, lamp: 1.6, glow: 1.4, sunPos: [-10, 30, 18] },
};
let todMode = 'now';
function azHour() { return Number(fmtAZ(new Date(), { hour: 'numeric', hour12: false })) % 24; }
function resolveTod() { if (todMode !== 'now') return todMode; const h = azHour(); return h >= 6 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'evening' : 'night'; }
let todApplied = null;
function applyTod(force) {
  const m = resolveTod(); if (m === todApplied && !force) return; todApplied = m; const s = TOD[m];
  hemi.color.set(s.hemi[0]); hemi.groundColor.set(s.hemi[1]); hemi.intensity = s.hemi[2];
  sun.color.set(s.sun[0]); sun.intensity = s.sun[1]; sun.position.set(...s.sunPos); sun.target.position.set(0, 0, 0);
  renderer.toneMappingExposure = s.exp;
  for (const l of lamps) l.p.intensity = l.base * s.lamp;
  for (const g of glowMats) g.m.color.copy(g.base).multiplyScalar(1.7 * s.glow);
  drawSky(m); drawBossWindows(m);
  const fz = { day: ['#b4c6dc', 0.45, '#1e2a40', 0.15], evening: ['#8a86a8', 0.95, '#1a1e36', 0.5], night: ['#5a6478', 1.15, '#0f1522', 0.7] }[m];
  for (const f of [facadeX, facadeZ]) { f.color.set(fz[0]); f.emissiveIntensity = fz[1]; }
  for (const k of skyline) { k.color.set(fz[2]); k.emissiveIntensity = fz[3]; }
  document.querySelectorAll('#tod button').forEach((b) => b.classList.toggle('on', b.dataset.m === todMode));
}
document.querySelectorAll('#tod button').forEach((b) => b.addEventListener('click', () => { todMode = b.dataset.m; applyTod(true); }));
if (['day', 'evening', 'night'].includes(QS.get('tod'))) todMode = QS.get('tod');
applyTod(true); setInterval(() => applyTod(false), 60000);

// ---------- post-processing (drop effects before ever lowering resolution) ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
const renderPass = new RenderPass(scene, camera);
const aoPass = new N8AOPass(scene, camera, innerWidth, innerHeight);
aoPass.configuration.gammaCorrection = false; aoPass.configuration.aoRadius = 1.2; aoPass.configuration.distanceFalloff = 0.6; aoPass.configuration.intensity = 2.2;
aoPass.configuration.color = new THREE.Color('#1a1020'); aoPass.setQualityMode('Medium');
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.32, 0.45, 1.05);
const outPass = new OutputPass();
const smaa = new SMAAPass(innerWidth * devicePixelRatio, innerHeight * devicePixelRatio);
composer.addPass(renderPass); composer.addPass(aoPass); composer.addPass(bloom); composer.addPass(outPass); composer.addPass(smaa);
const fx = { ao: QS.get('ao') !== '0', bloom: QS.get('bloom') !== '0', shadows: true };
function syncFx() { aoPass.enabled = fx.ao; renderPass.enabled = !fx.ao; bloom.enabled = fx.bloom; smaa.enabled = fx.ao; renderer.shadowMap.enabled = fx.shadows; }
syncFx();
// adaptive: if frames are slow for a few seconds, drop AO, then bloom, then shadows. Never touch pixel ratio.
const perf = { t: 0, n: 0, warm: performance.now() + 4000, lock: QS.get('hq') === '1' };
function adapt(dt) {
  if (perf.lock || performance.now() < perf.warm) return;
  perf.t += dt; perf.n++;
  if (perf.t > 3) { const avg = perf.t / perf.n; perf.t = 0; perf.n = 0;
    if (avg > 0.045) { if (fx.ao) fx.ao = false; else if (fx.bloom) fx.bloom = false; else if (fx.shadows) fx.shadows = false; syncFx(); perf.warm = performance.now() + 2000; } }
}

// ---------- camera framing (fixed isometric, fit the room) ----------
const ROOM_PTS = []; for (const x of [-20.3, 20.3]) for (const z of [-14.3, 14.3]) for (const y of [-0.7, WH + 0.1]) ROOM_PTS.push(V(x, z).setY(y));
function frameCamera() {
  const wide = innerWidth > 900;
  const fs = document.body.classList.contains('fs');
  const panelW = wide && panel && panel.offsetWidth > 0 ? panel.offsetWidth + 24 : 0;
  const top = fs ? 40 : wide ? 64 : 70, bottom = fs ? 16 : wide ? 70 : 150;
  const availW = innerWidth - panelW - (wide ? 40 : 12), availH = innerHeight - top - bottom;
  const tgt = V(0, 0).setY(1.0);
  camera.position.copy(tgt).addScaledVector(ISO_DIR, 120); camera.up.set(0, 1, 0); camera.lookAt(tgt); camera.updateMatrixWorld();
  const inv = camera.matrixWorldInverse; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of ROOM_PTS) { const q = p.clone().applyMatrix4(inv); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
  const cw = x1 - x0, ch = y1 - y0;
  const s = innerWidth < innerHeight ? cw / availW : Math.max(cw / availW, ch / availH); // world units per px (portrait: fill width)
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const leftPx = (wide ? 20 : 6) + availW / 2, topPx = top + availH / 2;
  camera.left = cx - leftPx * s; camera.right = camera.left + innerWidth * s;
  camera.top = cy + topPx * s; camera.bottom = camera.top - innerHeight * s;
  camera.near = 1; camera.far = 300; camera.zoom = 1;
  camera.updateProjectionMatrix(); controls.target.copy(tgt); controls.update();
}
frameCamera();
function resize() {
  renderer.setPixelRatio(window.devicePixelRatio); renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight);
  composer.setPixelRatio(window.devicePixelRatio); composer.setSize(innerWidth, innerHeight); frameCamera();
}
addEventListener('resize', resize); resize();

// ---------- fullscreen (always-on display) ----------
const fsBtn = document.getElementById('fsbtn'), root = document.documentElement;
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsOK = !!(root.requestFullscreen || root.webkitRequestFullscreen);
function toggleFs() {
  if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else { const r = (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); }
}
let idleT = 0;
function wake() { document.body.classList.remove('idle'); clearTimeout(idleT); if (fsEl()) idleT = setTimeout(() => document.body.classList.add('idle'), 3000); }
function onFsChange() {
  const on = !!fsEl(); document.body.classList.toggle('fs', on);
  fsBtn.title = on ? 'Exit fullscreen (F or Esc)' : 'Fullscreen (F)'; fsBtn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Enter fullscreen');
  wake(); resize(); requestAnimationFrame(resize); // re-fit once the browser settles on the monitor size
}
if (fsOK) {
  fsBtn.hidden = false;
  fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFs(); fsBtn.blur(); });
  document.addEventListener('fullscreenchange', onFsChange); document.addEventListener('webkitfullscreenchange', onFsChange);
  addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); toggleFs(); }
  });
  addEventListener('pointermove', wake, { passive: true });
}
// GPU resets (driver update, sleep/wake): reload once the context is back instead of showing a frozen frame
renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());

// ---------- loop ----------
const clock = new THREE.Clock();
let scrAcc = 0, ledAcc = 0;
function loop() {
  const dt = Math.min(1.0, clock.getDelta()), t = clock.elapsedTime, now = performance.now();
  tickSim(now);
  for (let left = dt; left > 1e-4; left -= 0.04) { const d = Math.min(0.04, left); for (const b of bots) step(b, d); }
  scrAcc += dt; if (scrAcc > 0.12) { scrAcc = 0; for (const s of screens) { const { g, c } = s.tex.userData; s.draw(g, c.width, c.height, t); s.tex.needsUpdate = true; } }
  ledAcc += dt; if (ledAcc > 0.25) { ledAcc = 0; for (const l of leds) if (Math.random() < 0.25) { const m = l.led.material; m.color.equals(l.on) ? m.color.setRGB(0.05, 0.06, 0.07) : m.color.copy(l.on); } }
  brew.material.emissiveIntensity = Math.sin(t * 2) > 0 ? 1.4 : 0.3;
  controls.update();
  adapt(dt);
  if (fx.ao || fx.bloom) composer.render(); else renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
const PROJ_V = new THREE.Vector3();
window.__hq = { bots, live: () => live, fx, toggleFs, onFsChange, camera, controls, place,
  project: (x, y, z) => { PROJ_V.set(x, y, z).project(camera); return [(PROJ_V.x + 1) / 2 * innerWidth, (1 - PROJ_V.y) / 2 * innerHeight]; } };
