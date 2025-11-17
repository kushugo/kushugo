// Navigation behavior shared across all pages
// - Header shrink on scroll
// - Smooth scroll for in-page anchor links
// - Mobile nav toggle (burger)
// - aria-current update based on visible section

(function () {
  const header = document.getElementById('header');

  // Header scroll effect (shrink + border)
  if (header) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Smooth scroll for in-page anchors (only href starting with "#")
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      const target = href ? document.querySelector(href) : null;
      if (href && href.startsWith('#') && target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Accessible mobile navigation toggle + aria-current
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('primary-navigation');
  const navAnchors = navLinks ? navLinks.querySelectorAll('a[href]') : [];

  const setAriaCurrent = (href) => {
    navAnchors.forEach(a => {
      if (a.getAttribute('href') === href) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  };

  // Function to manage tabindex for hidden navigation links and toggle button
  const manageNavLinksTabindex = () => {
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const isNavOpen = document.body.classList.contains('is-nav-open');
    
    // Manage nav links tabindex
    if (navLinks && navAnchors.length > 0) {
      navAnchors.forEach(a => {
        // On mobile, only allow focus when nav is open
        if (isMobile && !isNavOpen) {
          a.setAttribute('tabindex', '-1');
        } else {
          a.removeAttribute('tabindex');
        }
      });
    }
    
    // Manage nav toggle button tabindex (hidden on desktop, visible on mobile)
    if (navToggle) {
      if (!isMobile) {
        // On desktop, button is hidden via CSS display:none, but ensure it's not focusable
        navToggle.setAttribute('tabindex', '-1');
      } else {
        // On mobile, button is visible and should be focusable
        navToggle.removeAttribute('tabindex');
      }
    }
  };

  if (navToggle && navLinks) {
    // Initial state
    manageNavLinksTabindex();
    
    // Update on resize
    window.addEventListener('resize', manageNavLinksTabindex, { passive: true });
    
    navToggle.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('is-nav-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      manageNavLinksTabindex();
    });

    navAnchors.forEach(a => {
      a.addEventListener('click', () => {
        document.body.classList.remove('is-nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        manageNavLinksTabindex();
        const href = a.getAttribute('href');
        if (href) {
          setAriaCurrent(href);
        }
      });
    });

    // Dynamic update of active nav item based on scroll position
    const sections = [
      { id: 'hero-title', href: '/' },
      { id: 'projets', href: '#projets' },
      { id: 'about', href: '#about' },
      { id: 'contact', href: '#contact' },
    ].map(({ id, href }) => {
      const el = id === 'hero-title'
        ? document.getElementById(id)?.closest('section')
        : document.getElementById(id);
      return el ? { el, href } : null;
    }).filter(Boolean);

    const updateActiveSection = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportHeight = window.innerHeight;
      const headerOffset = header ? header.offsetHeight + 24 : 80;
      const centerY = scrollY + headerOffset + viewportHeight * 0.15;

      let currentHref = '/';
      sections.forEach(section => {
        const rect = section.el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = top + rect.height;
        if (centerY >= top && centerY < bottom) {
          currentHref = section.href;
        }
      });

      setAriaCurrent(currentHref);
    };

    // Initial state + scroll listener
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
  }
})();



