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
        document.querySelectorAll('.icon-list li').forEach(li => {
            const title = li.querySelector('strong');
            if (!title) return;

            const fragment = document.createDocumentFragment();
            let node = title.nextSibling;
            let hasContent = false;

            while (node) {
                const next = node.nextSibling;
                fragment.appendChild(node);
                hasContent = true;
                node = next;
            }

            if (!hasContent) return;

            const firstChild = fragment.firstChild;
            if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
                firstChild.textContent = firstChild.textContent.replace(/^\s+/, '');
                if (firstChild.textContent.startsWith(':')) {
                    firstChild.textContent = firstChild.textContent.replace(/^:\s*/, ': ');
                }
            }

            const description = document.createElement('span');
            description.className = 'icon-list__description';
            description.appendChild(fragment);
            li.appendChild(description);
        });

        const observerOptions = {
            threshold: window.innerWidth < 768 ? 0.05 : 0.12,
            rootMargin: '0px 0px 12% 0px'
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll('.content-section, .info-card, .stat-card, .quote-box, .icon-list li, .timeline-item, .chart-block, .chart-insights li, .poc-card, .poc-card__highlights li, .mockup-embed');

        const revealVisibleElements = () => {
            animatedElements.forEach(el => {
                if (el.classList.contains('visible')) {
                    return;
                }

                const rect = el.getBoundingClientRect();
                if (rect.top <= window.innerHeight * 0.92) {
                    el.classList.add('visible');
                }
            });
        };

        animatedElements.forEach(el => observer.observe(el));

        window.addEventListener('load', () => {
            revealVisibleElements();

            setTimeout(() => {
                revealVisibleElements();
            }, 750);
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

        const clampDelay = (index, step, max) => Math.min(index * step, max).toFixed(2);

        document.querySelectorAll('.icon-list li').forEach((li, index) => {
            li.style.transitionDelay = `${clampDelay(index, 0.06, 0.4)}s`;
        });

        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.transitionDelay = `${clampDelay(index, 0.1, 0.6)}s`;
        });

        document.querySelectorAll('.timeline-item').forEach((item, index) => {
            item.style.transitionDelay = `${clampDelay(index, 0.12, 0.65)}s`;
        });

        document.querySelectorAll('.chart-insights li').forEach((item, index) => {
            item.style.transitionDelay = `${clampDelay(index, 0.08, 0.45)}s`;
        });

        document.querySelectorAll('.poc-card__highlights li').forEach((item, index) => {
            item.style.transitionDelay = `${clampDelay(index, 0.07, 0.35)}s`;
        });

        document.querySelectorAll('.mockup-embed').forEach((block, index) => {
            block.style.transitionDelay = `${clampDelay(index, 0.1, 0.4)}s`;
        });

        const chartNoteTriggers = Array.from(document.querySelectorAll('.chart-note__trigger'));

        const getChartNoteBubble = (trigger) => {
            if (!trigger) {
                return null;
            }
            const contentId = trigger.getAttribute('aria-controls');
            if (!contentId) {
                return null;
            }
            return document.getElementById(contentId);
        };

        const closeChartNote = (trigger) => {
            const bubble = getChartNoteBubble(trigger);
            if (!bubble) {
                return;
            }
            trigger.setAttribute('aria-expanded', 'false');
            bubble.classList.remove('is-visible');
            bubble.setAttribute('aria-hidden', 'true');
            if (!bubble.hasAttribute('hidden')) {
                bubble.setAttribute('hidden', '');
            }
        };

        const openChartNote = (trigger) => {
            const bubble = getChartNoteBubble(trigger);
            if (!bubble) {
                return;
            }
            trigger.setAttribute('aria-expanded', 'true');
            bubble.classList.add('is-visible');
            bubble.setAttribute('aria-hidden', 'false');
            bubble.removeAttribute('hidden');
            if (typeof bubble.focus === 'function') {
                bubble.focus({ preventScroll: true });
            }
        };

        const closeAllChartNotes = () => {
            chartNoteTriggers.forEach(closeChartNote);
        };

        chartNoteTriggers.forEach(trigger => {
            trigger.addEventListener('click', event => {
                event.stopPropagation();
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
                closeAllChartNotes();
                if (!isExpanded) {
                    openChartNote(trigger);
                }
            });
        });

        document.addEventListener('click', event => {
            if (!event.target.closest('.chart-note')) {
                closeAllChartNotes();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeAllChartNotes();
            }
        });

        const chartRegistry = {};
        let chartsVisible = false;
        let pendingChartsUpdate = false;

        function initializeCharts() {
            if (typeof Chart === 'undefined') {
                console.warn("Chart.js n'est pas disponible.");
                return;
            }

            const translate = (key, fallback) => {
                if (window.__i18n && typeof window.__i18n.t === 'function') {
                    const value = window.__i18n.t(key);
                    if (value && value !== key) return value;
                }
                return fallback || key;
            };

            const getLocale = () => {
                if (window.__i18n && typeof window.__i18n.getLang === 'function') {
                    const lang = window.__i18n.getLang();
                    if (lang === 'en') return 'en-US';
                    if (lang === 'fr') return 'fr-FR';
                }
                return navigator.language || 'fr-FR';
            };

            const palette = {
                primary: '#667eea',
                secondary: '#764ba2',
                tertiary: '#a78bfa',
                quaternary: '#c7d2fe',
                light: '#e0e7ff'
            };

            Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
            Chart.defaults.font.size = 13;
            Chart.defaults.color = '#4b5563';

            const createGradient = (ctx, start, end) => {
                const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height || 320);
                gradient.addColorStop(0, start);
                gradient.addColorStop(1, end);
                return gradient;
            };

            const locale = getLocale();

            const researchCanvas = document.getElementById('researchBreakdownChart');
            if (researchCanvas) {
                const ctx = researchCanvas.getContext('2d');
                const researchUnits = [
                    translate('agora.research.stat.observed', 'grossistes observés'),
                    translate('agora.research.stat.interviews', 'entretiens réalisés'),
                    translate('agora.research.stat.workflows', 'workflows cartographiés'),
                    translate('agora.research.stat.workshops', 'ateliers co-création')
                ];

                if (chartRegistry.researchBreakdown) {
                    chartRegistry.researchBreakdown.destroy();
                }

                chartRegistry.researchBreakdown = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: [
                            translate('agora.research.chart.observations', 'Observations terrain'),
                            translate('agora.research.chart.interviews', 'Entretiens utilisateurs'),
                            translate('agora.research.chart.workflows', 'Analyse des workflows'),
                            translate('agora.research.chart.workshops', 'Ateliers de co-création')
                        ],
                        datasets: [{
                            data: [15, 20, 8, 3],
                            backgroundColor: [
                                palette.primary,
                                palette.secondary,
                                palette.tertiary,
                                palette.quaternary
                            ],
                            borderWidth: 0,
                            hoverOffset: 12
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        aspectRatio: 1,
                        cutout: '58%',
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: context => {
                                        const unit = researchUnits[context.dataIndex] || '';
                                        return `${context.label} : ${context.parsed} ${unit}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const userFlowsCanvas = document.getElementById('userFlowsChart');
            if (userFlowsCanvas) {
                const ctx = userFlowsCanvas.getContext('2d');
                const isMobile = window.matchMedia('(max-width: 640px)').matches;

                if (chartRegistry.userFlows) {
                    chartRegistry.userFlows.destroy();
                }

                chartRegistry.userFlows = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: [
                            translate('agora.ideation.flow1.label', 'Prise de commande express'),
                            translate('agora.ideation.flow2.label', 'Vérification de solvabilité'),
                            translate('agora.ideation.flow3.label', 'Facturation électronique')
                        ],
                        datasets: [
                            {
                                label: translate('agora.chart.userflows.before', 'Avant refonte'),
                                data: [5, 6, 15],
                                backgroundColor: palette.quaternary,
                                borderRadius: 14,
                                borderSkipped: false,
                                maxBarThickness: isMobile ? 40 : 80,
                                categoryPercentage: 1,
                                barPercentage: 0.9
                            },
                            {
                                label: translate('agora.chart.userflows.after', 'Après livraison'),
                                data: [1.5, 2, 3],
                                backgroundColor: palette.primary,
                                borderRadius: 14,
                                borderSkipped: false,
                                maxBarThickness: isMobile ? 40 : 80,
                                categoryPercentage: 1,
                                barPercentage: 0.9
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                left: 0,
                                right: 0
                            }
                        },
                        indexAxis: isMobile ? 'y' : 'x',
                        scales: isMobile
                            ? {
                                x: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Minutes'
                                    },
                                    ticks: {
                                        callback: value => `${value} min`
                                    },
                                    grid: {
                                        color: 'rgba(102, 126, 234, 0.1)',
                                        drawBorder: false
                                    }
                                },
                                y: {
                                    grid: { display: false },
                                    offset: true
                                }
                            }
                            : {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Minutes'
                                    },
                                    ticks: {
                                        callback: value => `${value} min`
                                    },
                                    grid: {
                                        color: 'rgba(102, 126, 234, 0.1)',
                                        drawBorder: false
                                    }
                                },
                                x: {
                                    grid: { display: false },
                                    offset: false
                                }
                            },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: context => {
                                        const value = isMobile ? context.parsed.x : context.parsed.y;
                                        const formatted = value.toLocaleString(locale, {
                                            minimumFractionDigits: value % 1 ? 1 : 0,
                                            maximumFractionDigits: 1
                                        });
                                        return `${context.dataset.label} : ${formatted} min`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const orderTimeCanvas = document.getElementById('orderTimeChart');
            if (orderTimeCanvas) {
                const ctx = orderTimeCanvas.getContext('2d');
                const gradient = createGradient(ctx, 'rgba(102, 126, 234, 0.35)', 'rgba(118, 75, 162, 0.1)');

                if (chartRegistry.orderTime) {
                    chartRegistry.orderTime.destroy();
                }

                chartRegistry.orderTime = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [
                            translate('agora.chart.ordertime.paper', 'Méthode papier'),
                            translate('agora.chart.ordertime.proto1', 'Prototype V1'),
                            translate('agora.chart.ordertime.proto2', 'Prototype V2'),
                            translate('agora.chart.ordertime.final', 'Version finale')
                        ],
                        datasets: [{
                            label: translate('agora.chart.ordertime.legend', 'Durée moyenne (minutes)'),
                            data: [5, 3.5, 2.2, 1.5],
                            fill: true,
                            tension: 0.4,
                            backgroundColor: gradient,
                            borderColor: palette.primary,
                            borderWidth: 2,
                            pointRadius: 5,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: palette.primary,
                            pointBorderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: translate('agora.chart.ordertime.axis', 'Minutes')
                                },
                                ticks: {
                                    callback: value => `${value} min`
                                },
                                grid: {
                                    color: 'rgba(102, 126, 234, 0.12)',
                                    drawBorder: false
                                }
                            },
                            x: {
                                grid: { display: false }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: context => {
                                        const value = context.parsed.y;
                                        const formatted = value.toLocaleString(locale, {
                                            minimumFractionDigits: value % 1 ? 1 : 0,
                                            maximumFractionDigits: 1
                                        });
                                        return `${formatted} min`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const kpiCanvas = document.getElementById('kpiPerformanceChart');
            if (kpiCanvas) {
                const ctx = kpiCanvas.getContext('2d');

                if (chartRegistry.kpiPerformance) {
                    chartRegistry.kpiPerformance.destroy();
                }

                const kpiLabels = [
                    translate('agora.kpi.adoption', "Taux d'adoption"),
                    translate('agora.kpi.productivity', "Gain de productivité"),
                    translate('agora.kpi.unpaid', "Réduction des impayés"),
                    translate('agora.results.kpi.satisfaction', "Satisfaction client")
                ];

                chartRegistry.kpiPerformance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: kpiLabels,
                        datasets: [{
                            label: translate('agora.results.dataset.sixMonths', 'Résultats à 6 mois'),
                            data: [92, 70, 30, 88],
                            backgroundColor: [
                                palette.primary,
                                palette.secondary,
                                palette.tertiary,
                                palette.quaternary
                            ],
                            borderRadius: 14,
                            borderSkipped: false,
                            maxBarThickness: 42
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    callback: value => `${value}%`
                                },
                                grid: {
                                    color: 'rgba(102, 126, 234, 0.1)',
                                    drawBorder: false
                                }
                            },
                            y: {
                                grid: { display: false }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: context => {
                                        const value = context.parsed.x;
                                        const isReduction = context.dataIndex === 2;
                                        const prefix = isReduction ? '-' : '';
                                        return `${context.label} : ${prefix}${value}%`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const businessCanvas = document.getElementById('businessImpactChart');
            if (businessCanvas) {
                const ctx = businessCanvas.getContext('2d');
                const businessUnits = ['h/jour', '%', 'jours'];

                if (chartRegistry.businessImpact) {
                    chartRegistry.businessImpact.destroy();
                }

                chartRegistry.businessImpact = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: [
                            translate('agora.results.metric.admin', 'Temps administratif'),
                            translate('agora.results.metric.errors', 'Erreurs de facturation'),
                            translate('agora.results.metric.delay', 'Délai moyen de paiement')
                        ],
                        datasets: [
                            {
                                label: translate('agora.chart.before', 'Avant AgoraSquare'),
                                data: [3, 40, 45],
                                backgroundColor: palette.quaternary,
                                borderRadius: 14,
                                borderSkipped: false,
                                maxBarThickness: 48
                            },
                            {
                                label: translate('agora.chart.after', 'Après déploiement'),
                                data: [0.8, 6, 30],
                                backgroundColor: palette.primary,
                                borderRadius: 14,
                                borderSkipped: false,
                                maxBarThickness: 48
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(102, 126, 234, 0.1)',
                                    drawBorder: false
                                }
                            },
                            y: {
                                grid: { display: false }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: context => {
                                        const unit = businessUnits[context.dataIndex] || '';
                                        const value = context.parsed.x;
                                        const needsDecimal = unit === 'h/jour' && value % 1 !== 0;
                                        const formatted = value.toLocaleString(locale, {
                                            minimumFractionDigits: needsDecimal ? 1 : 0,
                                            maximumFractionDigits: needsDecimal ? 1 : 0
                                        });
                                        return `${context.dataset.label} : ${formatted} ${unit}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        const ensureCharts = () => {
            loadChartJs()
                .then(() => {
                    initializeCharts();
                })
                .catch(() => {
                    console.warn("Chart.js n'est pas disponible.");
                });
        };

        const chartTargets = Array.from(document.querySelectorAll('#researchBreakdownChart, #userFlowsChart, #orderTimeChart, #kpiPerformanceChart, #businessImpactChart'));

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

        window.addEventListener('load', () => {
            if (chartsVisible) {
                ensureCharts();
            }
        });

        document.addEventListener('i18n:updated', () => {
            if (chartsVisible) {
                ensureCharts();
            } else {
                pendingChartsUpdate = true;
            }
        });

        if (pendingChartsUpdate && chartsVisible) {
            ensureCharts();
            pendingChartsUpdate = false;
        }

        const lightboxController = (() => {
            const overlay = document.getElementById('lightboxOverlay');
            const image = document.getElementById('lightboxImage');
            const closeBtn = document.getElementById('lightboxClose');
            if (!overlay || !image || !closeBtn) return null;

            let isOpen = false;

            function open(src, alt = '') {
                if (!src) return;
                image.src = src;
                image.alt = alt;
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                isOpen = true;
            }

            function close() {
                overlay.classList.remove('active');
                setTimeout(() => {
                    image.src = '';
                    image.alt = '';
                }, 200);
                document.body.style.overflow = '';
                isOpen = false;
            }

            closeBtn.addEventListener('click', close);

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    close();
                }
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && isOpen) {
                    close();
                }
            });

            return { open, close };
        })();

        (function () {
            const hero = document.querySelector('.hero-image.data-hero');
            if (!hero) return;

            const heroImage = hero.querySelector('img');
            const zoomBtn = hero.querySelector('.hero-zoom-button');

            if (!heroImage || !lightboxController) return;

            const openLightbox = () => {
                const src = heroImage.currentSrc || heroImage.getAttribute('src');
                if (!src) return;
                const alt = heroImage.getAttribute('alt') || '';
                lightboxController.open(src, alt);
            };

            if (zoomBtn) {
                zoomBtn.addEventListener('click', openLightbox);
            }

            heroImage.addEventListener('dblclick', (event) => {
                if (event.target.closest('.data-overlay')) return;
                openLightbox();
            });
        })();

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

            const io = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        run();
                        observer.disconnect();
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
    });
})();
