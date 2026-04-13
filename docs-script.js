// Documentation Page JavaScript - TOC, Animations, Navigation

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
    section.style.transitionDelay = `${Math.min(index * 0.05, 0.3)}s`;
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

          // Update active state immediately
          tocLinks.forEach(l => l.classList.remove('active'));
          this.classList.add('active');

          // Update URL hash without jumping
          history.pushState(null, null, `#${targetId}`);
        }
      });
    });
  }

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

        // Set active TOC link
        tocLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${targetId}`);
        });
      }, 300);
    }
  }
});