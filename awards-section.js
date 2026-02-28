/**
 * Micro-interactions pour la section Expertise (awards-section)
 * Dépendances: avoir onReady(fn) et runWhenIdle(fn, timeout) si pas dans le même bundle.
 * Exemple:
 *   const onReady = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
 *   const runWhenIdle = (fn, t) => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: t || 1500 }) : setTimeout(fn, 0);
 */

(function () {
    function mkTimer() {
        let ids = [];
        return {
            after(fn, ms) {
                const id = setTimeout(fn, ms);
                ids.push(id);
            },
            clear() {
                ids.forEach(clearTimeout);
                ids = [];
            }
        };
    }

    function initExpertiseAnimations() {
        const cards = Array.from(document.querySelectorAll('.expertise-card'));
        if (!cards.length) return;

        /* CARD 2 · Control level slider (UI Design) */
        const controlSliderCtrl = (() => {
            const track = document.getElementById('control-track');
            const progress = document.getElementById('control-progress');
            const thumb = document.getElementById('control-thumb');
            const valueEl = document.getElementById('control-value-num');
            const badgeEl = document.getElementById('control-badge');
            if (!track || !progress || !thumb || !valueEl || !badgeEl) return null;

            const MIN = 0, MAX = 100;
            let value = 0;
            let dragging = false;
            let bumpTm = null;
            let autoPlaying = false;
            let rafId = null;
            let animTm = null;

            function setValue(v) {
                const prev = value;
                value = Math.max(MIN, Math.min(MAX, Math.round(v)));
                const pct = value / 100;
                progress.style.width = (pct * 100) + '%';
                thumb.style.left = `calc(${pct * 100}% - 10px)`;

                valueEl.textContent = value;
                if (value !== prev) {
                    valueEl.classList.add('bump');
                    if (bumpTm) clearTimeout(bumpTm);
                    bumpTm = setTimeout(() => {
                        valueEl.classList.remove('bump');
                        bumpTm = null;
                    }, 250);
                }

                if (value < 33) {
                    badgeEl.textContent = 'Faible';
                    badgeEl.className = 'control-badge badge-faible';
                } else if (value <= 66) {
                    badgeEl.textContent = 'Moyen';
                    badgeEl.className = 'control-badge badge-moyen';
                } else {
                    badgeEl.textContent = 'Élevé';
                    badgeEl.className = 'control-badge badge-eleve';
                }
            }

            function easeInOutCubic(t) {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

            function animateValue(fromVal, toVal, durationMs, onComplete) {
                let start = null;
                function step(ts) {
                    if (!start) start = ts;
                    const elapsed = ts - start;
                    const t = Math.min(elapsed / durationMs, 1);
                    const eased = easeInOutCubic(t);
                    const current = fromVal + (toVal - fromVal) * eased;
                    setValue(current);
                    if (t < 1) {
                        rafId = requestAnimationFrame(step);
                    } else {
                        rafId = null;
                        if (onComplete) onComplete();
                    }
                }
                rafId = requestAnimationFrame(step);
            }

            function runAutoSequence() {
                if (autoPlaying) return;
                autoPlaying = true;
                track.classList.add('dragging');
                track.style.pointerEvents = 'none';
                setValue(0);

                animTm = setTimeout(() => {
                    animateValue(0, 100, 3200, () => {
                        endAuto();
                    });
                }, 400);
            }

            function endAuto() {
                if (animTm) clearTimeout(animTm);
                animTm = null;
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
                autoPlaying = false;
                track.classList.remove('dragging');
                track.style.pointerEvents = '';
            }

            function valueFromEvent(e) {
                const rect = track.getBoundingClientRect();
                const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
                const rel = (x - rect.left) / rect.width;
                return rel * (MAX - MIN) + MIN;
            }

            function onDown(e) {
                if (autoPlaying) return;
                e.preventDefault();
                dragging = true;
                track.classList.add('dragging');
                setValue(valueFromEvent(e));
            }

            function onMove(e) {
                if (!dragging) return;
                setValue(valueFromEvent(e));
            }

            function onUp() {
                dragging = false;
                track.classList.remove('dragging');
            }

            track.addEventListener('mousedown', onDown);
            track.addEventListener('touchstart', onDown, { passive: false });
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('mouseup', onUp);
            window.addEventListener('touchend', onUp);

            setValue(value);

            return {
                hasPlayed: false,
                play(loop) {
                    this.hasPlayed = true;
                    runAutoSequence(!!loop);
                },
                stop() {
                    endAuto();
                }
            };
        })();

        /* CARD 3 · Design Systems — staggered blink */
        const dsCtrl = (() => {
            const rects = ['ds1', 'ds2', 'ds3', 'ds4'].map(id => document.getElementById(id));
            if (rects.some(r => !r)) return null;
            let tm = mkTimer();

            function blinkOnce() {
                rects.forEach((r, i) => {
                    tm.after(() => {
                        r.style.transition = 'opacity .5s ease';
                        r.style.opacity = '0.12';
                        tm.after(() => { r.style.opacity = '1'; }, 520);
                    }, i * 500);
                });
            }

            function loopBlink(el, delay) {
                tm.after(function pulse() {
                    el.style.transition = 'opacity .5s ease';
                    el.style.opacity = '0.12';
                    tm.after(() => {
                        el.style.opacity = '1';
                        tm.after(pulse, 900 + Math.random() * 1100);
                    }, 520);
                }, delay);
            }

            return {
                hasPlayed: false,
                play(loop) {
                    tm.clear();
                    rects.forEach(r => { r.style.transition = 'none'; r.style.opacity = '1'; });
                    if (loop) {
                        rects.forEach((r, i) => loopBlink(r, 300 + i * 460));
                    } else {
                        blinkOnce();
                    }
                },
                stop() {
                    tm.clear();
                    rects.forEach(r => { r.style.opacity = '1'; });
                }
            };
        })();

        /* CARD 4 · Figma — cursor click + resize */
        const figmaCtrl = (() => {
            const bg      = document.getElementById('figma-bg');
            const inner   = document.getElementById('figma-inner');
            const cursor  = document.getElementById('figma-cursor');
            const handles = ['fh-tl', 'fh-tr', 'fh-bl', 'fh-br'].map(id => document.getElementById(id));
            if (!bg || !inner || !cursor || handles.some(h => !h)) return null;

            const CX = 88, CY = 65;
            let tm = mkTimer();
            let loop = false;

            cursor.style.position = 'absolute';

            function mv(x, y)  { cursor.style.left = x + 'px'; cursor.style.top = y + 'px'; }
            function show(v)   { cursor.style.opacity = v ? '1' : '0'; }
            function resetEl() {
                show(false);
                inner.style.width = '60px'; inner.style.height = '38px';
                handles.forEach(h => { h.style.opacity = '0'; h.style.boxShadow = 'none'; h.style.background = '#fff'; });
            }

            function runCycle() {
                resetEl(); mv(8, 8);
                tm.after(() => { show(true); mv(CX - 2, CY - 2); }, 600);
                tm.after(() => {
                    cursor.style.transform = 'scale(.72)';
                    tm.after(() => {
                        cursor.style.transform = 'scale(1)';
                        inner.style.width = '108px'; inner.style.height = '72px';
                        handles.forEach(h => {
                            h.style.opacity = '1';
                            h.style.background = '#c4baff';
                            h.style.boxShadow = '0 0 8px 2px rgba(124,111,238,.75)';
                        });
                    }, 135);
                }, 1450);
                tm.after(() => mv(CX + 42, CY + 26), 2700);
                tm.after(() => mv(bg.offsetWidth - 10, 10), 3500);
                tm.after(() => show(false), 4000);
                tm.after(() => { resetEl(); if (loop) tm.after(runCycle, 400); }, 4200);
            }

            return {
                hasPlayed: false,
                play(l) { tm.clear(); loop = l; runCycle(); },
                stop()  { loop = false; tm.clear(); resetEl(); }
            };
        })();

        /* CARD 5 · Terminal typewriter */
        const terminalCtrl = (() => {
            const body = document.getElementById('term-body');
            if (!body) return null;
            let token = { dead: true };

            function sleep(ms, t) {
                return new Promise((res, rej) => setTimeout(() => t.dead ? rej() : res(), ms));
            }

            function addLine(html) {
                const d = document.createElement('div');
                d.className = 't-line';
                d.innerHTML = html;
                body.appendChild(d);
                requestAnimationFrame(() => d.classList.add('show'));
                return d;
            }

            async function typeCmd(text, t) {
                const d = document.createElement('div');
                d.className = 't-line show';
                const cmd = document.createElement('span'); cmd.className = 't-cmd';
                const cur = document.createElement('span'); cur.className = 't-cursor';
                d.innerHTML = '<span class="t-prompt">$ </span>';
                d.appendChild(cmd); d.appendChild(cur);
                body.appendChild(d);
                for (let i = 0; i < text.length; i++) {
                    await sleep(40, t);
                    cmd.textContent = text.slice(0, i + 1);
                }
                cur.remove();
            }

            async function run(t, loop) {
                body.innerHTML = '';
                try {
                    const init = addLine('<span class="t-prompt">$ </span><span class="t-cursor"></span>');
                    await sleep(600, t);
                    init.remove();
                    await typeCmd('npm create vite@latest .', t);
                    await sleep(220, t);
                    addLine('<span class="t-out">✔ Select a framework: › React</span>');
                    await sleep(280, t);
                    addLine('<span class="t-out">✔ Select a variant: › TypeScript</span>');
                    await sleep(280, t);
                    addLine('<span class="t-out">Scaffolding project in ./... done.</span>');
                    await sleep(750, t);
                    await typeCmd('npm install', t);
                    await sleep(1300, t);
                    addLine('<span class="t-warn">added 312 packages in 4.2s</span>');
                    await sleep(650, t);
                    await typeCmd('npm run dev', t);
                    await sleep(340, t);
                    addLine('<span class="t-out">  VITE v5.0  ready in 284 ms</span>');
                    await sleep(360, t);
                    addLine('<span class="t-info">  ➜  Local:  http://localhost:5173/</span>');
                    if (loop) { await sleep(3000, t); if (!t.dead) run(t, true); }
                } catch (_) {}
            }

            return {
                hasPlayed: false,
                play(loop) {
                    token.dead = true;
                    const t = { dead: false }; token = t;
                    run(t, loop);
                },
                stop() { token.dead = true; body.innerHTML = ''; }
            };
        })();

        /* CARD 6 · Micro-interactions — toggle + state pills */
        const microCtrl = (() => {
            const zone   = document.getElementById('micro-zone');
            const scene  = document.getElementById('micro-scene');
            const toggle = document.getElementById('toggle');
            const cursor = document.getElementById('micro-cursor');
            const stateRow = document.getElementById('state-row');
            if (!zone || !scene || !toggle || !cursor || !stateRow) return null;

            const pills = {
                off:   stateRow.querySelector('.state-pill--off'),
                hover: stateRow.querySelector('.state-pill--hover'),
                on:    stateRow.querySelector('.state-pill--on')
            };

            let tm = mkTimer();
            let loop = false;

            function getCenter(relativeTo) {
                const br = relativeTo.getBoundingClientRect(), tr = toggle.getBoundingClientRect();
                return { x: tr.left + tr.width / 2 - br.left, y: tr.top + tr.height / 2 - br.top };
            }

            cursor.style.position = 'absolute';
            function mv(x, y) { cursor.style.left = x + 'px'; cursor.style.top = y + 'px'; }
            function show(v)  { cursor.style.opacity = v ? '1' : '0'; }

            function resetState() {
                show(false);
                toggle.classList.remove('on');
                Object.values(pills).forEach(p => p && p.classList.remove('state-pill--active'));
            }

            function runCycle() {
                resetState();
                const sc = getCenter(scene);
                mv(sc.x + 85, sc.y - 18);
                tm.after(() => show(true), 450);
                tm.after(() => mv(sc.x - 2, sc.y - 2), 650);
                tm.after(() => {
                    cursor.style.transform = 'scale(.68)';
                    tm.after(() => {
                        cursor.style.transform = 'scale(1)';
                        toggle.classList.add('on');

                        if (pills.off && pills.hover && pills.on) {
                            pills.off.classList.add('state-pill--active');
                            tm.after(() => {
                                pills.hover.classList.add('state-pill--active');
                            }, 220);
                            tm.after(() => {
                                pills.on.classList.add('state-pill--active');
                            }, 520);
                        }
                    }, 130);
                }, 1500);
                tm.after(() => mv(sc.x + 62, sc.y - 28), 2900);
                tm.after(() => show(false), 3450);
                tm.after(() => {
                    toggle.classList.remove('on');
                    Object.values(pills).forEach(p => p && p.classList.remove('state-pill--active'));
                    if (loop) tm.after(runCycle, 400);
                }, 4100);
            }

            return {
                hasPlayed: false,
                play(l) { tm.clear(); loop = l; runCycle(); },
                stop()  { loop = false; tm.clear(); resetState(); }
            };
        })();

        /* CARD 1 · User Testing — heatmap cursor */
        const utCtrl = (() => {
            const scene  = document.getElementById('ut-scene');
            const cursor = document.getElementById('ut-cursor');
            if (!scene || !cursor) return null;
            const hotspots = [
                { rx: -30, ry: -22, sz: 20, col: 'rgba(255,110,50,.58)' },
                { rx:  14, ry:   2, sz: 16, col: 'rgba(255,165,20,.52)' },
                { rx: -10, ry:  30, sz: 23, col: 'rgba(220,45,45,.62)'  },
            ];
            let tm = mkTimer();
            let loop = false;

            const spotEls = hotspots.map(hs => {
                const el = document.createElement('div');
                const s = hs.sz * 2.6;
                el.style.cssText = `position:absolute;width:${s}px;height:${s}px;
      background:radial-gradient(circle,${hs.col} 0%,transparent 68%);
      border-radius:50%;pointer-events:none;opacity:0;
      transform:translate(-50%,-50%) scale(0);
      transition:opacity .38s ease,transform .5s cubic-bezier(.34,1.56,.64,1);z-index:10;`;
                scene.appendChild(el);
                return el;
            });

            cursor.style.position = 'absolute';

            function posSpots() {
                const cx = scene.offsetWidth / 2, cy = scene.offsetHeight / 2;
                hotspots.forEach((hs, i) => {
                    spotEls[i].style.left = (cx + hs.rx) + 'px';
                    spotEls[i].style.top  = (cy + hs.ry) + 'px';
                });
            }
            function mv(x, y)  { cursor.style.left = x + 'px'; cursor.style.top = y + 'px'; }
            function show(v)   { cursor.style.opacity = v ? '1' : '0'; }
            function hideSpots() {
                spotEls.forEach(s => {
                    s.style.opacity = '0';
                    s.style.transform = 'translate(-50%,-50%) scale(0)';
                });
            }
            function revealSpot(i) {
                spotEls[i].style.opacity = '1';
                spotEls[i].style.transform = 'translate(-50%,-50%) scale(1)';
            }

            function runCycle() {
                hideSpots(); show(false); posSpots();
                const cx = scene.offsetWidth / 2, cy = scene.offsetHeight / 2;
                mv(scene.offsetWidth - 8, 6);
                tm.after(() => show(true), 250);
                hotspots.forEach((hs, i) => {
                    const base = 650 + i * 1450;
                    tm.after(() => mv(cx + hs.rx - 4, cy + hs.ry - 6), base);
                    tm.after(() => {
                        cursor.style.transform = 'scale(.72)';
                        tm.after(() => {
                            cursor.style.transform = 'scale(1)';
                            revealSpot(i);
                        }, 120);
                    }, base + 600);
                });
                tm.after(() => { show(false); if (loop) tm.after(runCycle, 600); }, 5200);
            }

            return {
                hasPlayed: false,
                play(l) { tm.clear(); loop = l; posSpots(); runCycle(); },
                stop()  { loop = false; tm.clear(); show(false); hideSpots(); }
            };
        })();

        const ctrls = [utCtrl, controlSliderCtrl, dsCtrl, figmaCtrl, terminalCtrl, microCtrl].filter(Boolean);
        const max = Math.min(cards.length, ctrls.length);
        const observedCards = cards.slice(0, max);

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const i = observedCards.indexOf(entry.target);
                if (i < 0) return;
                const ctrl = ctrls[i];
                if (!ctrl || ctrl.hasPlayed) return;
                ctrl.hasPlayed = true;
                ctrl.play(false);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.35 });

        observedCards.forEach(card => io.observe(card));

        observedCards.forEach((card, i) => {
            const ctrl = ctrls[i];
            if (!ctrl) return;
            card.addEventListener('mouseenter', () => ctrl.play(true));
            card.addEventListener('mouseleave', () => ctrl.stop());
        });
    }

    /* Démarrage au chargement (adapter si tu as déjà onReady / runWhenIdle) */
    const onReady = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };
    const runWhenIdle = (fn, timeout = 1500) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(fn, { timeout });
        } else {
            setTimeout(fn, 0);
        }
    };

    onReady(() => {
        runWhenIdle(initExpertiseAnimations);
    });
})();
