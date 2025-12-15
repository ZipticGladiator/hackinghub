// Hacking Hub Core Logic
// Initialization of Cyber Interface

document.addEventListener('DOMContentLoaded', () => {
    initNetworkCanvas();
    initTypewriter();
    initScrollReveal();
    initCarousel();
});

/* -------------------------------------------------------------------------- */
/*                               Reviews Carousel                             */
/* -------------------------------------------------------------------------- */

function initCarousel() {
    const carousel = document.getElementById('reviews-carousel');
    const prevBtn = document.getElementById('prev-review');
    const nextBtn = document.getElementById('next-review');

    if (!carousel || !prevBtn || !nextBtn) return;

    nextBtn.addEventListener('click', () => {
        const card = carousel.querySelector('.review-card');
        const scrollAmount = card ? card.offsetWidth + 30 : 400; // Width + Gap (30px from CSS)
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
        const card = carousel.querySelector('.review-card');
        const scrollAmount = card ? card.offsetWidth + 30 : 400;
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    // Auto-scroll optional:
    // setInterval(() => {
    //     if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
    //         carousel.scrollTo({ left: 0, behavior: 'smooth' });
    //     } else {
    //         carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    //     }
    // }, 5000);
}

/* -------------------------------------------------------------------------- */
/*                               Network Canvas                               */
/* -------------------------------------------------------------------------- */

function initNetworkCanvas() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuration
    const particleCount = 60;
    const connectionDistance = 150;
    const particleSpeed = 0.5;

    function resize() {
        width = canvas.width = window.innerWidth;
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

    elements.forEach(el => {
        const text = el.getAttribute('data-text');
        // Simple glitch effect already handled by CSS, 
        // but we could add random character cycling here if requested.

        // Let's add a random "decryption" effect on load
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
                // Retrigger HTML parsing for nested spans (like color spans)
                // This is a simplified "hacker" effect, might need refinement if HTML tags are involved in data-text
                // Since our HTML has spans inside H1, this overwrite isn't perfect for the structure.
                // Let's stick to a simpler logic or skip overwriting HTML structure.

                // Correction: The data-text usage in CSS often handles simple glitches. 
                // Let's revert the innerHTML to original after effect, or avoid overwriting if it has children.
                if (el.children.length > 0) {
                    // If element has children (like spans), don't mess with innerText too brutally.
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
    }, { threshold: 0.1 });

    document.querySelectorAll('.cyber-card, .section-title, .split-layout').forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}
