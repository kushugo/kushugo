(function () {
    const onReady = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };

    const loadChartJs = (() => {
        let promise = null;
        return () => {
            if (window.Chart) return Promise.resolve(window.Chart);
            if (!promise) {
                promise = new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js';
                    script.defer = true;
                    script.onload = () => resolve(window.Chart);
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            return promise;
        };
    })();

    onReady(() => {
        const sections = document.querySelectorAll('.content-section');
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));

        const tocItems = document.querySelectorAll('.toc-item');
        tocItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.dataset.section;
                const section = document.getElementById(sectionId);
                const headerOffset = 100;
                const elementPosition = section.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
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

        const lightboxController = (() => {
            const overlay = document.getElementById('lightboxOverlay');
            const image = document.getElementById('lightboxImage');
            const closeBtn = document.getElementById('lightboxClose');

            function open(src, alt = '') {
                if (!src) return;
                image.src = src;
                image.alt = alt;
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            function close() {
                overlay.classList.remove('active');
                setTimeout(() => {
                    image.src = '';
                    image.alt = '';
                }, 200);
                document.body.style.overflow = '';
            }

            closeBtn.addEventListener('click', close);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.classList.contains('active')) close();
            });

            return { open, close };
        })();

        const zoomBtn = document.querySelector('.hero-zoom-button');
        const dataHero = document.querySelector('.hero-image.data-hero');
        if (zoomBtn && dataHero) {
            zoomBtn.addEventListener('click', () => {
                const heroImg = dataHero.querySelector('img');
                if (!heroImg) return;
                const src = heroImg.currentSrc || heroImg.src;
                if (!src) return;
                lightboxController.open(src, heroImg.alt || 'Hero Info.gouv.fr');
            });
        }

        function enableLightboxOnImages() {
            const candidates = document.querySelectorAll('img:not(#lightboxImage):not([data-no-lightbox])');

            candidates.forEach(img => {
                if (img.dataset.lightboxInit === '1') return;
                if (img.closest('.lightbox-overlay')) return;

                const bind = () => {
                    if (img.dataset.lightboxInit === '1') return;
                    const src = img.currentSrc || img.src;
                    if (!src) return;
                    if (!img.dataset.forceLightbox && img.naturalWidth && img.naturalHeight && img.naturalWidth <= 60 && img.naturalHeight <= 60) {
                        return;
                    }

                    img.dataset.lightbox = 'true';
                    img.dataset.lightboxInit = '1';
                    img.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const targetSrc = img.currentSrc || img.src;
                        if (!targetSrc) return;
                        lightboxController.open(targetSrc, img.alt || '');
                    });
                };

                if (img.complete && img.naturalWidth) {
                    bind();
                } else {
                    img.addEventListener('load', bind, { once: true });
                }
            });
        }

        enableLightboxOnImages();
        document.addEventListener('DOMContentLoaded', enableLightboxOnImages);
        window.addEventListener('load', () => {
            setTimeout(enableLightboxOnImages, 400);
        });

        (function () {
            const hero = document.querySelector('.hero-image.data-hero');
            if (!hero) return;

            const counters = hero.querySelectorAll('[data-count]');
            if (!counters.length) return;

            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduced) {
                counters.forEach(el => {
                    el.textContent =
                        (el.dataset.prefix || '') +
                        (el.dataset.count || '0') +
                        (el.dataset.suffix || '');
                    el.dataset.done = '1';
                });
                return;
            }

            function animate(el) {
                el.dataset.done = '1';
                const target = parseFloat(el.dataset.count || '0');
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix || '';
                const duration = 1200;
                const startTime = performance.now();
                const ease = t => 1 - Math.pow(1 - t, 3);

                function tick(now) {
                    const progress = Math.min(1, (now - startTime) / duration);
                    const value = Math.round(target * ease(progress));
                    el.textContent = prefix + value + suffix;
                    if (progress < 1) requestAnimationFrame(tick);
                }

                requestAnimationFrame(tick);
            }

            function run() {
                counters.forEach(el => {
                    if (!el.dataset.done) animate(el);
                });
            }

            function isVisible(el) {
                const rect = el.getBoundingClientRect();
                return rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
            }

            if (isVisible(hero)) run();

            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        run();
                        io.disconnect();
                    }
                });
            }, { threshold: 0.15 });

            io.observe(hero);

            let armed = true;
            function onScroll() {
                if (armed && isVisible(hero)) {
                    armed = false;
                    run();
                    window.removeEventListener('scroll', onScroll);
                }
            }

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('load', () => {
                if (isVisible(hero)) run();
            });
        })();

        const palette = {
            primary: 'rgba(99, 102, 241, 0.8)',
            secondary: 'rgba(245, 87, 108, 0.8)',
            tertiary: 'rgba(0, 0, 145, 0.8)',
            quaternary: 'rgba(200, 200, 200, 0.5)'
        };

        const chartInstances = {
            kpi: null,
            beforeAfter: null,
        };

        const translate = (key, fallback) => {
            if (window.__i18n && typeof window.__i18n.t === 'function') {
                const value = window.__i18n.t(key);
                if (value && value !== key) return value;
            }
            return fallback || key;
        };

        const renderCharts = () => {
            if (typeof Chart === 'undefined') return;

            const kpiCtx = document.getElementById('kpiChart');
            if (chartInstances.kpi) {
                chartInstances.kpi.destroy();
                chartInstances.kpi = null;
            }
            if (kpiCtx) {
                chartInstances.kpi = new Chart(kpiCtx, {
                    type: 'line',
                    data: {
                        labels: [
                            translate('gouv.chart.month1', 'Mois 1'),
                            translate('gouv.chart.month2', 'Mois 2'),
                            translate('gouv.chart.month3', 'Mois 3'),
                            translate('gouv.chart.month4', 'Mois 4'),
                            translate('gouv.chart.month5', 'Mois 5'),
                            translate('gouv.chart.month6', 'Mois 6'),
                        ],
                        datasets: [
                            {
                                label: translate('gouv.chart.cta.label', 'Taux de clic CTA (%)'),
                                data: [18, 22, 28, 35, 39, 42],
                                borderColor: palette.primary,
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                tension: 0.4,
                                fill: true,
                            },
                            {
                                label: translate('gouv.chart.engagement.label', 'Engagement utilisateur (%)'),
                                data: [45, 48, 52, 58, 63, 68],
                                borderColor: palette.tertiary,
                                backgroundColor: 'rgba(0, 0, 145, 0.1)',
                                tension: 0.4,
                                fill: true,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)',
                                },
                            },
                            x: {
                                grid: {
                                    display: false,
                                },
                            },
                        },
                    },
                });
            }

            const beforeAfterCtx = document.getElementById('beforeAfterChart');
            if (chartInstances.beforeAfter) {
                chartInstances.beforeAfter.destroy();
                chartInstances.beforeAfter = null;
            }
            if (beforeAfterCtx) {
                chartInstances.beforeAfter = new Chart(beforeAfterCtx, {
                    type: 'bar',
                    data: {
                        labels: [
                            translate('gouv.chart.metric1', 'Taux de clic CTA'),
                            translate('gouv.chart.metric2', 'Temps accès info (min)'),
                            translate('gouv.chart.metric3', 'Taux de rebond'),
                            translate('gouv.chart.metric4', 'Engagement'),
                        ],
                        datasets: [
                            {
                                label: translate('gouv.chart.before', 'Avant refonte'),
                                data: [18, 5.2, 62, 45],
                                backgroundColor: palette.quaternary,
                                borderRadius: 8,
                            },
                            {
                                label: translate('gouv.chart.after', 'Après refonte'),
                                data: [42, 3.4, 34, 68],
                                backgroundColor: palette.primary,
                                borderRadius: 8,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)',
                                },
                            },
                            x: {
                                grid: {
                                    display: false,
                                },
                            },
                        },
                    },
                });
            }
        };

        const chartTargets = Array.from(document.querySelectorAll('#kpiChart, #beforeAfterChart'));
        let chartsVisible = false;
        let pendingChartsUpdate = false;

        const ensureCharts = () => {
            loadChartJs()
                .then(() => {
                    renderCharts();
                })
                .catch(() => {
                    console.warn('Chart.js non chargé');
                });
        };

        if (chartTargets.length) {
            if ('IntersectionObserver' in window) {
                const chartObserver = new IntersectionObserver((entries, observer) => {
                    if (entries.some(entry => entry.isIntersecting)) {
                        chartsVisible = true;
                        observer.disconnect();
                        ensureCharts();
                    }
                }, { rootMargin: '200px' });

                chartTargets.forEach(target => chartObserver.observe(target));
            } else {
                chartsVisible = true;
                ensureCharts();
            }
        }

        if (pendingChartsUpdate && chartsVisible) {
            ensureCharts();
            pendingChartsUpdate = false;
        }

        document.addEventListener('i18n:updated', () => {
            if (chartsVisible) {
                ensureCharts();
            } else {
                pendingChartsUpdate = true;
            }
        });
    });
})();
