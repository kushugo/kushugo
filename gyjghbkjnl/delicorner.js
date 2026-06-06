/* Délicorner — case study interactions
   Mirrors the logic pattern of gouvernement.js : IntersectionObserver reveal,
   TOC scroll-spy, lightbox, animated KPI counters, + the CX Copilot Slack-scene
   loop and the before/after Chart.js. Respects prefers-reduced-motion. */
(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* footer year */
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    /* ---------- Reveal on scroll ---------- */
    var sections = document.querySelectorAll('.content-section');
    if (reduced) {
        sections.forEach(function (s) { s.classList.add('visible'); });
    } else if ('IntersectionObserver' in window) {
        var revealIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealIO.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' });
        sections.forEach(function (s) { revealIO.observe(s); });
    } else {
        sections.forEach(function (s) { s.classList.add('visible'); });
    }

    /* ---------- TOC : click + scroll-spy ---------- */
    var tocItems = document.querySelectorAll('.toc-item');
    tocItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var section = document.getElementById(item.dataset.section);
            if (!section) return;
            var offset = section.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({ top: offset, behavior: 'smooth' });
        });
    });
    var spyTargets = [];
    tocItems.forEach(function (item) {
        var s = document.getElementById(item.dataset.section);
        if (s) spyTargets.push(s);
    });
    function onScrollSpy() {
        var current = '';
        spyTargets.forEach(function (s) {
            if (window.pageYOffset >= s.offsetTop - 200) current = s.id;
        });
        tocItems.forEach(function (item) {
            item.classList.toggle('active', item.dataset.section === current);
        });
    }
    window.addEventListener('scroll', onScrollSpy, { passive: true });
    onScrollSpy();

    /* ---------- Header shadow on scroll (fallback if nav.js absent) ---------- */
    var header = document.getElementById('header');
    if (header) {
        var onHdr = function () { header.classList.toggle('scrolled', window.pageYOffset > 20); };
        window.addEventListener('scroll', onHdr, { passive: true });
        onHdr();
    }

    /* ---------- Nav toggle (fallback) ---------- */
    var toggle = document.querySelector('.nav-toggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            var open = document.body.classList.toggle('is-nav-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.querySelectorAll('.nav-links a').forEach(function (a) {
            a.addEventListener('click', function () {
                document.body.classList.remove('is-nav-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ---------- Lightbox ---------- */
    var lightbox = (function () {
        var overlay = document.getElementById('lightboxOverlay');
        var image = document.getElementById('lightboxImage');
        var closeBtn = document.getElementById('lightboxClose');
        if (!overlay || !image) return { open: function () {} };
        function open(src, alt) {
            if (!src) return;
            image.src = src; image.alt = alt || '';
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function close() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(function () { image.src = ''; image.alt = ''; }, 220);
        }
        if (closeBtn) closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) close();
        });
        return { open: open, close: close };
    })();

    /* hero zoom button → opens hero image */
    var zoomBtn = document.querySelector('.hero-zoom-button');
    var heroImg = document.querySelector('.hero-image.data-hero img');
    if (zoomBtn && heroImg) {
        zoomBtn.addEventListener('click', function () {
            lightbox.open(heroImg.currentSrc || heroImg.src, heroImg.alt);
        });
    }

    /* click-to-zoom on gallery images */
    document.querySelectorAll('figure.shot img').forEach(function (img) {
        img.addEventListener('click', function () {
            lightbox.open(img.currentSrc || img.src, img.alt);
        });
    });

    /* ---------- Animated KPI counters ---------- */
    function decodeEntities(str) {
        var t = document.createElement('textarea');
        t.innerHTML = str;
        return t.value;
    }
    function animateCounter(el) {
        if (el.dataset.done) return;
        el.dataset.done = '1';
        var target = parseFloat(el.dataset.count || '0');
        var prefix = decodeEntities(el.dataset.prefix || '');
        var suffix = decodeEntities(el.dataset.suffix || '');
        if (reduced) { el.textContent = prefix + target + suffix; return; }
        var duration = 1200, start = performance.now();
        var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
        (function tick(now) {
            var p = Math.min(1, (now - start) / duration);
            el.textContent = prefix + Math.round(target * ease(p)) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
    }
    function watchCounters(scope) {
        var counters = scope.querySelectorAll('[data-count]');
        if (!counters.length) return;
        if (reduced || !('IntersectionObserver' in window)) {
            counters.forEach(animateCounter); return;
        }
        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { animateCounter(entry.target); cio.unobserve(entry.target); }
            });
        }, { threshold: 0.4 });
        counters.forEach(function (c) { cio.observe(c); });
    }
    watchCounters(document);

    /* ---------- CX Copilot : Slack-scene choreography loop ---------- */
    var slackScene = document.querySelector('.slack-scene');
    if (slackScene) {
        if (reduced) {
            slackScene.setAttribute('data-anim', 'on');
        } else {
            var playing = false, timer = null;
            function cycle() {
                slackScene.setAttribute('data-anim', 'off');
                // force reflow to restart CSS animations
                void slackScene.offsetWidth;
                slackScene.setAttribute('data-anim', 'on');
            }
            function start() {
                if (playing) return;
                playing = true;
                cycle();
                timer = setInterval(cycle, 8000);
            }
            function stop() {
                playing = false;
                if (timer) { clearInterval(timer); timer = null; }
            }
            if ('IntersectionObserver' in window) {
                var sio = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) start(); else stop();
                    });
                }, { threshold: 0.35 });
                sio.observe(slackScene);
            } else {
                start();
            }
        }
    }

    /* ---------- Chart.js : before / after response time ---------- */
    var chartInstance = null;
    function t(key, fallback) {
        if (window.__i18n && typeof window.__i18n.t === 'function') {
            var v = window.__i18n.t(key);
            if (v && v !== key) return v;
        }
        return fallback;
    }
    function renderChart() {
        if (typeof Chart === 'undefined') return;
        var ctx = document.getElementById('responseChart');
        if (!ctx) return;
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [t('deli.chart.before', 'Avant (process manuel)'), t('deli.chart.after', 'Avec CX Copilot')],
                datasets: [{
                    label: t('deli.chart.axis', 'Temps de réponse (minutes, échelle log)'),
                    data: [330, 0.33],
                    backgroundColor: ['rgba(120,130,122,0.45)', 'rgba(95,164,90,0.85)'],
                    borderColor: ['rgba(120,130,122,0.7)', 'rgba(63,125,60,1)'],
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 54
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (c) {
                                var min = c.parsed.x;
                                if (min < 1) return Math.round(min * 60) + ' s';
                                if (min < 60) return min + ' min';
                                return (min / 60).toFixed(1).replace('.0', '') + ' h';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: { display: true, text: t('deli.chart.axis', 'Temps de réponse (min · échelle log)') },
                        grid: { color: 'rgba(13,40,24,0.06)' },
                        ticks: {
                            callback: function (v) {
                                if (v === 0.1 || v === 1 || v === 10 || v === 100 || v === 1000) {
                                    if (v < 1) return (v * 60) + ' s';
                                    if (v < 60) return v + ' min';
                                    return (v / 60) + ' h';
                                }
                                return '';
                            }
                        }
                    },
                    y: { grid: { display: false } }
                }
            }
        });
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        renderChart();
    } else {
        window.addEventListener('DOMContentLoaded', renderChart);
    }
    window.addEventListener('load', renderChart);
    document.addEventListener('i18n:updated', renderChart);
})();
