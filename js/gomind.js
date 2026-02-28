(function () {
    const onReady = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };

    onReady(() => {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.content-section, .info-card, .step-card, .stat-card, .quote-box, .icon-list li, .timeline-item, .bar-item').forEach(el => {
            observer.observe(el);
        });

        const tocItems = document.querySelectorAll('.toc-item');
        const sections = document.querySelectorAll('.content-section');

        tocItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.dataset.section;
                const section = document.getElementById(sectionId);
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (pageYOffset >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });

            tocItems.forEach(item => {
                item.classList.remove('active');
                if (item.dataset.section === current) {
                    item.classList.add('active');
                }
            });
        }, { passive: true });

        document.querySelectorAll('.icon-list li').forEach((li, index) => {
            li.style.transitionDelay = `${index * 0.1}s`;
        });

        document.querySelectorAll('.step-card').forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.1}s`;
        });

        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.15}s`;
        });

        document.querySelectorAll('.timeline-item').forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.2}s`;
        });

        (function () {
            const media = document.querySelector('[data-hero-media]');
            if (!media) return;

            const img = media.querySelector('[data-hero-media-image]');
            if (!img) return;

            const dataSrc = (img.dataset.src || '').trim();
            const currentSrc = (img.getAttribute('src') || '').trim();

            if (!currentSrc && dataSrc) {
                img.src = dataSrc;
            }

            const finalSrc = (img.getAttribute('src') || '').trim();
            if (!finalSrc) {
                return;
            }

            media.removeAttribute('hidden');
            media.classList.add('has-image');
            const inner = media.closest('.project-hero-inner');
            if (inner) {
                inner.classList.add('has-media');
            }

            if (!(img.getAttribute('alt') || '').trim()) {
                img.setAttribute('alt', 'Aperçu visuel du projet GoMind');
            }
        })();

        (function () {
            const hero = document.querySelector('.hero-image.data-hero');
            if (!hero) return;

            const counters = hero.querySelectorAll('[data-count]');
            if (!counters.length) return;

            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                counters.forEach(el => {
                    el.textContent = `${el.dataset.prefix || ''}${el.dataset.count || '0'}${el.dataset.suffix || ''}`;
                });
                return;
            }

            const duration = 1400;
            const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

            function animate(el) {
                const raw = el.dataset.count || '0';
                const target = parseFloat(raw);
                const parts = raw.split('.');
                const decimals = parts.length > 1 ? parts[1].length : 0;
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix || '';
                let start = null;

                function step(timestamp) {
                    if (!start) start = timestamp;
                    const progress = Math.min(1, (timestamp - start) / duration);
                    const eased = easeOutCubic(progress);
                    const value = target * eased;
                    const formatted = decimals ? value.toFixed(decimals) : Math.round(value);
                    el.textContent = `${prefix}${formatted}${suffix}`;
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    }
                }

                requestAnimationFrame(step);
            }

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        counters.forEach(animate);
                        obs.disconnect();
                    }
                });
            }, { threshold: 0.2 });

            observer.observe(hero);
        })();

        (function () {
            const heroWrapper = document.querySelector('.hero-wrapper');
            if (!heroWrapper) return;

            const manageHeroFocusableElements = () => {
                const zoomButton = heroWrapper.querySelector('.hero-zoom-button');
                const dataOverlay = heroWrapper.querySelector('.data-overlay');

                const isElementVisible = (element) => {
                    if (!element) return false;
                    const style = window.getComputedStyle(element);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        element.offsetWidth > 0 &&
                        element.offsetHeight > 0;
                };

                if (zoomButton) {
                    if (isElementVisible(zoomButton)) {
                        zoomButton.removeAttribute('tabindex');
                    } else {
                        zoomButton.setAttribute('tabindex', '-1');
                    }
                }

                if (dataOverlay) {
                    const focusableInOverlay = dataOverlay.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
                    focusableInOverlay.forEach(el => {
                        if (isElementVisible(dataOverlay) && isElementVisible(el)) {
                            el.removeAttribute('tabindex');
                        } else {
                            el.setAttribute('tabindex', '-1');
                        }
                    });
                }
            };

            manageHeroFocusableElements();

            window.addEventListener('resize', manageHeroFocusableElements, { passive: true });

            const observer = new MutationObserver(manageHeroFocusableElements);
            observer.observe(heroWrapper, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                childList: false,
                subtree: true
            });
        })();

        (function () {
            const overlay = document.getElementById('lightboxOverlay');
            const image = document.getElementById('lightboxImage');
            const closeBtn = document.getElementById('lightboxClose');
            if (!overlay || !image || !closeBtn) return;

            const open = (sourceImg, overrideSrc) => {
                if (!sourceImg) return;
                const src = overrideSrc
                    || sourceImg.dataset.lightboxSrc
                    || sourceImg.dataset.zoomSrc
                    || sourceImg.currentSrc
                    || sourceImg.src
                    || sourceImg.getAttribute('src');
                if (!src) return;
                image.src = src;
                image.alt = sourceImg.alt || '';
                overlay.style.setProperty('--lightbox-image', `url("${src}")`);
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                if (typeof closeBtn.focus === 'function') {
                    try {
                        closeBtn.focus({ preventScroll: true });
                    } catch {
                        closeBtn.focus();
                    }
                }
            };

            const close = () => {
                overlay.classList.remove('active');
                image.src = '';
                image.alt = '';
                overlay.style.removeProperty('--lightbox-image');
                document.body.style.overflow = '';
            };

            document.addEventListener('click', event => {
                const zoomBtn = event.target.closest('.hero-zoom-button');
                if (zoomBtn) {
                    const hero = zoomBtn.closest('.hero-image');
                    if (!hero) return;
                    const heroImg = hero.querySelector('picture img') || hero.querySelector('img');
                    open(heroImg, zoomBtn.dataset.zoomSrc);
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                const trigger = event.target.closest('[data-lightbox]');
                if (!trigger || trigger.closest('#lightboxOverlay')) {
                    return;
                }

                const explicitSrc = trigger.dataset.lightboxSrc
                    || trigger.dataset.zoomSrc
                    || trigger.currentSrc
                    || trigger.src
                    || trigger.getAttribute('src');
                if (!explicitSrc) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                open(trigger, explicitSrc);
            });

            document.addEventListener('dblclick', event => {
                const hero = event.target.closest('.hero-image.data-hero');
                if (!hero || event.target.closest('.data-overlay')) return;
                const heroImg = hero.querySelector('picture img') || hero.querySelector('img');
                open(heroImg);
            });

            closeBtn.addEventListener('click', close);

            overlay.addEventListener('click', event => {
                if (event.target === overlay) {
                    close();
                }
            });

            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && overlay.classList.contains('active')) {
                    close();
                }
            });
        })();

        const comparisonContainer = document.getElementById('comparisonContainer');
        const comparisonSlider = document.getElementById('comparisonSlider');
        const comparisonBefore = document.getElementById('comparisonBefore');

        if (comparisonContainer && comparisonSlider && comparisonBefore) {
            let isDragging = false;

            function updateComparison(x) {
                const rect = comparisonContainer.getBoundingClientRect();
                const position = Math.max(0, Math.min(x - rect.left, rect.width));
                const percentage = (position / rect.width) * 100;

                comparisonBefore.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
                comparisonSlider.style.left = `${percentage}%`;
            }

            comparisonSlider.addEventListener('mousedown', () => {
                isDragging = true;
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    updateComparison(e.clientX);
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            comparisonSlider.addEventListener('touchstart', (e) => {
                isDragging = true;
                e.preventDefault();
            });

            document.addEventListener('touchmove', (e) => {
                if (isDragging) {
                    const touch = e.touches[0];
                    updateComparison(touch.clientX);
                }
            });

            document.addEventListener('touchend', () => {
                isDragging = false;
            });

            comparisonContainer.addEventListener('click', (e) => {
                if (e.target !== comparisonSlider) {
                    updateComparison(e.clientX);
                }
            });
        }
    });
})();
