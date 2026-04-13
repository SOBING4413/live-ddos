// Homepage JavaScript - Premium Animations and Interactions
document.addEventListener('DOMContentLoaded', function () {

  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      navbar.classList.toggle('scrolled', currentScroll > 40);
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ---- Mobile hamburger menu ----
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const spans = hamburger.querySelectorAll('span');
      if (navLinks.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // ---- Stat Counter Animation ----
  function animateCounter(el, target, duration) {
    const start = 0;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (target - start) * eased);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // Observe stat counters
  const statCounters = document.querySelectorAll('.stat-counter');
  if (statCounters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10);
          if (!isNaN(target)) {
            animateCounter(el, target, 1500);
          }
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statCounters.forEach(el => counterObserver.observe(el));
  }

  // ---- Scroll Animations (Intersection Observer) ----
  const animElements = document.querySelectorAll('.animate-on-scroll');
  if (animElements.length > 0) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    animElements.forEach((el, index) => {
      // Stagger delay based on position within parent grid
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll('.animate-on-scroll'));
        const siblingIndex = siblings.indexOf(el);
        if (siblingIndex >= 0) {
          el.style.transitionDelay = `${siblingIndex * 0.08}s`;
        }
      }
      animObserver.observe(el);
    });
  }

  // ---- Smooth parallax for hero background ----
  const heroBgImg = document.querySelector('.hero-bg-img');
  if (heroBgImg && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBgImg.style.transform = `scale(${1.05 + scrolled * 0.0001}) translateY(${scrolled * 0.15}px)`;
      }
    }, { passive: true });
  }

  // ---- Particle effect in hero (subtle floating dots) ----
  const particleContainer = document.getElementById('hero-particles');
  if (particleContainer && window.innerWidth > 768) {
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: ${1 + Math.random() * 2}px;
        height: ${1 + Math.random() * 2}px;
        background: rgba(0, 255, 136, ${0.15 + Math.random() * 0.25});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: particleFloat ${8 + Math.random() * 12}s ease-in-out infinite;
        animation-delay: ${Math.random() * -10}s;
        pointer-events: none;
      `;
      particleContainer.appendChild(particle);
    }

    const particleStyle = document.createElement('style');
    particleStyle.textContent = `
      @keyframes particleFloat {
        0%, 100% { transform: translate(0, 0); opacity: 0.3; }
        25% { transform: translate(${20 + Math.random() * 30}px, ${-15 - Math.random() * 25}px); opacity: 0.7; }
        50% { transform: translate(${-10 - Math.random() * 20}px, ${-30 - Math.random() * 20}px); opacity: 0.4; }
        75% { transform: translate(${15 + Math.random() * 20}px, ${10 + Math.random() * 15}px); opacity: 0.6; }
      }
    `;
    document.head.appendChild(particleStyle);
  }
});
