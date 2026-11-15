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
  { id: 'overlord', name: 'Overlord Boss', short: 'Overlord Boss', color: '#6a3c9c', dept: 'Leadership', acc: 'club' },
  { id: 'superseller', name: 'Superbot', short: 'Superbot', color: '#3a6fc4', dept: 'eBay Sales', acc: 'box' },
  { id: 'junior', name: 'Superbot Jr.', short: 'Superbot Jr.', color: '#6a9ae0', dept: 'eBay Sales', acc: 'clipboard' },
  { id: 'moneybot', name: 'Moneybot', short: 'Moneybot', color: '#2fbf4a', dept: 'Money Lab', acc: 'coin' },
  { id: 'mini', name: 'Mini-Money', short: 'Mini-Money', color: '#5ecf6a', dept: 'Money Lab', acc: 'clipboard' },
  { id: 'planner', name: 'SecretaryBot', short: 'SecretaryBot', color: '#c2346b', dept: 'Front Desk · Family', acc: 'planner' },
  { id: 'shadow', name: 'Schoolbot', short: 'Schoolbot', color: '#3f6fd0', dept: 'Family Office', acc: 'backpack' },
  { id: 'ledger', name: 'Family Ledger', short: 'Family Ledger', color: '#2f7a5a', dept: 'Family Office', acc: 'book' },
  { id: 'kimchi', name: 'Kimchi', short: 'Kimchi', color: '#a08a3a', dept: 'Family Office', acc: 'none' },
  { id: 'credit', name: 'Credit Repair', short: 'Credit Repair', color: '#e0892e', dept: 'Family Office', acc: 'folder' },
  { id: 'stockbot', name: 'Stockbot', short: 'Stockbot', color: '#d6dbe2', dept: 'Ops & Research', acc: 'tablet' },
  { id: 'eraser', name: 'Cloudy', short: 'Cloudy', color: '#cfe3ff', dept: 'Ops & Research', acc: 'eraser' },
  { id: 'sniper', name: 'Sniperbot', short: 'Sniper', color: '#5a7a3c', dept: 'Ops & Research (dormant)', acc: 'scope' },
  { id: 'scribe', name: 'Gatewalkers Guide', short: 'Gatewalkers Guide', color: '#d9a640', dept: "Writers' Den", acc: 'portal' },
];
// per-bot outfit: vertex colors by body part (head, torso, chest front, arms, hands, legs) + eye style
const LOOKS = {
  overlord: { head: '#c9956f', torso: '#5b2d8a', chest: '#c9956f', arms: '#5b2d8a', hands: '#c9956f', legs: '#4a2a6e', eyes: 'dot' },
  moneybot: { head: '#2f7d44', torso: '#245e34', chest: '#14301f', arms: '#2f8a4c', hands: '#1a3d27', legs: '#1a3d27', eyes: 'glow', eyeColor: '#7dff6a' },
  mini: { head: '#6ad078', torso: '#3d9a4e', chest: '#1a4024', arms: '#4eb85e', hands: '#2d6a38', legs: '#245a30', eyes: 'glow', eyeColor: '#b6ff8a' },
  stockbot: { head: '#eef1f4', torso: '#e8ebef', chest: '#1e2530', arms: '#b8bec7', hands: '#59616d', legs: '#4a5058', eyes: 'glow', eyeColor: '#5ff3ff' },
  superseller: { head: '#e6b994', torso: '#3d424b', chest: '#f1f1f1', arms: '#3d424b', hands: '#e6b994', legs: '#353a42', eyes: 'dot' },
  junior: { head: '#e8c4a0', torso: '#4a5a6e', chest: '#f4f4f4', arms: '#4a5a6e', hands: '#e8c4a0', legs: '#3a4450', eyes: 'dot' },
  ledger: { head: '#e8c4a0', torso: '#2f6e55', chest: '#efe6cf', arms: '#2f6e55', hands: '#e8c4a0', legs: '#1f4a3a', eyes: 'dot' },
  shadow: { head: '#f3d1b0', torso: '#8a5a36', chest: '#8a5a36', arms: '#8a5a36', hands: '#d23a3a', legs: '#3b5fa8', eyes: 'googly' },
  eraser: { head: '#f7fbff', torso: '#eef5ff', chest: '#ffffff', arms: '#eef5ff', hands: '#f7fbff', legs: '#d6e6fb', eyes: 'dot' },
  kimchi: { head: '#9a8233', torso: '#8f782e', chest: '#9a8233', arms: '#8f782e', hands: '#7d6828', legs: '#7d6828', eyes: 'googly' },
  scribe: { head: '#1c2036', torso: '#232842', chest: '#1a1e33', arms: '#232842', hands: '#2e3352', legs: '#1a1e33', eyes: 'glow', eyeColor: '#ffc65a' },
  planner: { head: '#f2c7a8', torso: '#c2346b', chest: '#f3e9d8', arms: '#c2346b', hands: '#f2c7a8', legs: '#3b2f3a', eyes: 'dot' },
  credit: { head: '#e9c39f', torso: '#1f4e79', chest: '#f5f1e8', arms: '#1f4e79', hands: '#e9c39f', legs: '#18324d', eyes: 'dot' },
  sniper: { head: '#d7c49a', torso: '#4a5c38', chest: '#2c3824', arms: '#556640', hands: '#3a4a2e', legs: '#3a432c', eyes: 'glow', eyeColor: '#9aff5c' },
};
const sidekickScale = (id) => (id === 'mini' || id === 'junior' ? 0.86 : 1);

// desk chair spots (bot faces +z, desk in front of it)
// v5 work floor, grouped by team. North row: eBay Sales | Money Lab | Leadership (center) | Ops & Research.
// South row: Family Office (beside SecretaryBot's front desk) | Writers' Den | Lounge | Team Huddle.
const DESKS = {
  superseller: [-17.6, -9.1], junior: [-14.6, -9.1], // eBay Sales
  moneybot: [-10.1, -9.1], mini: [-7.1, -9.1], // Money Lab
  overlord: [0, -9.1], // Leadership: the coordinator's glass office, center of the back row
  stockbot: [5.6, -9.1], eraser: [8.5, -9.1], sniper: [11.4, -9.1], // Ops & Research (Sniperbot keeps a desk, dormant)
  shadow: [-17.4, 6.0], ledger: [-14.0, 6.0], kimchi: [-10.0, 6.0], credit: [-6.6, 6.0], // Family Office
  scribe: [-1, 6.0], // Writers' Den
  planner: [-18.2, -1.6], // front desk in the lobby, facing into the hall (next to the Family Office)
};
// hall door (x) each desk uses: [door x on the z=-3 or z=3 hall wall]
const DESK_DOOR = { superseller: -13.0, junior: -13.0, moneybot: -5.95, mini: -5.95, stockbot: 7.0, eraser: 7.0, sniper: 7.0, shadow: -12.1, ledger: -12.1, kimchi: -12.1, credit: -12.1 };
// lounge: U-shaped sofas. [x, z, facing]
const SEATS = [[3.69, 5.3, 0], [5.11, 5.3, 0], [6.64, 5.3, 0], [8.06, 5.3, 0], [9.59, 5.3, 0], [11.01, 5.3, 0],
  [3.3, 8.1, Math.PI / 2], [11.1, 7.5, -Math.PI / 2, 1], [3.3, 9.5, Math.PI / 2], [11.1, 8.7, -Math.PI / 2, 1],
  [6.64, 9.35, Math.PI], [3.3, 10.9, Math.PI / 2], [5.2, 11.8, Math.PI, 0, 'bean'], [9.5, 11.8, Math.PI, 0, 'bean']];
const TRAY = [1.6, -7.0];
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
controls.screenSpacePanning = true; controls.minZoom = 0.6; controls.maxZoom = 4;
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
  const rows = 22, rh = h / rows;
  const tones = ['#4a2f1c', '#3f2718', '#352114', '#553522', '#462a19', '#3a2315'];
  for (let r = 0; r < rows; r++) {
    let x = -((r * 397) % 700);
    while (x < w) {
      const len = 420 + ((r * 131 + Math.abs(x)) % 280);
      g.fillStyle = tones[(r * 7 + Math.abs(Math.floor(x / 97))) % tones.length]; g.fillRect(x, r * rh, len, rh);
      g.globalAlpha = 0.07; g.fillStyle = '#1a0e08';
      for (let k = 0; k < 4; k++) g.fillRect(x + 16, r * rh + 8 + k * (rh - 16) / 4, len - 32, 1);
      g.globalAlpha = 1; g.fillStyle = 'rgba(18,10,6,.5)'; g.fillRect(x, r * rh, 3, rh);
      x += len;
    }
    g.fillStyle = 'rgba(18,10,6,.55)'; g.fillRect(0, r * rh, w, 3);
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
const FLOOR_H = 4.3, FLOORS = 12, TOWER_H = FLOOR_H * FLOORS, GROUND_Y = -0.7 - TOWER_H;
function facadeTex(widthW, cols, floors = FLOORS) {
  const PXW = 40, w = Math.round(widthW * PXW), h = Math.round(floors * FLOOR_H * PXW);
  const base = canvasTex(w, h, () => {}), glow = canvasTex(w, h, () => {});
  const g = base.userData.g, e = glow.userData.g;
  g.fillStyle = '#2a3242'; g.fillRect(0, 0, w, h); e.fillStyle = '#000'; e.fillRect(0, 0, w, h);
  const fh = FLOOR_H * PXW, band = 0.9 * PXW, cw = w / cols;
  for (let f = 0; f < floors; f++) {
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
  for (const c of [g, e]) { const fade = c.createLinearGradient(0, h * 0.35, 0, h); fade.addColorStop(0, 'rgba(12,18,30,0)'); fade.addColorStop(1, 'rgba(12,18,30,.55)'); c.fillStyle = fade; c.fillRect(0, 0, w, h); }
  base.needsUpdate = glow.needsUpdate = true; glow.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: base, emissiveMap: glow, emissive: '#ffffff', emissiveIntensity: 1, roughness: 0.5, metalness: 0.1 });
}
const facadeX = facadeTex(D + 0.6, 12), facadeZ = facadeTex(W + 0.6, 17), towerDark = mat('#141a26');
const OUTSIDE0 = scene.children.length; // everything from here to the sky backdrop stays put when the office floor peels back
const tower = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, TOWER_H, D + 0.6), [towerDark, facadeX, towerDark, towerDark, facadeZ, towerDark]);
// three stories lower than the office slab: the gap is the rec deck + residences (base sinks below the hazy ground)
tower.position.set(0, -0.7 - 3 * FLOOR_H - TOWER_H / 2, 0); scene.add(tower); // v5: three stories (rec deck + two residence floors) sit between the office and the tower body
const officeLedge = box(W + 1.0, 0.18, D + 1.0, '#5b6678', 0, -0.62, 0); // floor-plate ledge under our office
// distant towers (cheap boxes sharing one window texture), behind the room from the camera's view
const skyWin = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  for (let y = 6; y < h; y += 16) for (let x = 6; x < w; x += 14) if (srand() < 0.14) { g.fillStyle = srand() < 0.8 ? '#ffd48a' : '#bfe0ff'; g.fillRect(x, y, 6, 8); } });
skyWin.wrapS = skyWin.wrapT = THREE.RepeatWrapping;
const skyline = [];
for (let [x, z, w, d, top] of [[-34, -40, 5, 5, 6], [4, -46, 4, 6, 3], [32, -44, 5, 5, 9], [46, -26, 6, 7, 16],
  [54, -2, 5, 5, 4], [50, 18, 7, 6, 12], [62, 36, 6, 6, 18], [-28, -62, 8, 6, 22], [20, -66, 7, 7, 14], [-46, -14, 6, 6, 10]]) {
  top = top * 0.6 - 6; const hgt = top - GROUND_Y; const g = new THREE.BoxGeometry(w, hgt, d);
  const m = new THREE.MeshStandardMaterial({ color: '#1c2638', emissiveMap: skyWin, emissive: '#ffffff', emissiveIntensity: 0.8, roughness: 0.8, metalness: 0 });
  m.emissiveMap = skyWin.clone(); m.emissiveMap.repeat.set(w / 12, hgt / 24); m.emissiveMap.needsUpdate = true;
  const t = new THREE.Mesh(g, m); t.position.set(x, GROUND_Y + hgt / 2, z); scene.add(t); skyline.push(m);
  if (srand() < 0.6) { const ant = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), mat('#2a3346')); ant.position.set(x, top + 2, z); scene.add(ant);
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.4, 0.3) })); bl.position.set(x, top + 4.2, z); scene.add(bl); }
}

// ---------- city ground + sky backdrop (aligned to the fixed iso view: local +x = away from the camera, +z = screen right) ----------
const cityG = new THREE.Group(); cityG.rotation.y = Math.PI / 4; cityG.position.y = GROUND_Y; scene.add(cityG);
const G_NEAR = -90, G_FAR = 72, G_SIDE = 260;
const groundTex = canvasTex(1024, 2048, () => {}), groundGlow = canvasTex(1024, 2048, () => {});
{ const g = groundTex.userData.g, e = groundGlow.userData.g, w = 1024, h = 2048; // u along away-distance, v along screen-right
  g.fillStyle = '#3a3f48'; g.fillRect(0, 0, w, h); e.fillStyle = '#000'; e.fillRect(0, 0, w, h);
  const bs = 46, st = 10;
  for (let x = 0; x < w; x += bs) for (let y = 0; y < h; y += bs) {
    const k = srand(); g.fillStyle = k < 0.12 ? '#4f7d4a' : k < 0.2 ? '#6b7280' : ['#59606b', '#646a74', '#525862', '#6d6a64'][Math.floor(srand() * 4)];
    g.fillRect(x + st / 2, y + st / 2, bs - st, bs - st);
    if (k < 0.12) { g.fillStyle = '#3f6a3c'; for (let t = 0; t < 4; t++) { g.beginPath(); g.arc(x + 12 + srand() * 22, y + 12 + srand() * 22, 4, 0, 7); g.fill(); } }
  }
  g.fillStyle = 'rgba(230,230,210,.35)'; for (let x = 0; x < w; x += bs) for (let y = 0; y < h; y += 8) g.fillRect(x - 1, y, 2, 4); // lane marks
  for (let x = 0; x < w; x += bs) for (let y = 0; y < h; y += bs) { // street lights + traffic
    e.fillStyle = '#ffcf7a'; e.fillRect(x - 2, y - 2, 4, 4); if (srand() < 0.35) { e.fillStyle = srand() < 0.5 ? '#ff5a4a' : '#fff1c9'; e.fillRect(x - 1, y + 8 + srand() * 26, 3, 5); } }
  groundTex.needsUpdate = groundGlow.needsUpdate = true; }
const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, emissiveMap: groundGlow, emissive: '#ffffff', emissiveIntensity: 0.2, roughness: 1, metalness: 0 });
{ const gp = new THREE.Mesh(new THREE.PlaneGeometry(G_FAR - G_NEAR, G_SIDE * 2), groundMat); gp.rotation.x = -Math.PI / 2; gp.position.x = (G_FAR + G_NEAR) / 2; cityG.add(gp);
  // rotate the texture so its long side runs along screen-right
  groundTex.center.set(0.5, 0.5); groundTex.rotation = Math.PI / 2; groundGlow.center.set(0.5, 0.5); groundGlow.rotation = Math.PI / 2; }
// low-rise blocks: one instanced draw call
{ const N = 260, geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const bm = new THREE.MeshStandardMaterial({ color: '#ffffff', emissiveMap: skyWin, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.9, metalness: 0 });
  const im = new THREE.InstancedMesh(geo, bm, N); const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), col = new THREE.Color(), wp = new THREE.Vector3();
  let n = 0;
  for (let tries = 0; n < N && tries < 4000; tries++) {
    const lx = G_NEAR + 20 + srand() * (G_FAR - G_NEAR - 26), lz = (srand() * 2 - 1) * (G_SIDE - 10);
    wp.set(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    if (Math.abs(wp.x) < 27 && Math.abs(wp.z) < 21) continue; // keep clear of our tower
    const w = 3 + srand() * 5, d = 3 + srand() * 5, hh = 2 + Math.pow(srand(), 2) * 16;
    M4.compose(ps.set(lx, 0, lz), q, sc.set(w, hh, d)); im.setMatrixAt(n, M4);
    im.setColorAt(n, col.set(['#6d7684', '#7c8592', '#5f6876', '#8a8478', '#707a88'][Math.floor(srand() * 5)])); n++;
  }
  im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; cityG.add(im); skyline.push(bm); }
// sky backdrop: a tall world-space panel at the far edge of the ground, so the horizon meets the haze
const skyBackTex = canvasTex(256, 1024, () => {});
const SKY_BACK = { day: ['#3f7fcf', '#8fbde6', '#c9dff0'], evening: ['#23245a', '#8a4f7a', '#f0a070'], night: ['#03060f', '#0b1230', '#1c2647'] };
function drawSkyBack(mode) {
  const { g, c } = skyBackTex.userData, w = c.width, h = c.height, [top, mid, hor] = SKY_BACK[mode];
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.45, mid); gr.addColorStop(0.9, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (mode === 'night') { g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 90; i++) g.fillRect((i * 137) % w, (i * 389) % (h * 0.6), 2, 2); }
  if (mode === 'day') { g.fillStyle = 'rgba(255,255,255,.55)'; for (const [cx, cy] of [[60, 380], [190, 300], [120, 520], [30, 640]]) for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx + k * 22, cy - (k % 2) * 8, 34, 12, 0, 0, 7); g.fill(); } }
  skyBackTex.needsUpdate = true;
}
const SKY_H = 40; // the default framing sees roughly the lowest 10-25 units of this panel; above it the background is the top sky color
const skyBack = new THREE.Mesh(new THREE.PlaneGeometry(G_SIDE * 2, SKY_H), new THREE.MeshBasicMaterial({ map: skyBackTex, fog: false }));
skyBack.rotation.y = -Math.PI / 2; skyBack.position.set(G_FAR, SKY_H / 2, 0); cityG.add(skyBack);
scene.fog = new THREE.Fog('#c9dff0', 165, 215);
const OUTSIDE = new Set(scene.children.slice(OUTSIDE0)); OUTSIDE.delete(officeLedge);

// ---------- department rugs with glowing edges + lettering ----------
// floors: wood = hardwood, office = low-pile carpet tiles, tech = raised access floor, tile = ceramic, gym = sprung maple, carpet = lounge rug
const ZONES = [
  { name: 'EBAY SALES', x0: -20, x1: -12, z0: -14, z1: -3, color: '#2d5fb4', glow: '#7fb4ff', floor: 'office', tint: '#3f4f6e', labelX0: -16.4 }, // lettering clears the front-desk divider
  { name: 'MONEY LAB', x0: -12, x1: -4, z0: -14, z1: -3, color: '#2f8a4c', glow: '#7dff9e', floor: 'office', tint: '#3d5a48' },
  { name: 'LEADERSHIP', x0: -4, x1: 4, z0: -14, z1: -3, color: '#6a3c9c', glow: '#b48cff', back: true, floor: 'wood' },
  { name: 'OPS & RESEARCH', x0: 4, x1: 20, z0: -14, z1: -3, color: '#24386c', glow: '#5f8dff', floor: 'tech' },
  { name: 'FRONT DESK', x0: -20, x1: -15.6, z0: -3, z1: 3, color: '#7d5cc4', glow: '#c9b2ff', floor: 'wood', labelX0: -18.05 }, // lettering clears the elevator
  { name: 'RESTROOM', x0: 8, x1: 12, z0: -3, z1: 1.4, color: '#5d6a78', glow: '#bfe6ff', floor: 'tile' },
  { name: 'FAMILY OFFICE', x0: -20, x1: -4, z0: 3, z1: 14, color: '#b0532a', glow: '#ffc27a', floor: 'office', tint: '#6a5446' },
  { name: "WRITERS' DEN", x0: -4, x1: 2, z0: 3, z1: 14, color: '#b0532a', glow: '#ffae6b', floor: 'wood' },
  { name: 'LOUNGE', x0: 2, x1: 12, z0: 3, z1: 14, color: '#2f9a4f', glow: '#86ff8a', round: true, floor: 'carpet' },
  { name: 'TEAM HUDDLE', x0: 12, x1: 20, z0: 3, z1: 14, color: '#4a5568', glow: '#ffd27a', floor: 'office', tint: '#4b505c' },
  { name: 'GYM', x0: 12, x1: 20, z0: -3, z1: 3, color: '#343a46', glow: '#ff8a5c', floor: 'gym' },
];
function drawPlanks(g, cw, ch, tones, rows = 18) {
  const rh = ch / rows;
  for (let r = 0; r < rows; r++) {
    let x = -((r * 397) % 700);
    while (x < cw) {
      const len = 280 + ((r * 131 + Math.abs(x)) % 260);
      g.fillStyle = tones[(r * 7 + Math.abs(Math.floor(x / 97))) % tones.length];
      g.fillRect(x, r * rh, len, rh + 1);
      g.globalAlpha = 0.07; g.fillStyle = '#140a06';
      for (let k = 0; k < 4; k++) g.fillRect(x + 12, r * rh + 6 + k * (rh - 12) / 4, len - 24, 1);
      g.globalAlpha = 1; g.fillStyle = 'rgba(16,8,4,.45)'; g.fillRect(x, r * rh, 2, rh);
      x += len;
    }
    g.fillStyle = 'rgba(16,8,4,.5)'; g.fillRect(0, r * rh, cw, 2);
  }
}
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
    const kind = z.floor || (z.tile ? 'tile' : z.round ? 'carpet' : 'wood');
    if (kind === 'tile') {
      g.fillStyle = '#b7bcc2'; g.fillRect(0, 0, cw, ch);
      g.strokeStyle = 'rgba(90,96,104,.45)'; g.lineWidth = 4;
      for (let x = 0; x < cw; x += 0.8 * sx) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ch); g.stroke(); }
      for (let y = 0; y < ch; y += 0.8 * sy) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
    } else if (kind === 'carpet') {
      rr(g, 6, 6, cw - 12, ch - 12, r); g.fillStyle = z.color; g.fill();
      g.globalAlpha = 0.12; g.strokeStyle = '#000'; g.lineWidth = 3;
      for (let y = 20; y < ch; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
      g.globalAlpha = 1;
      rr(g, 0.28 * sx, 0.28 * sy, cw - 0.56 * sx, ch - 0.56 * sy, Math.max(4, r - 0.28 * sx)); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 5; g.stroke();
    } else if (kind === 'gym') {
      drawPlanks(g, cw, ch, ['#c9a066', '#be9560', '#d4ab70', '#b88c55', '#c49b62', '#ae854c'], 14);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 6;
      g.strokeRect(0.18 * sx, 0.18 * sy, cw - 0.36 * sx, ch - 0.36 * sy);
      g.beginPath(); g.arc(cw / 2, ch / 2, Math.min(cw, ch) * 0.16, 0, 7); g.stroke();
    } else if (kind === 'lino') {
      const tw0 = 0.55 * sx, th0 = 0.55 * sy;
      for (let y = 0, row = 0; y < ch; y += th0, row++) {
        for (let x = 0, col = 0; x < cw; x += tw0, col++) {
          g.fillStyle = (row + col) % 2 ? '#cbbb9c' : '#d4c6a8'; g.fillRect(x, y, tw0 + 1, th0 + 1);
        }
      }
      g.strokeStyle = 'rgba(140,124,96,.35)'; g.lineWidth = 2;
      for (let x = 0; x < cw; x += tw0) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ch); g.stroke(); }
      for (let y = 0; y < ch; y += th0) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
    } else if (kind === 'office') { // commercial carpet tiles, quarter-turned for a checker of pile direction
      const t = 0.6 * sx; const base = new THREE.Color(z.tint || '#4a5060');
      for (let y = 0, row = 0; y < ch; y += t, row++) for (let x = 0, col = 0; x < cw; x += t, col++) {
        g.fillStyle = '#' + base.clone().multiplyScalar((row + col) % 2 ? 1.0 : 0.9).getHexString(); g.fillRect(x, y, t + 1, t + 1);
        g.globalAlpha = 0.08; g.fillStyle = '#000'; for (let k = 4; k < t; k += 7) (row + col) % 2 ? g.fillRect(x + k, y, 2, t) : g.fillRect(x, y + k, t, 2); g.globalAlpha = 1; }
    } else if (kind === 'tech') {
      g.fillStyle = '#2a3140'; g.fillRect(0, 0, cw, ch);
      g.strokeStyle = 'rgba(111,211,255,.10)'; g.lineWidth = 2;
      const step = 0.45 * sx;
      for (let x = 0; x < cw; x += step) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ch); g.stroke(); }
      for (let y = 0; y < ch; y += step) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
    } else {
      drawPlanks(g, cw, ch, ['#4a2f1c', '#3f2718', '#352114', '#553522', '#462a19', '#3a2315'], 16);
    }
    // lettering along the front (camera-side) edge
    let size = band * sy * 0.56; const sp = 0.12;
    const setF = () => { g.font = `800 ${size}px ${FONT}`; if ('letterSpacing' in g) g.letterSpacing = `${size * sp}px`; };
    const lx0 = z.labelX0 != null ? Math.max(0, (z.labelX0 - x0) * sx) : 0, lw = cw - lx0;
    setF(); const maxW = (z.round ? 0.55 : 0.86) * lw; const tw = g.measureText(z.name).width;
    if (tw > maxW) { size *= maxW / tw; setF(); }
    const lightFloor = kind === 'tile' || kind === 'lino' || kind === 'gym';
    g.fillStyle = lightFloor ? 'rgba(52,58,66,.85)' : 'rgba(255,255,255,.9)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(z.name, lx0 + lw / 2, z.back ? band * 0.62 * sy : ch - (z.round ? band * 1.5 : band * 0.62) * sy);
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

// ---------- office partitions: framed glass with doorways, so every department is its own room ----------
const frost = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.38, roughness: 0.5, metalness: 0, depthWrite: false });
function partition(x0, z0, x1, z1, doors = [], h = 2.6, parent = scene, pane = glass) { // axis-aligned wall from (x0,z0) to (x1,z1); doors: [from,to] along the wall
  const alongX = z0 === z1, a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1;
  const at = (a, y, len, hh, d, m) => { const g = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len : d, hh, alongX ? d : len), m);
    g.position.set(alongX ? a : x0, y, alongX ? z0 : a); parent.add(g); return g; };
  const cuts = [a0, ...doors.flat(), a1];
  for (let i = 0; i < cuts.length; i += 2) {
    const s0 = cuts[i], s1 = cuts[i + 1], len = s1 - s0, mid = (s0 + s1) / 2; if (len <= 0.05) continue;
    at(mid, h / 2, len, h, 0.04, pane); at(mid, 1.35, len, 0.22, 0.05, frost);
    for (const yy of [0.04, h]) { const b = at(mid, yy, len, 0.07, 0.08, mat(FRAME)); b.castShadow = true; }
    for (const p of [s0, s1]) { const b = at(p, h / 2, 0.08, h, 0.08, mat(FRAME)); b.castShadow = true; }
  }
  for (const [d0, d1] of doors) at((d0 + d1) / 2, h - 0.18, d1 - d0, 0.3, 0.06, mat(FRAME)); // door header
}
// north row (hall side z = -3) + side walls: eBay Sales | Money Lab | Leadership | Ops & Research (its door sits west of the restroom)
partition(-15.6, -3, 20, -3, [[-13.6, -12.4], [-6.6, -5.3], [1.3, 2.9], [6.4, 7.6]]);
partition(-20, -3, -15.6, -3); // behind the front desk
partition(-12, -14, -12, -3); partition(-4, -14, -4, -3); partition(4, -14, 4, -3);
// south row (hall side z = 3) + side walls; Writers' Den has an open front, lounge is reached through its side door
partition(-20, 3, -1.7, 3, [[-12.8, -11.4]]);
partition(2, 3, 20, 3, [[12.3, 13.8]]);
partition(-4, 3, -4, 14); partition(2, 3, 2, 14, [[10.2, 11.6]]); partition(12, 3, 12, 14, [[10.4, 12.0]]);

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

// ---------- decor ----------
const pl = (x, z, big) => prop(big ? 'pottedPlant' : 'plantSmall1', x, z, rand(0, 6), { s: big ? 2.6 : 2.4 });
[[-12.6, -13.3, 1], [-4.6, -13.3, 1], [-11.4, -13.3, 0], [4.7, -13.3, 1], [-19.3, 13.3, 1], [-3.4, 13.4, 0], [2.6, 13.4, 1], [12.6, 13.4, 1],
  [19.2, 13.3, 1], [-19.55, -0.75, 0], [11.6, 3.4, 0]].forEach(([x, z, b]) => pl(x, z, b));
// Family Office: Schoolbot's bookcases on the west wall, Credit Repair's filing cabinets in the east corner
prop('bookcaseOpen', -19.4, 9.6, Math.PI / 2); prop('bookcaseOpen', -19.4, 11.4, Math.PI / 2);
for (const z of [11.6, 12.4, 13.2]) { rbox(0.62, 1.25, 0.7, '#5d6675', -4.5, 0.625, z, scene, { roughness: 0.6, metalness: 0.2 }, 0.04);
  for (const y of [0.35, 0.75, 1.1]) box(0.02, 0.05, 0.22, '#c9ced6', -4.82, y, z); } // drawer pulls
// eBay Sales: packing table with shipping boxes + a label roll (Superbot / Jr.)
rbox(2.2, 0.08, 0.9, '#c98c55', -16.1, 0.9, -12.9, scene, {}, 0.02); for (const sx of [-1, 1]) box(0.08, 0.86, 0.8, '#8a5a36', -16.1 + sx, 0.43, -12.9);
for (const [x, y, w, h] of [[-16.8, 0.94, 0.6, 0.45], [-16.75, 1.39, 0.45, 0.32], [-15.9, 0.94, 0.5, 0.36]]) { rbox(w, h, w * 0.8, '#b8864f', x, y + h / 2, -12.9, scene, {}, 0.02); box(w + 0.01, 0.04, 0.1, '#e0c98f', x, y + h, -12.9); }
{ const r = cyl(0.12, 0.12, 0.2, '#f4efe4', -15.2, 1.04, -12.8); r.rotation.x = Math.PI / 2; }
for (let i = 0; i < 3; i++) rbox(1.1, 0.5, 0.5, '#3a3f4a', -19.2, 0.25 + i * 0.52, -10.6 + 0, scene, {}, 0.03); // parts bins
// Team Huddle: the old break room is now a meeting room (kitchen moved up to the Rec Deck)
rbox(0.1, 1.2, 2.0, '#f6f6f2', 19.4, 1.5, 9.6, scene, { roughness: 0.4 }, 0.02); box(0.12, 0.08, 2.1, FRAME, 19.4, 0.88, 9.6); // whiteboard on the window wall
rbox(2.6, 0.7, 0.55, '#3b2a20', 16, 0.35, 13.3, scene, {}, 0.03); // credenza
prop('bookcaseOpen', -3.4, 8.6, Math.PI / 2); prop('lampRoundFloor', 0.6, 13.0, 0);
prop('lampRoundFloor', 2.9, 4.4, 0); prop('lampRoundFloor', 18.6, -3.8, 0); prop('lampRoundFloor', -11.0, -3.8, 0);

// crests (Sean's) on the slate wall
const texLoader = new THREE.TextureLoader();
function crest(url, x, y, s) {
  const t = texLoader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
  rbox(s + 0.16, s + 0.16, 0.06, '#151a22', x, y, -13.96, scene, {}, 0.03);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, metalness: 0 }));
  m.position.set(x, y, -13.92); scene.add(m);
}

// ---------- SecretaryBot's front desk: backdrop with a real wall calendar and an outings map ----------
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
// v5: authored at the old west-corner spot (x -20..-12), then slid +16 so the coordinator's office is center back (x -4..4)
const LEAD_DX = 16, LEAD0 = scene.children.length;
prop('bookcaseOpen', -19.3, -9.0, Math.PI / 2); prop('lampRoundFloor', -19.2, -5.2, 0);
crest('/crest-main.jpg', -16, 2.3, 1.5);
rbox(1.82, 1.82, 0.04, '#e8b93a', -16, 2.3, -13.985, scene, { roughness: 0.4, metalness: 0.3 }, 0.03); // gold trim behind the main crest
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
for (const o of scene.children.slice(LEAD0)) o.position.x += LEAD_DX;
crest('/crest-samurai.jpg', -18.8, 2.3, 1.3);
crest('/crest-samurai.jpg', 6, 2.3, 1.3);

// lounge
const SOFA = '#1f9e9a';
for (const x of [4.4, 7.35, 10.3]) prop('loungeSofa', x, 5.0, 0, { s: 2.9, recolor: { carpet: SOFA } });
prop('loungeSofa', 3.0, 8.8, Math.PI / 2, { s: 2.9, recolor: { carpet: SOFA } });
prop('loungeSofa', 11.4, 8.1, -Math.PI / 2, { s: 2.4, recolor: { carpet: SOFA } });
prop('tableCoffee', 7.35, 8.0, 0, { s: 2.6 });
for (const [x, c] of [[5.2, '#e9c46a'], [9.5, '#e76f51']]) { const bb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), mat(c, { roughness: 1 })); bb.scale.set(1, 0.55, 1); bb.position.set(x, 0.27, 11.8); bb.castShadow = bb.receiveShadow = true; scene.add(bb); } // bean bags
// ---------- office art (v5; see also Rec Deck + Residences) ----------
// ART 2 — "8-Bit Panda": pixel-art mural on the eBay Sales back wall
signPanel(scene, 1.3, 1.3, -13.25, 2.3, -13.93, (g, w) => { const P = ['................', '..##........##..', '.####......####.', '.####.####.####.', '..#..######..#..', '...##########...', '..####WWWW####..', '..#WW..WW..WW#..', '..#W.#.WW.#.W#..', '..#WW..WW..WW#..', '..#WWWW##WWWW#..', '...#WWWWWWWW#...', '....##WWWW##....', '...####..####...', '..#####..#####..', '................'];
  const c = w / 16; g.fillStyle = '#7fd0b0'; g.fillRect(0, 0, w, w); P.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === '#' ? '#1b1e24' : '#f4f4ef'; g.fillRect(x * c, y * c, c + 1, c + 1); })); }, { frame: '#2b2d42', px: 200 });
// ART 8 — "Federation Stars": constellation map on the Writers' Den wall
signPanel(scene, 1.9, 0.95, -2.85, 1.95, 3.06, (g, w, h) => { g.fillStyle = '#0b1230'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + srand() * 0.6})`; g.fillRect(srand() * w, srand() * h, 2, 2); }
  const st = [[120, 200], [210, 110], [320, 150], [420, 90], [520, 170], [470, 260], [330, 240]]; g.strokeStyle = 'rgba(255,214,122,.7)'; g.lineWidth = 3; g.beginPath(); st.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
  g.fillStyle = '#ffd27a'; for (const [x, y] of st) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); } g.font = `700 30px ${FONT}`; g.fillText('FEDERATION STARS', 20, h - 18); }, { frame: '#b0532a' });
// ART 10 — "Wall of Fame": every bot's color + name, in the Team Huddle room
signPanel(scene, 2.8, 1.3, 16.3, 1.75, 3.06, (g, w, h) => { g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2420'; g.font = `900 56px ${FONT}`; g.textAlign = 'center'; g.fillText('PANDA FEDERATION · WALL OF FAME', w / 2, 62);
  TEAM.forEach((t, i) => { const c = i % 7, r = Math.floor(i / 7), x = 70 + c * ((w - 140) / 6), y = 145 + r * 150; g.fillStyle = t.color; g.beginPath(); g.arc(x, y, 40, 0, 7); g.fill(); g.strokeStyle = '#e8b93a'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#2b2420'; g.font = `700 24px ${FONT}`; g.fillText(t.short.length > 13 ? t.short.slice(0, 12) + '…' : t.short, x, y + 66); }); }, { frame: '#e8b93a', px: 330 });
// wall TV in the lounge (shows the Arizona clock, which is real)
const tvTex = canvasTex(1024, 576, () => {});
rbox(2.75, 1.6, 0.1, '#0c0f15', -16, 2.25, -13.92, scene, {}, 0.05); // v5: wall clock-TV moved to the eBay Sales back wall
const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.46), new THREE.MeshBasicMaterial({ map: tvTex, color: new THREE.Color(1.4, 1.4, 1.4) }));
tvScr.position.set(-16, 2.25, -13.86); scene.add(tvScr);
box(0.9, 0.05, 0.2, '#0c0f15', -16, 1.42, -13.85);

// Team Huddle (old break room): round meeting table + 4 chairs (idle bots still drop in here: 'break' spots)
prop('tableRound', 16, 9.6, 0, { s: 2.3 });
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; prop('chair', 16 + Math.cos(a) * 1.35, 9.6 + Math.sin(a) * 1.35, -a - Math.PI / 2); }

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
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), mat('#7d5cc4', { roughness: 0.5 })); ball.position.set(13.5, 0.34, 0.4); ball.castShadow = true; scene.add(ball);
  for (const [x, z, r] of [[19.2, 1.4, 0.16], [19.2, 1.9, 0.19], [19.25, 0.9, 0.14]]) {
    const kb = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(BLK, { roughness: 0.6 })); kb.position.set(x, r * 0.9, z); kb.castShadow = true; scene.add(kb);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(r * 0.6, r * 0.14, 6, 14, Math.PI), kb.material); hd.position.set(x, r * 1.7, z); hd.rotation.y = Math.PI / 2; scene.add(hd); }
  prop('pottedPlant', 19.35, -2.55, 0, { s: 2.6 });
}

// ---------- restroom (hall, west of the gym): frosted framed glass, two stalls, vanity with two sinks + mirror ----------
// a walkway stays open between the restroom and the lounge wall (z 1.4..3) to the gym and the break-room door
const roomGlass = new THREE.MeshStandardMaterial({ color: '#e4ecf1', transparent: true, opacity: 0.5, roughness: 0.35, metalness: 0, depthWrite: false });
const stallMat = new THREE.MeshStandardMaterial({ color: '#dfe5ea', transparent: true, opacity: 0.9, roughness: 0.45, metalness: 0, depthWrite: false });
const stallDoorMat = new THREE.MeshStandardMaterial({ color: '#cdd6de', transparent: true, opacity: 0.94, roughness: 0.45, metalness: 0, depthWrite: false });
const STEEL = mat('#aeb6bf', { roughness: 0.32, metalness: 0.6 }), PORCELAIN = mat('#f7f7f4', { roughness: 0.35 });
partition(8, -3, 8, 1.4, [[-0.6, 0.6]], 2.6, scene, roomGlass); // west wall, doorway from the hall
partition(8, 1.4, 12, 1.4, [], 2.6, scene, roomGlass);
partition(12, -3, 12, 1.4, [], 2.6, scene, roomGlass);
{
  // tiled back wall behind the vanity (hides the research room glass), mirror, towel dispenser, bin
  rbox(2.35, 2.5, 0.05, '#dcd8cf', 9.22, 1.27, -2.93, scene, { roughness: 0.7 }, 0.02);
  const mirror = rbox(1.7, 0.9, 0.03, mat('#b9c7d1', { roughness: 0.12, metalness: 0.55 }), 9.05, 1.75, -2.885, scene, {}, 0.01); mirror.castShadow = false;
  rbox(1.78, 0.98, 0.02, FRAME, 9.05, 1.75, -2.9, scene, {}, 0.01);
  rbox(0.32, 0.42, 0.12, '#eef0f2', 10.15, 1.35, -2.85, scene, {}, 0.03); box(0.2, 0.02, 0.02, '#9aa3ae', 10.15, 1.16, -2.79); // paper towels
  cyl(0.15, 0.13, 0.42, '#9aa3ae', 10.15, 0.21, -2.62, scene, 16);
  // vanity: walnut cabinet, stone top, two vessel sinks with faucets + soap
  rbox(1.8, 0.78, 0.5, '#3b2a20', 9.05, 0.39, -2.68, scene, {}, 0.03);
  rbox(1.86, 0.06, 0.58, '#eceae6', 9.05, 0.81, -2.66, scene, { roughness: 0.5 }, 0.02);
  for (const sx of [8.6, 9.5]) {
    cyl(0.19, 0.15, 0.1, PORCELAIN, sx, 0.89, -2.62, scene, 24);
    cyl(0.016, 0.016, 0.2, STEEL, sx, 0.94, -2.85, scene, 8); box(0.03, 0.03, 0.14, STEEL, sx, 1.03, -2.79);
    cyl(0.035, 0.035, 0.12, '#8fb3a5', sx + 0.3, 0.9, -2.82, scene, 10); cyl(0.012, 0.012, 0.05, STEEL, sx + 0.3, 0.98, -2.82, scene, 6);
  }
  // two stalls along the east wall (frosted, lifted off the floor), doors face the room
  const SX0 = 10.4, SX1 = 12, SY = 1.15, SH = 2.0;
  box(SX1 - SX0, SH, 0.05, stallMat, (SX0 + SX1) / 2, SY, -1.8); box(SX1 - SX0, SH, 0.05, stallMat, (SX0 + SX1) / 2, SY, -0.6);
  box(0.06, 0.06, 2.4, FRAME, SX0, SY + SH / 2 + 0.03, -1.8);
  for (const [a, b] of [[-3, -1.8], [-1.8, -0.6]]) {
    const zc = (a + b) / 2;
    box(0.05, SH, 0.2, stallMat, SX0, SY, a + 0.1); box(0.05, SH, 0.2, stallMat, SX0, SY, b - 0.1);
    box(0.05, SH - 0.04, 0.76, stallDoorMat, SX0, SY, zc); box(0.03, 0.12, 0.03, STEEL, SX0 - 0.04, 1.05, zc + 0.26);
    for (const zz of [a + 0.03, b - 0.03]) box(0.05, 0.15, 0.05, STEEL, SX0, 0.075, zz); // stall feet
    // toilet: bowl, seat, tank against the wall; paper roll on the stall side
    const bowl = cyl(0.19, 0.15, 0.38, PORCELAIN, 11.38, 0.19, zc, scene, 20); bowl.scale.x = 1.25;
    const seat = cyl(0.21, 0.21, 0.04, PORCELAIN, 11.38, 0.4, zc, scene, 20); seat.scale.x = 1.25;
    rbox(0.22, 0.46, 0.46, PORCELAIN, 11.86, 0.62, zc, scene, {}, 0.04);
    const roll = cyl(0.06, 0.06, 0.11, '#fbfbf8', 10.85, 0.72, b - 0.08, scene, 12); roll.rotation.x = Math.PI / 2;
  }
  prop('plantSmall1', 11.6, 1.0, 0.4, { s: 2.6 });
}
const SINKS = [[8.6, -1.95], [9.5, -1.95]]; // standing spots at the vanity (face the mirror, -z)

// ---------- elevator: glass shaft beside the front desk, doors open onto the hall; same footprint on the apartment floor ----------
const ELEV = { x0: -20, x1: -18.2, z0: 0.7, z1: 2.9, cx: -19.1, cz: 1.8, landX: -16.9, doorX: -18.2 };
const elevSignTex = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#0c0f15'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffcf7a'; for (const [cx, up] of [[84, 1], [172, 0]]) { g.beginPath(); g.moveTo(cx - 22, up ? 64 : 32); g.lineTo(cx + 22, up ? 64 : 32); g.lineTo(cx, up ? 26 : 70); g.fill(); } });
const elevLightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.85, 1.55) });
const doorSteel = mat('#c3cad2', { roughness: 0.28, metalness: 0.65 });
function buildElevator(parent, h) {
  const grp = new THREE.Group(); parent.add(grp);
  const { x0, x1, z0, z1, cx, cz } = ELEV, wx = x1 - x0, wz = z1 - z0;
  rbox(wx - 0.08, 0.05, wz - 0.08, '#3a404c', cx, 0.025, cz, grp, { roughness: 0.6 }, 0.02); // cab floor
  for (const [px, pz] of [[x0 + 0.05, z0 + 0.05], [x0 + 0.05, z1 - 0.05], [x1 - 0.05, z0 + 0.05], [x1 - 0.05, z1 - 0.05]]) box(0.1, h, 0.1, FRAME, px, h / 2, pz, grp);
  for (const [w, d, x, z] of [[0.04, wz - 0.1, x0 + 0.05, cz], [wx - 0.1, 0.04, cx, z0 + 0.05], [wx - 0.1, 0.04, cx, z1 - 0.05]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.1, d), glass); m.position.set(x, h / 2, z); grp.add(m); }
  for (const [w, d, x, z] of [[wx, 0.12, cx, z0 + 0.05], [wx, 0.12, cx, z1 - 0.05], [0.12, wz, x0 + 0.05, cz], [0.12, wz, x1 - 0.05, cz]]) box(w, 0.12, d, FRAME, x, h - 0.06, z, grp);
  for (const yy of [0.04, 2.5]) box(wx - 0.1, 0.05, 0.06, FRAME, cx, yy, z1 - 0.05, grp); // cab rails seen through the glass
  // cab: walnut back panel + steel handrail, lit ceiling
  rbox(wx - 0.3, 2.2, 0.05, '#4a2f1c', cx, 1.2, z0 + 0.12, grp, {}, 0.02);
  box(wx - 0.45, 0.04, 0.04, STEEL, cx, 0.95, z0 + 0.2, grp);
  rbox(wx - 0.14, 0.06, wz - 0.14, '#232a36', cx, 2.5, cz, grp, {}, 0.02);
  box(wx - 0.6, 0.02, wz - 0.8, elevLightMat, cx, 2.465, cz, grp);
  // hall face: steel jambs + header around the doorway (z 1.25..2.35)
  box(0.08, 2.5, 1.25 - z0 - 0.1, STEEL, x1 - 0.04, 1.25, (z0 + 0.1 + 1.25) / 2, grp);
  box(0.08, 2.5, z1 - 0.1 - 2.35, STEEL, x1 - 0.04, 1.25, (2.35 + z1 - 0.1) / 2, grp);
  box(0.08, 0.32, wz - 0.2, STEEL, x1 - 0.04, 2.56, cz, grp);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: elevSignTex, color: new THREE.Color(1.6, 1.6, 1.6) }));
  sign.rotation.y = Math.PI / 2; sign.position.set(x1 + 0.005, 2.58, cz); grp.add(sign);
  const sign2 = new THREE.Mesh(sign.geometry, sign.material); sign2.position.set(cx, h - 0.3, z1 + 0.01); grp.add(sign2); // indicator on the front face too
  rbox(0.56, 0.24, 0.03, '#0c0f15', cx, h - 0.3, z1 - 0.005, grp, {}, 0.01);
  for (const gz of [z0 + 0.32, z1 - 0.32]) box(0.06, h - 0.2, 0.06, STEEL, x0 + 0.16, h / 2, gz, grp); // guide rails
  for (const dz of [-0.25, 0.25]) cyl(0.012, 0.012, h - 2.56, '#1b1e24', cx, (h + 2.53) / 2, cz + dz, grp, 6); // hoist cables
  rbox(0.5, 0.04, 1.25, '#2c313b', x1 + 0.27, 0.02, cz, grp, { roughness: 0.6 }, 0.01); // landing threshold
  box(0.04, 0.045, 1.25, '#e8b93a', x1 + 0.5, 0.022, cz, grp);
  rbox(0.03, 0.28, 0.13, '#c9ced6', x1 + 0.01, 1.15, 2.62, grp, {}, 0.01); // call buttons
  for (const yy of [1.21, 1.09]) { const btn = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.5, 0.8) })); btn.rotation.y = Math.PI / 2; btn.position.set(x1 + 0.03, yy, 2.62); grp.add(btn); }
  // doors: two leaves just inside the jambs, slide apart when someone is at the doorway
  const leaves = [];
  for (const s of [-1, 1]) leaves.push({ s, m: rbox(0.04, 2.36, 0.56, doorSteel, x1 - 0.12, 1.2, cz + s * 0.28, grp, {}, 0.01) });
  return { grp, leaves, open: 0 };
}
const officeElev = buildElevator(scene, WH);
rbox(ELEV.x1 - ELEV.x0 + 0.12, 0.1, ELEV.z1 - ELEV.z0 + 0.12, '#2c3546', ELEV.cx, WH + 0.05, ELEV.cz, officeElev.grp, {}, 0.03); // machine-room cap

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
prop('desk', 16.2, -8.6, Math.PI);
prop('laptop', 15.6, -8.6, Math.PI, { y: 0.91, s: 1.6 }); prop('computerScreen', 16.7, -8.5, Math.PI, { y: 0.91 });
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

// ---------- usage board (slate wall, Money Lab) ----------
rbox(5.9, 2.9, 0.1, '#11151c', -8, 2.15, -13.92, scene, {}, 0.05);
const usageTex = canvasTex(2048, 970, () => {});
const usageBoard = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 2.7), new THREE.MeshBasicMaterial({ map: usageTex, color: new THREE.Color(1.25, 1.25, 1.25) }));
usageBoard.position.set(-8, 2.15, -13.86); scene.add(usageBoard);
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
for (const [x, y, z, inten] of [[-3.2, 2.0, -5.2, 6], [0.6, 2.0, 13.0, 5], [2.9, 2.0, 4.4, 5], [18.6, 2.0, -3.8, 5], [-11, 2.0, -3.8, 5], [16, 2.4, 9.6, 4], [14.6, 2.4, -12.4, 4], [7.35, 2.4, 9.5, 3], [-12, 2.4, 9, 4]]) {
  const p = new THREE.PointLight(0xffc98a, inten, 7, 1.6); p.position.set(x, y, z); scene.add(p); lamps.push({ p, base: inten });
}

// ---------- the office floor as one layer: it peels back (hinged at the back wall) to show the apartments below ----------
const hqPivot = new THREE.Group(); hqPivot.position.set(0, 0, -14.3);
const hq = new THREE.Group(); hq.position.set(0, 0, 14.3); hqPivot.add(hq); // identity in world space while closed
for (const o of [...scene.children]) if (!o.isLight && o !== sun.target && !OUTSIDE.has(o)) hq.add(o);
scene.add(hqPivot);

// ---------- floors below the office (v5): 1 Rec Deck, 2 Residences A, 3 Residences B ----------
// Every floor is its own layer; the floors above the one in view peel back (hinged at the back wall) and lift away.
const NFLOORS = 4, FLOOR_NAMES = ['Office', 'Rec Deck', 'Residences A', 'Residences B'];
const floorY = (k) => -k * FLOOR_H;
const AWH = FLOOR_H - 0.7; // wall height on the lower floors (up to the slab above)
const pivots = [hqPivot], layers = [hq];
for (let k = 1; k < NFLOORS; k++) {
  const pv = new THREE.Group(); pv.position.set(0, floorY(k), -14.3);
  const L = new THREE.Group(); L.position.set(0, 0, 14.3); L.visible = false; pv.add(L); scene.add(pv); pivots.push(pv); layers.push(L);
}
const rec = layers[1], aptA = layers[2], aptB = layers[3];
const aptFloorTex = canvasTex(2048, 2048, (g, w, h) => drawPlanks(g, w, h, ['#8a6440', '#7d5a39', '#94704a', '#6f4f32', '#86603d', '#7a5838'], 24));
aptFloorTex.wrapS = aptFloorTex.wrapT = THREE.RepeatWrapping; aptFloorTex.repeat.set(W / 9, D / 9);
const SLAB_SIDES = [mat('#4a5466'), mat('#4a5466'), null, mat('#2a3140'), mat('#556074'), mat('#4a5466')];
function floorShell(P, wall, top, hole) { // slab (optionally with a rectangular hole), ledge, back wall, window wall, elevator
  if (!hole) { const s2 = new THREE.Mesh(slab.geometry, SLAB_SIDES.map((m) => m || top)); s2.position.set(0, -0.35, 0); s2.receiveShadow = true; P.add(s2); }
  else { const [hx0, hx1, hz0, hz1] = hole, X0 = -W / 2 - 0.3, X1 = W / 2 + 0.3, Z0 = -D / 2 - 0.3, Z1 = D / 2 + 0.3;
    for (const [a0, a1, b0, b1] of [[X0, X1, Z0, hz0], [X0, X1, hz1, Z1], [X0, hx0, hz0, hz1], [hx1, X1, hz0, hz1]]) {
      const m = box(a1 - a0, 0.7, b1 - b0, top, (a0 + a1) / 2, -0.35, (b0 + b1) / 2, P); m.castShadow = false; } }
  box(W + 1.0, 0.18, D + 1.0, '#5b6678', 0, -0.62, 0, P);
  rbox(W + 0.6, AWH, 0.35, wall, 0, AWH / 2, -14.17, P, { roughness: 0.95 }, 0.05);
  box(W + 0.6, 0.16, 0.38, '#2a201b', 0, 0.08, -13.98, P);
  const sk = new THREE.Mesh(new THREE.PlaneGeometry(D, AWH - 0.35), skyMat); sk.rotation.y = -Math.PI / 2; sk.position.set(20.3, 0.2 + (AWH - 0.35) / 2, 0); P.add(sk);
  const gp = new THREE.Mesh(sk.geometry, glassPane.material); gp.rotation.y = -Math.PI / 2; gp.position.set(20.05, sk.position.y, 0); P.add(gp);
  box(0.3, 0.2, D + 0.6, FRAME, 20.15, 0.1, 0, P); box(0.3, 0.16, D + 0.6, FRAME, 20.15, AWH - 0.08, 0, P);
  for (let i = 0; i <= 8; i++) box(0.16, AWH, 0.12, FRAME, 20.12, AWH / 2, -14 + i * (D / 8), P);
  box(0.12, 0.06, D, FRAME, 20.1, 1.0, 0, P);
  return buildElevator(P, AWH);
}
// floor finish: a canvas-painted plane over a rect (canvas y runs toward +z)
function floorPlane(P, x0, x1, z0, z1, draw, px = 60, y = 0.012) {
  const w = x1 - x0, d = z1 - z0, cw = Math.min(2048, Math.round(w * px)), ch = Math.min(2048, Math.round(d * px));
  const tex = canvasTex(cw, ch, (g) => draw(g, cw, ch, cw / w, ch / d));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.85, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 }));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; P.add(m); return m;
}
function floorWord(P, text, x, z, w = 3.6, col = new THREE.Color(0.95, 0.9, 0.82)) {
  const lt = canvasTex(1024, 160, (g, cw, ch) => { g.font = `800 96px ${FONT}`; if ('letterSpacing' in g) g.letterSpacing = '14px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.88)';
    const tw = g.measureText(text).width; if (tw > cw - 40) g.font = `800 ${Math.floor(96 * (cw - 40) / tw)}px ${FONT}`; g.fillText(text, cw / 2, ch / 2); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.156), new THREE.MeshBasicMaterial({ map: lt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, color: col }));
  lab.rotation.x = -Math.PI / 2; lab.position.set(x, 0.02, z); P.add(lab); return lab;
}
// shared carpet pile (grayscale, tinted per room by the material color)
const pileTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 200 + Math.floor(srand() * 55); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(srand() * w, srand() * h, 2, 2); } });
pileTex.wrapS = pileTex.wrapT = THREE.RepeatWrapping;
function carpet(P, x0, x1, z0, z1, color) {
  const t = pileTex.clone(); t.repeat.set((x1 - x0) / 2, (z1 - z0) / 2); t.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ map: t, color, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 }));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.01, (z0 + z1) / 2); m.receiveShadow = true; P.add(m); return m;
}
const tileDraw = (a, b, step, grout = 'rgba(80,86,94,.45)') => (g, cw, ch, sx, sy) => { const tw = step * sx, th = step * sy;
  for (let y = 0, r = 0; y < ch; y += th, r++) for (let x = 0, c = 0; x < cw; x += tw, c++) { g.fillStyle = (r + c) % 2 ? a : b; g.fillRect(x, y, tw + 1, th + 1); }
  g.strokeStyle = grout; g.lineWidth = 2; for (let x = 0; x < cw; x += tw) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ch); g.stroke(); } for (let y = 0; y < ch; y += th) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); } };

const elevs = [officeElev];

// ======================= FLOOR 1: REC DECK (kitchen + recreation) =======================
const POOL = { x0: -5, x1: 13, z0: -12.4, z1: -5.6 };
let recWaterTex = null;
elevs.push(floorShell(rec, '#5c6b78', mat('#9aa0a8'), [POOL.x0, POOL.x1, POOL.z0, POOL.z1]));
const recGlass = new THREE.MeshStandardMaterial({ color: '#e2f1f8', transparent: true, opacity: 0.2, roughness: 0.25, metalness: 0, depthWrite: false });
partition(-20, -3, 20, -3, [[-12.2, -10.8], [-7.8, -6.4]], 2.6, rec, recGlass);
partition(-20, 3, 20, 3, [[-12.2, -10.8], [-4.6, -3.2], [3.0, 4.4]], 2.6, rec, recGlass);
partition(-9, -14, -9, -3, [], 2.6, rec, recGlass); partition(-9, 3, -9, 14, [], 2.6, rec, recGlass); partition(2, 3, 2, 14, [], 2.6, rec, recGlass);
// flooring: ceramic checker in the kitchen, non-slip deck tile at the pool, terrazzo hall, carpet lounge, sport vinyl game room, acrylic tennis court
floorPlane(rec, -20, -9, -14, -3, tileDraw('#e9e4da', '#c9533f', 0.55), 90);
floorPlane(rec, -9, 20, -14, -3, (g, cw, ch, sx, sy) => { tileDraw('#d9cfba', '#d1c6ae', 0.4, 'rgba(120,108,88,.35)')(g, cw, ch, sx, sy);
  const X = (x) => (x + 9) * sx, Z = (z) => (z + 14) * sy;
  g.fillStyle = '#c8bda5'; g.fillRect(X(POOL.x0 - 0.45), Z(POOL.z0 - 0.45), (POOL.x1 - POOL.x0 + 0.9) * sx, (POOL.z1 - POOL.z0 + 0.9) * sy); // coping band
  g.clearRect(X(POOL.x0), Z(POOL.z0), (POOL.x1 - POOL.x0) * sx, (POOL.z1 - POOL.z0) * sy); // the pool itself
  g.fillStyle = '#1d3f73'; g.font = `800 ${0.3 * sy}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [x, t] of [[POOL.x0 + 1.2, '3 FT'], [POOL.x0 + 1.2, '3 FT'], [POOL.x1 - 1.2, '9 FT'], [(POOL.x0 + POOL.x1) / 2, '5 FT']]) { g.fillText(t, X(x), Z(POOL.z1 + 0.22)); g.fillText(t, X(x), Z(POOL.z0 - 0.22)); }
  g.fillStyle = '#b3261e'; g.font = `800 ${0.34 * sy}px ${FONT}`; g.fillText('NO DIVING', X(POOL.x0 + 1.6), Z(POOL.z1 + 0.9)); // painted on the shallow-end deck
}, 60);
floorPlane(rec, -20, 20, -3, 3, (g, cw, ch) => { g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, cw, ch); // terrazzo
  for (let i = 0; i < 9000; i++) { g.fillStyle = ['#9a948a', '#b8b0a2', '#7d8a96', '#c9a77a', '#efece6'][i % 5]; g.fillRect(srand() * cw, srand() * ch, 2 + srand() * 3, 2 + srand() * 3); } }, 50);
carpet(rec, -20, -9, 3, 14, '#a0786a');
floorPlane(rec, -9, 2, 3, 14, (g, cw, ch, sx, sy) => { g.fillStyle = '#3c6a8a'; g.fillRect(0, 0, cw, ch); // sport vinyl
  g.globalAlpha = 0.06; g.fillStyle = '#000'; for (let y = 0; y < ch; y += 6) g.fillRect(0, y, cw, 2); g.globalAlpha = 1;
  g.strokeStyle = 'rgba(255,214,102,.55)'; g.lineWidth = 6; g.strokeRect(0.6 * sx, 0.6 * sy, cw - 1.2 * sx, ch - 1.2 * sy); }, 70);
const COURT = { x0: 4, x1: 18, z0: 4.6, z1: 12.4 };
floorPlane(rec, 2, 20, 3, 14, (g, cw, ch, sx, sy) => { const X = (x) => (x - 2) * sx, Z = (z) => (z - 3) * sy;
  g.fillStyle = '#3f7d4f'; g.fillRect(0, 0, cw, ch); g.fillStyle = '#2f5f9e'; g.fillRect(X(COURT.x0), Z(COURT.z0), (COURT.x1 - COURT.x0) * sx, (COURT.z1 - COURT.z0) * sy);
  g.strokeStyle = '#f4f4f0'; g.lineWidth = 0.07 * sx; const L = (x0, z0, x1, z1) => { g.beginPath(); g.moveTo(X(x0), Z(z0)); g.lineTo(X(x1), Z(z1)); g.stroke(); };
  g.strokeRect(X(COURT.x0), Z(COURT.z0), (COURT.x1 - COURT.x0) * sx, (COURT.z1 - COURT.z0) * sy);
  L(COURT.x0, 5.55, COURT.x1, 5.55); L(COURT.x0, 11.45, COURT.x1, 11.45); // singles sidelines (doubles alleys outside)
  L(7, 5.55, 7, 11.45); L(15, 5.55, 15, 11.45); L(7, 8.5, 15, 8.5); // service lines + center service line
  L(COURT.x0, 8.5, COURT.x0 + 0.3, 8.5); L(COURT.x1 - 0.3, 8.5, COURT.x1, 8.5); }, 70);
floorWord(rec, 'REC DECK', -13.2, 2.3);
// --- kitchen & café: back counter, island with bar stools, coffee + soda machines, fridge, water cooler, dining table
for (let i = 0; i < 4; i++) prop('kitchenCabinet', -19.4 + i * 1.03, -13.45, 0, { parent: rec });
rbox(4.3, 0.08, 0.8, '#eceae6', -17.85, 1.1, -13.45, rec, { roughness: 0.6 }, 0.03);
prop('kitchenMicrowave', -19.1, -13.5, 0, { y: 1.14, parent: rec }); prop('kitchenCoffeeMachine', -17.4, -13.5, 0, { y: 1.14, parent: rec });
prop('kitchenFridgeLarge', -15.1, -13.4, 0, { parent: rec });
const ISLAND_Z = -10.3;
for (let i = 0; i < 5; i++) prop('kitchenCabinet', -18.1 + i * 1.03, ISLAND_Z, Math.PI, { parent: rec });
rbox(5.4, 0.08, 1.2, '#eceae6', -16.04, 1.1, ISLAND_Z, rec, { roughness: 0.6 }, 0.03);
prop('kitchenCoffeeMachine', -14.9, ISLAND_Z - 0.2, Math.PI, { y: 1.14, parent: rec });
const brew = rbox(0.06, 0.06, 0.02, '#6fae7a', -14.9, 1.6, ISLAND_Z + 0.45, rec, { emissive: '#3eff6c', emissiveIntensity: 1.2 }, 0.01); // "ready" light, blinks
for (let i = 0; i < 4; i++) prop('stoolBar', -17.9 + i * 1.25, -9.05, 0, { s: 2.2, parent: rec });
{ // soda machine: red cabinet, lit front with bottle rows
  rbox(1.1, 2.2, 0.8, '#c8262e', -13.4, 1.1, -13.4, rec, { roughness: 0.5 }, 0.05);
  const st = canvasTex(256, 400, (g, w, h) => { g.fillStyle = '#1c0f12'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff4e6'; g.font = `900 64px ${FONT}`; g.textAlign = 'center'; g.fillText('SODA', w / 2, 70);
    const cols = ['#e63946', '#f4a261', '#2a9d8f', '#8ecae6', '#ffb703']; for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) { g.fillStyle = cols[(r + c) % 5]; rr(g, 26 + c * 54, 100 + r * 58, 34, 46, 8); g.fill(); } });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.97), new THREE.MeshBasicMaterial({ map: st, color: new THREE.Color(1.3, 1.3, 1.3) })); f.position.set(-13.55, 1.35, -12.99); rec.add(f);
  box(0.22, 0.5, 0.04, '#2a2d33', -13.05, 1.3, -12.98, rec); box(0.6, 0.16, 0.05, '#111', -13.5, 0.32, -12.98, rec); }
{ // water cooler
  rbox(0.5, 1.0, 0.5, '#eef0f2', -10.0, 0.5, -13.4, rec, {}, 0.04);
  const btl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 18), new THREE.MeshStandardMaterial({ color: '#7cc4f0', transparent: true, opacity: 0.7, roughness: 0.1 })); btl.position.set(-10.0, 1.3, -13.4); rec.add(btl); }
prop('tableRound', -15, -5.6, 0, { s: 2.3, parent: rec });
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; prop('chair', -15 + Math.cos(a) * 1.35, -5.6 + Math.sin(a) * 1.35, -a - Math.PI / 2, { parent: rec }); }
prop('pottedPlant', -9.6, -3.6, 0.4, { s: 2.6, parent: rec });
// --- pool: sunken basin, water, coping, diving board (deep end), ladders, lifeguard chair, loungers, umbrella, wet-floor sign
{ const { x0, x1, z0, z1 } = POOL, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, pw = x1 - x0, pd = z1 - z0;
  const basinTex = canvasTex(1024, 384, (g, w, h) => { tileDraw('#7fd0ea', '#76c8e4', 0.3, 'rgba(255,255,255,.35)')(g, w, h, w / pw, h / pd);
    g.fillStyle = '#1d4f8a'; for (const z of [0.25, 0.5, 0.75]) g.fillRect(w * 0.06, h * z - 6, w * 0.88, 12); });
  const bf = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.04, pd), new THREE.MeshStandardMaterial({ map: basinTex, roughness: 0.4 })); bf.position.set(cx, -0.52, cz); rec.add(bf);
  const wallM = mat('#8fd6ee', { roughness: 0.4 });
  for (const [w, d, x, z] of [[pw, 0.05, cx, z0], [pw, 0.05, cx, z1], [0.05, pd, x0, cz], [0.05, pd, x1, cz]]) { const m = box(w, 0.52, d, wallM, x, -0.26, z, rec); m.castShadow = false; }
  const waterTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,220,255,.9)'; g.lineWidth = 5;
    for (let i = 0; i < 70; i++) { g.beginPath(); const x = srand() * w, y = srand() * h; g.ellipse(x, y, 20 + srand() * 30, 10 + srand() * 18, srand() * 3, 0, 7); g.stroke(); } });
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(pw / 4, pd / 4);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), new THREE.MeshStandardMaterial({ map: waterTex, color: '#3fb0dc', transparent: true, opacity: 0.8, roughness: 0.06, metalness: 0.1, depthWrite: false }));
  water.rotation.x = -Math.PI / 2; water.position.set(cx, -0.1, cz); rec.add(water); recWaterTex = waterTex;
  const cop = '#ece6d8'; // raised stone coping
  for (const [w, d, x, z] of [[pw + 0.9, 0.45, cx, z0 - 0.225], [pw + 0.9, 0.45, cx, z1 + 0.225], [0.45, pd, x0 - 0.225, cz], [0.45, pd, x1 + 0.225, cz]]) rbox(w, 0.08, d, cop, x, 0.04, z, rec, {}, 0.02);
  // diving board over the deep end (east)
  box(0.7, 0.5, 0.8, '#2f6fb0', x1 + 1.35, 0.25, cz, rec); rbox(3.0, 0.08, 0.6, '#f4f4ef', x1 - 0.1, 0.56, cz, rec, { roughness: 0.6 }, 0.03);
  for (const sz of [-0.42, 0.42]) { const r = cyl(0.025, 0.025, 1.6, STEEL, x1 + 1.4, 0.8, cz + sz, rec, 8); r.rotation.z = Math.PI / 2 - 0.35; }
  // ladders (chrome rails curving over the coping)
  for (const [lx, lz, s] of [[x0 + 1.0, z0 + 0.05, 1], [x1 - 1.6, z1 - 0.05, -1]]) for (const dx of [-0.25, 0.25]) {
    const v = cyl(0.025, 0.025, 1.1, STEEL, lx + dx, 0.2, lz + s * 0.12, rec, 8);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 12, Math.PI), STEEL); arc.rotation.y = Math.PI / 2; arc.position.set(lx + dx, 0.75, lz - s * 0.1); rec.add(arc); v.castShadow = false; }
  // lifeguard chair
  for (const [dx, dz] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) cyl(0.04, 0.04, 1.6, '#f4f4ef', 18.8 + dx, 0.8, -12.4 + dz, rec, 8);
  rbox(0.9, 0.08, 0.9, '#f4f4ef', 18.8, 1.62, -12.4, rec, {}, 0.02); rbox(0.9, 0.7, 0.08, '#d23a3a', 18.8, 2.0, -12.82, rec, {}, 0.03);
  // loungers + umbrella + towels
  for (const z of [-11.2, -9.0, -6.8]) { rbox(1.5, 0.1, 0.7, '#f4f4ef', 16.3, 0.36, z, rec, {}, 0.03); const bk = rbox(0.6, 0.08, 0.7, '#f4f4ef', 17.25, 0.6, z, rec, {}, 0.03); bk.rotation.z = 0.7;
    rbox(1.3, 0.05, 0.6, z === -9.0 ? '#2a9d8f' : '#e76f51', 16.3, 0.43, z, rec, {}, 0.02); for (const dx of [-0.6, 0.6]) box(0.06, 0.32, 0.6, '#c9ced6', 16.3 + dx, 0.16, z, rec); }
  cyl(0.04, 0.04, 2.4, '#e8e4da', 18.6, 1.2, -7.9, rec, 8);
  { const can = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 8), mat('#f2c14e')); can.position.set(18.6, 2.45, -7.9); can.castShadow = true; rec.add(can); }
  rbox(0.7, 0.5, 0.5, '#3b2a20', 14.6, 0.25, -4.2, rec, {}, 0.03); for (let i = 0; i < 3; i++) rbox(0.5, 0.08, 0.36, ['#ffffff', '#8ecae6', '#ffb703'][i], 14.6, 0.54 + i * 0.08, -4.2, rec, { roughness: 1 }, 0.03);
  // wet-floor A-frame
  const wf = canvasTex(256, 384, (g, w, h) => { g.fillStyle = '#ffd400'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = `900 52px ${FONT}`; g.textAlign = 'center'; g.fillText('CAUTION', w / 2, 70);
    g.font = `800 40px ${FONT}`; g.fillText('WET FLOOR', w / 2, 330); g.beginPath(); g.moveTo(w / 2, 110); g.lineTo(w / 2 + 70, 250); g.lineTo(w / 2 - 70, 250); g.closePath(); g.lineWidth = 10; g.stroke(); g.fillText('!', w / 2, 232); });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), new THREE.MeshStandardMaterial({ map: wf, side: THREE.DoubleSide })); p.position.set(-7.4, 0.3, -4.4 + s * 0.09); p.rotation.x = s * 0.28; rec.add(p); }
}
// pool signage on the back wall: rules board, NO DIVING, NO RUNNING, DEEP END, life ring
function signPanel(P, w, h, x, y, z, draw, { ry = 0, basic = false, frame = '#151a22', px = 320 } = {}) {
  const t = canvasTex(Math.round(w * px), Math.round(h * px), draw);
  rbox(w + 0.1, h + 0.1, 0.05, frame, x, y, z - Math.cos(ry) * 0.03 - Math.sin(ry) * 0.03, P, {}, 0.02).rotation.y = ry;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic ? new THREE.MeshBasicMaterial({ map: t, transparent: true, color: basic === true ? new THREE.Color(1, 1, 1) : basic }) : new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, metalness: 0 }));
  m.position.set(x + Math.sin(ry) * 0.005, y, z + Math.cos(ry) * 0.005); m.rotation.y = ry; P.add(m); return m;
}
const BWZ = -13.93; // back-wall face
signPanel(rec, 3.2, 2.0, 1.0, 1.9, BWZ, (g, w, h) => { g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d4f8a'; g.fillRect(0, 0, w, 150);
  g.fillStyle = '#fff'; g.font = `900 104px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('POOL RULES', w / 2, 78);
  g.textAlign = 'left'; g.fillStyle = '#1b2433'; g.font = `700 46px ${FONT}`;
  ['NO RUNNING ON THE DECK', 'NO DIVING IN THE SHALLOW END', 'SHOWER BEFORE SWIMMING', 'NO GLASS IN THE POOL AREA', 'NO LIFEGUARD ON DUTY', 'SWIM AT YOUR OWN RISK'].forEach((t, i) => g.fillText('•  ' + t, 60, 210 + i * 66)); });
signPanel(rec, 1.1, 1.1, -6.6, 2.0, BWZ, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = `900 52px ${FONT}`; g.textAlign = 'center'; g.fillText('NO DIVING', w / 2, h - 30);
  g.save(); g.translate(w / 2, h / 2 - 20); g.fillStyle = '#1b2433'; g.rotate(0.7); g.fillRect(-90, -14, 180, 28); g.beginPath(); g.arc(100, 0, 22, 0, 7); g.fill(); g.restore(); // diver
  g.strokeStyle = '#d0021b'; g.lineWidth = 26; g.beginPath(); g.arc(w / 2, h / 2 - 20, 130, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 92, h / 2 - 112); g.lineTo(w / 2 + 92, h / 2 + 72); g.stroke(); });
signPanel(rec, 1.2, 0.6, 15.2, 2.5, BWZ, (g, w, h) => { g.fillStyle = '#d0021b'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 70px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NO RUNNING', w / 2, h / 2); });
signPanel(rec, 1.4, 0.7, 12.4, 2.0, BWZ, (g, w, h) => { g.fillStyle = '#1d4f8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 70px ${FONT}`; g.fillText('DEEP END', w / 2, h * 0.36); g.font = `800 64px ${FONT}`; g.fillText('9 FT', w / 2, h * 0.74); });
{ const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 10, 28), mat('#e8402e', { roughness: 0.6 })); ring.position.set(17.0, 1.8, -13.84); rec.add(ring);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.095, 10, 4, 0.35), mat('#ffffff')); b.rotation.z = i * Math.PI / 2; b.position.copy(ring.position); rec.add(b); } }
// ART 4 — "Kanagawa Splash": stylized great-wave mural over the pool
signPanel(rec, 3.4, 1.6, 7.6, 2.1, BWZ, (g, w, h) => { g.fillStyle = '#efe3c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9c9a0'; g.beginPath(); g.arc(w * 0.78, h * 0.3, 60, 0, 7); g.fill();
  for (let k = 0; k < 3; k++) { g.fillStyle = ['#1e3a6e', '#2f5f9e', '#5d8fc9'][k]; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 12) g.lineTo(x, h * (0.55 + k * 0.12) - Math.sin(x / (60 + k * 30) + k) * 40); g.lineTo(w, h); g.fill(); }
  g.strokeStyle = '#fff'; g.lineWidth = 10; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * 0.22 + i * 26, h * 0.42, 70 - i * 12, Math.PI * 1.1, Math.PI * 1.95); g.stroke(); }
  g.fillStyle = '#1e3a6e'; g.font = `700 34px ${FONT}`; g.fillText('KANAGAWA SPLASH', 24, 44); }, { frame: '#2b2420' });
// ART 1 — "Golden Valley Sunset": desert painting over the kitchen counter
signPanel(rec, 2.2, 1.15, -17.8, 2.65, BWZ, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2a6e'); gr.addColorStop(0.45, '#e2603c'); gr.addColorStop(0.8, '#f7c56a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(w * 0.62, h * 0.66, 70, 0, 7); g.fill();
  g.fillStyle = '#5a2f3a'; g.beginPath(); g.moveTo(0, h * 0.72); g.lineTo(w * 0.2, h * 0.6); g.lineTo(w * 0.32, h * 0.6); g.lineTo(w * 0.4, h * 0.72); g.lineTo(w, h * 0.74); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  g.fillStyle = '#24161c'; g.fillRect(0, h * 0.86, w, h * 0.14);
  const sag = (x, s) => { g.fillRect(x, h * 0.86 - 150 * s, 24 * s, 150 * s); g.fillRect(x - 34 * s, h * 0.86 - 110 * s, 16 * s, 50 * s); g.fillRect(x - 34 * s, h * 0.86 - 76 * s, 40 * s, 14 * s); g.fillRect(x + 36 * s, h * 0.86 - 128 * s, 16 * s, 60 * s); g.fillRect(x + 20 * s, h * 0.86 - 82 * s, 30 * s, 14 * s); };
  sag(w * 0.14, 1.2); sag(w * 0.8, 0.9); sag(w * 0.45, 0.6); }, { frame: '#c99a63' });
signPanel(rec, 1.3, 0.9, -11.3, 2.3, BWZ, (g, w, h) => { g.fillStyle = '#26332b'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2efe6'; g.font = `700 54px ${FONT}`; g.textAlign = 'center'; g.fillText('CAFÉ', w / 2, 66);
  g.font = `500 34px ${FONT}`; ['cold brew', 'fruit + snacks', 'taco tuesday'].forEach((t, i) => g.fillText(t, w / 2, 130 + i * 50)); }, { frame: '#8a5a36' }); // menu chalkboard
// --- hall: ART 5 "Bamboo Bronze" panda statue on a plinth, bench, plants
{ const BR = mat('#a8723a', { roughness: 0.35, metalness: 0.7 }), BRD = mat('#5a3a1e', { roughness: 0.4, metalness: 0.6 }), sx = 6, sz = 0;
  rbox(1.2, 0.9, 1.2, '#ece8e0', sx, 0.45, sz, rec, { roughness: 0.5 }, 0.04);
  const sp = (r, m, x, y, z, s = [1, 1, 1]) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), m); o.scale.set(...s); o.position.set(sx + x, y, sz + z); o.castShadow = true; rec.add(o); };
  sp(0.42, BR, 0, 1.32, 0, [1, 0.95, 0.9]); sp(0.3, BR, 0, 1.92, 0.05); for (const d of [-1, 1]) { sp(0.1, BRD, d * 0.2, 2.16, 0.02); sp(0.07, BRD, d * 0.11, 1.95, 0.3, [1, 1.2, 0.5]); sp(0.13, BRD, d * 0.3, 1.25, 0.25); }
  const bam = cyl(0.03, 0.03, 0.9, '#7a8a3a', sx + 0.32, 1.5, sz + 0.25, rec, 8); bam.rotation.z = 0.4;
  signPanel(rec, 0.6, 0.16, sx, 0.62, sz + 0.61, (g, w, h) => { g.fillStyle = '#c9a24a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2420'; g.font = `800 34px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BAMBOO BRONZE', w / 2, h / 2); }, { frame: '#5a3a1e' }); }
rbox(2.2, 0.1, 0.6, '#8a5a36', 12, 0.45, 2.4, rec, {}, 0.03); for (const dx of [-0.9, 0.9]) box(0.08, 0.45, 0.5, '#2f3540', 12 + dx, 0.22, 2.4, rec);
prop('pottedPlant', 19.45, -1.9, 0.3, { s: 2.6, parent: rec }); prop('pottedPlant', 19.45, 1.9, 2.1, { s: 2.6, parent: rec }); prop('pottedPlant', 2.6, -2.4, 1.1, { s: 2.6, parent: rec });
// --- lounge: TV on the hall wall, two sofas facing it, bean bags, game shelf, ART 3 neon
const HWZ = 3.06; // hall-wall face on the south rooms
{ rbox(2.8, 0.5, 0.5, '#3b2a20', -16, 0.25, 3.4, rec, {}, 0.03);
  rbox(2.7, 1.55, 0.08, '#0c0f15', -16, 1.55, 3.12, rec, {}, 0.04);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.4), new THREE.MeshBasicMaterial({ map: bossWinTex, color: new THREE.Color(1.2, 1.2, 1.2) })); scr.position.set(-16, 1.55, 3.17); rec.add(scr); } // nature channel follows the time of day
for (const x of [-17.4, -14.4]) prop('loungeSofa', x, 7.0, Math.PI, { s: 2.9, parent: rec, recolor: { carpet: '#c0623a' } });
const BEAN_GEO = new THREE.SphereGeometry(0.5, 18, 12);
function beanBag(P, x, z, color) { const b = new THREE.Mesh(BEAN_GEO, mat(color, { roughness: 1 })); b.scale.set(1, 0.55, 1); b.position.set(x, 0.27, z); b.castShadow = b.receiveShadow = true; P.add(b); return b; }
beanBag(rec, -12.4, 9.9, '#e9c46a'); beanBag(rec, -10.7, 10.8, '#2a9d8f'); beanBag(rec, -13.4, 11.6, '#e76f51');
prop('bookcaseOpen', -19.4, 10.8, Math.PI / 2, { parent: rec }); prop('lampRoundFloor', -19.2, 7.4, 0, { parent: rec }); prop('pottedPlant', -9.6, 13.4, 0.2, { s: 2.6, parent: rec });
signPanel(rec, 1.5, 0.75, -19.0, 1.8, HWZ, (g, w, h) => { g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ffb347'; g.shadowBlur = 24;
  g.fillStyle = '#ffe9b0'; g.font = `italic 900 92px ${FONT}`; g.fillText('STAY', w / 2, h * 0.3); g.fillText('GOLDEN', w / 2, h * 0.72); }, { basic: new THREE.Color(2.2, 1.7, 0.9), frame: '#1a1410' });
// --- game room: table tennis, arcade cabinets, foosball, bean bags, ART 9 poster
{ const TT = { x: -3.5, z: 9.0 };
  rbox(3.0, 0.06, 1.6, '#1f5fa8', TT.x, 0.78, TT.z, rec, { roughness: 0.5 }, 0.01);
  for (const [w, d, dx, dz] of [[3.0, 0.03, 0, -0.79], [3.0, 0.03, 0, 0.79], [0.03, 1.6, -1.49, 0], [0.03, 1.6, 1.49, 0], [3.0, 0.02, 0, 0]]) box(w, 0.065, d, '#f4f4f0', TT.x + dx, 0.785, TT.z + dz, rec);
  box(0.03, 0.17, 1.76, mat('#1b1e24', { transparent: true, opacity: 0.75 }), TT.x, 0.9, TT.z, rec); box(0.035, 0.02, 1.76, '#f4f4f0', TT.x, 0.985, TT.z, rec);
  for (const [dx, dz] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]]) box(0.07, 0.76, 0.07, '#2f3540', TT.x + dx, 0.38, TT.z + dz, rec);
  for (const [dx, c] of [[-0.9, '#d23a3a'], [1.0, '#1b1e24']]) { cyl(0.11, 0.11, 0.02, c, TT.x + dx, 0.82, TT.z + 0.3, rec, 16); box(0.04, 0.02, 0.14, '#c98c55', TT.x + dx, 0.82, TT.z + 0.45, rec); }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat('#ffffff')); ball.position.set(TT.x + 0.5, 1.1, TT.z - 0.2); rec.add(ball);
  const arcTex = canvasTex(256, 200, (g, w, h) => { g.fillStyle = '#050818'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffde59'; g.beginPath(); g.arc(70, 110, 26, 0.6, 2 * Math.PI - 0.6); g.lineTo(70, 110); g.fill();
    g.fillStyle = '#fff'; for (let x = 110; x < 240; x += 26) g.fillRect(x, 106, 8, 8); g.fillStyle = '#ff4d6d'; g.fillRect(200, 60, 26, 26); g.fillStyle = '#7df9ff'; g.font = `800 22px ${FONT}`; g.fillText('1UP 004200', 10, 26); });
  for (const [x, c] of [[-7.7, '#3a2a7a'], [-6.5, '#7a2a3a']]) { rbox(0.95, 1.9, 0.8, c, x, 0.95, 3.5, rec, {}, 0.04);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.56), new THREE.MeshBasicMaterial({ map: arcTex, color: new THREE.Color(1.5, 1.5, 1.5) })); s.position.set(x, 1.4, 3.91); s.rotation.x = -0.12; rec.add(s);
    rbox(0.9, 0.12, 0.35, '#1b1e24', x, 1.0, 4.0, rec, {}, 0.02); cyl(0.04, 0.04, 0.1, '#e63946', x - 0.2, 1.1, 4.0, rec, 8); }
  rbox(1.5, 0.4, 0.85, '#3b2a20', -0.2, 0.75, 12.3, rec, {}, 0.03); box(1.36, 0.02, 0.72, '#2f8a4c', -0.2, 0.96, 12.3, rec);
  for (let i = 0; i < 6; i++) { const r = cyl(0.015, 0.015, 1.15, STEEL, -0.75 + i * 0.22, 1.0, 12.3, rec, 6); r.rotation.x = Math.PI / 2; }
  for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) box(0.08, 0.55, 0.08, '#2f3540', -0.2 + dx, 0.28, 12.3 + dz, rec);
  beanBag(rec, -7.8, 12.4, '#8338ec'); beanBag(rec, -6.4, 13.0, '#ff006e');
  prop('pottedPlant', 1.4, 3.6, 0.9, { s: 2.4, parent: rec });
  // ART 9 — "Hi-Score Hall": retro arcade high-score poster (bot initials, no real data)
  signPanel(rec, 1.4, 1.0, -1.4, 1.65, HWZ, (g, w, h) => { g.fillStyle = '#0b0b1e'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff4d6d'; g.font = `900 64px ui-monospace,monospace`; g.textAlign = 'center'; g.fillText('HI-SCORE', w / 2, 72);
    g.font = `700 36px ui-monospace,monospace`; [['OVL', '#ffde59'], ['SPB', '#7df9ff'], ['MNY', '#7dff6a'], ['KIM', '#f9c74f'], ['CRD', '#ff9f43']].forEach(([n, c], i) => { g.fillStyle = c; g.fillText(`${i + 1}. ${n}  ${String(99000 - i * 7300).padStart(6, '0')}`, w / 2, 140 + i * 44); }); }, { frame: '#ff4d6d' }); }
// --- tennis: net + posts, scoreboard, bench, ball hopper, rackets
{ const nx = (COURT.x0 + COURT.x1) / 2;
  for (const z of [COURT.z0 - 0.3, COURT.z1 + 0.3]) cyl(0.05, 0.05, 1.05, '#2f3540', nx, 0.52, z, rec, 10);
  const net = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.85, COURT.z1 - COURT.z0 + 0.6), new THREE.MeshStandardMaterial({ color: '#1b1e24', transparent: true, opacity: 0.55, depthWrite: false }));
  net.position.set(nx, 0.48, (COURT.z0 + COURT.z1) / 2); rec.add(net); box(0.04, 0.06, COURT.z1 - COURT.z0 + 0.6, '#f4f4f0', nx, 0.92, (COURT.z0 + COURT.z1) / 2, rec);
  signPanel(rec, 2.0, 0.85, 11, 1.8, HWZ, (g, w, h) => { g.fillStyle = '#10161f'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 56px ${FONT}`;
    g.fillStyle = '#9fb0c6'; g.fillText('HOME', w * 0.25, 60); g.fillText('AWAY', w * 0.75, 60); g.fillStyle = '#ffd166'; g.font = `900 120px ui-monospace,monospace`; g.fillText('40', w * 0.25, 175); g.fillText('30', w * 0.75, 175); }, { basic: new THREE.Color(1.3, 1.3, 1.3) });
  rbox(2.4, 0.1, 0.5, '#8a5a36', 6.8, 0.45, 3.5, rec, {}, 0.03); for (const dx of [-1, 1]) box(0.08, 0.45, 0.4, '#2f3540', 6.8 + dx, 0.22, 3.5, rec);
  for (const dx of [-0.5, 0.4]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 6, 18), mat('#d23a3a')); r.rotation.x = -Math.PI / 2; r.position.set(6.8 + dx, 0.52, 3.5); rec.add(r); box(0.3, 0.03, 0.04, '#1b1e24', 6.8 + dx + 0.3, 0.52, 3.5, rec); }
  const BALL = mat('#d7f542', { roughness: 0.8 }), BG2 = new THREE.SphereGeometry(0.05, 10, 8);
  cyl(0.28, 0.24, 0.6, mat('#9aa3ae', { transparent: true, opacity: 0.5 }), 18.9, 0.35, 4.0, rec, 12);
  for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(BG2, BALL); const a = srand() * 7, r = srand() * 0.2; b.position.set(18.9 + Math.cos(a) * r, 0.1 + srand() * 0.5, 4.0 + Math.sin(a) * r); rec.add(b); }
  for (const [x, z] of [[8.2, 6.4], [14.1, 10.6], [5.1, 12.9]]) { const b = new THREE.Mesh(BG2, BALL); b.position.set(x, 0.05, z); rec.add(b); } }

// ======================= FLOORS 2-3: RESIDENCES (one personalized apartment per bot) =======================
const aptGlass = new THREE.MeshStandardMaterial({ color: '#f3e6d6', transparent: true, opacity: 0.26, roughness: 0.4, metalness: 0, depthWrite: false });
const sconceMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 1.1) });
const aptTop = new THREE.MeshStandardMaterial({ map: aptFloorTex, roughness: 0.74, metalness: 0 });
// four rooms behind the corridor (10 wide), three in front (13.3 wide), grouped by team
const RES = [
  { P: aptA, floor: 2, name: 'RESIDENCES A', back: ['overlord', 'superseller', 'junior', 'moneybot'], front: ['mini', 'stockbot', 'sniper'] },
  { P: aptB, floor: 3, name: 'RESIDENCES B', back: ['planner', 'shadow', 'ledger', 'kimchi'], front: ['credit', 'eraser', 'scribe'] },
];
const BEDS = {}; // id -> { x, headZ, facing, floor, P, side, via, door, back, wid, foot, col, cover }
const MATTRESS_TOP = 0.56;
const soften = (hex, k = 0.42) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#d9d2c6'), k).getHexString();
const deepen = (hex, k = 0.55) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
function nameTex(def) {
  return canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#efe7da'; rr(g, 4, 4, w - 8, h - 8, 26); g.fill();
    g.fillStyle = def.color; rr(g, 4, 4, 34, h - 8, 18); g.fill();
    g.fillStyle = '#2b2420'; let px = 74; g.font = `800 ${px}px ${FONT}`; const mw = w - 90; const tw = g.measureText(def.short).width; if (tw > mw) { px = Math.floor(px * mw / tw); g.font = `800 ${px}px ${FONT}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(def.short, 38 + (w - 38) / 2, h / 2 + 3); });
}
const MAT_GEO = new THREE.PlaneGeometry(1.15, 0.36), PLAQUE_GEO = new THREE.PlaneGeometry(0.86, 0.27);

// themed wall poster per bot (decor only; no real data, no amounts)
function posterDraw(id) {
  const T = (g, t, y, px = 54, c = '#fff', f = 800) => { g.fillStyle = c; g.font = `${f} ${px}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 256, y); };
  const line = (g, pts, c, wdt = 8) => { g.strokeStyle = c; g.lineWidth = wdt; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
  return (g, w, h) => {
    switch (id) {
      case 'overlord': g.fillStyle = '#3e1f60'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8b93a'; g.beginPath(); g.moveTo(166, 190); g.lineTo(186, 100); g.lineTo(226, 150); g.lineTo(256, 80); g.lineTo(286, 150); g.lineTo(326, 100); g.lineTo(346, 190); g.fill();
        T(g, 'COMMAND · COORDINATE', 250, 34, '#f2cf63'); break;
      case 'moneybot': g.fillStyle = '#0f2a1a'; g.fillRect(0, 0, w, h); line(g, [[40, 270], [120, 230], [180, 250], [260, 170], [330, 190], [420, 90], [470, 60]], '#7dff6a', 10); T(g, 'TO THE MOON', 40, 40, '#d6f5e3'); break;
      case 'mini': g.fillStyle = '#eaf7ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#cfd8d0'; rr(g, 226, 50, 60, 220, 30); g.fill(); g.fillStyle = '#3d9a4e'; rr(g, 232, 140, 48, 126, 24); g.fill();
        g.beginPath(); g.arc(256, 270, 40, 0, 7); g.fill(); T(g, 'SAVINGS GOAL', 30, 36, '#245a30'); break;
      case 'stockbot': g.fillStyle = '#10161f'; g.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { const up = (i * 7) % 3 !== 0, x = 40 + i * 38, y0 = 220 - i * 10 + (up ? 0 : 30); g.fillStyle = up ? '#3ddc84' : '#ff5d5d';
          g.fillRect(x, y0 - 50, 20, 50); g.fillRect(x + 9, y0 - 70, 3, 90); } T(g, 'BULL MARKET', 40, 38, '#5ff3ff'); break;
      case 'superseller': g.fillStyle = '#ffd166'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2d42'; rr(g, 150, 100, 212, 110, 40); g.fill(); g.fillStyle = '#ef476f'; g.beginPath(); g.arc(320, 140, 14, 0, 7); g.arc(300, 170, 14, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.fillRect(182, 140, 40, 12); g.fillRect(196, 126, 12, 40); T(g, 'RETRO LOT · SOLD!', 270, 44, '#2b2d42', 900); break;
      case 'junior': g.fillStyle = '#e8f1fb'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8864f'; g.fillRect(170, 110, 170, 120); g.fillStyle = '#e0c98f'; g.fillRect(170, 150, 170, 18);
        line(g, [[200, 70], [230, 100], [300, 40]], '#2f9a4f', 16); T(g, 'SHIPPED ON TIME', 275, 44, '#2a4a7a', 900); break;
      case 'ledger': g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h); [['#2f7a5a', 0, 2.2], ['#e8b93a', 2.2, 3.6], ['#3f6fd0', 3.6, 5.0], ['#c2346b', 5.0, 6.283]].forEach(([c, a0, a1]) => { g.fillStyle = c; g.beginPath(); g.moveTo(256, 170); g.arc(256, 170, 100, a0, a1); g.fill(); });
        T(g, 'FAMILY BUDGET', 300, 40, '#1f4a3a'); break;
      case 'shadow': g.fillStyle = '#2d4a36'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.88)'; g.font = `600 60px "Comic Sans MS",${FONT}`; g.textAlign = 'left';
        g.fillText('2 + 2 = 4', 40, 90); g.fillText('A B C', 40, 175); g.fillStyle = '#ffd166'; g.font = `900 96px ${FONT}`; g.fillText('A+', 330, 190); g.fillStyle = 'rgba(255,255,255,.7)'; g.font = `500 34px ${FONT}`; g.fillText('homework done ✓', 40, 270); break;
      case 'eraser': g.fillStyle = '#dbe9ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f4a6e'; g.beginPath(); g.moveTo(256, 40); g.lineTo(356, 80); g.lineTo(346, 180); g.lineTo(256, 250); g.lineTo(166, 180); g.lineTo(156, 80); g.closePath(); g.fill();
        g.fillStyle = '#fff'; g.fillRect(226, 130, 60, 50); g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(256, 130, 22, Math.PI, 0); g.stroke(); T(g, 'IDENTITY PROTECTED', 286, 36, '#2f4a6e'); break;
      case 'kimchi': g.fillStyle = '#f3efe0'; g.fillRect(0, 0, w, h); for (const [x, a, c] of [[150, -0.5, '#4f7d3a'], [256, 0, '#6a9a3a'], [362, 0.5, '#3f6a2a']]) { g.save(); g.translate(x, 170); g.rotate(a); g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, 38, 110, 0, 0, 7); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -100); g.lineTo(0, 100); g.stroke(); g.restore(); } T(g, 'GROW SLOW', 296, 34, '#4a3a1a'); break;
      case 'scribe': g.fillStyle = '#0d0f1e'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e1cf'; g.beginPath(); g.arc(380, 70, 34, 0, 7); g.fill(); g.fillStyle = '#0d0f1e'; g.beginPath(); g.arc(394, 62, 30, 0, 7); g.fill();
        g.strokeStyle = '#ffc65a'; g.lineWidth = 10; g.beginPath(); g.moveTo(186, 280); g.lineTo(186, 140); g.arc(256, 140, 70, Math.PI, 0); g.lineTo(326, 280); g.stroke(); g.fillStyle = 'rgba(90,110,255,.35)'; g.fillRect(196, 140, 120, 140);
        T(g, 'THE GATE AWAITS', 40, 34, '#ffc65a'); break;
      case 'planner': g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, w, h); g.fillStyle = '#c2346b'; g.fillRect(0, 0, w, 70); T(g, 'PLAN AHEAD', 36, 44, '#fff', 900);
        g.strokeStyle = '#d9cbe0'; g.lineWidth = 3; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) g.strokeRect(26 + c * 66, 90 + r * 56, 66, 56); g.fillStyle = '#a77de0'; g.beginPath(); g.arc(26 + 3 * 66 + 33, 90 + 56 + 28, 18, 0, 7); g.fill(); break;
      case 'credit': { g.fillStyle = '#fbf6ee'; g.fillRect(0, 0, w, h); const cx = 256, cy = 230; [['#d64545', Math.PI, Math.PI * 1.25], ['#f08a2e', Math.PI * 1.25, Math.PI * 1.5], ['#e8c43a', Math.PI * 1.5, Math.PI * 1.75], ['#3aa65a', Math.PI * 1.75, Math.PI * 2]].forEach(([c, a0, a1]) => {
          g.strokeStyle = c; g.lineWidth = 46; g.beginPath(); g.arc(cx, cy, 150, a0, a1); g.stroke(); });
        g.strokeStyle = '#1f2a3a'; g.lineWidth = 10; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(Math.PI * 1.86) * 130, cy + Math.sin(Math.PI * 1.86) * 130); g.stroke(); g.fillStyle = '#1f2a3a'; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill();
        T(g, 'CREDIT SCORE', 34, 40, '#1f4e79', 900); T(g, 'EXCELLENT', 290, 40, '#2f8a4c', 900); break; }
      case 'sniper': g.fillStyle = '#2c3824'; g.fillRect(0, 0, w, h); T(g, 'GOING… GOING…', 60, 44, '#d7c49a'); T(g, '00:00:03', 160, 96, '#9aff5c', 900); T(g, 'SOLD!', 262, 70, '#ffd166', 900); break;
    }
  };
}
// themed 3D corner per bot: (ax, az) is the anchor on the floor of the room's free corner
function themeProps(id, P, ax, az) {
  const B = (w, h, d, c, dx, y, dz, o = {}, r = 0.03) => rbox(w, h, d, c, ax + dx, y, az + dz, P, o, r);
  const C = (rt, rb, h, c, dx, y, dz, seg = 16) => cyl(rt, rb, h, c, ax + dx, y, az + dz, P, seg);
  const S = (r, c, dx, y, dz, s = [1, 1, 1], o = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), typeof c === 'string' ? mat(c, o) : c); m.scale.set(...s); m.position.set(ax + dx, y, az + dz); m.castShadow = true; P.add(m); return m; };
  const table = (dx, dz, w = 1.0, d = 0.6, h = 0.72, c = '#5a3a24') => { B(w, 0.06, d, c, dx, h, dz); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.05, h, 0.05, c, ax + dx + a * (w / 2 - 0.06), h / 2, az + dz + b * (d / 2 - 0.06), P); return h + 0.03; };
  const GOLDM = mat('#e8b93a', { roughness: 0.4, metalness: 0.4 });
  switch (id) {
    case 'overlord': { // purple throne + chess table
      B(1.0, 0.5, 0.9, '#5b2d8a', 0, 0.25, 0); B(1.0, 1.7, 0.2, '#5b2d8a', 0, 1.0, -0.42); B(1.12, 0.1, 0.24, GOLDM, 0, 1.88, -0.42); for (const s of [-1, 1]) { B(0.16, 0.4, 0.9, '#3e1f60', s * 0.52, 0.62, 0); C(0.06, 0.06, 0.12, GOLDM, s * 0.45, 1.98, -0.42, 8); }
      const t = table(-1.6, 0.5, 0.8, 0.8); const ct = canvasTex(256, 256, (g, w) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#3b2a20' : '#efe6cf'; g.fillRect(i * 32, j * 32, 32, 32); } });
      const bd = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({ map: ct })); bd.rotation.x = -Math.PI / 2; bd.position.set(ax - 1.6, t + 0.005, az + 0.5); P.add(bd);
      for (let i = 0; i < 6; i++) C(0.035, 0.045, 0.12, i < 3 ? '#efe6cf' : '#1b1e24', -1.85 + i * 0.1, t + 0.06, 0.5 + (i < 3 ? -0.25 : 0.25), 8); break; }
    case 'moneybot': { // gold coin stacks + safe
      for (let i = 0; i < 6; i++) C(0.13, 0.13, 0.08 + (i % 3) * 0.12, GOLDM, -1.2 + i * 0.32, 0.04 + (i % 3) * 0.06, 0.6 + (i % 2) * 0.25, 18);
      B(0.85, 0.95, 0.75, '#3a3f4a', 0.6, 0.475, -0.4, { roughness: 0.5, metalness: 0.4 }); const d = C(0.12, 0.12, 0.05, '#c9ced6', 0.6, 0.6, -0.01, 18); d.rotation.x = Math.PI / 2; B(0.06, 0.25, 0.06, '#c9ced6', 0.92, 0.5, -0.01);
      prop('pottedPlant', ax - 1.4, az - 0.6, 0.4, { s: 2.2, parent: P }); break; }
    case 'mini': { // piggy bank on a side table + coin jar
      const t = table(0, 0, 0.9, 0.6); S(0.22, '#f4a6b8', 0, t + 0.2, 0, [1.3, 1, 1]); const sn = C(0.07, 0.07, 0.06, '#e88aa0', 0.3, t + 0.2, 0, 12); sn.rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 6), mat('#e88aa0')); e.position.set(ax + 0.12, t + 0.42, az + s * 0.1); P.add(e); C(0.04, 0.04, 0.1, '#e88aa0', 0.15, t + 0.04, s * 0.1, 8); C(0.04, 0.04, 0.1, '#e88aa0', -0.15, t + 0.04, s * 0.1, 8); }
      B(0.12, 0.02, 0.02, '#7a3a4a', 0, t + 0.42, 0);
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 16), new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.45, roughness: 0.1 })); jar.position.set(ax - 1.0, 0.2, az + 0.5); P.add(jar);
      C(0.14, 0.14, 0.18, GOLDM, -1.0, 0.1, 0.5, 14); beanBag(P, ax + 1.0, az + 0.7, '#5ecf6a'); break; }
    case 'stockbot': { // ticker screens on a stand + bronze bull
      C(0.05, 0.05, 1.6, '#2f3540', 0, 0.8, -0.4, 8); B(0.6, 0.05, 0.4, '#2f3540', 0, 0.025, -0.4);
      const tk = canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#05080e'; g.fillRect(0, 0, w, h); g.font = `700 40px ui-monospace,monospace`;
        [['PFQ ▲', '#3ddc84'], ['GVA ▼', '#ff5d5d'], ['AZX ▲', '#3ddc84']].forEach(([t, c], i) => { g.fillStyle = c; g.fillText(t, 20 + i * 165, 70); }); g.strokeStyle = '#5ff3ff'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x < w; x += 16) g.lineTo(x, 130 - Math.sin(x / 40) * 14 - x / 30); g.stroke(); });
      for (const [dx, y, ry] of [[-0.62, 1.45, 0.25], [0, 1.45, 0], [0.62, 1.45, -0.25], [0, 0.98, 0]]) { const fr = B(0.62, 0.4, 0.05, '#11151c', dx, y, -0.35); fr.rotation.y = ry;
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), new THREE.MeshBasicMaterial({ map: tk, color: new THREE.Color(1.4, 1.4, 1.4) })); s.position.set(ax + dx, y, az - 0.32); s.rotation.y = ry; P.add(s); }
      const BRZ = mat('#a8723a', { roughness: 0.35, metalness: 0.7 }); B(0.7, 0.35, 0.3, BRZ, -1.3, 0.55, 0.6); B(0.25, 0.25, 0.25, BRZ, -0.9, 0.72, 0.6);
      for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), BRZ); h.rotation.x = s * 1.2; h.position.set(ax - 0.85, 0.9, az + 0.6 + s * 0.15); P.add(h); }
      for (const [a, b] of [[-1.55, -1], [-1.55, 1], [-1.05, -1], [-1.05, 1]]) box(0.07, 0.4, 0.07, BRZ, ax + a, 0.2, az + 0.6 + b * 0.1, P); B(0.9, 0.06, 0.5, '#2a2d33', -1.3, 0.03, 0.6); break; }
    case 'superseller': { // retro collectibles shelves + CRT on a stand with a console
      const sw = 1.8, sh = 2.0; B(sw, 0.06, 0.45, '#5a3a24', 0, sh, -0.6); for (const s of [-1, 1]) B(0.06, sh, 0.45, '#5a3a24', s * sw / 2, sh / 2, -0.6); B(sw, sh, 0.04, '#4a2f1c', 0, sh / 2, -0.8);
      const CART = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#8338ec', '#ffbe0b', '#6c757d', '#ef476f'];
      for (let r = 0; r < 4; r++) { const y = 0.08 + r * 0.48; B(sw - 0.1, 0.04, 0.42, '#5a3a24', 0, y, -0.6); for (let k = 0; k < 7; k++) { const tall = (k + r) % 3 === 0; B(0.17, tall ? 0.3 : 0.22, tall ? 0.24 : 0.12, CART[(k * 3 + r) % 8], -0.72 + k * 0.24, y + (tall ? 0.17 : 0.13), -0.58, {}, 0.01); } }
      const t = table(1.5, 0.2, 0.9, 0.6, 0.6, '#3b2a20'); B(0.7, 0.55, 0.55, '#d8d2c4', 1.5, t + 0.28, 0.15, {}, 0.06);
      const ct = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.38), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.2, 1.6) })); ct.position.set(ax + 1.5, t + 0.3, az + 0.43); P.add(ct);
      B(0.4, 0.08, 0.28, '#8a8f99', 1.5, 0.05, 0.6); break; }
    case 'junior': { // packing station: boxes, tape, label printer, outgoing tray
      const t = table(0, -0.2, 1.4, 0.7, 0.85, '#c98c55'); for (const [dx, h] of [[-0.4, 0.35], [0.1, 0.25]]) { B(0.4, h, 0.35, '#b8864f', dx, t + h / 2, -0.2); B(0.41, 0.03, 0.08, '#e0c98f', dx, t + h, -0.2); }
      B(0.3, 0.18, 0.25, '#f4f4f0', 0.5, t + 0.09, -0.3); box(0.2, 0.01, 0.12, '#ffffff', ax + 0.5, t + 0.19, az - 0.18, P);
      for (let i = 0; i < 3; i++) B(0.55, 0.4, 0.45, '#b8864f', -1.2 + (i % 2) * 0.1, 0.2 + i * 0.41, 0.6); { const r = C(0.08, 0.08, 0.06, '#d9c99c', 0.3, t + 0.04, 0.0, 12); r.rotation.x = Math.PI / 2; } break; }
    case 'ledger': { // writing desk with ledger books + adding machine
      const t = table(0, -0.2, 1.3, 0.7); for (let i = 0; i < 4; i++) B(0.34, 0.07, 0.46, ['#2f6e55', '#8a2a2a', '#2f6e55', '#3a3f4a'][i], -0.35, t + 0.035 + i * 0.075, -0.2, {}, 0.01);
      B(0.36, 0.14, 0.32, '#d6d2c4', 0.35, t + 0.07, -0.2); B(0.12, 0.2, 0.02, '#ffffff', 0.35, t + 0.2, -0.33, {}, 0.005);
      prop('chair', ax, az + 0.45, Math.PI, { parent: P, recolor: { wood: '#2f6e55' } }); prop('bookcaseOpen', ax - 1.55, az - 0.2, Math.PI / 2, { parent: P, s: 2.0 }); break; }
    case 'shadow': { // chalkboard easel, book stack, globe
      for (const s of [-1, 1]) { const l = B(0.06, 1.8, 0.06, '#8a5a36', s * 0.6, 0.9, 0); l.rotation.z = -s * 0.08; }
      B(1.3, 0.9, 0.05, '#2d4a36', 0, 1.25, 0.02, { roughness: 1 }); B(1.4, 0.06, 0.08, '#8a5a36', 0, 0.78, 0.05);
      const ch = canvasTex(256, 180, (g, w, h) => { g.fillStyle = '#2d4a36'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; g.font = `600 40px ${FONT}`; g.fillText('3 × 4 = 12', 20, 60); g.fillText('ABC ✓', 20, 130); });
      const cm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: ch, roughness: 1 })); cm.position.set(ax, 1.25, az + 0.05); P.add(cm);
      for (let i = 0; i < 5; i++) B(0.42, 0.09, 0.3, ['#e63946', '#457b9d', '#ffbe0b', '#2a9d8f', '#8338ec'][i], -1.2, 0.045 + i * 0.09, 0.6, {}, 0.01);
      C(0.04, 0.12, 0.5, '#8a5a36', 1.1, 0.25, 0.6, 10); S(0.22, '#3a7bd5', 1.1, 0.7, 0.6); S(0.12, '#4caf50', 1.15, 0.78, 0.68, [1, 0.7, 0.6]); break; }
    case 'eraser': { // shredder, cloud lamp, small safe
      B(0.5, 0.65, 0.4, '#2f3540', 0, 0.325, -0.3); B(0.4, 0.03, 0.06, '#111', 0, 0.66, -0.3); for (let i = 0; i < 5; i++) B(0.02, 0.22, 0.004, '#f4f4f0', -0.08 + i * 0.04, 0.25, -0.09, {}, 0.002);
      const t = table(1.2, 0.3, 0.7, 0.6); const CL = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#cfe3ff', emissiveIntensity: 0.8, roughness: 1 });
      for (const [dx, dy, r] of [[0, 0.16, 0.16], [-0.17, 0.1, 0.12], [0.17, 0.1, 0.12]]) S(r, CL, 1.2 + dx, t + dy, 0.3);
      B(0.6, 0.6, 0.55, '#59616d', -1.1, 0.3, 0.4, { roughness: 0.5, metalness: 0.4 }); { const d = C(0.08, 0.08, 0.04, '#c9ced6', -1.1, 0.35, 0.68, 14); d.rotation.x = Math.PI / 2; } break; }
    case 'kimchi': { // plants galore + onggi kimchi crocks
      const POT = ['#b5653a', '#8a4a2a', '#d9c9a0', '#6b7d5a'];
      for (const [dx, dz, s] of [[-1.3, -0.5, 1.2], [-0.5, -0.8, 0.8], [0.4, -0.6, 1.0], [1.2, -0.3, 1.4], [-1.2, 0.6, 0.7], [1.3, 0.8, 0.9]]) { C(0.18 * s, 0.13 * s, 0.32 * s, POT[Math.round(s * 10) % 4], dx, 0.16 * s, dz, 12);
        S(0.28 * s, ['#4f7d3a', '#6a9a3a', '#3f6a2a'][Math.round(s * 7) % 3], dx, 0.32 * s + 0.2 * s, dz, [1, 1.2, 1]); }
      for (const [dx, s] of [[-0.3, 1], [0.25, 0.8]]) { S(0.26 * s, '#5a3a24', dx, 0.24 * s, 0.6, [1, 1.1, 1], { roughness: 0.5 }); C(0.14 * s, 0.14 * s, 0.06, '#3b2a20', dx, 0.5 * s, 0.6, 12); } break; }
    case 'scribe': { // dark-fantasy library + candles + rune circle
      const sw = 1.7; B(sw, 2.0, 0.42, '#1a1410', 0, 1.0, -0.6); const SP = ['#3a1f4a', '#5a1a1a', '#1f2a3a', '#2a3a1f', '#4a3a1a', '#111'];
      for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) B(0.16, 0.34 + (k % 3) * 0.04, 0.3, SP[(k + r * 2) % 6], -0.62 + k * 0.18, 0.28 + r * 0.46, -0.45, {}, 0.01);
      const t = table(1.2, 0.4, 0.8, 0.6, 0.72, '#2a1f18'); const FL = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.6, 0.5) });
      for (const [dx, dz, h] of [[1.0, 0.3, 0.3], [1.2, 0.5, 0.22], [1.4, 0.35, 0.36]]) { C(0.04, 0.04, h, '#efe6cf', dx, t + h / 2, dz, 10); const f = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 6), FL); f.position.set(ax + dx, t + h + 0.05, az + dz); P.add(f); }
      floorPlane(P, ax - 1.0, ax + 0.4, az + 0.0, az + 1.4, (g, w, h) => { g.strokeStyle = '#ffc65a'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w * 0.42, 0, 7); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, w * 0.3, 0, 7); g.stroke();
        for (let i = 0; i < 5; i++) { const a = i * 2.513; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * w * 0.3, h / 2 + Math.sin(a) * h * 0.3); g.lineTo(w / 2 + Math.cos(a + 2.513) * w * 0.3, h / 2 + Math.sin(a + 2.513) * h * 0.3); g.stroke(); } }, 120, 0.016); break; }
    case 'planner': { // writing desk with planner + flower vase, vanity mirror
      const t = table(0, -0.3, 1.3, 0.6, 0.75, '#efe6dc'); B(0.4, 0.05, 0.3, '#d94f86', -0.3, t + 0.025, -0.3);
      C(0.07, 0.09, 0.25, '#a8dadc', 0.4, t + 0.125, -0.35, 12); for (const [dx, dy, c] of [[0, 0.32, '#ff6b9a'], [0.07, 0.28, '#ffd166'], [-0.06, 0.29, '#c77dff']]) S(0.07, c, 0.4 + dx, t + dy, -0.35);
      B(0.7, 0.9, 0.04, mat('#b9c7d1', { roughness: 0.12, metalness: 0.55 }), 0, t + 0.6, -0.58); prop('chair', ax, az + 0.25, Math.PI, { parent: P, recolor: { wood: '#c2346b' } }); break; }
    case 'credit': { // filing cabinets with labeled drawers + folder stack
      for (const dx of [-0.35, 0.35]) { B(0.66, 1.4, 0.7, '#5d6675', dx, 0.7, -0.5, { roughness: 0.5, metalness: 0.3 }); for (let i = 0; i < 4; i++) { B(0.6, 0.3, 0.02, '#6b7584', dx, 0.2 + i * 0.33, -0.14, {}, 0.01); B(0.18, 0.04, 0.03, '#c9ced6', dx, 0.27 + i * 0.33, -0.13, {}, 0.01); B(0.14, 0.07, 0.01, '#f4efe4', dx, 0.15 + i * 0.33, -0.13, {}, 0.005); } }
      const t = table(1.3, 0.4, 0.8, 0.6); for (let i = 0; i < 5; i++) B(0.34, 0.03, 0.26, ['#e6c27a', '#e0892e', '#e6c27a', '#7ab0e0', '#e6c27a'][i], 1.3, t + 0.015 + i * 0.03, 0.4, {}, 0.005);
      prop('plantSmall1', ax - 1.3, az + 0.5, 0, { s: 2.4, parent: P }); break; }
    case 'sniper': { // auction gavel on its sound block, binoculars, camo rug
      floorPlane(P, ax - 1.2, ax + 1.2, az - 0.6, az + 1.2, (g, w, h) => { g.fillStyle = '#4a5c38'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = ['#2c3824', '#6b7a4a', '#3a432c'][i % 3]; g.beginPath(); g.ellipse(srand() * w, srand() * h, 20 + srand() * 30, 10 + srand() * 20, srand() * 3, 0, 7); g.fill(); } }, 100, 0.014);
      const t = table(0, 0, 0.9, 0.6, 0.75, '#3b2a20'); C(0.12, 0.13, 0.05, '#5a3a24', -0.15, t + 0.025, 0, 18);
      const head = C(0.05, 0.05, 0.22, '#7a4a2a', 0.0, t + 0.12, 0.0, 12); head.rotation.z = Math.PI / 2; const hnd = B(0.03, 0.03, 0.34, '#8a5a36', 0.0, t + 0.12, 0.17, {}, 0.01); hnd.rotation.y = 0.2;
      for (const s of [-1, 1]) { const b = C(0.04, 0.04, 0.12, '#1a1c18', 0.3 + s * 0.05, t + 0.06, -0.15, 10); b.rotation.x = Math.PI / 2; } beanBag(P, ax + 1.1, az + 0.7, '#556640'); break; }
  }
}
function bedroom(def, x0, x1, back, P, floor) { // back: room behind the corridor (z -14..-3), else in front (z 3..14)
  const cx = (x0 + x1) / 2, col = def.color;
  const bx = back ? cx - 1.2 : x0 + 2.2, hz = back ? -13.9 : 3.12, dX = back ? cx + 1.8 : x1 - 1.6;
  const len = 2.3, wid = 1.7, bcz = hz + 0.1 + len / 2, duvetZ0 = hz + 0.1 + len * 0.42, duvetZ1 = hz + 0.12 + len;
  carpet(P, x0 + 0.04, x1 - 0.04, back ? -13.99 : 3.02, back ? -3.02 : 13.98, soften(col, 0.55)); // wall-to-wall carpet, tinted to the bot
  // bed: walnut frame, upholstered headboard in the bot's color, mattress, duvet (muted bot color), pillows
  rbox(wid, 0.26, len, '#5a3a24', bx, 0.2, bcz, P, {}, 0.05);
  rbox(wid + 0.12, 1.1, 0.14, deepen(col, 0.6), bx, 0.62, hz + 0.02, P, { roughness: 0.95 }, 0.06);
  rbox(wid - 0.12, 0.24, len - 0.1, '#f2eee7', bx, MATTRESS_TOP - 0.12, bcz, P, {}, 0.07);
  rbox(wid - 0.02, 0.2, duvetZ1 - duvetZ0, soften(col), bx, MATTRESS_TOP + 0.02, (duvetZ0 + duvetZ1) / 2, P, { roughness: 1 }, 0.08);
  rbox(wid - 0.0, 0.07, 0.2, soften(col, 0.7), bx, MATTRESS_TOP + 0.11, duvetZ0 + 0.1, P, { roughness: 1 }, 0.03);
  for (const sd of [-1, 1]) rbox(0.68, 0.14, 0.38, '#fbfaf6', bx + sd * 0.38, MATTRESS_TOP + 0.05, hz + 0.36, P, { roughness: 1 }, 0.07);
  const nx = bx - 1.25;
  rbox(0.55, 0.55, 0.5, '#5a3a24', nx, 0.275, hz + 0.38, P, {}, 0.04); box(0.4, 0.02, 0.01, '#c9a24a', nx, 0.36, hz + 0.635, P);
  prop('lampRoundFloor', nx, hz + 0.38, 0, { s: 0.75, y: 0.55, parent: P });
  rbox(2.7, 0.02, 1.9, deepen(soften(col, 0.3), 0.8), bx, 0.016, duvetZ1 + 0.95, P, { roughness: 1 }, 0.01);
  rbox(2.4, 0.024, 1.6, soften(col, 0.2), bx, 0.018, duvetZ1 + 0.95, P, { roughness: 1 }, 0.01);
  const poster = posterDraw(def.id);
  if (back) {
    prop('chair', cx + 1.55, -12.4, -Math.PI / 2 - 0.4, { parent: P, recolor: { wood: '#8a5a36' } });
    prop('pottedPlant', x1 - 0.55, -13.45, 1.3, { s: 2.4, parent: P });
    prop('bookcaseOpen', x1 - 0.42, -8.4, -Math.PI / 2, { parent: P });
    signPanel(P, 1.9, 1.2, cx + 1.5, 1.95, BWZ, poster, { frame: '#f1ece2', px: 270 }); // themed wall poster
    themeProps(def.id, P, x0 + 2.4, -5.7);
  } else {
    prop('chair', x0 + 4.9, 10.6, Math.PI + 0.5, { parent: P, recolor: { wood: '#8a5a36' } });
    prop('pottedPlant', x1 - 0.6, 13.3, 0.7, { s: 2.4, parent: P });
    prop('bookcaseOpen', x0 + 0.42, 9.6, Math.PI / 2, { parent: P });
    signPanel(P, 1.9, 1.2, x0 + 7.0, 1.7, HWZ, poster, { frame: '#f1ece2', px: 270 }); // themed poster on the hall wall
    themeProps(def.id, P, x0 + 8.3, 11.0);
  }
  // name plates: doormat just inside the door + a plaque (corridor side for the back row, room side for the front row)
  const nt = nameTex(def);
  const dm = new THREE.Mesh(MAT_GEO, new THREE.MeshStandardMaterial({ map: nt, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
  dm.rotation.x = -Math.PI / 2; dm.position.set(dX, 0.02, back ? -3.6 : 3.6); dm.receiveShadow = true; P.add(dm);
  const pz = back ? -2.955 : 3.075, px = back ? dX - 1.25 : x0 + 4.6;
  const pq = new THREE.Mesh(PLAQUE_GEO, new THREE.MeshBasicMaterial({ map: nt, color: new THREE.Color(1.05, 1.05, 1.05) })); pq.position.set(px, 1.75, pz); P.add(pq);
  rbox(0.92, 0.33, 0.02, '#2b2420', px, 1.75, pz - 0.015, P, {}, 0.01);
  BEDS[def.id] = { x: bx, headZ: hz, facing: 0, floor, P, side: bx + 1.15, via: back ? -9.0 : 7.5, door: dX, back, wid, foot: duvetZ1, col, cover: null };
}
for (const R of RES) {
  const P = R.P, nb = R.back.length, nf = R.front.length, bw = W / nb, fw = W / nf;
  elevs.push(floorShell(P, '#6b5a4e', aptTop));
  partition(-20, -3, 20, -3, R.back.map((_, i) => { const cx = -20 + (i + 0.5) * bw; return [cx + 1.2, cx + 2.4]; }), 2.6, P, aptGlass);
  partition(-20, 3, 20, 3, R.front.map((_, i) => { const x1 = -20 + (i + 1) * fw; return [x1 - 2.2, x1 - 1.0]; }), 2.6, P, aptGlass);
  for (let i = 1; i < nb; i++) partition(-20 + i * bw, -14, -20 + i * bw, -3, [], 2.6, P, aptGlass);
  for (let i = 1; i < nf; i++) partition(-20 + i * fw, 3, -20 + i * fw, 14, [], 2.6, P, aptGlass);
  R.back.forEach((id, i) => bedroom(TEAM.find((t) => t.id === id), -20 + i * bw, -20 + (i + 1) * bw, true, P, R.floor));
  R.front.forEach((id, i) => bedroom(TEAM.find((t) => t.id === id), -20 + i * fw, -20 + (i + 1) * fw, false, P, R.floor));
  // corridor: runner, lettering, sconces between the doors, plants at the window end
  const rt = canvasTex(2048, 128, (g, w, h) => { g.fillStyle = '#4b3a52'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(232,185,58,.55)'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.globalAlpha = 0.1; g.fillStyle = '#000'; for (let x = 0; x < w; x += 18) g.fillRect(x, 0, 2, h); });
  const run = new THREE.Mesh(new THREE.PlaneGeometry(35, 2.0), new THREE.MeshStandardMaterial({ map: rt, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 }));
  run.rotation.x = -Math.PI / 2; run.position.set(2.2, 0.012, 0.15); run.receiveShadow = true; P.add(run);
  floorWord(P, R.name, -13.2, 2.3);
  for (let i = 0; i < nb; i++) { const x = -20 + (i + 0.5) * bw - 0.4; box(0.18, 0.28, 0.06, sconceMat, x, 2.0, -2.95, P); }
  prop('pottedPlant', 19.45, -1.9, 0.3, { s: 2.6, parent: P }); prop('pottedPlant', 19.45, 1.9, 2.1, { s: 2.6, parent: P });
}
// ART 6 — "Mother Road": vintage Route 66 shield in the Residences A corridor
signPanel(aptA, 1.0, 1.1, -9.0, 1.7, -2.95, (g, w, h) => { g.fillStyle = '#6b5a4e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4efe2'; g.strokeStyle = '#1b1e24'; g.lineWidth = 12;
  g.beginPath(); g.moveTo(30, 40); g.quadraticCurveTo(w / 2, 0, w - 30, 40); g.lineTo(w - 40, h * 0.6); g.quadraticCurveTo(w / 2, h, 40, h * 0.6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#1b1e24'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 40px ${FONT}`; g.fillText('ARIZONA', w / 2, 80); g.fillText('US', w / 2, 130); g.beginPath(); g.moveTo(40, 160); g.lineTo(w - 40, 160); g.stroke();
  g.font = `900 140px ${FONT}`; g.fillText('66', w / 2, 240); }, { frame: '#3b2a20' });
// ART 7 — "Saguaro Triptych": three cactus panels in the Residences B corridor
for (let i = 0; i < 3; i++) signPanel(aptB, 0.6, 1.0, -9.8 + i * 0.75, 1.7, -2.95, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, ['#f2a65a', '#e76f51', '#6d597a'][i]); gr.addColorStop(1, '#f7e1b5'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2f5d3a'; const x = w / 2 - 14; g.fillRect(x, h * 0.25, 28, h * 0.75); g.fillRect(x - 40, h * 0.42, 14, 70); g.fillRect(x - 40, h * 0.42 + 56, 54, 14); if (i !== 1) { g.fillRect(x + 50, h * 0.36, 14, 80); g.fillRect(x + 14, h * 0.36 + 66, 50, 14); } }, { frame: '#3b2a20', px: 240 });
// lights for the floor in view below the office: one shared set, moved to whichever lower floor is shown
const LOW_LIGHT_POS = { 1: [[-14.5, -8], [4, -9], [-14, 8], [11, 8]], 2: [[-10, -7], [10, -7], [-7, 8.5], [7, 8.5]], 3: [[-10, -7], [10, -7], [-7, 8.5], [7, 8.5]] };
const lowLights = [];
for (let i = 0; i < 4; i++) { const p = new THREE.PointLight(0xffd2a0, 0, 15, 1.4); scene.add(p); lowLights.push({ p, base: 7 }); }
function placeLowLights(f) { if (!f) return; LOW_LIGHT_POS[f].forEach(([x, z], i) => lowLights[i].p.position.set(x, floorY(f) + 2.9, z)); }
// outer skin of each lower story (glass facade, like the tower below); fades out as the floor above it peels back
const skinsByFloor = [null];
for (let k = 1; k < NFLOORS; k++) { const ms = [facadeTex(D + 0.6, 12, 1), facadeTex(W + 0.6, 17, 1)];
  const sx = new THREE.Mesh(new THREE.PlaneGeometry(D + 0.6, FLOOR_H), ms[0]); sx.rotation.y = -Math.PI / 2; sx.position.set(-20.31, -0.7 - (k - 0.5) * FLOOR_H, 0);
  const sz = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6, FLOOR_H), ms[1]); sz.position.set(0, -0.7 - (k - 0.5) * FLOOR_H, 14.31);
  scene.add(sx, sz); skinsByFloor.push({ mats: ms, meshes: [sx, sz] }); }
const skinMats = skinsByFloor.slice(1).flatMap((s) => s.mats);

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
    case 'scope': { // compact optic, held in the hand
      const tube = cyl(0.05, 0.05, 0.36, '#2a2e28', 0, 0, 0, g, 14); tube.rotation.z = Math.PI / 2;
      cyl(0.07, 0.07, 0.055, '#1a1c18', 0.13, 0, 0, g, 14).rotation.z = Math.PI / 2;
      cyl(0.07, 0.07, 0.055, '#1a1c18', -0.13, 0, 0, g, 14).rotation.z = Math.PI / 2;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.048, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 1.8, 0.55) }));
      lens.position.set(0.19, 0, 0); lens.rotation.y = Math.PI / 2; g.add(lens); break; }
    case 'folder': rbox(0.32, 0.25, 0.03, '#e6c27a', 0, 0, 0, g, {}, 0.01); box(0.28, 0.21, 0.032, '#fbf8f0', 0.01, 0.01, 0, g); box(0.12, 0.04, 0.034, '#e0892e', -0.08, 0.13, 0, g);
      for (let i = 0; i < 3; i++) box(0.18, 0.012, 0.034, '#7a8494', 0.02, 0.05 - i * 0.05, 0, g); break;
    case 'quill': { const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.48, 12), mat('#f4efe4')); f.position.y = 0.14; f.rotation.z = 0.25; f.castShadow = true; g.add(f);
      box(0.018, 0.14, 0.018, '#2b2b2e', 0.035, -0.14, 0, g); break; }
  }
  return g;
}
const CHAR_H = 1.32;
let charScale = 1, eyeSpec = null, headBox = null, torsoBox = null, charBack = 0.3; // charBack: feet-origin to the back of the head (lying pose)
if (charGltf) {
  const tmp = charGltf.scene; tmp.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(tmp); charScale = CHAR_H / (bb.max.y - bb.min.y); charBack = Math.max(0.1, -bb.min.z * charScale);
  const headMesh = tmp.getObjectByName('head-mesh');
  const hb = headMesh ? new THREE.Box3().setFromObject(headMesh) : null; headBox = hb;
  eyeSpec = hb ? { y: (hb.min.y + hb.max.y) / 2 - (hb.max.y - hb.min.y) * 0.06, z: hb.max.z + 0.002, dx: (hb.max.x - hb.min.x) * 0.17, r: (hb.max.x - hb.min.x) * 0.06, top: hb.max.y } : null;
}
// tucked-in blanket over the lower body, one per bed, shown only while its bot is asleep (sized from the character)
for (const id in BEDS) {
  const p = BEDS[id], sc = sidekickScale(id), len = CHAR_H * sc, feetZ = p.headZ + 0.34 + len, rootY = MATTRESS_TOP + charBack * sc - 0.05, topY = rootY + 0.24 * sc;
  const z0 = feetZ - len * 0.58, z1 = p.foot + 0.03;
  p.cover = rbox(p.wid - 0.02, topY - MATTRESS_TOP + 0.06, z1 - z0, soften(p.col, 0.3), p.x, (topY + MATTRESS_TOP - 0.06) / 2, (z0 + z1) / 2, p.P, { roughness: 1 }, 0.12);
  p.cover.visible = false;
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
// flag texture for Superbot's open-shirt reveal
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
    case 'superseller': { // Superbot: neat dark hair, suit jacket open over a flag shirt, red tie knot
      bx(0.93, 0.09, 0.7, '#3a2a20', 0, 0.31, -0.03, {}, 0.04); bx(0.93, 0.36, 0.08, '#3a2a20', 0, 0.12, -0.33, {}, 0.03); bx(0.6, 0.08, 0.06, '#3a2a20', 0.1, 0.25, 0.33, {}, 0.03);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.22), new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.8 })); putT(f, 0, 0.02, 0.201);
      break; }
    case 'junior': { // Superbot Jr.: shorter dark hair, same suit family, no flag shirt
      bx(0.90, 0.09, 0.68, '#3a2a20', 0, 0.31, -0.03, {}, 0.04); bx(0.90, 0.28, 0.08, '#3a2a20', 0, 0.16, -0.33, {}, 0.03);
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
    case 'mini': // Mini-Money: shorter helper-bunny ears, no mohawk
      for (const sd of [-1, 1]) { const e = bx(0.11, 0.38, 0.07, '#6ad078', sd * 0.2, 0.42, -0.05, {}, 0.05); e.rotation.z = -sd * 0.22; bx(0.05, 0.26, 0.025, '#b6ff8a', sd * 0.2, 0.43, -0.005, { emissive: '#7dff6a', emissiveIntensity: 0.45 }, 0.02).rotation.z = -sd * 0.22; }
      break;
    case 'scribe': // Gatewalkers Guide: deep hood
      sph(0.56, '#151829', 0, 0.04, -0.08, 1, 0.92, 0.9, { roughness: 1, side: THREE.BackSide });
      sph(0.57, '#232842', 0, 0.06, -0.12, 1, 0.94, 0.86, { roughness: 1 });
      cone(0.2, 0.34, '#232842', 0, 0.48, -0.25, -0.7, 0);
      break;
    case 'credit': // Credit Repair: tidy side-part hair, reading glasses, orange tie
      bx(0.92, 0.09, 0.7, '#4a3426', 0, 0.31, -0.03, {}, 0.04); bx(0.92, 0.32, 0.08, '#4a3426', 0, 0.14, -0.33, {}, 0.03); bx(0.5, 0.07, 0.06, '#4a3426', -0.15, 0.26, 0.33, {}, 0.03);
      for (const sd of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 4, 4), M('#1f2a3a')); ring.rotation.z = Math.PI / 4; put(ring, sd * 0.15, -0.03, 0.36); }
      bx(0.1, 0.02, 0.02, '#1f2a3a', 0, -0.01, 0.36, {}, 0.005);
      putT(rbox(0.07, 0.2, 0.02, '#e0892e', 0, 0, 0, new THREE.Group(), {}, 0.01).parent, 0, -0.02, 0.2);
      break;
    case 'sniper': { // camo panda-robot: olive ears, dark eye patches, boonie cap, monocular over the right eye
      for (const sd of [-1, 1]) { sph(0.13, '#1a1e16', sd * 0.33, 0.34, -0.05, 1, 1, 0.6); sph(0.12, '#1a1e16', sd * 0.16, -0.02, 0.31, 1, 1.15, 0.35); }
      sph(0.48, '#4a5c38', 0, 0.22, -0.02, 1, 0.42, 0.85, { roughness: 0.95 });
      { const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.035, 20, 1), M('#3a4a2e')); brim.rotation.x = 0.1; put(brim, 0, 0.12, 0.08); }
      const tube = cyl(0.08, 0.08, 0.16, '#2a2e28', 0, 0, 0, new THREE.Group(), 14); tube.rotation.x = Math.PI / 2;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.0, 0.6) })); lens.position.z = 0.085; tube.parent.add(lens);
      put(tube.parent, 0.16, -0.02, 0.36);
      break; }
  }
}
function makeBot(def, i) {
  const root = new THREE.Group(); scene.add(root);
  const c = def.color, look = LOOKS[def.id] || {};
  const skin = new THREE.MeshStandardMaterial({ color: look.head || c, roughness: 0.92, metalness: 0 });
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.62), roughness: 0.92, metalness: 0 });
  const bot = { def, i, root, loc: 'lounge', path: [], onArrive: null, floor: 0, placed: false, spot: null, nextSpot: null, claim: null, want: 'idle', info: null, handled: null, seat: SEATS[i] || SEATS[SEATS.length - 1], desk: DESKS[def.id], lane: (i - 6.5) * 0.28 };
  let model, mixer = null, acts = {}, bones = {};
  let put = null, putT = null;
  if (charGltf) {
    model = SkeletonUtils.clone(charGltf.scene); model.scale.setScalar(charScale * sidekickScale(def.id));
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
let peel = 0, peelTarget = 0, camShift = 0; // floor view: 0 office, 1 rec deck, 2-3 residences (see applyPeel)
const PEEL_T = 1.1;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// paths are lists of [x, z] walk points (local to the bot's floor) plus { ride, wait } elevator legs (vertical only)
function seatFront(b) { const [sx, sz, f] = b.seat; return [sx + Math.sin(f) * 0.95, sz + Math.cos(f) * 0.95]; }
// idle roaming spots (daytime): office lounge seats (per bot), Team Huddle table chairs, restroom sinks (office floor);
// café island stools + lounge sofas on the Rec Deck (one elevator ride down)
const STOOLS = [0, 1, 2, 3].map((i) => [-17.9 + i * 1.25, -9.05]); // Rec Deck kitchen island
const REC_SEATS = [[-18.11, 6.7], [-16.69, 6.7], [-15.11, 6.7], [-13.69, 6.7]]; // Rec Deck lounge sofas, facing the TV (-z)
const REC_DOOR = -11.5; // kitchen + lounge doors on the Rec Deck hall
const BREAK = [0, 1, 2, 3].map((k) => { const a = k * Math.PI / 2 + Math.PI / 4;
  return { x: 16 + Math.cos(a) * 1.35, z: 9.6 + Math.sin(a) * 1.35, f: -a - Math.PI / 2, out: [16 + Math.cos(a) * 2.1, 9.6 + Math.sin(a) * 2.1] }; });
const BREAK_VIA = [[[13.4, 12.3], [17.6, 12.3]], [[13.3, 11.2]], [], [[15.6, 7.0]]]; // around the round table from the door
const BR_PATH = [[7.3, 2.2], [13.05, 2.2], [13.05, 6.5]]; // hall -> walkway past the restroom -> break-room door (z 3, x 12.3..13.8)
const ROAM = new Set(['lounge', 'coffee', 'break', 'bathroom', 'chill']);
const ROAM_CAP = { coffee: STOOLS.length, break: BREAK.length, bathroom: SINKS.length, chill: REC_SEATS.length };
const RIDE_SPEED = 3.0;
function cabSpot(b) { return [ELEV.cx + ((b.i % 3) - 1) * 0.36, ELEV.cz + ((Math.floor(b.i / 3) % 3) - 1) * 0.48]; }
function bedPose(b) { const p = BEDS[b.def.id], sc = sidekickScale(b.def.id); // root at the feet, head on the pillow
  return [p.x, p.headZ + 0.34 + CHAR_H * sc, MATTRESS_TOP + charBack * sc - 0.05]; }
// from a resting spot out to the corridor lane on that floor (the way in is the same, reversed)
function legOut(b, loc, spot) {
  const lz = b.lane;
  switch (loc) {
    case 'lounge': { const [fx, fz] = seatFront(b); const pts = [[fx, fz]]; if (fz < 6.8) pts.push([fx, 6.8], [fx < 7.35 ? 4.7 : 10.0, 6.8]); const ex = pts[pts.length - 1][0];
      pts.push([ex, 10.9], [1.5, 10.9], [1.5, lz]); return pts; }
    case 'desk': { const [dx, dz] = b.desk, id = b.def.id;
      if (id === 'overlord') return [[2.0, dz], [2.1, -4.2], [2.1, lz]]; // out the Leadership door (x 1.3..2.9)
      if (id === 'planner') return [[-16.6, dz], [-16.6, lz]];
      if (id === 'scribe') return [[dx, lz]]; // Writers' Den has an open front
      const door = DESK_DOOR[id], hz = dz < 0 ? -4.2 : 4.2;
      return dz < 0 ? [[dx + 1.25, dz], [dx + 1.25, hz], [door, hz], [door, lz]] : [[dx, hz], [door, hz], [door, lz]]; }
    case 'tray': return [[2.1, -5.5], [2.1, -4.2], [2.1, lz]];
    case 'coffee': return [[STOOLS[spot][0], -8.1], [REC_DOOR, -8.1], [REC_DOOR, -4.2], [REC_DOOR, lz]];
    case 'chill': { const [x] = REC_SEATS[spot]; return [[x, 5.75], [x, 4.2], [REC_DOOR, 4.2], [REC_DOOR, lz]]; }
    case 'break': return [BREAK[spot].out, ...BREAK_VIA[spot].slice().reverse(), ...BR_PATH.slice().reverse(), [7.3, lz]];
    case 'bathroom': return [[SINKS[spot][0], -1.2], [8.7, 0], [7.3, 0], [7.3, lz]];
    case 'elev': return [[ELEV.landX, ELEV.cz], [ELEV.landX, lz]];
    case 'bed': { const p = BEDS[b.def.id], [, z] = bedPose(b); return [[p.side, z], [p.side, p.via], [p.door, p.via], [p.door, p.back ? -4.2 : 4.2], [p.door, lz]]; }
  }
  return [[1.5, lz]];
}
function spotXZ(b, loc, spot) {
  switch (loc) {
    case 'lounge': return [b.seat[0], b.seat[1]];
    case 'desk': return b.desk;
    case 'tray': return [TRAY[0], TRAY[1] + 0.85];
    case 'coffee': return STOOLS[spot];
    case 'chill': return REC_SEATS[spot];
    case 'break': return [BREAK[spot].x, BREAK[spot].z];
    case 'bathroom': return SINKS[spot];
    case 'elev': return cabSpot(b);
    case 'bed': { const [, z] = bedPose(b); return [BEDS[b.def.id].side, z]; }
  }
  return [1.5, 0];
}
const legIn = (b, loc, spot) => legOut(b, loc, spot).reverse().concat([spotXZ(b, loc, spot)]);
// which floor a resting spot is on: 0 office, 1 rec deck, 2-3 residences
const floorOf = (b, loc) => (loc === 'bed' ? BEDS[b.def.id].floor : loc === 'coffee' || loc === 'chill' ? 1 : 0);
function routeTo(b, dest) {
  const out = legOut(b, b.loc, b.spot), f1 = floorOf(b, dest);
  if (b.floor !== f1) out.push(...legIn(b, 'elev'), { ride: floorY(f1), floor: f1, wait: 0.6 }, ...legOut(b, 'elev'));
  out.push(...legIn(b, dest, b.nextSpot));
  return out;
}
// seat cushion offsets (tuned so the sit pose rests on top of the cushion, not inside it)
const SEAT_FIT = { bean: { y: 0.34, f: 0.05 }, sofa: { y: 0.62, f: 0.22 }, sofaSmall: { y: 0.55, f: 0.2 }, chair: { y: 0.6, f: 0.16 }, stool: { y: 0.8, f: 0.04 }, dine: { y: 0.42, f: 0.08 } };
function place(b, where) {
  b.loc = where; b.path = []; b.placed = true;
  b.model.rotation.x = 0;
  const f = floorOf(b, where); b.floor = f; if (b.root.parent !== layers[f]) layers[f].add(b.root); b.root.visible = true; // bots live in their floor's layer
  if (where === 'bed') { // lie on the mattress: no lie clip, so tip the standing pose onto its back, frozen
    const [x, z, y] = bedPose(b); b.root.position.set(x, y, z); b.root.rotation.y = BEDS[b.def.id].facing;
    b.model.rotation.x = -Math.PI / 2; setClip(b, 'static', true); BEDS[b.def.id].cover.visible = true; return;
  }
  let [x, z] = spotXZ(b, where, b.spot), y = 0, ry = 0, sit = false;
  if (where === 'chill') { const fit = SEAT_FIT.sofa; ry = Math.PI; z -= fit.f; y = fit.y; sit = true; }
  else if (where === 'lounge') { const fit = SEAT_FIT[b.seat[4] || (b.seat[3] ? 'sofaSmall' : 'sofa')]; ry = b.seat[2]; x += Math.sin(ry) * fit.f; z += Math.cos(ry) * fit.f; y = fit.y; sit = true; }
  else if (where === 'desk') { sit = b.want === 'working'; if (sit) { z += SEAT_FIT.chair.f; y = SEAT_FIT.chair.y; } }
  else if (where === 'tray') ry = Math.PI;
  else if (where === 'coffee') { ry = Math.PI; z -= SEAT_FIT.stool.f; y = SEAT_FIT.stool.y; sit = true; } // face the counter
  else if (where === 'break') { ry = BREAK[b.spot].f; x += Math.sin(ry) * SEAT_FIT.dine.f; z += Math.cos(ry) * SEAT_FIT.dine.f; y = SEAT_FIT.dine.y; sit = true; }
  else if (where === 'bathroom') ry = Math.PI; // at the sink, facing the mirror
  b.root.position.set(x, y, z); b.root.rotation.y = ry;
  setClip(b, sit ? 'sit' : 'static', true);
}
function go(b, dest, onArrive, spot = null) {
  if (b.loc === dest && !b.path.length && (spot === null || spot === b.spot)) { onArrive && onArrive(); return; }
  b.nextSpot = spot; b.claim = spot === null ? null : dest + ':' + spot;
  b.model.rotation.x = 0; if (b.root.parent !== scene) b.root.position.y = 0; BEDS[b.def.id].cover.visible = false;
  b.path = routeTo(b, dest); b.dest = dest; b.onArrive = onArrive;
  setClip(b, 'walk', false);
}
function freeSpots(b, k) { const out = []; for (let i = 0; i < ROAM_CAP[k]; i++) if (!bots.some((o) => o !== b && o.claim === k + ':' + i)) out.push(i); return out; }
const dwellFor = (k) => (k === 'bathroom' ? rand(8000, 14000) : rand(10000, 25000));
function roam(b, now, mustMove) { // idle: lounge, coffee bar, break-room table or restroom; often stays put
  if (!mustMove && b.loc !== 'bathroom' && Math.random() < 0.5) { b.roamAt = now + dwellFor(b.loc); return; }
  const opts = []; let tot = 0;
  for (const [k, w] of [['lounge', 4], ['coffee', 2], ['chill', 1.6], ['break', 1.6], ['bathroom', 1]]) {
    if (k === b.loc) continue;
    const free = k === 'lounge' ? [null] : freeSpots(b, k); if (free.length) { opts.push([k, w, free]); tot += w; }
  }
  if (!opts.length) { b.roamAt = now + dwellFor(b.loc); return; }
  let r = Math.random() * tot, pick = opts[0]; for (const o of opts) { if ((r -= o[1]) <= 0) { pick = o; break; } }
  const [k, , free] = pick, spot = free[Math.floor(Math.random() * free.length)];
  b.roamAt = Infinity;
  go(b, k, () => { b.roamAt = performance.now() + dwellFor(k); }, spot);
}
// overnight: 2:00-7:00 AM Arizona time every bot sleeps in its own apartment (status chips stay real)
let sleepNow = null, sleepForce = QS.get('sleep') === '1' ? true : QS.get('sleep') === '0' ? false : null;
function azHour24() { return Number(fmtAZ(new Date(), { hour: 'numeric', hourCycle: 'h23' })) % 24; }
function checkSleep() {
  const h = azHour24(), s = sleepForce !== null ? sleepForce : h >= 2 && h < 7;
  if (s === sleepNow) return; const first = sleepNow === null; sleepNow = s;
  if (!first) { const now = performance.now(); bots.forEach((b, i) => { b.holdUntil = now + i * 900 + rand(0, 900); }); } // stagger the elevator line
}
function decide(b) {
  if (b.path.length || !b.placed) return;
  const now = performance.now();
  if (b.holdUntil && now < b.holdUntil) return;
  if (sleepNow) { if (b.loc !== 'bed') go(b, 'bed'); return; }
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
  if (b.pauseUntil && now < b.pauseUntil) return;
  if (!ROAM.has(b.loc)) roam(b, now, true);
  else if (now >= (b.roamAt || 0)) roam(b, now, false);
}
const PAPER_GEO = new THREE.BoxGeometry(0.26, 0.008, 0.32);
function dropPaper() {
  const p = new THREE.Mesh(PAPER_GEO, mat('#f4efe4')); // shared geometry + cached material: nothing to dispose
  p.position.set(TRAY[0] + rand(-0.04, 0.04), 0.8 + trayPapers.children.length * 0.01, TRAY[1] + rand(-0.03, 0.03)); p.rotation.y = rand(-0.2, 0.2);
  trayPapers.add(p); if (trayPapers.children.length > 8) trayPapers.remove(trayPapers.children[0]);
}
const SPEED = 2.4;
function turnTo(b, ang, dt) { let da = ang - b.root.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); b.root.rotation.y += da * Math.min(1, dt * 12); }
function step(b, dt) {
  if (b.path.length) {
    const t = b.path[0], pos = b.root.position;
    if (Array.isArray(t)) {
      const dx = t[0] - pos.x, dz = t[1] - pos.z, dist = Math.hypot(dx, dz);
      if (dist < 0.02) b.path.shift();
      else {
        if (b.clip !== 'walk') setClip(b, 'walk', false);
        const k = Math.min(dist, SPEED * dt) / dist; pos.x += dx * k; pos.z += dz * k;
        turnTo(b, Math.atan2(dx, dz), dt);
        if (b.mixer) b.mixer.update(dt);
      }
    } else { // elevator: wait for the doors, then ride straight up/down the shaft
      if (b.clip !== 'static') setClip(b, 'static', true);
      turnTo(b, Math.PI / 2, dt); // face the doors
      if (t.wait > 0) t.wait -= dt;
      else {
        if (b.root.parent !== scene) { pos.y = floorY(b.floor); scene.add(b.root); } // ride in world space
        const dy = t.ride - pos.y;
        if (Math.abs(dy) < 1e-3) { b.path.shift(); b.floor = t.floor; layers[t.floor].add(b.root); pos.y = 0; b.root.visible = true; }
        else pos.y += Math.sign(dy) * Math.min(Math.abs(dy), RIDE_SPEED * dt);
      }
    }
    if (!b.path.length) { b.loc = b.dest; b.spot = b.nextSpot; place(b, b.loc); const cb = b.onArrive; b.onArrive = null; cb && cb(); }
  }
  decide(b);
}
function tickDoors(dt) { // elevator doors slide open while someone is at the doorway on that floor
  for (let k = 0; k < NFLOORS; k++) {
    const el = elevs[k], fy = floorY(k); let want = 0;
    for (const b of bots) { const p = b.root.position, wy = b.root.parent === scene ? p.y : floorY(b.floor) + p.y;
      if (Math.abs(wy - fy) < 0.3 && Math.hypot(p.x - ELEV.doorX, p.z - ELEV.cz) < 1.75) { want = 1; break; } }
    if (el.open === want) continue;
    el.open = want > el.open ? Math.min(1, el.open + dt * 2.2) : Math.max(0, el.open - dt * 2.2);
    for (const l of el.leaves) l.m.position.z = ELEV.cz + l.s * (0.28 + el.open * 0.5);
  }
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
      place(b, sleepNow ? 'bed' : ['working', 'waiting', 'error'].includes(eff) ? 'desk' : 'lounge'); // 2-7 AM AZ: already in bed
      b.roamAt = performance.now() + 4000 + b.i * 3000 + rand(0, 5000); // stagger the first wander
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
checkSleep();
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
function pick(e) { // -> { bot } for a bot on the floor in view, { elev: true } for the elevator in view, or {}
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(bots.filter((b) => b.tag.visible).map((b) => b.root), true)[0];
  if (hit) return { bot: hit.object.userData.bot };
  if (peel === peelTarget && ray.intersectObject(elevs[peelTarget].grp, true).length) return { elev: true };
  return {};
}
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  const p = pick(e), b = p.bot;
  if (p.elev) { setView((peelTarget + 1) % NFLOORS); return; } // the elevator goes one floor down (and back up to the office from the bottom)
  for (const o of bots) if (o !== b) { o.el.dataset.pinned = ''; o.el.classList.remove('open'); }
  if (b) { b.el.dataset.pinned = b.el.dataset.pinned ? '' : '1'; b.el.classList.toggle('open', !!b.el.dataset.pinned); }
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const p = pick(e), b = p.bot;
  if (hovered && hovered !== b && !hovered.el.dataset.pinned) hovered.el.classList.remove('open');
  if (b) b.el.classList.add('open'); hovered = b; renderer.domElement.style.cursor = b || p.elev ? 'pointer' : '';
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
function lampLevels() { const k = TOD[todApplied || 'day'].lamp, e = ease(Math.min(1, peel));
  for (const l of lamps) l.p.intensity = l.base * k * (1 - e);
  const vis = peelTarget ? Math.max(0, 1 - Math.abs(peel - peelTarget)) : 0;
  for (const l of lowLights) l.p.intensity = l.base * Math.max(0.55, k) * vis; }
function applyTod(force) {
  const m = resolveTod(); if (m === todApplied && !force) return; todApplied = m; const s = TOD[m];
  hemi.color.set(s.hemi[0]); hemi.groundColor.set(s.hemi[1]); hemi.intensity = s.hemi[2];
  sun.color.set(s.sun[0]); sun.intensity = s.sun[1]; sun.position.set(...s.sunPos); sun.target.position.set(0, 0, 0);
  renderer.toneMappingExposure = s.exp;
  lampLevels();
  for (const g of glowMats) g.m.color.copy(g.base).multiplyScalar(1.7 * s.glow);
  drawSky(m); drawBossWindows(m);
  const fz = { day: ['#b4c6dc', 0.45, '#7d8fa6', 0.1], evening: ['#8a86a8', 0.95, '#1a1e36', 0.5], night: ['#5a6478', 1.15, '#0f1522', 0.7] }[m];
  for (const f of [facadeX, facadeZ, ...skinMats]) { f.color.set(fz[0]); f.emissiveIntensity = fz[1]; }
  for (const k of skyline) { k.color.set(fz[2]); k.emissiveIntensity = fz[3]; }
  drawSkyBack(m); const hor = SKY_BACK[m][2]; scene.fog.color.set(hor); BG.set(SKY_BACK[m][0]);
  groundMat.color.set({ day: '#ffffff', evening: '#a49aa8', night: '#5d6680' }[m]); groundMat.emissiveIntensity = { day: 0.15, evening: 0.9, night: 1.3 }[m];
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
// ---------- floor view: every floor above the one in view peels back (hinged at the back wall, then lifts away) ----------
const floorsEl = document.getElementById('floors');
floorsEl.innerHTML = FLOOR_NAMES.map((n, k) => `<button type="button" data-f="${k}" aria-pressed="false">${n}</button>`).join('');
function syncFloorBtn() {
  floorsEl.querySelectorAll('button').forEach((bt) => { const on = +bt.dataset.f === peelTarget; bt.classList.toggle('on', on); bt.setAttribute('aria-pressed', on ? 'true' : 'false'); });
}
function setView(f) { peelTarget = Math.max(0, Math.min(NFLOORS - 1, typeof f === 'boolean' ? (f ? 2 : 0) : f | 0)); placeLowLights(peelTarget); syncFloorBtn(); }
function applyPeel() {
  for (let k = 0; k < NFLOORS - 1; k++) {
    const p = Math.min(1, Math.max(0, peel - k)), e = ease(p);
    pivots[k].rotation.x = -1.2 * ease(Math.min(1, p * 1.35)); // fold up from the front edge, hinged at the back wall
    pivots[k].position.set(e * 4, floorY(k) + e * e * 46, -14.3 - e * 4); // then lift up and away, fully off screen before it hides
  }
  for (let k = 0; k < NFLOORS; k++) layers[k].visible = peel < k + 1 && peel > k - 1; // only the floor(s) in view are drawn
  for (let k = 1; k < NFLOORS; k++) { const so = 1 - smooth(0.02, 0.4, peel - (k - 1)), S = skinsByFloor[k];
    for (const m of S.mats) { const tr = so < 1; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = so; }
    for (const mm of S.meshes) mm.visible = so > 0.001; }
  const fk = Math.min(NFLOORS - 1, Math.floor(peel)), shift = -FLOOR_H * (fk + ease(peel - fk)), d = shift - camShift; camShift = shift; camera.position.y += d; controls.target.y += d;
  lampLevels();
}
function tickPeel(dt) {
  if (peel === peelTarget) return;
  const rate = Math.max(1, Math.abs(peelTarget - peel) * 0.8) / PEEL_T; // multi-floor jumps move a little faster
  peel = peelTarget > peel ? Math.min(peelTarget, peel + dt * rate) : Math.max(peelTarget, peel - dt * rate);
  applyPeel();
}
function syncFloors() { // tags + bots only on the floor in view (tags hide while the floors are moving)
  const settled = peel === peelTarget;
  for (const b of bots) {
    const riding = b.root.parent === scene, f = riding ? Math.max(0, Math.min(NFLOORS - 1, Math.round(-b.root.position.y / FLOOR_H))) : b.floor;
    if (riding) b.root.visible = layers[f].visible;
    const v = settled && f === peelTarget; if (b.tag.visible !== v) b.tag.visible = v;
  }
}
floorsEl.addEventListener('click', (e) => { const bt = e.target.closest('button'); if (!bt) return; e.stopPropagation(); setView(+bt.dataset.f); });
addEventListener('keydown', (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'PageDown') { e.preventDefault(); setView(peelTarget + 1); } else if (e.key === 'PageUp') { e.preventDefault(); setView(peelTarget - 1); } });
syncFloorBtn();
const ROOM_PTS = []; for (const x of [-20.3, 20.3]) for (const z of [-14.3, 14.3]) for (const y of [-0.7, WH + 0.1]) ROOM_PTS.push(V(x, z).setY(y));
function frameCamera() {
  const wide = innerWidth > 900;
  const fs = document.body.classList.contains('fs');
  const panelW = wide && panel && panel.offsetWidth > 0 ? panel.offsetWidth + 24 : 0;
  const top = fs ? 40 : wide ? 64 : 70, bottom = fs ? 16 : wide ? 70 : 150;
  const availW = innerWidth - panelW - (wide ? 40 : 12), availH = innerHeight - top - bottom;
  const tgt = V(0, 0).setY(1.0 + camShift);
  camera.position.copy(tgt).addScaledVector(ISO_DIR, 120); camera.up.set(0, 1, 0); camera.lookAt(tgt); camera.updateMatrixWorld();
  const inv = camera.matrixWorldInverse; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of ROOM_PTS) { const q = p.clone(); q.y += camShift; q.applyMatrix4(inv); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
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
{ const q = QS.get('floor'), f = { office: 0, rec: 1, apt: 2, apt2: 3 }[q] ?? (/^[0-3]$/.test(q || '') ? +q : 0); if (f) { setView(f); peel = f; applyPeel(); } }
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
let scrAcc = 0, ledAcc = 0, sleepAcc = 0;
function loop() {
  const dt = Math.min(1.0, clock.getDelta()), t = clock.elapsedTime, now = performance.now();
  tickSim(now);
  sleepAcc += dt; if (sleepAcc > 20) { sleepAcc = 0; checkSleep(); } // a tab left open overnight follows the AZ clock
  for (let left = dt; left > 1e-4; left -= 0.04) { const d = Math.min(0.04, left); for (const b of bots) step(b, d); }
  tickDoors(dt); tickPeel(dt); syncFloors();
  scrAcc += dt; if (scrAcc > 0.12) { scrAcc = 0; for (const s of screens) { const { g, c } = s.tex.userData; s.draw(g, c.width, c.height, t); s.tex.needsUpdate = true; } }
  ledAcc += dt; if (ledAcc > 0.25) { ledAcc = 0; for (const l of leds) if (Math.random() < 0.25) { const m = l.led.material; m.color.equals(l.on) ? m.color.setRGB(0.05, 0.06, 0.07) : m.color.copy(l.on); } }
  brew.material.emissiveIntensity = Math.sin(t * 2) > 0 ? 1.4 : 0.3;
  if (recWaterTex && rec.visible) { recWaterTex.offset.x = t * 0.03; recWaterTex.offset.y = Math.sin(t * 0.4) * 0.05; } // gentle ripple drift
  controls.update();
  adapt(dt);
  if (fx.ao || fx.bloom) composer.render(); else renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
const PROJ_V = new THREE.Vector3();
window.__hq = { NFLOORS, FLOOR_NAMES, bots, live: () => live, fx, toggleFs, onFsChange, camera, controls, place, setView, BEDS, charBack: () => charBack,
  sleep: (v) => { sleepForce = v; checkSleep(); }, view: () => ({ peel, peelTarget }), peelTo: (p) => { peel = peelTarget = p; applyPeel(); }, // screenshot helpers only
  project: (x, y, z) => { PROJ_V.set(x, y, z).project(camera); return [(PROJ_V.x + 1) / 2 * innerWidth, (1 - PROJ_V.y) / 2 * innerHeight]; } };
