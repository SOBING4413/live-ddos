// Documentation Page JavaScript - Enhanced with particles, progress, animations

document.addEventListener('DOMContentLoaded', function () {
  // ---- Navbar scroll effect ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
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

  // ---- Create floating particles ----
  createParticles();

  // ---- Create back-to-top button ----
  createBackToTop();

  // ---- Add progress bar to TOC ----
  addTocProgress();

  // ---- Add hero stats ----
  addHeroStats();

  // ---- Scroll animations for docs sections ----
  const sections = document.querySelectorAll('.docs-section');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -40px 0px'
  });

  sections.forEach((section, index) => {
    section.style.transitionDelay = `${Math.min(index * 0.08, 0.4)}s`;
    sectionObserver.observe(section);
  });

  // ---- TOC active state tracking ----
  const tocLinks = document.querySelectorAll('.toc-link');
  const docsSections = document.querySelectorAll('.docs-section[id]');

  if (tocLinks.length > 0 && docsSections.length > 0) {
    const tocObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tocLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '-80px 0px -60% 0px'
    });

    docsSections.forEach(section => {
      tocObserver.observe(section);
    });

    // ---- Smooth scroll on TOC link click ----
    tocLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          const navbarHeight = navbar ? navbar.offsetHeight : 72;
          const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          tocLinks.forEach(l => l.classList.remove('active'));
          this.classList.add('active');

          history.pushState(null, null, `#${targetId}`);
        }
      });
    });
  }

  // ---- Scroll progress for TOC ----
  window.addEventListener('scroll', updateScrollProgress);

  // ---- Handle initial hash on page load ----
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      setTimeout(() => {
        const navbarHeight = navbar ? navbar.offsetHeight : 72;
        const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        tocLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${targetId}`);
        });
      }, 300);
    }
  }

  // ---- Animate counters in hero stats ----
  animateHeroCounters();
});

/**
 * Create floating particle background
 */
function createParticles() {
  const hero = document.querySelector('.docs-hero');
  if (!hero) return;

  const container = document.createElement('div');
  container.className = 'docs-particles';

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'docs-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${8 + Math.random() * 15}s`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.width = `${1 + Math.random() * 2}px`;
    particle.style.height = particle.style.width;

    if (Math.random() > 0.7) {
      particle.style.background = '#00e5ff';
    }

    container.appendChild(particle);
  }

  hero.appendChild(container);
}

/**
 * Create back-to-top button
 */
function createBackToTop() {
  const btn = document.createElement('a');
  btn.href = '#';
  btn.className = 'back-to-top';
  btn.innerHTML = '↑';
  btn.title = 'Back to top';
  btn.setAttribute('aria-label', 'Back to top');

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

/**
 * Add progress bar to TOC
 */
function addTocProgress() {
  const toc = document.querySelector('.docs-toc');
  if (!toc) return;

  const h4 = toc.querySelector('h4');
  if (!h4) return;

  const progressContainer = document.createElement('div');
  progressContainer.className = 'toc-progress';
  const progressFill = document.createElement('div');
  progressFill.className = 'toc-progress-fill';
  progressFill.id = 'toc-progress-fill';
  progressContainer.appendChild(progressFill);

  h4.insertAdjacentElement('afterend', progressContainer);

  // Add number spans to toc links
  const tocLinks = toc.querySelectorAll('.toc-link');
  tocLinks.forEach((link, i) => {
    const text = link.textContent.trim();
    // Extract number from text like "1. Ikhtisar Sistem"
    const match = text.match(/^(\d+)\.\s*(.*)/);
    if (match) {
      const numSpan = document.createElement('span');
      numSpan.className = 'toc-link-num';
      numSpan.textContent = match[1].padStart(2, '0');
      link.textContent = '';
      link.appendChild(numSpan);
      link.appendChild(document.createTextNode(match[2]));
    }
  });
}

/**
 * Update scroll progress
 */
function updateScrollProgress() {
  const fill = document.getElementById('toc-progress-fill');
  if (!fill) return;

  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = window.scrollY;
  const progress = Math.min((scrolled / docHeight) * 100, 100);
  fill.style.width = `${progress}%`;
}

/**
 * Add hero stats section
 */
function addHeroStats() {
  const heroContent = document.querySelector('.docs-hero-content');
  if (!heroContent) return;

  const statsHtml = `
    <div class="docs-hero-stats">
      <div class="docs-hero-stat">
        <div class="docs-hero-stat-value" data-target="9">0</div>
        <div class="docs-hero-stat-label">Sections</div>
      </div>
      <div class="docs-hero-stat-divider"></div>
      <div class="docs-hero-stat">
        <div class="docs-hero-stat-value" data-target="6">0</div>
        <div class="docs-hero-stat-label">Attack Types</div>
      </div>
      <div class="docs-hero-stat-divider"></div>
      <div class="docs-hero-stat">
        <div class="docs-hero-stat-value" data-target="30" data-suffix="+">0</div>
        <div class="docs-hero-stat-label">Countries</div>
      </div>
      <div class="docs-hero-stat-divider"></div>
      <div class="docs-hero-stat">
        <div class="docs-hero-stat-value" data-target="3">0</div>
        <div class="docs-hero-stat-label">Data Sources</div>
      </div>
    </div>
  `;

  heroContent.insertAdjacentHTML('beforeend', statsHtml);
}

/**
 * Animate hero counters
 */
function animateHeroCounters() {
  const counters = document.querySelectorAll('.docs-hero-stat-value[data-target]');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        let current = 0;
        const duration = 1500;
        const step = target / (duration / 30);

        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = Math.round(current) + suffix;
        }, 30);

        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}
