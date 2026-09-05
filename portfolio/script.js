// ============================================================
// Respect reduced-motion: skip both effects entirely if set.
// ============================================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================
// Hero stat count-up — the single orchestrated load animation.
// Runs once, on load, never re-triggers.
// ============================================================
function animateStats() {
    const stats = document.querySelectorAll('.stat-num');
    stats.forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        if (prefersReducedMotion || isNaN(target)) {
            el.textContent = target + suffix;
            return;
        }
        const duration = 900;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

// ============================================================
// Project panel tilt + glow — the pointer-reactive "3D" moment.
// Only runs on devices with a real mouse (not touch), and only
// while the pointer is actually over a given panel.
// ============================================================
function setupPanelTilt() {
    if (prefersReducedMotion) return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    document.querySelectorAll('.panel[data-tilt]').forEach(panel => {
        const media = panel.querySelector('.panel-media');
        const body = panel.querySelector('.panel-body');
        const glow = panel.querySelector('.panel-glow');

        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;

            const maxTilt = 2.5; // degrees — kept subtle, tactile rather than gimmicky
            const rx = (px - 0.5) * maxTilt * 2;
            const ry = (py - 0.5) * -maxTilt * 2;

            [media, body].forEach(el => {
                if (!el) return;
                el.style.setProperty('--rx', `${rx}deg`);
                el.style.setProperty('--ry', `${ry}deg`);
            });

            if (glow) {
                glow.style.setProperty('--gx', `${px * 100}%`);
                glow.style.setProperty('--gy', `${py * 100}%`);
            }
        });

        panel.addEventListener('mouseleave', () => {
            [media, body].forEach(el => {
                if (!el) return;
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
            });
        });
    });
}

// ============================================================
// Scroll reveal — watches .reveal elements and adds .is-visible
// once they enter the viewport. (Bug fix: this observer was
// missing entirely, so .reveal content — including the new
// Work cards — never appeared unless reduced-motion was on.)
// ============================================================
function setupRevealObserver() {
    const revealEls = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(el => el.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    animateStats();
    setupPanelTilt();
    setupRevealObserver();
});
