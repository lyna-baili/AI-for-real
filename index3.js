const canvas = document.getElementById('cityCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resize();
window.addEventListener('resize', () => { resize(); });

// City grid & nodes definition
const nodes = [
  { id:'A-1', x:0.12, y:0.18, risk:12, label:'Treatment Plant', type:'plant' },
  { id:'A-2', x:0.28, y:0.12, risk:15, label:'Reservoir N', type:'reservoir' },
  { id:'B-1', x:0.22, y:0.32, risk:18, label:'Res. North', type:'residential' },
  { id:'B-2', x:0.42, y:0.22, risk:22, label:'Tech Park', type:'industrial' },
  { id:'B-3', x:0.60, y:0.30, risk:45, label:'Commercial Hub', type:'commercial' },
  { id:'C-1', x:0.18, y:0.50, risk:20, label:'Res. West', type:'residential' },
  { id:'C-2', x:0.35, y:0.45, risk:28, label:'City Center', type:'commercial' },
  { id:'C-3', x:0.52, y:0.52, risk:35, label:'Hospital', type:'hospital' },
  { id:'C-4', x:0.70, y:0.48, risk:62, label:'Ind. Zone', type:'critical' },
  { id:'D-1', x:0.25, y:0.67, risk:24, label:'School', type:'school' },
  { id:'D-2', x:0.45, y:0.70, risk:31, label:'Res. South', type:'residential' },
  { id:'D-3', x:0.65, y:0.68, risk:38, label:'Market', type:'commercial' },
  { id:'E-1', x:0.35, y:0.84, risk:16, label:'Res. SW', type:'residential' },
  { id:'E-2', x:0.55, y:0.82, risk:19, label:'Res. SE', type:'residential' },
];

const pipes = [
  ['A-1','A-2'],['A-1','B-1'],['A-2','B-2'],['B-1','B-2'],['B-1','C-1'],
  ['B-2','B-3'],['B-2','C-2'],['B-3','C-3'],['B-3','C-4'],
  ['C-1','C-2'],['C-1','D-1'],['C-2','C-3'],['C-3','C-4'],
  ['C-2','D-2'],['C-3','D-2'],['C-4','D-3'],
  ['D-1','D-2'],['D-1','E-1'],['D-2','E-1'],['D-2','E-2'],['D-3','E-2'],
];

// Building shapes for the city
const buildings = [];
for(let i = 0; i < 80; i++) {
  buildings.push({
    x: 0.05 + Math.random() * 0.9,
    y: 0.05 + Math.random() * 0.9,
    w: 0.012 + Math.random() * 0.025,
    h: 0.015 + Math.random() * 0.04,
    opacity: 0.15 + Math.random() * 0.25,
  });
}

// Water particle system
const particles = [];
function spawnParticle(n1, n2) {
  const nd1 = nodes.find(n => n.id === n1);
  const nd2 = nodes.find(n => n.id === n2);
  if (!nd1 || !nd2) return;
  const risk = Math.max(nd1.risk, nd2.risk);
  const color = risk > 70 ? '#ff3355' : risk > 45 ? '#ffb800' : '#00ffcc';
  particles.push({
    x: nd1.x, y: nd1.y,
    tx: nd2.x, ty: nd2.y,
    progress: Math.random(),
    speed: 0.003 + Math.random() * 0.004,
    color,
    size: 2 + Math.random() * 2,
    pipe: [n1, n2],
  });
}

// Spawn particles on all pipes
pipes.forEach(p => {
  for(let i = 0; i < 3; i++) spawnParticle(p[0], p[1]);
  for(let i = 0; i < 2; i++) spawnParticle(p[1], p[0]);
});

let hovered = null;
let frame = 0;
let riskOffset = 0;

function getRiskColor(risk) {
  if (risk < 35) return '#00ffcc';
  if (risk < 60) return '#ffb800';
  if (risk < 80) return '#ff6600';
  return '#ff3355';
}

function lerp(a, b, t) { return a + (b - a) * t; }

function drawCity() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // ── BACKGROUND ──
  ctx.fillStyle = '#010608';
  ctx.fillRect(0, 0, W, H);

  // City glow
  const grd = ctx.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, W*0.6);
  grd.addColorStop(0, 'rgba(0,40,80,0.25)');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // ── CITY GRID (isometric feel) ──
  ctx.strokeStyle = 'rgba(0,80,120,0.12)';
  ctx.lineWidth = 0.5;
  const gridStep = 40;
  for(let x = 0; x < W; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for(let y = 0; y < H; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── BUILDINGS ──
  buildings.forEach(b => {
    const bx = b.x * W, by = b.y * H;
    const bw = b.w * W, bh = b.h * H;
    ctx.fillStyle = `rgba(0,30,60,${b.opacity})`;
    ctx.strokeStyle = `rgba(0,100,160,${b.opacity * 0.8})`;
    ctx.lineWidth = 0.5;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);
    // windows
    const winCols = Math.floor(bw / 5);
    const winRows = Math.floor(bh / 5);
    for(let r = 0; r < winRows; r++) {
      for(let c = 0; c < winCols; c++) {
        if(Math.random() > 0.55) {
          ctx.fillStyle = `rgba(0,200,255,${0.08 + Math.random() * 0.1})`;
          ctx.fillRect(bx + c*5 + 1, by + r*5 + 1, 3, 3);
        }
      }
    }
  });

  // ── PIPES ──
  pipes.forEach(p => {
    const n1 = nodes.find(n => n.id === p[0]);
    const n2 = nodes.find(n => n.id === p[1]);
    if (!n1 || !n2) return;

    const x1 = n1.x * W, y1 = n1.y * H;
    const x2 = n2.x * W, y2 = n2.y * H;
    const risk = Math.max(n1.risk, n2.risk);
    const col = getRiskColor(risk);

    // Pipe shadow
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Pipe body
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(0,40,80,0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Pipe glow edge
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    const riskGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    riskGrad.addColorStop(0, getRiskColor(n1.risk) + '40');
    riskGrad.addColorStop(1, getRiskColor(n2.risk) + '40');
    ctx.strokeStyle = riskGrad;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // ── WATER PARTICLES ──
  particles.forEach(p => {
    p.progress += p.speed;
    if (p.progress > 1) {
      p.progress = 0;
      p.x = nodes.find(n => n.id === p.pipe[0])?.x || 0.5;
      p.y = nodes.find(n => n.id === p.pipe[0])?.y || 0.5;
      p.tx = nodes.find(n => n.id === p.pipe[1])?.x || 0.5;
      p.ty = nodes.find(n => n.id === p.pipe[1])?.y || 0.5;
    }
    const cx2 = lerp(p.x, p.tx, p.progress) * W;
    const cy2 = lerp(p.y, p.ty, p.progress) * H;
    const alpha = Math.sin(p.progress * Math.PI) * 0.8;

    ctx.beginPath();
    ctx.arc(cx2, cy2, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();

    // Glow
    const glow = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, p.size * 3);
    glow.addColorStop(0, p.color + '40');
    glow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx2, cy2, p.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  });

  // ── NODES ──
  nodes.forEach(node => {
    const nx = node.x * W;
    const ny = node.y * H;
    const risk = node.risk;
    const color = getRiskColor(risk);
    const isHovered = hovered === node.id;
    const isCritical = risk > 55;

    // Pulse rings for critical
    if (isCritical) {
      const pulseSize = 18 + 10 * Math.sin(frame * 0.08 + node.x * 10);
      const pulseAlpha = 0.3 + 0.2 * Math.sin(frame * 0.08);
      ctx.beginPath();
      ctx.arc(nx, ny, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = color + Math.floor(pulseAlpha * 255).toString(16).padStart(2,'0');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Second ring
      const p2 = 28 + 8 * Math.sin(frame * 0.06);
      ctx.beginPath();
      ctx.arc(nx, ny, p2, 0, Math.PI * 2);
      ctx.strokeStyle = color + '20';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Ground shadow
    const shadowGrad = ctx.createRadialGradient(nx, ny + 4, 0, nx, ny + 4, 16);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
    shadowGrad.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(nx, ny + 3, 14, 0, Math.PI * 2);
    ctx.fillStyle = shadowGrad; ctx.fill();

    // Outer glow
    const glowGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, isHovered ? 28 : 20);
    glowGrad.addColorStop(0, color + '30');
    glowGrad.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(nx, ny, isHovered ? 28 : 20, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad; ctx.fill();

    // Outer ring
    ctx.beginPath(); ctx.arc(nx, ny, isHovered ? 14 : 11, 0, Math.PI * 2);
    ctx.strokeStyle = color + 'cc';
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.stroke();

    // Inner fill
    const innerGrad = ctx.createRadialGradient(nx - 2, ny - 2, 0, nx, ny, isHovered ? 10 : 8);
    innerGrad.addColorStop(0, color + 'ee');
    innerGrad.addColorStop(1, color + '66');
    ctx.beginPath(); ctx.arc(nx, ny, isHovered ? 10 : 8, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad; ctx.fill();

    // Center dot
    ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    // Label
    const labelY = ny - (isHovered ? 18 : 15);
    ctx.font = isHovered ? 'bold 11px Exo 2' : '10px Exo 2';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(node.id, nx, labelY);

    if (isHovered) {
      ctx.font = '9px Exo 2';
      ctx.fillStyle = 'rgba(180,220,240,0.8)';
      ctx.fillText(node.label, nx, labelY - 12);
    }

    // Risk badge
    const badgeW = 28, badgeH = 14;
    const bx = nx - badgeW/2, by = ny + 13;
    ctx.fillStyle = 'rgba(1,6,8,0.85)';
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 3);
    ctx.fill();
    ctx.strokeStyle = color + '66';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.font = 'bold 8px Orbitron';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(risk, nx, by + 9);
  });

  // ── ZONE LABELS ──
  const zones = [
    { x: 0.20, y: 0.08, label: 'ZONE NORTH · TREATMENT' },
    { x: 0.55, y: 0.08, label: 'ZONE INDUSTRIAL · HIGH RISK' },
    { x: 0.15, y: 0.58, label: 'ZONE RESIDENTIAL WEST' },
    { x: 0.45, y: 0.90, label: 'ZONE SOUTH · RESIDENTIAL' },
  ];
  zones.forEach(z => {
    ctx.font = '8px Orbitron';
    ctx.fillStyle = 'rgba(58,112,144,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(z.label, z.x * W, z.y * H);
  });

  // ── COORDINATES OVERLAY ──
  ctx.font = '9px DM Mono';
  ctx.fillStyle = 'rgba(42,90,120,0.5)';
  ctx.textAlign = 'left';
  ctx.fillText(`COORD: 36.8065°N 10.1815°E · TUNIS SMART CITY`, 16, H - 16);
  ctx.textAlign = 'right';
  ctx.fillText(`FRAME: ${String(frame).padStart(6,'0')} · NODES: ${nodes.length} · PIPES: ${pipes.length}`, W - 16, H - 16);

  frame++;
  requestAnimationFrame(drawCity);
}

drawCity();

// ── HOVER / TOOLTIP ──
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / rect.width;
  const my = (e.clientY - rect.top) / rect.height;
  const tooltip = document.getElementById('nodeTooltip');
  let found = null;

  nodes.forEach(n => {
    const dx = n.x - mx, dy = n.y - my;
    if (Math.sqrt(dx*dx + dy*dy) < 0.025) found = n;
  });

  hovered = found?.id || null;

  if (found) {
    const col = getRiskColor(found.risk);
    tooltip.style.left = (e.clientX - rect.left + 16) + 'px';
    tooltip.style.top = (e.clientY - rect.top - 80) + 'px';
    tooltip.classList.add('show');
    document.getElementById('tt-name').textContent = `NODE ${found.id} — ${found.label.toUpperCase()}`;
    document.getElementById('tt-risk').textContent = found.risk;
    document.getElementById('tt-risk').className = `nt-val ${found.risk > 60 ? 'danger' : found.risk > 35 ? 'warn' : 'safe'}`;
    document.getElementById('tt-status').textContent = found.risk > 70 ? 'HIGH RISK' : found.risk > 45 ? 'MODERATE' : 'SAFE';
    canvas.style.cursor = 'pointer';
  } else {
    tooltip.classList.remove('show');
    canvas.style.cursor = 'crosshair';
  }
});

// ── MODE BUTTONS ──
function toggleMode(el) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ── GAUGE ──
function drawGauge(val) {
  const c = document.getElementById('mainGauge');
  const ctx2 = c.getContext('2d');
  const W = 220, H = 130, cx = 110, cy = 120, r = 90;
  ctx2.clearRect(0, 0, W, H);

  // BG arc
  ctx2.beginPath();
  ctx2.arc(cx, cy, r, Math.PI, 0);
  ctx2.lineWidth = 16;
  ctx2.strokeStyle = 'rgba(10,45,66,0.8)';
  ctx2.stroke();

  // Color arc
  const grad = ctx2.createLinearGradient(20, 0, 200, 0);
  grad.addColorStop(0, '#00ffcc');
  grad.addColorStop(0.45, '#ffb800');
  grad.addColorStop(0.75, '#ff6600');
  grad.addColorStop(1, '#ff3355');
  ctx2.beginPath();
  ctx2.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * val / 100);
  ctx2.lineWidth = 16;
  ctx2.strokeStyle = grad;
  ctx2.lineCap = 'round';
  ctx2.stroke();

  // Ticks
  for(let i = 0; i <= 10; i++) {
    const a = Math.PI + (Math.PI * i / 10);
    const r1 = r - 20, r2 = r - 12;
    ctx2.beginPath();
    ctx2.moveTo(cx + r1*Math.cos(a), cy + r1*Math.sin(a));
    ctx2.lineTo(cx + r2*Math.cos(a), cy + r2*Math.sin(a));
    ctx2.strokeStyle = 'rgba(58,112,144,0.5)';
    ctx2.lineWidth = i%5===0 ? 2:1; ctx2.stroke();
  }

  // Needle
  const na = Math.PI + Math.PI * val / 100;
  ctx2.beginPath();
  ctx2.moveTo(cx, cy);
  ctx2.lineTo(cx + (r-22)*Math.cos(na), cy + (r-22)*Math.sin(na));
  ctx2.lineWidth = 3;
  ctx2.strokeStyle = val > 70 ? '#ff3355' : val > 45 ? '#ffb800' : '#00ffcc';
  ctx2.lineCap = 'round';
  ctx2.stroke();
  ctx2.beginPath(); ctx2.arc(cx, cy, 6, 0, Math.PI*2);
  ctx2.fillStyle = val > 70 ? '#ff3355' : val > 45 ? '#ffb800' : '#00ffcc'; ctx2.fill();
}

let gaugeVal = 62;
drawGauge(gaugeVal);
setInterval(() => {
  gaugeVal += (Math.random()-0.45) * 2;
  gaugeVal = Math.max(55, Math.min(72, gaugeVal));
  const v = Math.round(gaugeVal);
  drawGauge(v);
  document.getElementById('riskNum').textContent = v;
  document.getElementById('hdRisk').textContent = v;
  document.getElementById('riskBarFill').style.width = v + '%';
}, 2500);

// ── SENSOR SIMULATION ──
function jitter(base, range, decimals) {
  return (base + (Math.random()-0.5)*range).toFixed(decimals);
}
setInterval(() => {
  document.getElementById('s-ph').textContent = jitter(8.4, 0.15, 1);
  document.getElementById('s-turb').textContent = jitter(4.8, 0.4, 1);
  document.getElementById('s-cl').textContent = jitter(0.08, 0.01, 2);
  document.getElementById('s-cond').textContent = Math.round(312 + (Math.random()-0.5)*10);
  document.getElementById('s-temp').textContent = jitter(21.3, 0.3, 1);
  document.getElementById('s-pres').textContent = jitter(2.1, 0.06, 2);
}, 2000);

// ── CAUSE BARS ──
setTimeout(() => {
  document.querySelectorAll('.cause-fill').forEach(el => {
    el.style.width = el.dataset.w + '%';
  });
  document.querySelectorAll('.fc-bar-fill').forEach(el => {
    el.style.width = el.dataset.w + '%';
  });
}, 500);

// ── CLOCK ──
function tick() {
  // update header time
}
setInterval(tick, 1000);

// ── TIME SLIDER ──
function onSliderChange(val) {
  const v = parseInt(val);
  const label = document.getElementById('sliderTime');
  if (v === 0) label.innerHTML = 'NOW <span>→ LIVE</span>';
  else if (v < 0) label.innerHTML = `${Math.abs(v)} MIN AGO`;
  else label.innerHTML = `+${v} MIN (FORECAST)`;
}

// ── WHAT IF ──
function applyWhatIf(scenario) {
  document.getElementById('whatifModal').classList.remove('open');
  const reductions = { flush: 34, chlorine: 22, valve: 18, all: 41 };
  const red = reductions[scenario] || 20;
  nodes.forEach(n => { n.risk = Math.max(5, n.risk - red * (0.3 + Math.random()*0.4)); n.risk = Math.round(n.risk); });
  gaugeVal = Math.max(20, gaugeVal - red);
  drawGauge(Math.round(gaugeVal));
  document.getElementById('riskNum').textContent = Math.round(gaugeVal);
  document.getElementById('hdRisk').textContent = Math.round(gaugeVal);
  document.getElementById('riskBarFill').style.width = Math.round(gaugeVal) + '%';
  particles.forEach(p => { p.color = '#00ffcc'; });
}