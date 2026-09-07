// Hacking Hub Core Logic
// Initialization of Cyber Interface

// Honoured across the decorative motion on this page (network canvas, title
// scramble, auto-scrolling carousels) so the site is comfortable for visitors
// who ask their OS to reduce motion — and lighter on phone batteries when the
// setting is on. Read live (matchMedia) rather than cached so a mid-session
// change is picked up on the next check.
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
function prefersReducedMotion() {
    return reduceMotionQuery.matches;
}

// Coarse pointer + narrow viewport ~= phone. Used to dial the network canvas
// down rather than off.
function isHandset() {
    return window.matchMedia('(max-width: 768px)').matches;
}

document.addEventListener('DOMContentLoaded', () => {
    initNetworkCanvas();
    initTypewriter();
    initCarousels();
    initScrollReveal();
    initEventsFeed();
});

/* -------------------------------------------------------------------------- */
/*                              Auto-Scroll Carousels                          */
/* -------------------------------------------------------------------------- */

function initCarousels() {
    initAutoCarousel('reviews-carousel', 'prev-review', 'next-review', '.review-card');
    initAutoCarousel('videos-carousel', 'prev-video', 'next-video', '.video-card');
    initAutoCarousel('impact-carousel', 'prev-impact', 'next-impact', '.impact-card');
    initAutoCarousel('roadmap-carousel', 'prev-roadmap', 'next-roadmap', '.roadmap-card');
}

function initAutoCarousel(carouselId, prevBtnId, nextBtnId, itemSelector) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);

    // Reduced-motion: leave the track as-is (no clones, no auto-scroll). Native
    // horizontal scroll + the prev/next buttons still give full access to every
    // card; scroll-snap stays on so it lands cleanly.
    if (prefersReducedMotion()) {
        const step = () => {
            const item = carousel.querySelector(itemSelector);
            return item ? item.offsetWidth + 30 : 400;
        };
        nextBtn?.addEventListener('click', () => carousel.scrollBy({ left: step(), behavior: 'smooth' }));
        prevBtn?.addEventListener('click', () => carousel.scrollBy({ left: -step(), behavior: 'smooth' }));
        return;
    }

    // Clone original children DOM nodes cleanly for infinite loop
    const originalCards = Array.from(carousel.children);
    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        carousel.appendChild(clone);
    });

    // SCROLL SETTINGS
    const scrollSpeed = 0.5; // Pixels per frame
    let isPaused = false;

    // Disable scroll snap for smooth auto-scrolling
    carousel.style.scrollSnapType = 'none';
    carousel.style.scrollBehavior = 'auto';

    // BUTTON LISTENERS
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const item = carousel.querySelector(itemSelector);
            const scrollAmount = item ? item.offsetWidth + 30 : 400;
            carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
        nextBtn.addEventListener('mouseenter', () => isPaused = true);
        nextBtn.addEventListener('mouseleave', () => isPaused = false);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const item = carousel.querySelector(itemSelector);
            const scrollAmount = item ? item.offsetWidth + 30 : 400;
            carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        prevBtn.addEventListener('mouseenter', () => isPaused = true);
        prevBtn.addEventListener('mouseleave', () => isPaused = false);
    }

    // PAUSE ON HOVER
    carousel.addEventListener('mouseenter', () => isPaused = true);
    carousel.addEventListener('mouseleave', () => isPaused = false);

    // ANIMATION LOOP
    function startAutoScroll() {
        if (!isPaused) {
            carousel.scrollLeft += scrollSpeed;
            if (carousel.scrollLeft >= carousel.scrollWidth / 2) {
                carousel.scrollLeft = 0;
            }
        }
        requestAnimationFrame(startAutoScroll);
    }

    startAutoScroll();
}

/* -------------------------------------------------------------------------- */
/*                               Network Canvas                               */
/* -------------------------------------------------------------------------- */

function initNetworkCanvas() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    // Purely decorative — skip the whole animation loop when motion is to be
    // reduced. The hero still has its background colour and grid.
    if (prefersReducedMotion()) {
        canvas.remove();
        return;
    }

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuration — lighter on phones (fewer nodes, shorter link radius) so
    // the O(n^2) per-frame pass doesn't chew battery or drop frames.
    const handset = isHandset();
    const particleCount = handset ? 28 : 60;
    const connectionDistance = handset ? 110 : 150;
    const particleSpeed = 0.5;

    function resize() {
        // Only the width matters here: on mobile, scrolling shows/hides the
        // address bar, which fires 'resize' with a new height every time. Re-
        // sizing the canvas on that is pointless churn (and resets the frame),
        // so ignore height-only changes and react to real width changes.
        const newWidth = window.innerWidth;
        if (newWidth === width) return;
        width = canvas.width = newWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * particleSpeed;
            this.vy = (Math.random() - 0.5) * particleSpeed;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.fillStyle = 'rgba(14, 215, 181, 0.5)'; // Cyan
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Draw connections
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(14, 215, 181, ${1 - distance / connectionDistance})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    initParticles();
    animate();
}

/* -------------------------------------------------------------------------- */
/*                              Typewriter Effect                             */
/* -------------------------------------------------------------------------- */

function initTypewriter() {
    const elements = document.querySelectorAll('.glitch-text');

    // Reduced motion: skip the scramble, just show the final headline. The
    // markup already contains the styled final text, so leave it untouched.
    if (prefersReducedMotion()) return;

    elements.forEach(el => {
        const text = el.getAttribute('data-text');

        let iteration = 0;
        const interval = setInterval(() => {
            el.innerText = text
                .split("")
                .map((letter, index) => {
                    if (index < iteration) {
                        return text[index];
                    }
                    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)];
                })
                .join("");

            if (iteration >= text.length) {
                clearInterval(interval);
                if (el.children.length > 0) {
                    el.innerHTML = el.getAttribute('data-original-html') || el.innerHTML;
                }
            }

            iteration += 1 / 3;
        }, 30);
    });
}

/* -------------------------------------------------------------------------- */
/*                               Scroll Reveal                                */
/* -------------------------------------------------------------------------- */

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Trigger specific card animations
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll('.cyber-card, .reviews-carousel-wrapper, .videos-carousel-wrapper, .impact-carousel-wrapper, .roadmap-carousel-wrapper, .section-title, .split-layout').forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

/* -------------------------------------------------------------------------- */
/*                          Community Events Feed                             */
/* -------------------------------------------------------------------------- */

// Public anon key - safe to ship in client JS by design. RLS/the RPC body
// (get_public_community_events, admin dashboard supabase/052_public_events.sql)
// is the actual security boundary here, not secrecy of this key - same key
// class the admin dashboard itself ships client-side as VITE_SUPABASE_ANON_KEY.
const SUPABASE_URL = 'https://kveiflphktpvsddhkspz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWlmbHBoa3RwdnNkZGhrc3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTUzODEsImV4cCI6MjEwMTY3MTM4MX0.IdD6sh921RKRKwBN-5ZtmaHs4dIDTq75z2iNaIkHMjs';

const EVENT_BADGE_CLASS = {
    'HH Meetup': 'badge-lime',
    'Industry Event': 'badge-cyan',
    'Sunday Catchup': 'badge-purple',
    'Study Session': 'badge-red',
};

async function initEventsFeed() {
    const statusEl = document.getElementById('events-status');
    const wrapperEl = document.getElementById('events-carousel-wrapper');
    const trackEl = document.getElementById('events-carousel');
    if (!statusEl || !wrapperEl || !trackEl) return;

    // Delegated once, up front - card markup gets replaced wholesale on every
    // fetch below (and initAutoCarousel further clones it for the infinite
    // loop), so per-card listeners would be lost each time.
    trackEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.event-desc-toggle');
        if (!btn) return;
        const wrap = btn.closest('.event-desc-wrap');
        const expanded = wrap.classList.toggle('is-expanded');
        btn.textContent = expanded ? 'READ_LESS' : 'READ_MORE';
    });

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_community_events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ p_upcoming_only: true }),
        });

        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const events = await res.json();

        if (!events.length) {
            statusEl.textContent = 'No upcoming events right now — check back soon.';
            return;
        }

        trackEl.innerHTML = events.map(renderEventCard).join('');
        statusEl.hidden = true;
        wrapperEl.hidden = false;

        // Only reveal READ_MORE on cards whose description actually overflows
        // the clamp - a short blurb that already fits gets no dead-end button.
        trackEl.querySelectorAll('.event-desc-wrap').forEach((wrap) => {
            const desc = wrap.querySelector('.event-desc');
            if (desc.scrollHeight > desc.clientHeight + 1) {
                wrap.querySelector('.event-desc-toggle').hidden = false;
            }
        });

        // Events are fetched async, unlike every other carousel's hardcoded
        // HTML - initAutoCarousel has to run after insertion (so it has real
        // cards to clone for the loop), not from the synchronous
        // initCarousels() at page load, or it would clone zero children and
        // auto-scroll an empty track.
        initAutoCarousel('events-carousel', 'prev-event', 'next-event', '.event-card');
    } catch (err) {
        console.error('Failed to load community events:', err);
        statusEl.textContent = "Couldn't load events right now — please try again later.";
        statusEl.classList.add('is-error');
    }
}

function renderEventCard(event) {
    const badgeClass = EVENT_BADGE_CLASS[event.type] || 'badge-cyan';
    const dateLabel = formatEventDate(event.date);
    const timeLabel = event.time ? ` &bull; ${escapeHtml(event.time)}` : '';
    const rsvpLabel = event.rsvp_count > 0
        ? `<p class="event-meta"><i class="fa-solid fa-users text-cyan"></i> ${event.rsvp_count} attending</p>`
        : '';
    const linkHtml = event.link
        ? `<a href="${escapeAttr(event.link)}" target="_blank" rel="noopener noreferrer" class="event-link">
               <i class="fa-solid fa-arrow-up-right-from-square"></i> EVENT_DETAILS
           </a>`
        : '';
    // Clamped by default (CSS) so every card starts at the same height
    // regardless of description length; the toggle button starts hidden and
    // is only revealed post-render, for descriptions that actually overflow.
    const descHtml = event.description
        ? `<div class="event-desc-wrap">
               <p class="event-desc">${escapeHtml(event.description)}</p>
               <button type="button" class="event-desc-toggle" hidden>READ_MORE</button>
           </div>`
        : '';

    return `
        <div class="cyber-card event-card hover-glow">
            <div class="roadmap-badge ${badgeClass}">${escapeHtml(event.type)}</div>
            <h3>${escapeHtml(event.title)}</h3>
            <p class="event-meta"><i class="fa-solid fa-calendar-days text-cyan"></i> ${dateLabel}${timeLabel}</p>
            ${event.location ? `<p class="event-meta"><i class="fa-solid fa-location-dot text-cyan"></i> ${escapeHtml(event.location)}</p>` : ''}
            ${rsvpLabel}
            ${descHtml}
            ${linkHtml}
        </div>
    `;
}

function formatEventDate(isoDate) {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(str) {
    return escapeHtml(str);
}
