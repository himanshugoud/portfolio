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
    setupLightbox();
    setupMobileNav();
});

// ============================================================
// Mobile nav toggle (Day 11) — .nav2-links has no equivalent
// below 900px, so this dropdown is the only way to reach
// Work/Log/About/Contact from the nav on a phone.
// ============================================================
function setupMobileNav() {
    const toggle = document.getElementById('navToggle');
    const panel = document.getElementById('navMobilePanel');
    if (!toggle || !panel) return;

    function setOpen(open) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        panel.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', () => {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after picking a link, and on Escape
    panel.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            toggle.focus();
        }
    });

    // Collapse automatically if the viewport grows past the
    // mobile breakpoint (e.g. rotating a tablet to landscape)
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
        if (e.matches) setOpen(false);
    });
}

// ============================================================
// Work gallery lightbox (Day 8) — opens the screenshot set for
// a project when its card image or a thumbnail is clicked.
// Supports Esc / arrow keys / backdrop click.
// ============================================================
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const imgEl = document.getElementById('lightboxImg');
    const captionEl = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    let images = [];
    let captions = [];
    let title = '';
    let index = 0;
    let lastFocused = null;

    function render() {
        imgEl.src = images[index];
        imgEl.alt = `${title} screenshot ${index + 1} of ${images.length}`;
        captionEl.textContent = captions[index] || `${title} — ${index + 1} / ${images.length}`;
    }

    function open(gallerySrc, galleryTitle, galleryCaptions, startIndex) {
        images = gallerySrc.split(',').map(s => s.trim()).filter(Boolean);
        captions = (galleryCaptions || '').split(',').map(s => s.trim());
        title = galleryTitle || '';
        index = startIndex || 0;
        lastFocused = document.activeElement;
        render();
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
        document.body.style.overflow = 'hidden';
    }

    function close() {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    }

    function step(delta) {
        index = (index + delta + images.length) % images.length;
        render();
    }

    document.querySelectorAll('[data-gallery]').forEach(card => {
        card.addEventListener('click', () => {
            open(card.dataset.gallery, card.dataset.galleryTitle, card.dataset.galleryCaptions, 0);
        });
    });

    document.querySelectorAll('[data-gallery-index]').forEach(thumb => {
        const card = thumb.closest('.work2-card')?.querySelector('[data-gallery]');
        if (!card) return;
        thumb.addEventListener('click', () => {
            open(card.dataset.gallery, card.dataset.galleryTitle, card.dataset.galleryCaptions, Number(thumb.dataset.galleryIndex));
        });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });
}

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
