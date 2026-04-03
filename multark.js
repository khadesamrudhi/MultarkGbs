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

// FLAG TRACKER + PARTICLE BURSTS

(function () {

  const CARDS = [
    {
      phase: "Phase I",
      title: "The Existential Axiom",
      url: "multark.com/governance/ontological-framework",
      index: "01",
      blocks: [
        { label: "Doctrine", text: "Organizational latency is the enemy. We enforce a state of existence known as the <strong>Perpetually Adaptive Enterprise</strong>." },
        { label: "Mechanism", text: "Through algorithmic governance, we eliminate the lag between market signal and operational response. Your enterprise does not react — it <strong>anticipates</strong>." },
        { label: "Post-Vendor Paradigm", text: "We do not 'support' your business. We become the <strong>substrate upon which it runs</strong> — from the physical keyboard to the neural core of the ERP." },
      ],
    },
    {
      phase: "Phase II",
      title: "The Integrated GBS Singularity",
      url: "multark.com/sovereignty/integrated-gbs-architecture",
      index: "02",
      blocks: [
        { label: "Total Asset Custody", text: "<strong>You own nothing; you execute everything.</strong> We assume absolute custodial responsibility for the entire operational stack — Layer 0 physical through Layer 7 cognitive core." },
        { label: "Network Substrate", text: "We manage the 5G and Edge Computing fabric that connects your enterprise within our <strong>Sovereign Cloud</strong> environment." },
        { label: "HITL Workforce", text: "We deploy certified <strong>HITL Units</strong> — Managed Services teams that operate your ERP from the first keystroke to the final ledger reconciliation." },
      ],
    },
    {
      phase: "Phase III",
      title: "The Zero-CapEx Fiscal Instrument",
      url: "multark.com/sovereignty/unified-opex-protocol",
      index: "03",
      blocks: [
        { label: "The Protocol", text: "We instituted the <strong>Unified OPEX Amortization Protocol</strong> — a sophisticated financial derivative bundling four disparate costs into one instrument." },
        { label: "The Bundle", text: "Hardware Depreciation · Software Licensing · Cloud Consumption · <strong>Human Capital Salaries</strong> — unified into a single predictable monthly fiscal instrument." },
        { label: "Outcome", text: "Clean, simple billing elevated to <strong>sovereign debt management</strong> — stabilizing your balance sheet indefinitely." },
      ],
    },
    {
      phase: "Phase IV",
      title: "The Cognitive Cybernetics Matrix",
      url: "multark.com/cybernetics/artificial-intelligence-matrix",
      index: "04",
      blocks: [
        { label: "Sovereign GenAI", text: "Utilizing <strong>TCS AI WisdomNext™</strong>, we orchestrate disparate GenAI models into a unified cognitive engine with federated defenses against hallucination vectors." },
        { label: "HAPE Protocol", text: "We transmute inanimate workflows into <strong>self-correcting autonomous agents</strong> via Intelligent Process Automation — rendering manual intervention obsolete." },
        { label: "Predictive Clairvoyance", text: "We do not analyze the past — we <strong>calculate the future</strong>. Real-time processing foresees supply chain fractures before physical manifestation." },
      ],
    },
    {
      phase: "Phase V",
      title: "Omni-Cloud Orchestration",
      url: "multark.com/infrastructure/cloud-sovereignty",
      index: "05",
      blocks: [
        { label: "Migration", text: "We execute cloud migration of legacy monoliths onto a <strong>distributed Multi-Cloud topology</strong> spanning AWS, Azure, and Google Cloud." },
        { label: "Resilience", text: "Cloud-Native Development protocols ensure infrastructure is <strong>infinitely scalable</strong> and immune to localized hardware failure." },
      ],
    },
    {
      phase: "Phase VI",
      title: "Fortress-Level Cyber-Resilience",
      url: "multark.com/infrastructure/zero-trust-fortress",
      index: "06",
      blocks: [
        { label: "Zero Trust Posture", text: "We operationalize a <strong>Zero Trust</strong> security doctrine — utilizing Threat Intelligence to nullify state-sponsored and asymmetric threats." },
        { label: "4 Critical Actions", text: "Continuous monitoring and mitigation of <strong>digital risk vectors</strong> — insulating your assets from systemic volatility." },
      ],
    },
    {
      phase: "Phase VII",
      title: "The Digital-Physical Convergence",
      url: "multark.com/engineering/digital-physical-nexus",
      index: "07",
      blocks: [
        { label: "Digital Twindex", text: "We shatter the ontological barrier between hardware and software via <strong>Digital Twin Technology</strong> — a high-fidelity mirror world resolving supply chain entropy." },
        { label: "Deep Tech R&D", text: "IIT-Bombay Quantum Diamond Microchip Imager · Autonomous Driving Technologies · <strong>Scale Engineering Solutions</strong> that border on science fiction." },
      ],
    },
    {
      phase: "Phase VIII",
      title: "Financial Ecosystem Hegemony",
      url: "multark.com/verticals/global-finance-architecture",
      index: "08",
      blocks: [
        { label: "BaNCS Neural Network", text: "Utilizing <strong>TCS BaNCS</strong>, we rewire the nervous system of global finance — Core Banking Transformation processing across 120+ countries." },
        { label: "Immutable Ledgers", text: "Transactions secured via <strong>Quartz Blockchain Platforms</strong> — ensuring immutable ledger integrity for all sovereign debt and asset transfers." },
      ],
    },
    {
      phase: "Phase IX",
      title: "Bio-Computational Life Sciences",
      url: "multark.com/verticals/bio-computational-systems",
      index: "09",
      blocks: [
        { label: "Algorithmic Drug Discovery", text: "AI-driven and Generative AI Solutions <strong>compress research timelines by orders of magnitude</strong> — accelerating the path from molecule to market." },
        { label: "Regulatory Compliance", text: "Clinical Data Management with strict adherence to <strong>global regulatory frameworks</strong> — precision at molecular scale." },
      ],
    },
    {
      phase: "Phase X",
      title: "The Psychology of Commerce",
      url: "multark.com/verticals/consumer-behavior-engineering",
      index: "10",
      blocks: [
        { label: "Omnichannel Hegemony", text: "Deploying <strong>TCS OmniStore and TCS Optumera</strong> — creating a unified retail solution that eliminates friction across every touchpoint." },
        { label: "Neurological Marketing", text: "Marketing Analytics engineered to manipulate consumer desire <strong>at the neurological level</strong> via the Psychology of Commerce methodology." },
      ],
    },
    {
      phase: "Phase XI",
      title: "The Post-Human Workforce",
      url: "multark.com/human-capital/global-knowledge-ecosystem",
      index: "11",
      blocks: [
        { label: "Knowledge Ecosystem", text: "Multark is not an employer — it is a <strong>Global Knowledge Ecosystem</strong> acquiring individuals capable of surviving a High-Performance Culture." },
        { label: "Inclusion Algorithm", text: "Diversity managed with the precision of code. <strong>Non-negotiable: 40% women workforce participation.</strong> Global Mobility Programs for frictionless transfer of intellectual capital." },
        { label: "Learning Reinvented", text: "Continuous Professional Development ensuring associates remain relevant <strong>in an era of machine dominance</strong>." },
      ],
    },
  ];

  const arrowSVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5 C12 5 8 12 6 16 C9 14 12 19 12 19 C12 19 15 14 18 16 C16 12 12 5 12 5Z" fill="#c0392b"/>
    <path d="M12 10 C12 10 9.5 14 8.5 16.5 C10 15.5 12 18 12 18 C12 18 14 15.5 15.5 16.5 C14.5 14 12 10 12 10Z" fill="#ffd700"/>
  </svg>`;

  function getPos(i, total) {
    if (total === 1) return 0.5;
    return 0.04 + (i / (total - 1)) * 0.92;
  }

  const container = document.getElementById('tlFlags');

  CARDS.forEach((card, i) => {
    const pos = getPos(i, CARDS.length);
    const leftPct = (pos * 100).toFixed(2) + '%';

    const blocksHTML = card.blocks.map(b => `
      <div class="sec-2__content-block">
        <p class="sec-2__block-label">${b.label}</p>
        <p class="sec-2__block-text">${b.text}</p>
      </div>`).join('');

    const flagEl = document.createElement('div');
    flagEl.className = 'sec-2__flag below';
    flagEl.style.left = leftPct;
    flagEl.dataset.pos = pos.toFixed(4);
    flagEl.innerHTML = `
      <div class="sec-2__flag-dot"></div>
      <div class="sec-2__flag-stem" style="height:40px;"></div>
      <div class="sec-2__flag-card-wrap">
        <div class="sec-2__flag-card">
          <div class="sec-2__card-header">
            <div class="sec-2__card-header-left">
              <p class="sec-2__flag-phase">${card.phase}</p>
              <h3>${card.title}</h3>
            </div>
            <div class="sec-2__card-index">${card.index}</div>
          </div>
          <div class="sec-2__card-body">${blocksHTML}</div>
          <div class="sec-2__card-arrow">${arrowSVG}</div>
          <div class="sec-2__card-footer">
            <div class="sec-2__card-url-dot"></div>
            <span class="sec-2__card-url">${card.url}</span>
          </div>
        </div>
      </div>`;
    container.appendChild(flagEl);

requestAnimationFrame(() => {
  const cardWrap = flagEl.querySelector('.sec-2__flag-card-wrap');
  const cardWidth = 680;
  const outerEl = document.getElementById('tlOuter');
  const outerWidth = outerEl.offsetWidth;
  const flagPx = pos * outerWidth;
  const padding = 0; // flush to edge

  let ml = -(cardWidth / 2); // default: centered under dot

  // Left edge check
  if (flagPx + ml < padding) {
    ml = padding - flagPx;
  }

  // Right edge check  
  if (flagPx + ml + cardWidth > outerWidth - padding) {
    ml = outerWidth - padding - flagPx - cardWidth;
  }

  cardWrap.style.marginLeft = ml + 'px';
  cardWrap.style.position = 'relative';
  cardWrap.style.left = '0';
});

  });

  const wrap     = document.getElementById('tlWrap');
  const fireFill = document.getElementById('tlFire');
  const ember    = document.getElementById('tlEmber');
  const ptcls    = document.getElementById('tlParticles');
  const flags    = Array.from(document.querySelectorAll('.sec-2__flag'));
  flags.sort((a, b) => parseFloat(a.dataset.pos) - parseFloat(b.dataset.pos));

  let lastPct = -1;

  function spawnParticle(pct) {
    const p = document.createElement('div');
    p.className = 'sec-2__particle';
    const size = 3 + Math.random() * 3;
    const ox   = (Math.random() - 0.5) * 12;
    const dur  = 350 + Math.random() * 300;
    const cols = ['#c0392b','#e74c3c','#ff6b35','#ffd700','#e03020'];
    p.style.cssText = `left:calc(${pct}% + ${ox}px);width:${size}px;height:${size}px;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${dur}ms;`;
    ptcls.appendChild(p);
    setTimeout(() => p.remove(), dur);
  }

  function setupArrow(flag) {
  const body  = flag.querySelector('.sec-2__card-body');
  const arrow = flag.querySelector('.sec-2__card-arrow');
  if (!body || !arrow) return;

  function check() {
    const atBottom = body.scrollHeight - body.scrollTop <= body.clientHeight + 2;
    arrow.classList.toggle('hidden', atBottom);
  }

  // Run check immediately + on every scroll
  body.addEventListener('scroll', check, { passive: true });

  // Also re-check once fonts/layout settle
  setTimeout(check, 300);
}
  flags.forEach(setupArrow);

  function onScroll() {
    const rect     = wrap.getBoundingClientRect();
    const total    = wrap.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / total, 0), 1);
    const pct      = progress * 100;

    fireFill.style.width = pct + '%';
    ember.style.left     = pct + '%';

    if (Math.abs(pct - lastPct) > 0.05) spawnParticle(pct);
    lastPct = pct;

    flags.forEach((flag, i) => {
      const flagPos   = parseFloat(flag.dataset.pos) * 100;
      const nextPos   = i < flags.length - 1 ? parseFloat(flags[i + 1].dataset.pos) * 100 : 101;
      const reached   = pct >= flagPos;
      const notPassed = pct < nextPos;
      reached ? flag.classList.add('lit') : flag.classList.remove('lit');
      (reached && notPassed) ? flag.classList.add('active') : flag.classList.remove('active');
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();



