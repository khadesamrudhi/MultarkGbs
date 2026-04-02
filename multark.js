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

