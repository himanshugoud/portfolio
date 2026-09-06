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
// Scroll reveal — GSAP for the actual tween (better easing than
// a flat CSS transition), triggered by IntersectionObserver
// rather than GSAP's own ScrollTrigger. ScrollTrigger caches
// scroll-position math on load, which produced a real bug here:
// jumping straight to a section (nav click, back-forward cache,
// etc.) instead of scrolling through it left elements stuck at
// opacity 0 because its cached trigger point never fired.
// IntersectionObserver has none of that — it just reports what's
// actually on screen — so it's the more reliable trigger here.
// ============================================================
function setupScrollReveal() {
    if (prefersReducedMotion) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
        return;
    }
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
        return;
    }

    const useGsap = typeof gsap !== 'undefined';
    const groupSelector = '.work2-grid, .log2-list, .about2-stack';
    const groupParents = new Set(document.querySelectorAll(groupSelector));

    function animateIn(el) {
        el.classList.add('is-visible'); // CSS safety net if GSAP is ever unavailable
        if (useGsap) {
            gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        }
    }

    function animateGroupIn(parent) {
        parent.classList.add('is-visible'); // in case the parent itself also carries .reveal
        const items = Array.from(parent.children);
        items.forEach(i => i.classList.add('is-visible'));
        if (useGsap) {
            gsap.fromTo(items, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1 });
        }
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (groupParents.has(el)) animateGroupIn(el);
            else animateIn(el);
            obs.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal:not(.work2-card)').forEach(el => observer.observe(el));
    groupParents.forEach(parent => observer.observe(parent));
}

// ============================================================
// Hero entrance — the name splits in from either side, the photo
// scales in, and the rest cascades up. Closer to the reference's
// motion feel than a flat fade. Runs once, on load.
// ============================================================
function setupHeroIntro() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    const outline = document.querySelector('.name-outline');
    const solid = document.querySelector('.name-solid');
    const photo = document.querySelector('.hero2-photo');
    const left = document.querySelector('.hero2-left');
    const social = document.querySelector('.hero2-social');
    const stats = document.querySelector('.hero2-stats');
    if (!outline || !solid) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(outline, { opacity: 0, x: -50, duration: 0.7 })
      .from(solid, { opacity: 0, x: 50, duration: 0.7 }, '<')
      .from(photo, { opacity: 0, scale: 0.85, duration: 0.6, ease: 'back.out(1.6)' }, '-=0.35')
      .from([left, social], { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 }, '-=0.25')
      .from(stats, { opacity: 0, y: 20, duration: 0.5 }, '-=0.2');
}

// ============================================================
// Work filter tabs — All / Backend / Realtime. Each project is
// tagged with its real standout characteristic (see data-category
// in the HTML) rather than an invented "Exploration" category
// that wouldn't be true of either project.
// ============================================================
function setupWorkFilters() {
    const tabs = document.querySelectorAll('.work2-filter');
    const cards = document.querySelectorAll('.work2-card');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.filter;

            tabs.forEach(t => {
                t.classList.toggle('is-active', t === tab);
                t.setAttribute('aria-selected', String(t === tab));
            });

            cards.forEach(card => {
                const matches = filter === 'all' || card.dataset.category === filter;
                if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
                    if (matches) {
                        card.classList.remove('is-filtered-out');
                        gsap.fromTo(card, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35 });
                    } else {
                        gsap.to(card, { opacity: 0, y: 10, duration: 0.2, onComplete: () => card.classList.add('is-filtered-out') });
                    }
                } else {
                    card.classList.toggle('is-filtered-out', !matches);
                }
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    animateStats();
    setupHeroIntro();
    setupScrollReveal();
    setupReticle();
    setupLightbox();
    setupMobileNav();
    setupWorkFilters();
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
