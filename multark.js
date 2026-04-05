window.addEventListener("load", () => {
  const robot = document.querySelector(".robot-img");

  setTimeout(() => {
    robot.classList.add("show");
  }, 300); // small delay for smooth feel
});

/* ============================================================
   ROBOT ENTRANCE — triggers on scroll into view
   ============================================================ */
window.addEventListener("load", () => {
  const robot = document.querySelector(".robot-img");
  if (!robot) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => robot.classList.add("show"), 300);
        observer.unobserve(entry.target); // fire once only
      }
    });
  }, { threshold: 0.3 });

  observer.observe(robot);
});


/* ============================================================
   TICK MARKS
   60 ticks around the outer bezel — every 5th is brighter
   Runs immediately (pure DOM, no animation)
   ============================================================ */
const tg = document.getElementById('ticks');

for (let i = 0; i < 60; i++) {
  const angle   = (i / 60) * 360 - 90;
  const rad     = angle * Math.PI / 180;
  const cx      = 230, cy = 230;
  const isMajor = i % 5 === 0;
  const r1      = isMajor ? 200 : 204;
  const r2      = 212;

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', cx + r1 * Math.cos(rad));
  line.setAttribute('y1', cy + r1 * Math.sin(rad));
  line.setAttribute('x2', cx + r2 * Math.cos(rad));
  line.setAttribute('y2', cy + r2 * Math.sin(rad));
  line.setAttribute('stroke',       isMajor ? 'rgba(255,100,30,0.55)' : 'rgba(255,80,20,0.18)');
  line.setAttribute('stroke-width', isMajor ? '2' : '1');
  tg.appendChild(line);
}


/* ============================================================
   PARTICLE FIELD
   Starts only when canvas scrolls into view
   Pauses automatically when off-screen (saves CPU)
   ============================================================ */
const canvas = document.getElementById('pc');
const ctx    = canvas.getContext('2d');
canvas.width  = 560;
canvas.height = 560;

const pts = Array.from({ length: 60 }, () => ({
  x:  Math.random() * 560,
  y:  Math.random() * 560,
  vx: (Math.random() - 0.5) * 0.3,
  vy: (Math.random() - 0.5) * 0.3,
  r:  Math.random() * 1.5 + 0.5,
  a:  Math.random()
}));

let particlesRunning = false;

function drawParticles() {
  if (!particlesRunning) return;

  ctx.clearRect(0, 0, 560, 560);

  pts.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > 560) p.vx *= -1;
    if (p.y < 0 || p.y > 560) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,90,20,${p.a * 0.4})`;
    ctx.fill();
  });

  pts.forEach((p, i) => {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[j].x - p.x;
      const dy = pts[j].y - p.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 80) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(255,90,20,${0.08 * (1 - d / 80)})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(drawParticles);
}

// start particle loop on entry, pause on exit
const particleObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !particlesRunning) {
      particlesRunning = true;
      drawParticles();
    } else if (!entry.isIntersecting) {
      particlesRunning = false;
    }
  });
}, { threshold: 0.1 });

particleObserver.observe(canvas);


/* ============================================================
   COUNTER + RING ANIMATION
   Fires when ring scrolls into view (40% visible threshold)
   Option A: plays ONCE ever
   Option B: replays every time it enters view (see comments)
   ============================================================ */
const TARGET   = 27;
const MAIN_C   = 2 * Math.PI * 190;  // ~1194  (r = 190)
const INNER_C  = 2 * Math.PI * 158;  // ~993   (r = 158)
const DURATION = 2600;               // ms

const mainArc  = document.getElementById('mainArc');
const innerArc = document.getElementById('innerArc');
const tipDot   = document.getElementById('tipDot');
const counter  = document.getElementById('counter');

// cubic ease-in-out
const ease = t => t < 0.5
  ? 4 * t * t * t
  : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

let startTime   = null;
let rafId       = null;
let hasAnimated = false;

function resetRing() {
  startTime = null;
  counter.textContent = '0';
  mainArc.style.strokeDashoffset  = MAIN_C;
  innerArc.style.strokeDashoffset = INNER_C;
  tipDot.setAttribute('cx', 230);
  tipDot.setAttribute('cy', 40);
}

function animate(ts) {
  if (!startTime) startTime = ts;

  const elapsed  = ts - startTime;
  const progress = Math.min(elapsed / DURATION, 1);
  const ep       = ease(progress);

  counter.textContent = Math.round(ep * TARGET);

  mainArc.style.strokeDashoffset  = MAIN_C  * (1 - ep);
  innerArc.style.strokeDashoffset = INNER_C * (1 - ep * 0.85);

  const angle = (ep * 360 - 90) * (Math.PI / 180);
  tipDot.setAttribute('cx', 230 + 190 * Math.cos(angle));
  tipDot.setAttribute('cy', 230 + 190 * Math.sin(angle));

  if (progress < 1) {
    rafId = requestAnimationFrame(animate);
  }
}

function startRingAnimation() {
  if (rafId) cancelAnimationFrame(rafId);
  resetRing();
  setTimeout(() => {
    rafId = requestAnimationFrame(animate);
  }, 300);
}

const ringObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {

      // OPTION A: play once ever — remove this block to use Option B
      if (!hasAnimated) {
        hasAnimated = true;
        startRingAnimation();
      }

      // OPTION B: replay every time it enters view
      // Uncomment below and delete the Option A block above
      // startRingAnimation();

    } else {
      // cancel if user scrolls away mid-animation
      if (rafId) cancelAnimationFrame(rafId);
    }
  });
}, { threshold: 0.4 });

ringObserver.observe(document.getElementById('ringsvg'));

const points = document.querySelectorAll(".point");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    }
  });
}, {
  threshold: 0.5
});

points.forEach(point => {
  observer.observe(point);
});

(function () {

  const CARDS = [
    {
      phase: "Phase I", index: "01",
      title: "The Existential Axiom",
      blocks: [
        { label: "Doctrine", text: "Organizational latency is the enemy. We enforce a state of existence known as the <strong>Perpetually Adaptive Enterprise</strong>." },
        { label: "Mechanism", text: "Through algorithmic governance, we eliminate the lag between market signal and operational response. Your enterprise does not react — it <strong>anticipates</strong>." },
        { label: "Post-Vendor Paradigm", text: "We do not 'support' your business. We become the <strong>substrate upon which it runs</strong> — from the physical keyboard to the neural core of the ERP." },
      ],
    },
    {
      phase: "Phase II", index: "02",
      title: "The Integrated GBS Singularity",
      blocks: [
        { label: "Total Asset Custody", text: "<strong>You own nothing; you execute everything.</strong> Absolute custodial responsibility — Layer 0 physical through Layer 7 cognitive core." },
        { label: "Network Substrate", text: "We manage the 5G and Edge Computing fabric within our <strong>Sovereign Cloud</strong> environment." },
        { label: "HITL Workforce", text: "Certified <strong>HITL Units</strong> operate your ERP from the first keystroke to the final ledger reconciliation." },
      ],
    },
    {
      phase: "Phase III", index: "03",
      title: "Zero-CapEx Fiscal Instrument",
      blocks: [
        { label: "The Protocol", text: "The <strong>Unified OPEX Amortization Protocol</strong> — a sophisticated financial derivative bundling four disparate costs." },
        { label: "The Bundle", text: "Hardware · Software · Cloud · <strong>Human Capital</strong> — one predictable monthly fiscal instrument." },
        { label: "Outcome", text: "Billing elevated to <strong>sovereign debt management</strong> — stabilizing your balance sheet indefinitely." },
      ],
    },
    {
      phase: "Phase IV", index: "04",
      title: "The Cognitive Cybernetics Matrix",
      blocks: [
        { label: "Sovereign GenAI", text: "<strong>TCS AI WisdomNext™</strong> orchestrates disparate GenAI models into a unified cognitive engine with federated hallucination defenses." },
        { label: "HAPE Protocol", text: "Inanimate workflows transmuted into <strong>self-correcting autonomous agents</strong> — manual intervention rendered obsolete." },
        { label: "Predictive Clairvoyance", text: "We do not analyze the past — we <strong>calculate the future</strong>." },
      ],
    },
    {
      phase: "Phase V", index: "05",
      title: "Omni-Cloud Orchestration",
      blocks: [
        { label: "Migration", text: "Legacy monoliths migrated onto a <strong>distributed Multi-Cloud topology</strong> spanning AWS, Azure, and Google Cloud." },
        { label: "Resilience", text: "Infrastructure that is <strong>infinitely scalable</strong> and immune to localized hardware failure." },
      ],
    },
    {
      phase: "Phase VI", index: "06",
      title: "Fortress-Level Cyber-Resilience",
      blocks: [
        { label: "Zero Trust Posture", text: "<strong>Zero Trust</strong> security doctrine nullifying state-sponsored and asymmetric threats." },
        { label: "4 Critical Actions", text: "Continuous monitoring of <strong>digital risk vectors</strong> — insulating assets from systemic volatility." },
      ],
    },
    {
      phase: "Phase VII", index: "07",
      title: "Digital-Physical Convergence",
      blocks: [
        { label: "Digital Twindex", text: "<strong>Digital Twin Technology</strong> creates a high-fidelity mirror world resolving supply chain entropy before physical manifestation." },
        { label: "Deep Tech R&D", text: "IIT-Bombay Quantum Diamond Microchip · Autonomous Driving · <strong>Scale Engineering</strong> that borders on science fiction." },
      ],
    },
    {
      phase: "Phase VIII", index: "08",
      title: "Financial Ecosystem Hegemony",
      blocks: [
        { label: "BaNCS Neural Network", text: "<strong>TCS BaNCS</strong> rewires the nervous system of global finance — Core Banking across 120+ countries." },
        { label: "Immutable Ledgers", text: "<strong>Quartz Blockchain</strong> ensures immutable ledger integrity for all sovereign debt and asset transfers." },
      ],
    },
    {
      phase: "Phase IX", index: "09",
      title: "Bio-Computational Life Sciences",
      blocks: [
        { label: "Algorithmic Drug Discovery", text: "AI Solutions <strong>compress research timelines by orders of magnitude</strong> — molecule to market." },
        { label: "Regulatory Compliance", text: "Clinical Data Management with strict adherence to <strong>global regulatory frameworks</strong>." },
      ],
    },
    {
      phase: "Phase X", index: "10",
      title: "The Psychology of Commerce",
      blocks: [
        { label: "Omnichannel Hegemony", text: "<strong>TCS OmniStore + TCS Optumera</strong> — unified retail that eliminates friction across every touchpoint." },
        { label: "Neurological Marketing", text: "Consumer desire engineered <strong>at the neurological level</strong> via the Psychology of Commerce methodology." },
      ],
    },
    {
      phase: "Phase XI", index: "11",
      title: "The Post-Human Workforce",
      blocks: [
        { label: "Knowledge Ecosystem", text: "Not an employer — a <strong>Global Knowledge Ecosystem</strong> acquiring individuals capable of surviving High-Performance Culture." },
        { label: "Inclusion Algorithm", text: "Diversity managed with the precision of code. <strong>40% women workforce participation — non-negotiable.</strong>" },
        { label: "Learning Reinvented", text: "Continuous development ensuring relevance <strong>in an era of machine dominance</strong>." },
      ],
    },
  ];

  const total = CARDS.length;
  const wrap      = document.getElementById('tlWrap');
  const circuit   = document.getElementById('tlCircuit');
  const svg       = document.getElementById('tlSVG');
  const nodesEl   = document.getElementById('tlNodes');
  const cardZone  = document.getElementById('tlCardZone');

  // ── BUILD CIRCUIT SVG (horizontal line + branch drops) ──
  const NODE_Y = 60; // vertical center of nodes within 120px svg height

  function buildCircuit() {
    const W = circuit.offsetWidth;
    const nodePositions = CARDS.map((_, i) =>
      i === 0 ? 0 : i === total - 1 ? W : Math.round(W * (i / (total - 1)))
    );

    svg.setAttribute('viewBox', `0 0 ${W} 120`);

    // base line (dim)
    const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    baseLine.setAttribute('x1', '0');
    baseLine.setAttribute('y1', NODE_Y);
    baseLine.setAttribute('x2', W);
    baseLine.setAttribute('y2', NODE_Y);
    baseLine.setAttribute('stroke', 'rgba(200,50,30,0.12)');
    baseLine.setAttribute('stroke-width', '1');
    svg.appendChild(baseLine);

    // fire fill line (animates via JS)
    const fireLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    fireLine.setAttribute('id', 'tlFireLine');
    fireLine.setAttribute('x1', '0');
    fireLine.setAttribute('y1', NODE_Y);
    fireLine.setAttribute('x2', '0');
    fireLine.setAttribute('y2', NODE_Y);
    fireLine.setAttribute('stroke', 'url(#fireGrad)');
    fireLine.setAttribute('stroke-width', '1.5');
    svg.appendChild(fireLine);

    // gradient def
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#8b0000"/>
        <stop offset="60%"  stop-color="#c0392b"/>
        <stop offset="85%"  stop-color="#ff6b35"/>
        <stop offset="100%" stop-color="#ffd700"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.insertBefore(defs, svg.firstChild);

    // glow line on top
    const glowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    glowLine.setAttribute('id', 'tlGlowLine');
    glowLine.setAttribute('x1', '0');
    glowLine.setAttribute('y1', NODE_Y);
    glowLine.setAttribute('x2', '0');
    glowLine.setAttribute('y2', NODE_Y);
    glowLine.setAttribute('stroke', 'rgba(255,120,50,0.5)');
    glowLine.setAttribute('stroke-width', '4');
    glowLine.setAttribute('filter', 'url(#glow)');
    svg.appendChild(glowLine);

    // ember dot
    const emberCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    emberCircle.setAttribute('id', 'tlEmberDot');
    emberCircle.setAttribute('cy', NODE_Y);
    emberCircle.setAttribute('cx', '0');
    emberCircle.setAttribute('r', '5');
    emberCircle.setAttribute('fill', '#ffd700');
    emberCircle.setAttribute('filter', 'url(#glow)');
    svg.appendChild(emberCircle);

    // particles container
    const particleG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    particleG.setAttribute('id', 'tlSVGParticles');
    svg.appendChild(particleG);

    return nodePositions;
  }

  // ── BUILD NODES ──
  function buildNodes(nodePositions) {
    nodePositions.forEach((x, i) => {
      const node = document.createElement('div');
      node.className = 'sec-2__node';
      node.style.left = x + 'px';
      node.style.top = NODE_Y + 'px';
      node.dataset.index = i;
      node.innerHTML = `
        <div class="sec-2__node-ring">
          <div class="sec-2__node-core"></div>
          <div class="sec-2__node-pulse"></div>
        </div>
        <div class="sec-2__node-label">${CARDS[i].phase}</div>`;
      nodesEl.appendChild(node);
    });
    return Array.from(nodesEl.querySelectorAll('.sec-2__node'));
  }

  // ── BUILD CARDS ──
  function buildCards(nodePositions) {
    const W = circuit.offsetWidth;
    const cardW = 560;

    CARDS.forEach((card, i) => {
      const blocksHTML = card.blocks.map(b => `
        <div class="sec-2__card-block">
          <p class="sec-2__card-block-label">${b.label}</p>
          <p class="sec-2__card-block-text">${b.text}</p>
        </div>`).join('');

      const el = document.createElement('div');
      el.className = 'sec-2__tron-card';
      el.dataset.index = i;

      // horizontal position: center under node, clamped
      const nodeX = nodePositions[i];
      let left = nodeX - cardW / 2;
      left = Math.max(0, Math.min(left, W - cardW));
      el.style.left = left + 'px';

      // connector offset from card-left to node-x
      const connX = nodeX - left;

      el.innerHTML = `
        <div class="sec-2__connector" style="left:${connX}px;"></div>
        <div class="sec-2__tron-card-inner">
          <div class="sec-2__card-corner"></div>
          <div class="sec-2__card-phase-bar">
            <span class="sec-2__card-phase-tag">${card.phase}</span>
            <span class="sec-2__card-num">${card.index} / 11</span>
          </div>
          <div class="sec-2__card-title-block">
            <h3 class="sec-2__card-title">${card.title}</h3>
          </div>
          <div class="sec-2__card-content">${blocksHTML}</div>
        </div>`;

      cardZone.appendChild(el);
    });

    return Array.from(cardZone.querySelectorAll('.sec-2__tron-card'));
  }

  // ── PROGRESS DOTS ──
  function buildProgress() {
    const bar = document.createElement('div');
    bar.className = 'sec-2__progress';
    CARDS.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'sec-2__progress-dot';
      d.dataset.index = i;
      bar.appendChild(d);
    });
    wrap.querySelector('.sec-2__sticky').appendChild(bar);
    return Array.from(bar.querySelectorAll('.sec-2__progress-dot'));
  }

  // ── SVG PARTICLES ──
  let lastParticlePct = -1;
  function spawnSVGParticle(x) {
    const g = document.getElementById('tlSVGParticles');
    if (!g) return;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const size = 1.5 + Math.random() * 2.5;
    const ox   = (Math.random() - 0.5) * 10;
    const oy   = (Math.random() - 0.5) * 14;
    const dur  = 300 + Math.random() * 300;
    const cols = ['#ff4500','#ff7700','#ffd700','#ff3300','#ffaa00'];
    c.setAttribute('cx', x + ox);
    c.setAttribute('cy', NODE_Y + oy);
    c.setAttribute('r', size);
    c.setAttribute('fill', cols[Math.floor(Math.random() * cols.length)]);
    c.style.opacity = '0.9';
    c.style.transition = `opacity ${dur}ms, transform ${dur}ms`;
    g.appendChild(c);
    requestAnimationFrame(() => {
      c.style.opacity = '0';
      c.setAttribute('cy', NODE_Y + oy - 12);
    });
    setTimeout(() => c.remove(), dur);
  }

  // ── INIT ──
  let nodePositions, nodeEls, cardEls, progressDots;
  let fireLine, glowLine, emberDot;

  function init() {
    svg.innerHTML = '';
    nodesEl.innerHTML = '';
    cardZone.innerHTML = '';

    nodePositions = buildCircuit();
    nodeEls       = buildNodes(nodePositions);
    cardEls       = buildCards(nodePositions);
    progressDots  = buildProgress();

    fireLine  = document.getElementById('tlFireLine');
    glowLine  = document.getElementById('tlGlowLine');
    emberDot  = document.getElementById('tlEmberDot');
  }

  init();
  window.addEventListener('resize', () => { init(); onScroll(); });

  // ── SCROLL LOGIC ──
  function onScroll() {
    const rect     = wrap.getBoundingClientRect();
    const total_h  = wrap.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / total_h, 0), 1);
    const W        = circuit.offsetWidth;
    const fireX    = progress * W;

    // update fire line
    if (fireLine) {
      fireLine.setAttribute('x2', fireX);
      glowLine.setAttribute('x2', Math.max(0, fireX - 10));
      emberDot.setAttribute('cx', fireX);
    }

    // particles
    if (Math.abs(fireX - lastParticlePct) > 3) {
      spawnSVGParticle(fireX);
      lastParticlePct = fireX;
    }

    // node / card / dot states
    nodePositions.forEach((nodeX, i) => {
      const reached  = fireX >= nodeX - 2;
      const nextX    = i < nodePositions.length - 1 ? nodePositions[i + 1] : W + 1;
      const isActive = reached && fireX < nextX;

      nodeEls[i].classList.toggle('lit', reached);
      cardEls[i].classList.toggle('active', isActive);
      progressDots[i].classList.toggle('lit', reached);
      progressDots[i].classList.toggle('active', isActive);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();