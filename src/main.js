import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// ---------- team ----------
const TEAM = [
  { id: 'overlord', name: 'Overlord Boss', short: 'Overlord', color: '#c4473d', dept: 'Leadership', acc: 'crown' },
  { id: 'moneybot', name: 'Moneybot', short: 'Moneybot', color: '#3f9a55', dept: 'Money Lab', acc: 'calculator' },
  { id: 'stockbot', name: 'Stockbot', short: 'Stockbot', color: '#c4473d', dept: 'Money Lab', acc: 'tablet' },
  { id: 'superseller', name: 'Superseller Mini', short: 'Superseller', color: '#3a6fc4', dept: 'Sales', acc: 'box' },
  { id: 'ledger', name: 'Family Ledger', short: 'Ledger', color: '#2a9d8f', dept: 'Family Finance', acc: 'book' },
  { id: 'shadow', name: 'Gatewalkers Shadow', short: 'Shadow', color: '#2c2c30', dept: 'School', acc: 'backpack' },
  { id: 'eraser', name: 'Eraser', short: 'Eraser', color: '#8a8f96', dept: 'Identity Security', acc: 'eraser' },
  { id: 'kimchi', name: 'Kimchi', short: 'Kimchi', color: '#38b6c9', dept: 'Identity Security', acc: 'shield' },
  { id: 'scribe', name: 'Soulrot Scribe', short: 'Scribe', color: '#e07b2e', dept: "Writers' Den", acc: 'quill' },
];

// desk standing spots (bot faces +z, desk in front of it)
const DESKS = {
  overlord: [-16, -9.1], moneybot: [-9.5, -9.1], stockbot: [-5.5, -9.1], superseller: [0, -9.1], ledger: [6, -9.1],
  shadow: [-16.5, 6.2], eraser: [-10.5, 6.2], kimchi: [-6.5, 6.2], scribe: [-1, 6.2],
};
const SEATS = [[4.2, 6.0], [5.4, 6.0], [6.6, 6.0], [8.2, 6.0], [9.4, 6.0], [10.6, 6.0], [6.0, 9.6], [7.2, 9.6], [8.4, 9.6]];
const TRAY = [-14.5, -7.8];

// ---------- renderer / scene ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(window.devicePixelRatio); // never lower than the screen
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const labels = new CSS2DRenderer();
labels.setSize(innerWidth, innerHeight);
Object.assign(labels.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
app.appendChild(labels.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#1b1e22');
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.5, 300);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.12;
controls.minPolarAngle = 0.12; controls.maxPolarAngle = 1.2; controls.minDistance = 8;

scene.add(new THREE.HemisphereLight(0xf1eee7, 0x4b4641, 1.15));
const sun = new THREE.DirectionalLight(0xfff4e6, 1.55);
sun.position.set(12, 30, 16);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 80 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun);

// ---------- helpers ----------
const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, ...opts }));
  return matCache.get(key);
}
function box(w, h, d, color, x = 0, y = 0, z = 0, parent = scene, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color, opts) : color);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function cyl(rt, rb, h, color, x, y, z, parent = scene, seg = 20) {
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

// ---------- floor, zones, walls ----------
const W = 40, D = 28;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('#8b8781'));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

const ZONES = [
  { name: 'LEADERSHIP', x0: -20, x1: -12, z0: -14, z1: -3, color: '#5a3d3b', lz: -4.3 },
  { name: 'MONEY LAB', x0: -12, x1: -3, z0: -14, z1: -3, color: '#3f5a46', lz: -4.3 },
  { name: 'SALES', x0: -3, x1: 3, z0: -14, z1: -3, color: '#3e4f6a', lz: -4.3 },
  { name: 'FAMILY FINANCE', x0: 3, x1: 9, z0: -14, z1: -3, color: '#305c59', lz: -4.3 },
  { name: 'RESEARCH', x0: 9, x1: 20, z0: -14, z1: -3, color: '#474a54', lz: -4.3 },
  { name: 'SCHOOL', x0: -20, x1: -13, z0: 3, z1: 14, color: '#4a4559', lz: 12.6 },
  { name: 'IDENTITY SECURITY', x0: -13, x1: -4, z0: 3, z1: 14, color: '#4a5258', lz: 12.6 },
  { name: "WRITERS' DEN", x0: -4, x1: 2, z0: 3, z1: 14, color: '#654e3e', lz: 12.6 },
  { name: 'LOUNGE', x0: 2, x1: 12, z0: 3, z1: 14, color: '#584a5d', lz: 12.6 },
  { name: 'BREAK ROOM', x0: 12, x1: 20, z0: 3, z1: 14, color: '#665d50', lz: 12.6 },
];
function lighten(hex, f) { const c = new THREE.Color(hex); c.lerp(new THREE.Color('#e9e2d4'), f); return '#' + c.getHexString(); }
for (const z of ZONES) {
  const w = z.x1 - z.x0 - 0.3, d = z.z1 - z.z0 - 0.3, cx = (z.x0 + z.x1) / 2, cz = (z.z0 + z.z1) / 2;
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(z.color));
  carpet.rotation.x = -Math.PI / 2; carpet.position.set(cx, 0.01, cz); carpet.receiveShadow = true; scene.add(carpet);
  // lettering woven into the carpet
  const lw = Math.min(w - 1.0, 0.6 * z.name.length + 0.8), lh = 1.0;
  const tex = canvasTex(2048, Math.round(2048 * lh / lw), (g, cw, ch) => {
    g.clearRect(0, 0, cw, ch);
    let size = ch * 0.72; const sp = 0.08;
    const setF = () => { g.font = `700 ${size}px ${FONT}`; if ('letterSpacing' in g) g.letterSpacing = `${size * sp}px`; };
    setF(); const tw = g.measureText(z.name).width + size * sp * (z.name.length + 1);
    if (tw > cw * 0.9) { size *= (cw * 0.9) / tw; setF(); }
    g.fillStyle = lighten(z.color, 0.42); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(z.name, cw / 2, ch / 2 + size * 0.04);
  });
  const lm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), lm);
  letters.rotation.x = -Math.PI / 2; letters.position.set(cx, 0.02, z.lz); letters.receiveShadow = true; scene.add(letters);
}
// walls
const WALL = '#a9a397';
box(W, 3.2, 0.3, WALL, 0, 1.6, -14.15);
box(0.3, 3.2, D, WALL, -20.15, 1.6, 0);
box(0.3, 3.2, D, WALL, 20.15, 1.6, 0);
box(W + 0.6, 0.12, 0.34, '#6f6a62', 0, 0.06, -13.98); // baseboard

// glass corner office
const glass = new THREE.MeshStandardMaterial({ color: '#bcd3dc', transparent: true, opacity: 0.12, roughness: 0.3, metalness: 0, depthWrite: false });
const frame = '#3c3f44';
function glassWall(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ang = Math.atan2(z1 - z0, x1 - x0);
  const g = new THREE.Mesh(new THREE.BoxGeometry(len, 2.5, 0.05), glass); g.position.set(cx, 1.25, cz); g.rotation.y = -ang; scene.add(g);
  const bot = box(len, 0.08, 0.1, frame, cx, 0.04, cz); bot.rotation.y = -ang;
  for (const [px, pz] of [[x0, z0], [x1, z1]]) box(0.07, 2.5, 0.07, frame, px, 1.25, pz);
}
glassWall(-12, -14, -12, -3);
glassWall(-20, -3, -14.6, -3);
glassWall(-13.2, -3, -12, -3);

// ---------- furniture ----------
function desk(x, z, withMonitor = true) {
  box(1.6, 0.06, 0.8, '#7a5f45', x, 0.75, z);
  for (const [dx, dz] of [[-0.74, -0.34], [0.74, -0.34], [-0.74, 0.34], [0.74, 0.34]]) box(0.05, 0.72, 0.05, '#3a3c40', x + dx, 0.36, z + dz);
  if (withMonitor) {
    box(0.7, 0.42, 0.04, '#25272b', x, 1.08, z + 0.18); // monitor faces -z (toward bot); back toward camera
    box(0.06, 0.22, 0.06, '#25272b', x, 0.88, z + 0.22);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.36), new THREE.MeshBasicMaterial({ color: '#4f6f86' }));
    scr.position.set(x, 1.08, z + 0.157); scr.rotation.y = Math.PI; scene.add(scr);
    box(0.45, 0.02, 0.15, '#2f3135', x, 0.79, z - 0.15);
  }
}
for (const id in DESKS) { const [x, z] = DESKS[id]; desk(x, z + 1.1); }
// lead extras: tray + side shelf + rug
box(0.42, 0.05, 0.32, '#3a3c40', TRAY[0] - 0.9, 0.8, TRAY[1]); // in-tray on desk corner
const trayPapers = new THREE.Group(); scene.add(trayPapers);
cyl(1.2, 1.2, 0.012, '#6d4a45', -16, 0.012, -6.4, scene, 40).castShadow = false;

function plant(x, z, s = 1) {
  cyl(0.22 * s, 0.17 * s, 0.4 * s, '#7a5a44', x, 0.2 * s, z);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 1), mat('#4d7a4a', { flatShading: true }));
  leaves.position.set(x, 0.75 * s, z); leaves.castShadow = true; scene.add(leaves);
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 * s, 1), mat('#5a8a55', { flatShading: true }));
  top.position.set(x + 0.05, 1.05 * s, z - 0.05); top.castShadow = true; scene.add(top);
}
[[-19.3, -13.3], [-12.8, -13.3], [-3.6, -13.3], [8.4, -13.3], [-19.3, 13.3], [-13.6, 13.3], [1.4, 13.3], [11.5, 13.3], [19.3, 13.3], [11.6, 3.6], [-19.3, 3.6]]
  .forEach(([x, z], i) => plant(x, z, i % 3 === 0 ? 1.25 : 1));

// bookshelf (school), whiteboard (writers), filing cabinets (identity)
function shelf(x, z, rotY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  box(1.8, 2, 0.4, '#6b5038', 0, 1, 0, g);
  const cols = ['#8c4b3e', '#3e5f7a', '#6d7a46', '#a07a3c', '#5a4a6e'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) box(0.14, 0.38 + ((i * 7 + r) % 3) * 0.05, 0.28, cols[(i + r) % 5], -0.7 + i * 0.17, 0.42 + r * 0.6, 0.05, g);
}
shelf(-19.7, 8.5, Math.PI / 2); shelf(-14, -13.7);
box(2.2, 1.2, 0.06, '#d7d3ca', -1, 1.7, 3.3).rotation.y = 0;
box(0.5, 1.1, 0.6, '#5c6168', -12.5, 0.55, 4.0); box(0.5, 1.1, 0.6, '#5c6168', -12.5, 0.55, 4.7);

// wall art — Sean's crests
const loader = new THREE.TextureLoader();
function crest(url, x, y, z, s) {
  const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
  box(s + 0.12, s + 0.12, 0.05, '#2c2e32', x, y, z - 0.02);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: t, roughness: 1, metalness: 0 }));
  m.position.set(x, y, z + 0.01); scene.add(m);
}
crest('/crest-main.jpg', -16, 1.9, -13.95, 1.5);
crest('/crest-samurai.jpg', -7.5, 1.9, -13.95, 1.3);
crest('/crest-samurai.jpg', 6, 1.9, -13.95, 1.3);

// lounge
function sofa(x0, x1, z, color = '#7b6a5e') {
  const w = x1 - x0, cx = (x0 + x1) / 2;
  box(w, 0.42, 0.9, color, cx, 0.21, z);
  box(w, 0.55, 0.22, color, cx, 0.62, z - 0.42);
  box(0.2, 0.62, 0.9, color, x0 + 0.1, 0.31, z); box(0.2, 0.62, 0.9, color, x1 - 0.1, 0.31, z);
}
sofa(3.5, 7.3, 6.0); sofa(7.5, 11.3, 6.0, '#6a6e7a'); sofa(5.3, 9.1, 9.6, '#6e7a68');
box(0.8, 0.4, 0.6, '#5f4a3a', 4.6, 0.2, 7.85); box(0.8, 0.4, 0.6, '#5f4a3a', 10.1, 0.2, 7.85);
cyl(2.4, 2.4, 0.012, '#6b5a70', 7.3, 0.013, 8.2, scene, 48).castShadow = false;

// break room
box(5, 0.95, 0.7, '#6d6a66', 17.2, 0.475, 3.5); box(5, 0.05, 0.74, '#cfc8bb', 17.2, 0.97, 3.5);
box(0.45, 0.6, 0.4, '#2c2d31', 18.3, 1.3, 3.5); box(0.3, 0.06, 0.2, '#555a60', 18.3, 1.05, 3.65);
const brew = box(0.05, 0.05, 0.02, '#6fae7a', 18.15, 1.45, 3.71, scene, { emissive: '#3e8a4c', emissiveIntensity: 0.6 });
cyl(0.06, 0.05, 0.1, '#e8e2d6', 18.3, 1.05, 3.75);
box(0.8, 1.9, 0.7, '#9aa0a6', 19.4, 0.95, 5.2); // fridge
cyl(0.9, 0.9, 0.05, '#7a5f45', 16, 0.75, 8.3, scene, 40); cyl(0.08, 0.08, 0.72, '#3a3c40', 16, 0.37, 8.3);
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; box(0.45, 0.45, 0.45, '#4d5158', 16 + Math.cos(a) * 1.35, 0.23, 8.3 + Math.sin(a) * 1.35); }
cyl(0.18, 0.18, 1.1, '#cfd6db', 13, 0.55, 3.6); cyl(0.16, 0.16, 0.4, '#8fb4c9', 13, 1.3, 3.6);

// ---------- research: animated screens + server racks ----------
const SCR_W = 1024, SCR_H = 576;
const screens = [];
function screen(x, draw) {
  box(2.9, 1.7, 0.08, '#202226', x, 1.75, -13.9);
  const tex = canvasTex(SCR_W, SCR_H, () => {});
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.76, 1.55), new THREE.MeshBasicMaterial({ map: tex, color: '#d9d9d9' }));
  m.position.set(x, 1.75, -13.85); scene.add(m);
  screens.push({ tex, draw });
}
// US outline (lon, lat) — simplified lower 48
const US = [[-124.7,48.4],[-123,48.2],[-122.8,49],[-95.2,49],[-94.8,49.4],[-89.6,48],[-84.8,46.5],[-83.4,45.8],[-82.4,43],[-79,43.3],[-79.2,42.5],[-76.8,43.6],[-75,45],[-71.5,45],[-70,46.7],[-68.2,47.4],[-67.1,45.2],[-70.6,43],[-70.6,41.6],[-74,40.6],[-74.9,38.9],[-75.9,37.2],[-75.5,35.2],[-77.9,33.8],[-81,32],[-81.4,30.4],[-80.1,26.8],[-80.6,25.2],[-81.8,26.1],[-82.8,27.9],[-84.3,30],[-86.5,30.4],[-89.6,30.2],[-89.4,29.1],[-91.3,29.3],[-94,29.7],[-97.2,27.7],[-97.4,25.9],[-99.2,26.5],[-100.3,28.2],[-101.4,29.8],[-103.2,29],[-104.5,29.7],[-106.5,31.8],[-108.2,31.8],[-111.1,31.3],[-114.8,32.5],[-117.1,32.5],[-118.5,34],[-120.6,34.6],[-121.9,36.6],[-123.7,38.9],[-124.2,41],[-124.5,43],[-124.1,46.2],[-124.7,48.4]];
const rand = (a, b) => a + Math.random() * (b - a);
const chartData = Array.from({ length: 60 }, (_, i) => 0.5 + 0.25 * Math.sin(i / 6) + rand(-0.05, 0.05));
const termLines = [];
const TERM_POOL = ['indexing workspace', 'syncing task queue', 'compiling notes', 'checking routines', 'reviewing handoffs', 'scanning feeds', 'summarizing threads',
  'planning next steps', 'verifying sources', 'drafting outline', 'running checks', 'cleaning cache', 'ranking ideas', 'linking references'];
function drawChart(g, w, h, t) {
  g.fillStyle = '#16232b'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(160,190,200,.14)'; g.lineWidth = 2;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(40, i * h / 6); g.lineTo(w - 30, i * h / 6); g.stroke(); }
  chartData.shift(); chartData.push(Math.min(0.92, Math.max(0.08, chartData[chartData.length - 1] + rand(-0.06, 0.065) + (0.5 - chartData[chartData.length - 1]) * 0.05)));
  const bw = (w - 80) / chartData.length;
  chartData.forEach((v, i) => { g.fillStyle = 'rgba(95,174,115,.28)'; g.fillRect(40 + i * bw, h - 30 - v * (h - 90) * 0.5, bw - 3, v * (h - 90) * 0.5); });
  g.strokeStyle = '#7fc89a'; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath();
  chartData.forEach((v, i) => { const x = 40 + i * bw + bw / 2, y = h - 40 - v * (h - 100); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = '#cfe3d6'; g.font = `600 34px ${FONT}`; g.fillText('TREND', 44, 50);
}
function drawMap(g, w, h, t) {
  g.fillStyle = '#18202c'; g.fillRect(0, 0, w, h);
  const px = (lon) => 70 + (lon + 125) / 58 * (w - 140), py = (lat) => 60 + (49.5 - lat) / 25 * (h - 120);
  g.fillStyle = 'rgba(110,150,190,.16)'; g.strokeStyle = '#8fb3d6'; g.lineWidth = 4; g.lineJoin = 'round';
  g.beginPath(); US.forEach(([lo, la], i) => (i ? g.lineTo(px(lo), py(la)) : g.moveTo(px(lo), py(la)))); g.closePath(); g.fill(); g.stroke();
  // home base: Phoenix, AZ
  const hx = px(-112.07), hy = py(33.45), r = 10 + 14 * ((t * 0.6) % 1);
  g.strokeStyle = `rgba(232,160,120,${1 - ((t * 0.6) % 1)})`; g.lineWidth = 4; g.beginPath(); g.arc(hx, hy, r, 0, 7); g.stroke();
  g.fillStyle = '#e8a078'; g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fill();
  g.fillStyle = '#d6e2ee'; g.font = `600 34px ${FONT}`; g.fillText('HOME BASE · AZ', 44, h - 28);
}
function drawTerm(g, w, h, t) {
  g.fillStyle = '#121614'; g.fillRect(0, 0, w, h);
  if (!drawTerm.next || t > drawTerm.next) {
    termLines.push(`> ${TERM_POOL[Math.floor(Math.random() * TERM_POOL.length)]} ${'.'.repeat(1 + Math.floor(Math.random() * 3))} ${Math.random() < 0.85 ? 'ok' : 'retry'}`);
    if (termLines.length > 11) termLines.shift(); drawTerm.next = t + rand(0.5, 1.1);
  }
  g.font = `500 36px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`; g.fillStyle = '#9fd8a8';
  termLines.forEach((l, i) => g.fillText(l, 36, 60 + i * 46));
  if (Math.floor(t * 2) % 2) g.fillRect(36, 60 + termLines.length * 46 - 30, 20, 36);
}
screen(11.2, drawChart); screen(14.5, drawMap); screen(17.8, drawTerm);
box(2.6, 0.06, 1, '#5d5f64', 14.5, 0.75, -9.6); box(2.4, 0.7, 0.9, '#3d4046', 14.5, 0.36, -9.6);
const leds = [];
for (let r = 0; r < 4; r++) {
  const z = -12.6 + r * 1.25;
  box(1.0, 2.1, 1.0, '#26282c', 19.35, 1.05, z);
  for (let i = 0; i < 12; i++) {
    const on = new THREE.MeshStandardMaterial({ color: '#1d1f22', emissive: i % 4 === 0 ? '#c9953c' : '#4fae6a', emissiveIntensity: 0.9, roughness: 1, metalness: 0 });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.06), on);
    led.position.set(18.84, 0.3 + i * 0.15, z - 0.3 + (i % 3) * 0.18); scene.add(led); leds.push(led);
  }
}

// ---------- usage board ----------
box(5.9, 2.9, 0.08, '#202226', 0, 1.75, -13.92);
const usageTex = canvasTex(2048, 970, () => {});
const usageBoard = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 2.7), new THREE.MeshBasicMaterial({ map: usageTex, color: '#dedede' }));
usageBoard.position.set(0, 1.75, -13.86); scene.add(usageBoard);
const AZ = 'America/Phoenix';
function fmtAZ(d, opts) { return new Intl.DateTimeFormat('en-US', { timeZone: AZ, ...opts }).format(d); }
function drawUsage(u) {
  const { g, c } = usageTex.userData, w = c.width, h = c.height;
  g.fillStyle = '#1a1f25'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#a9b3bd'; g.font = `700 104px ${FONT}`; g.textAlign = 'center'; g.fillText('WEEKLY USAGE LEFT', w / 2, 150);
  if (!u) {
    g.fillStyle = '#d7dde2'; g.font = `700 210px ${FONT}`; g.fillText('no reading yet', w / 2, 540);
    g.fillStyle = '#8b949d'; g.font = `500 84px ${FONT}`; g.fillText('waiting for the first usage check', w / 2, 730);
  } else {
    const left = Math.max(0, 100 - u.percentUsed);
    const col = left > 40 ? '#7fc89a' : left > 15 ? '#e2bf6a' : '#e58a7e';
    g.fillStyle = col; g.font = `700 330px ${FONT}`; g.fillText(`${left.toFixed(left % 1 ? 1 : 0)}%`, w / 2, 480);
    g.fillStyle = '#2b333b'; g.fillRect(260, 545, w - 520, 54);
    g.fillStyle = col; g.fillRect(260, 545, (w - 520) * Math.min(1, left / 100), 54);
    g.fillStyle = '#d7dde2'; g.font = `600 92px ${FONT}`;
    g.fillText(`Resets ${fmtAZ(new Date(u.resetsAt), { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} AZ`, w / 2, 750);
    g.fillStyle = '#8b949d'; g.font = `500 66px ${FONT}`;
    g.fillText(`reading taken ${fmtAZ(new Date(u.recordedAt), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} AZ`, w / 2, 880);
  }
  usageTex.needsUpdate = true;
}
drawUsage(null);

// ---------- bots ----------
function accessory(kind, color) {
  const g = new THREE.Group();
  const m = (c) => mat(c);
  switch (kind) {
    case 'calculator': box(0.17, 0.24, 0.04, '#cfccc4', 0, 0, 0, g); box(0.13, 0.06, 0.01, '#3f5a46', 0, 0.07, 0.022, g);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) box(0.03, 0.025, 0.01, '#55585e', -0.04 + i * 0.04, 0.0 - j * 0.04, 0.022, g); break;
    case 'tablet': { box(0.28, 0.2, 0.025, '#24262a', 0, 0, 0, g);
      const t = canvasTex(256, 192, (c, w, h) => { c.fillStyle = '#18242a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7fc89a'; c.lineWidth = 8; c.beginPath();
        [150, 120, 135, 90, 105, 60, 75, 40].forEach((y, i) => (i ? c.lineTo(20 + i * 31, y) : c.moveTo(20, y))); c.stroke(); });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.17), new THREE.MeshBasicMaterial({ map: t, color: '#cfcfcf' })); s.position.z = 0.014; g.add(s); break; }
    case 'box': box(0.3, 0.26, 0.3, '#a07a4f', 0, 0, 0, g); box(0.31, 0.04, 0.08, '#c9b48a', 0, 0.12, 0, g); break;
    case 'book': box(0.2, 0.27, 0.06, '#2f5d4a', 0, 0, 0, g); box(0.18, 0.25, 0.062, '#e2dccd', 0.012, 0, 0, g); box(0.02, 0.27, 0.064, '#8a6a3a', -0.09, 0, 0, g); break;
    case 'eraser': box(0.15, 0.4, 0.11, '#d99aa2', 0, 0, 0, g); box(0.155, 0.08, 0.115, '#3e5f8a', 0, -0.12, 0, g); break;
    case 'shield': { const s = cyl(0.2, 0.2, 0.04, '#2c7f8e', 0, 0, 0, g, 28); s.rotation.x = Math.PI / 2; const e = cyl(0.09, 0.09, 0.045, '#d9e6e8', 0, 0, 0.005, g, 20); e.rotation.x = Math.PI / 2; break; }
    case 'quill': { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 10), m('#e9e4da')); f.position.y = 0.12; f.rotation.z = 0.25; f.castShadow = true; g.add(f);
      box(0.015, 0.12, 0.015, '#2b2b2e', 0.03, -0.13, 0, g); break; }
  }
  return g;
}
function makeBot(def, i) {
  const root = new THREE.Group(); scene.add(root);
  const body = new THREE.Group(); root.add(body);
  const c = def.color;
  const hipL = new THREE.Group(), hipR = new THREE.Group(); hipL.position.set(-0.11, 0.75, 0); hipR.position.set(0.11, 0.75, 0);
  box(0.17, 0.75, 0.2, lighten(c, 0) === c ? c : c, 0, -0.375, 0, hipL); box(0.17, 0.75, 0.2, c, 0, -0.375, 0, hipR);
  box(0.18, 0.07, 0.26, '#2b2c30', 0, -0.72, 0.03, hipL); box(0.18, 0.07, 0.26, '#2b2c30', 0, -0.72, 0.03, hipR);
  body.add(hipL, hipR);
  box(0.52, 0.62, 0.3, c, 0, 1.06, 0, body);
  const head = box(0.38, 0.36, 0.36, c, 0, 1.58, 0, body);
  const eye = def.id === 'shadow' ? '#d8d4cc' : '#26272b';
  box(0.06, 0.06, 0.01, eye, -0.08, 1.6, 0.182, body); box(0.06, 0.06, 0.01, eye, 0.08, 1.6, 0.182, body);
  const shL = new THREE.Group(), shR = new THREE.Group(); shL.position.set(-0.34, 1.33, 0); shR.position.set(0.34, 1.33, 0);
  box(0.14, 0.58, 0.16, c, 0, -0.27, 0, shL); box(0.14, 0.58, 0.16, c, 0, -0.27, 0, shR);
  body.add(shL, shR);
  // accessory
  if (def.acc === 'crown') {
    const cr = new THREE.Group(); cr.position.set(0, 1.8, 0); body.add(cr);
    cyl(0.17, 0.17, 0.07, '#c9a443', 0, 0, 0, cr, 16);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 6), mat('#c9a443')); sp.position.set(Math.cos(a) * 0.14, 0.08, Math.sin(a) * 0.14); cr.add(sp); }
  } else if (def.acc === 'backpack') {
    box(0.4, 0.42, 0.16, '#5a6f8a', 0, 1.06, -0.23, body); box(0.3, 0.14, 0.04, '#4a5c74', 0, 0.94, -0.32, body);
  } else if (def.acc === 'shield') {
    const a = accessory('shield'); a.position.set(-0.1, -0.42, 0.12); shL.add(a);
  } else {
    const a = accessory(def.acc); a.position.set(0, -0.56, 0.14); a.rotation.x = -0.25; shR.add(a);
  }
  const paper = box(0.2, 0.01, 0.26, '#ece7dc', 0, -0.58, 0.12, shL); paper.rotation.x = -1.2; paper.visible = false;

  // name tag
  const el = document.createElement('div'); el.className = 'tag';
  el.innerHTML = '<span class="short"><span class="mk" hidden></span><span class="nm"></span></span><span class="full"><b></b><span class="st"></span><span class="tx"></span></span>';
  el.querySelector('.nm').textContent = def.short; el.querySelector('.full b').textContent = def.name;
  const tag = new CSS2DObject(el); tag.position.set(0, i % 2 ? 2.7 : 2.15, 0); root.add(tag);
  el.addEventListener('pointerenter', () => el.classList.add('open'));
  el.addEventListener('pointerleave', () => { if (!el.dataset.pinned) el.classList.remove('open'); });
  el.addEventListener('click', (e) => { e.stopPropagation(); el.dataset.pinned = el.dataset.pinned ? '' : '1'; el.classList.toggle('open', !!el.dataset.pinned); });

  const bot = { def, i, root, body, hipL, hipR, shL, shR, paper, el, head,
    seat: SEATS[i], desk: DESKS[def.id], lane: (i - 4) * 0.22, lx: 2.4 + (i % 5) * 0.2,
    loc: 'lounge', path: [], onArrive: null, phase: 0, want: 'idle', info: null, handled: null };
  root.traverse((o) => { if (o.isMesh) o.userData.bot = bot; });
  return bot;
}
const bots = TEAM.map(makeBot);
const byId = Object.fromEntries(bots.map((b) => [b.def.id, b]));

// ---------- routing ----------
function routeTo(b, dest) { // from current loc to dest, via the central aisle
  const out = [];
  const lz = b.lane;
  const exit = { lounge: () => { const [sx, sz] = b.seat; const lane = sz < 8 ? 7.0 : 10.4; return [[sx, lane], [b.lx, lane], [b.lx, lz]]; },
    desk: () => { const [dx, dz] = b.desk; if (b.def.id === 'overlord') return [[-14.6, -9.1], [-13.9, -3], [-13.9, lz]]; return dz < 0 ? [[dx + 1.1, dz], [dx + 1.1, lz]] : [[dx, lz]]; },
    tray: () => [[-13.9, -3], [-13.9, lz]] };
  const enter = { lounge: () => { const [sx, sz] = b.seat; const lane = sz < 8 ? 7.0 : 10.4; return [[b.lx, lz], [b.lx, lane], [sx, lane], [sx, sz]]; },
    desk: () => { const [dx, dz] = b.desk; if (b.def.id === 'overlord') return [[-13.9, lz], [-13.9, -3], [-14.6, -9.1], [dx, dz]]; return dz < 0 ? [[dx + 1.1, lz], [dx + 1.1, dz], [dx, dz]] : [[dx, lz], [dx, dz]]; },
    tray: () => [[-13.9, lz], [-13.9, -3], TRAY] };
  out.push(...exit[b.loc](), ...enter[dest]());
  return out.map(([x, z]) => new THREE.Vector3(x, 0, z));
}
function place(b, where) {
  b.loc = where; b.path = [];
  const [x, z] = where === 'lounge' ? b.seat : where === 'desk' ? b.desk : TRAY;
  b.root.position.set(x, 0, z); b.root.rotation.y = where === 'tray' ? -Math.PI / 2 : 0;
  pose(b, where === 'lounge' ? 'sit' : 'stand');
}
function pose(b, p) {
  b.posture = p;
  b.hipL.rotation.x = b.hipR.rotation.x = p === 'sit' ? -Math.PI / 2 : 0;
  b.body.position.y = p === 'sit' ? -0.3 : 0;
  b.body.position.z = p === 'sit' ? -0.12 : 0;
  b.shL.rotation.x = b.shR.rotation.x = p === 'sit' ? -0.35 : 0;
}
function go(b, dest, onArrive) {
  if (b.loc === dest && !b.path.length) { onArrive && onArrive(); return; }
  b.path = routeTo(b, dest); b.dest = dest; b.onArrive = onArrive; pose(b, 'stand');
}
function decide(b) {
  if (b.path.length) return; // finish the current walk first
  const s = b.want;
  if (s === 'working' || s === 'waiting' || s === 'error') { if (b.loc !== 'desk') go(b, 'desk'); return; }
  if (s === 'done' && b.handled !== b.doneKey && b.def.id !== 'overlord') {
    b.handled = b.doneKey; b.paper.visible = true;
    go(b, 'tray', () => { b.paper.visible = false; dropPaper(); b.pauseUntil = performance.now() + 700; });
    return;
  }
  if (b.pauseUntil && performance.now() < b.pauseUntil) return;
  if (b.loc !== 'lounge') go(b, 'lounge');
}
function dropPaper() {
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.28), mat('#ece7dc'));
  p.position.set(TRAY[0] - 0.9 + rand(-0.04, 0.04), 0.83 + trayPapers.children.length * 0.01, TRAY[1] + rand(-0.03, 0.03)); p.rotation.y = rand(-0.2, 0.2);
  trayPapers.add(p); if (trayPapers.children.length > 8) trayPapers.remove(trayPapers.children[0]);
}
const SPEED = 2.3;
function step(b, dt, t) {
  if (b.path.length) {
    const target = b.path[0], pos = b.root.position;
    const d = target.clone().sub(pos); d.y = 0; const dist = d.length();
    if (dist < 0.02) { b.path.shift(); }
    else {
      const mv = Math.min(dist, SPEED * dt); pos.addScaledVector(d.normalize(), mv);
      const ang = Math.atan2(d.x, d.z); let da = ang - b.root.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
      b.root.rotation.y += da * Math.min(1, dt * 12);
      b.phase += dt * 9; const s = Math.sin(b.phase) * 0.55;
      b.hipL.rotation.x = s; b.hipR.rotation.x = -s; b.shL.rotation.x = b.paper.visible ? -0.9 : -s * 0.8; b.shR.rotation.x = s * 0.8;
    }
    if (!b.path.length) { // arrived
      b.loc = b.dest; b.phase = 0;
      place(b, b.loc);
      const cb = b.onArrive; b.onArrive = null; cb && cb();
    }
  } else if (b.loc === 'desk' && b.want === 'working') {
    // gentle typing at the desk while working (idle bots stay perfectly still)
    b.shR.rotation.x = -0.5 + Math.sin(t * 9 + b.i) * 0.06; b.shL.rotation.x = -0.5 + Math.cos(t * 8 + b.i) * 0.06;
  } else if (b.loc === 'desk') { b.shR.rotation.x = b.shL.rotation.x = 0; }
  decide(b);
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
    if (firstLoad && !isSim) { // jump straight to the right spot on first load, no replayed handoffs
      if (eff === 'done') b.handled = b.doneKey;
      place(b, ['working', 'waiting', 'error'].includes(eff) ? 'desk' : 'lounge');
    }
  }
  if (!isSim) firstLoad = false;
}
async function poll() {
  try {
    const r = await fetch('/api/state', { cache: 'no-store', credentials: 'same-origin' });
    if (r.status === 401) { location.href = '/login'; return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    live = await r.json();
    drawUsage(live.usage);
    if (!sim) applyStates(live.bots, false);
    const active = Object.values(live.bots).filter((x) => ['working', 'waiting', 'error'].includes(x.effective)).length;
    feedEl.className = 'feed ' + (live.feed.quiet ? 'bad' : 'ok');
    feedText.textContent = active ? `live · ${active} active` : 'live · all idle';
    warnEl.hidden = !live.feed.quiet;
    if (live.feed.quiet) warnEl.textContent = 'Status feed has been quiet for 45+ minutes (no heartbeat).';
  } catch (e) {
    feedEl.className = 'feed bad'; feedText.textContent = 'feed error';
    warnEl.hidden = false; warnEl.textContent = 'Status feed unreachable — showing last known state.';
    if (firstLoad) { applyStates({}, false); }
  }
}
poll(); setInterval(poll, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

// ---------- simulate work (browser only, never written to the API) ----------
const SIM_TEXT = ['Researching a topic', 'Drafting a document', 'Reviewing a checklist', 'Updating a report', 'Checking a routine', 'Organizing files', 'Comparing options', 'Writing a summary'];
const simBtn = document.getElementById('simbtn'), simLabel = document.getElementById('simlabel');
function startSim() {
  sim = { states: {}, next: {} };
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
    sim.next[id] = now + dur; changed = true;
  }
  if (changed) applyStates(sim.states, true);
}
simBtn.addEventListener('click', () => (sim ? stopSim() : startSim()));
if (new URLSearchParams(location.search).get('simulate') === '1') startSim();

// ---------- tap/hover on bots ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downAt = null, hovered = null;
function pick(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
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

// ---------- camera framing ----------
function frameCamera() {
  const aspect = innerWidth / innerHeight; camera.aspect = aspect;
  const portrait = aspect < 0.9;
  const dir = portrait ? new THREE.Vector3(0, 1, 0.3).normalize() : new THREE.Vector3(0, 1, 0.9).normalize();
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * aspect);
  const dW = (portrait ? 20.6 : 21.5) / Math.tan(hf) + (portrait ? 1 : 9), dH = 15.5 / Math.tan(vf) * (portrait ? 0.95 : 0.8);
  const d = Math.max(dW, dH) * (portrait ? 1 : 0.95);
  controls.target.set(0, 0, portrait ? 0.3 : 1.0);
  camera.position.copy(controls.target).addScaledVector(dir, d);
  controls.maxDistance = d * 1.5;
  camera.updateProjectionMatrix(); controls.update();
}
frameCamera();
addEventListener('resize', () => {
  renderer.setPixelRatio(window.devicePixelRatio); renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight); frameCamera();
});

// ---------- loop ----------
const clock = new THREE.Clock();
let scrAcc = 0, ledAcc = 0;
function loop() {
  const dtAll = Math.min(0.5, clock.getDelta()), dt = dtAll, t = clock.elapsedTime, now = performance.now();
  tickSim(now);
  for (let left = dtAll; left > 1e-4; left -= 0.04) { const d = Math.min(0.04, left); for (const b of bots) step(b, d, t); }
  scrAcc += dt; if (scrAcc > 0.12) { scrAcc = 0; for (const s of screens) { const { g, c } = s.tex.userData; s.draw(g, c.width, c.height, t); s.tex.needsUpdate = true; } }
  ledAcc += dt; if (ledAcc > 0.25) { ledAcc = 0; for (const l of leds) if (Math.random() < 0.25) l.material.emissiveIntensity = l.material.emissiveIntensity > 0.3 ? 0.08 : 0.9; }
  brew.material.emissiveIntensity = 0.4 + 0.3 * (Math.sin(t * 2) > 0 ? 1 : 0);
  controls.update();
  renderer.render(scene, camera); labels.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
window.__hq = { bots, live: () => live };
