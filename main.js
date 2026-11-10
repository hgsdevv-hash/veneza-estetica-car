/* Veneza Estética Car — HGS Dev */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- abertura: carro passa em alta e deixa marca de pneu ---------- */
const intro = document.getElementById('intro');
let ended = false;
function endIntro() {
  if (ended) return; ended = true;
  intro.classList.add('out'); document.body.classList.remove('lock');
  reveal(); startVideo(); autoPolish(500);
  setTimeout(() => intro.remove(), 700);
}
document.getElementById('skip').onclick = endIntro;
history.scrollRestoration = 'manual'; scrollTo(0, 0);

(function road() {
  if (reduce) { endIntro(); return; }
  const cv = document.getElementById('road'), ctx = cv.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);

  // asfalto: granulado fixo desenhado uma vez
  const asphalt = document.createElement('canvas'); asphalt.width = W; asphalt.height = H;
  const a = asphalt.getContext('2d');
  a.fillStyle = '#262626'; a.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 90; i++) {
    const g = 28 + Math.random() * 34 | 0;
    a.fillStyle = `rgba(${g},${g},${g},.9)`; a.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
  }
  // faixa da pista
  a.strokeStyle = 'rgba(245,243,238,.12)'; a.lineWidth = 6; a.setLineDash([46, 38]);
  a.beginPath(); a.moveTo(0, H * .52); a.lineTo(W, H * .44); a.stroke(); a.setLineDash([]);

  // trajeto: entra embaixo à esquerda, derrapa e sai à direita
  const S = Math.max(.6, Math.min(W, H * 1.6) / 1000);            // escala do carro
  const P = [[-.15 * W, .98 * H], [.5 * W, .78 * H], [.32 * W, .34 * H], [1.28 * W, .4 * H]];
  const bez = (t, i) => (1 - t) ** 3 * P[0][i] + 3 * (1 - t) ** 2 * t * P[1][i] + 3 * (1 - t) * t * t * P[2][i] + t ** 3 * P[3][i];
  const tan = t => {
    const d = i => 3 * (1 - t) ** 2 * (P[1][i] - P[0][i]) + 6 * (1 - t) * t * (P[2][i] - P[1][i]) + 3 * t * t * (P[3][i] - P[2][i]);
    return Math.atan2(d(1), d(0));
  };
  const L = 230 * S, Wd = 104 * S;                  // comprimento e largura do carro
  // quanto a frente "entra" na curva: proporcional à curvatura do trajeto, limitado
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
  const slipAt = t => Math.max(-.7, Math.min(.7, wrapA(tan(Math.min(1, t + .03)) - tan(Math.max(0, t - .03))) * 3.2));
  const marks = [[], []], smoke = [];

  // carro visto de cima, frente para +x: faróis e facho de luz na frente, lanternas vermelhas atrás
  function car(x, y, ang, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha;
    const hl = L / 2, hw = Wd / 2;
    // facho dos faróis, à frente
    if (alpha > .9) {
      ctx.fillStyle = 'rgba(255,246,216,.10)';
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(hl - 4 * S, s * (hw - 18 * S)); ctx.lineTo(hl + L * .9, s * (hw + 30 * S)); ctx.lineTo(hl + L * .9, s * (hw - 60 * S)); ctx.closePath(); ctx.fill(); });
    }
    // pneus
    ctx.fillStyle = '#050505';
    [[-.3, -1], [-.3, 1], [.3, -1], [.3, 1]].forEach(([u, v]) => ctx.fillRect(u * L - 18 * S, v * hw - 9 * S, 36 * S, 18 * S));
    // carroceria: frente mais estreita e arredondada, traseira reta
    ctx.fillStyle = '#ff6a13';
    ctx.beginPath();
    ctx.moveTo(-hl, -hw + 8 * S);
    ctx.lineTo(hl - 34 * S, -hw + 6 * S);
    ctx.quadraticCurveTo(hl, -hw + 12 * S, hl, -hw + 34 * S);
    ctx.lineTo(hl, hw - 34 * S);
    ctx.quadraticCurveTo(hl, hw - 12 * S, hl - 34 * S, hw - 6 * S);
    ctx.lineTo(-hl, hw - 8 * S);
    ctx.quadraticCurveTo(-hl - 6 * S, 0, -hl, -hw + 8 * S);
    ctx.fill();
    // duas faixas de corrida
    ctx.fillStyle = '#f5f3ee';
    ctx.fillRect(-hl + 6 * S, -12 * S, L - 14 * S, 7 * S); ctx.fillRect(-hl + 6 * S, 5 * S, L - 14 * S, 7 * S);
    // para-brisa (trapézio mais largo na frente)
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(.06 * L, -hw + 20 * S); ctx.lineTo(.24 * L, -hw + 12 * S); ctx.lineTo(.24 * L, hw - 12 * S); ctx.lineTo(.06 * L, hw - 20 * S); ctx.closePath(); ctx.fill();
    // teto
    ctx.fillStyle = '#e25a08'; rr(-.18 * L, -hw + 18 * S, .24 * L, Wd - 36 * S, 8 * S); ctx.fill();
    ctx.fillStyle = '#f5f3ee'; ctx.fillRect(-.18 * L, -12 * S, .24 * L, 7 * S); ctx.fillRect(-.18 * L, 5 * S, .24 * L, 7 * S);
    // vidro traseiro, menor
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(-.32 * L, -hw + 22 * S); ctx.lineTo(-.2 * L, -hw + 18 * S); ctx.lineTo(-.2 * L, hw - 18 * S); ctx.lineTo(-.32 * L, hw - 22 * S); ctx.closePath(); ctx.fill();
    // retrovisores
    ctx.fillStyle = '#ff6a13'; ctx.fillRect(.06 * L, -hw - 4 * S, 10 * S, 8 * S); ctx.fillRect(.06 * L, hw - 4 * S, 10 * S, 8 * S);
    // faróis na frente, lanternas vermelhas atrás
    ctx.fillStyle = '#fff6d8';
    ctx.fillRect(hl - 9 * S, -hw + 16 * S, 7 * S, 20 * S); ctx.fillRect(hl - 9 * S, hw - 36 * S, 7 * S, 20 * S);
    ctx.fillStyle = '#ff1f1f';
    ctx.fillRect(-hl - 1 * S, -hw + 12 * S, 6 * S, 22 * S); ctx.fillRect(-hl - 1 * S, hw - 34 * S, 6 * S, 22 * S);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  const DUR = 1050, t0 = performance.now();
  let shook = false, brandAt = 0;
  function frame(now) {
    if (ended) return;
    const raw = Math.min(1, (now - t0) / DUR);
    const t = raw < .5 ? 2 * raw * raw : 1 - (-2 * raw + 2) ** 2 / 2;        // acelera, derrapa, sai
    const x = bez(t, 0), y = bez(t, 1);
    const slip = slipAt(t), drift = Math.abs(slip);
    const ang = tan(t) + slip;

    // marcas das rodas traseiras (só no chão, ficam)
    const rx = x - Math.cos(ang) * L * .33, ry = y - Math.sin(ang) * L * .33;
    [-1, 1].forEach((s, k) => marks[k].push([rx - Math.sin(ang) * Wd * .5 * s, ry + Math.cos(ang) * Wd * .5 * s, drift]));
    if (drift > .2) smoke.push({ x: rx + (Math.random() - .5) * 30 * S, y: ry + (Math.random() - .5) * 30 * S, r: 14 * S, a: .16 });

    ctx.drawImage(asphalt, 0, 0, W, H);
    marks.forEach(m => {
      for (let i = 1; i < m.length; i++) {
        const w = (14 + m[i][2] * 30) * S;
        ctx.strokeStyle = `rgba(6,6,6,${Math.min(.95, .7 + m[i][2] * .4)})`; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m[i - 1][0], m[i - 1][1]); ctx.lineTo(m[i][0], m[i][1]); ctx.stroke();
      }
    });
    smoke.forEach(p => { p.r += 2.6 * S; p.a *= .95; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(215,214,210,${p.a})`); g.addColorStop(1, 'rgba(215,214,210,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
    for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].a < .02) smoke.splice(i, 1);

    if (raw < 1) {
      // rastro de velocidade: o carro em três posições anteriores, apagando
      [.06, .035, .015].forEach((d, i) => { const tt = Math.max(0, t - d); car(bez(tt, 0), bez(tt, 1), tan(tt) + slipAt(tt), .12 + i * .1); });
      car(x, y, ang, 1);
      if (!shook && drift > .45) { shook = true; intro.classList.add('shake'); }
    } else if (!brandAt) {
      brandAt = now; intro.classList.add('brand-in');
      setTimeout(endIntro, 1000);
    }
    if (smoke.length || raw < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setTimeout(endIntro, 4500); // trava de segurança
})();

/* ---------- vídeo do topo ---------- */
const heroVid = document.getElementById('heroVid');
function startVideo() {
  if (reduce) return;
  new IntersectionObserver(([e]) => { if (e.isIntersecting) heroVid.play().catch(() => {}); else heroVid.pause(); }).observe(heroVid);
}

/* ---------- título que se poli com o mouse ---------- */
const hsvg = document.getElementById('hsvg'), dull = document.getElementById('dull'), shiny = document.getElementById('shiny'), dots = document.getElementById('pmDots'), hint = document.getElementById('hint');
const NS = 'http://www.w3.org/2000/svg';
let lastPt = null, dotCount = 0, autoRunning = false;
function layoutHeadline() {
  const lines = [['Do fosco'], ['ao'], ['espelho.', 1]];
  [dull, shiny].forEach((g, gi) => { g.textContent = ''; lines.forEach(([l, accent], i) => { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', 0); t.setAttribute('y', 130 + i * 134); t.textContent = l; if (gi) t.setAttribute('fill', accent ? 'url(#glossOr)' : 'url(#gloss)'); g.appendChild(t); }); });
  const b = dull.getBBox();
  hsvg.setAttribute('viewBox', `${b.x - 6} ${b.y} ${b.width + 24} ${b.height}`);
}
function polishAt(x, y) {
  if (lastPt && Math.hypot(x - lastPt[0], y - lastPt[1]) < 14) return;
  lastPt = [x, y];
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 85); c.setAttribute('fill', 'url(#soft)');
  dots.appendChild(c);
  if (++dotCount > 900) dots.firstChild.remove();
}
function toSvg(e) { const p = hsvg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(hsvg.getScreenCTM().inverse()); }
hsvg.addEventListener('pointermove', e => { const p = toSvg(e); polishAt(p.x, p.y); hint.style.opacity = 0; });
function autoPolish(delay) {
  if (autoRunning) return; autoRunning = true;
  if (reduce) { fullShine(); return; }
  setTimeout(() => {
    const vb = hsvg.viewBox.baseVal, rows = 3, dur = 2800, t0 = performance.now();
    (function step(now) {
      const t = Math.min(1, (now - t0) / dur), rt = t * rows, row = Math.min(rows - 1, Math.floor(rt)), p = rt - row, px = row % 2 ? 1 - p : p;
      const x = vb.x + px * vb.width * .8, y = vb.y + (row + .5) / rows * vb.height + Math.sin(t * 40) * 18;
      lastPt = null; polishAt(x, y); polishAt(x, y - 40); polishAt(x, y + 40);
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }, delay);
}
function fullShine() { const vb = hsvg.viewBox.baseVal; const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', vb.x); r.setAttribute('y', vb.y); r.setAttribute('width', vb.width); r.setAttribute('height', vb.height); r.setAttribute('fill', '#fff'); dots.appendChild(r); }
layoutHeadline();
document.fonts && document.fonts.ready.then(layoutHeadline);
if (matchMedia('(hover: none)').matches) hint.innerHTML = '<b>Teste</b> arraste o dedo no título para polir';

/* ---------- entradas ---------- */
let revealed = false;
function reveal() {
  if (revealed) return; revealed = true;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
}

/* ---------- barra ---------- */
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });

/* ---------- chuva ácida: antes e depois ---------- */
const clear = document.getElementById('clear'), lvlTxt = document.getElementById('lvlTxt');
const shapes = [clear.getAttribute('d'), 'M0 146 L0 112 L70 112 Q85 112 92 112 Q100 112 108 112 Q115 112 130 112 L250 112 Q262 112 268 112 Q276 112 284 112 Q290 112 302 112 L430 112 Q445 112 452 112 Q460 112 468 112 Q475 112 490 112 L600 112 L600 146 Z'];
document.querySelectorAll('.toggle button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.toggle button').forEach(x => x.setAttribute('aria-pressed', x === b));
  const s = +b.dataset.s; clear.setAttribute('d', shapes[s]); clear.style.d = `path("${shapes[s]}")`;
  lvlTxt.textContent = s ? 'Verniz nivelado' : 'Marcas de gota';
});

/* ---------- catálogo em abas ---------- */
const tabs = [...document.querySelectorAll('.tabs [role=tab]')];
function openTab(key) {
  tabs.forEach(t => {
    const on = t.id === 't-' + key;
    t.setAttribute('aria-selected', on);
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
}
tabs.forEach(t => t.addEventListener('click', () => openTab(t.id.slice(2))));
document.querySelectorAll('[data-tab]').forEach(a => a.addEventListener('click', () => openTab(a.dataset.tab)));

/* ---------- Agendar: já seleciona o serviço na agenda ---------- */
const form = document.getElementById('form'), servico = document.getElementById('servico');
const adicional = form.elements.adicional;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-svc]'); if (!b) return;
  const v = b.dataset.svc;
  const inAdic = [...adicional.options].some(o => o.text === v);
  if (inAdic) adicional.value = v;
  else if ([...servico.options].some(o => o.text === v)) servico.value = v;
  document.getElementById('agenda').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  form.classList.remove('flash'); void form.offsetWidth; form.classList.add('flash');
});

/* dia: a partir de hoje */
const dia = document.getElementById('dia');
const hoje = new Date(); hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
dia.min = hoje.toISOString().slice(0, 10);

form.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(form);
  const d = f.get('dia') ? f.get('dia').split('-').reverse().join('/') : '';
  const linhas = [
    'Olá! Quero agendar na Veneza Estética Car.',
    `Serviço: ${f.get('servico')}`,
    f.get('adicional') && f.get('adicional') !== 'Nenhum' ? `Adicional: ${f.get('adicional')}` : '',
    `Dia: ${d}`, `Horário: ${f.get('hora')}`,
    `Nome: ${f.get('nome')}`, `Endereço: ${f.get('endereco')}`,
    f.get('obs') ? `Observações: ${f.get('obs')}` : ''
  ].filter(Boolean);
  window.open('https://wa.me/5519990150008?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
});
