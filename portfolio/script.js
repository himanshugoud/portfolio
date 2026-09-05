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

// (Old pointer-tilt effect for the dark project panels lived here —
// removed since Day 2 replaced those panels with the .work2-card
// grid. Keeping the function around no-oped silently since its
// .panel[data-tilt] selector matches nothing anymore.)


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
    setupRevealObserver();
    setupReticle();
});

// ============================================================
// Custom cursor reticle — follows the pointer and expands over
// clickable elements. Was markup-only before (no JS drove it),
// so it never appeared; wiring it up here.
// ============================================================
function setupReticle() {
    const reticle = document.getElementById('reticle');
    if (!reticle || prefersReducedMotion || window.matchMedia('(hover: none), (pointer: coarse)').matches) {
        return;
    }
    let active = false;
    window.addEventListener('mousemove', (e) => {
        if (!active) {
            active = true;
            reticle.classList.add('is-active');
        }
        reticle.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    });
    const hoverables = document.querySelectorAll('a, button, .work2-card, [role="button"]');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => reticle.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => reticle.classList.remove('is-hover'));
    });
    window.addEventListener('mouseleave', () => reticle.classList.remove('is-active'));
}
