(function () {
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

    // Force i18n update and specifically handle contact section
    function forceI18nUpdate() {
        if (window.__i18n && window.__i18n.getLang && window.__i18n.setLang) {
            const currentLang = window.__i18n.getLang();
            window.__i18n.setLang(currentLang);

            setTimeout(() => {
                if (window.__i18n && window.__i18n.t) {
                    const contactLabel = document.querySelector('.holo-label[data-i18n="contact.holo.label"]');
                    const contactTitle = document.querySelector('.holo-title[data-i18n="contact.holo.title"]');
                    const contactText = document.querySelector('.holo-text[data-i18n="contact.holo.text"]');
                    const contactBtn1 = document.querySelector('.holo-btn-text[data-i18n="contact.holo.button.appointment"]');
                    const contactBtn2 = document.querySelector('.holo-btn-text[data-i18n="contact.holo.button.linkedin"]');

                    if (contactLabel) {
                        const text = window.__i18n.t('contact.holo.label', 'Future ready');
                        if (text && contactLabel.textContent !== text) {
                            contactLabel.textContent = text;
                        }
                    }
                    if (contactTitle) {
                        const text = window.__i18n.t('contact.holo.title', 'Travaillons<br>ensemble');
                        if (text && contactTitle.innerHTML !== text) {
                            contactTitle.innerHTML = text;
                        }
                    }
                    if (contactText) {
                        const text = window.__i18n.t('contact.holo.text', 'Vous avez un projet en tête ?<br>Envie d\'échanger sur une idée ? N\'hésitez pas à me contacter, je serais ravi d\'en discuter avec vous.');
                        if (text && contactText.innerHTML !== text) {
                            contactText.innerHTML = text;
                        }
                    }
                    if (contactBtn1) {
                        const text = window.__i18n.t('contact.holo.button.appointment', 'Prendre rendez-vous');
                        if (text && contactBtn1.textContent !== text) {
                            contactBtn1.textContent = text;
                        }
                    }
                    if (contactBtn2) {
                        const text = window.__i18n.t('contact.holo.button.linkedin', 'LinkedIn');
                        if (text && contactBtn2.textContent !== text) {
                            contactBtn2.textContent = text;
                        }
                    }
                }
            }, 300);
        }
    }

    onReady(() => {
        setTimeout(forceI18nUpdate, 100);
        setTimeout(forceI18nUpdate, 500);
        setTimeout(forceI18nUpdate, 1000);
    });

    document.addEventListener('i18n:updated', () => {
        setTimeout(forceI18nUpdate, 100);
    });

    window.addEventListener('load', () => {
        setTimeout(forceI18nUpdate, 200);
    });

    // Three.js particle animation for projects section - lazy loaded
    let threeJSLoaded = false;
    let threeJSInitPromise = null;

    async function initThreeJS() {
        if (threeJSInitPromise) return threeJSInitPromise;

        threeJSInitPromise = (async () => {
            if (threeJSLoaded) return;
            threeJSLoaded = true;
            const { Scene, PerspectiveCamera, WebGLRenderer, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Points, Clock } = await import('three');

            const projectsSection = document.querySelector('.projects-section');
            if (!projectsSection) return;

            const canvas = document.createElement('canvas');
            canvas.className = 'threejs-canvas';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '0';
            canvas.style.opacity = '0';
            projectsSection.style.position = 'relative';
            projectsSection.appendChild(canvas);

            const scene = new Scene();
            const camera = new PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
            camera.position.z = 5;

            const renderer = new WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });
            renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const particleCount = 100;
            const geometry = new BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * 10;
                positions[i3 + 1] = (Math.random() - 0.5) * 10;
                positions[i3 + 2] = (Math.random() - 0.5) * 5;
                sizes[i] = Math.random() * 0.5 + 0.1;
            }

            geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
            geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));

            const material = new ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color1: { value: { r: 0.39, g: 0.4, b: 0.94 } },
                    color2: { value: { r: 0.12, g: 0.13, b: 0.24 } }
                },
                vertexShader: `
                    attribute float size;
                    uniform float time;
                    varying vec3 vPosition;
                    varying float vSize;
                    
                    void main() {
                        vPosition = position;
                        vSize = size;
                        
                        vec3 newPosition = position;
                        newPosition.y += sin(time * 0.5 + position.x) * 0.5;
                        newPosition.x += cos(time * 0.3 + position.y) * 0.5;
                        
                        vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
                        gl_PointSize = size * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec3 vPosition;
                    varying float vSize;
                    
                    void main() {
                        vec2 center = gl_PointCoord - vec2(0.5);
                        float dist = length(center);
                        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                        
                        vec3 color = mix(color1, color2, vPosition.y * 0.5 + 0.5);
                        gl_FragColor = vec4(color, alpha * 0.8);
                    }
                `,
                transparent: true,
                blending: 2
            });

            const points = new Points(geometry, material);
            scene.add(points);

            const clock = new Clock();
            let scrollProgress = 0;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        canvas.style.transition = 'opacity 1s ease';
                        canvas.style.opacity = '1';
                    } else {
                        canvas.style.opacity = '0';
                    }
                });
            }, { threshold: 0.2 });

            observer.observe(projectsSection);

            function updateScrollProgress() {
                const scrollPosition = window.scrollY + window.innerHeight;
                const sectionTop = projectsSection.offsetTop;
                const sectionHeight = projectsSection.offsetHeight;

                scrollProgress = Math.max(0, Math.min(1,
                    (scrollPosition - sectionTop) / sectionHeight
                ));
            }

            function animate() {
                requestAnimationFrame(animate);

                const elapsedTime = clock.getElapsedTime();
                updateScrollProgress();

                material.uniforms.time.value = elapsedTime + scrollProgress * 10;

                camera.position.x = scrollProgress * 2 - 1;
                camera.position.y = Math.sin(elapsedTime * 0.5) * 0.5;
                camera.lookAt(0, 0, 0);

                renderer.render(scene, camera);
            }

            window.addEventListener('resize', () => {
                const width = canvas.offsetWidth;
                const height = canvas.offsetHeight;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            });

            animate();

            setTimeout(() => {
                if (window.__i18n && window.__i18n.setLang && window.__i18n.t) {
                    const currentLang = window.__i18n.getLang();
                    window.__i18n.setLang(currentLang);

                    const contactLabel = document.querySelector('.holo-label[data-i18n="contact.holo.label"]');
                    const contactTitle = document.querySelector('.holo-title[data-i18n="contact.holo.title"]');
                    const contactText = document.querySelector('.holo-text[data-i18n="contact.holo.text"]');
                    const contactBtn1 = document.querySelector('.holo-btn-text[data-i18n="contact.holo.button.appointment"]');
                    const contactBtn2 = document.querySelector('.holo-btn-text[data-i18n="contact.holo.button.linkedin"]');

                    if (contactLabel) {
                        const text = window.__i18n.t('contact.holo.label', 'Future ready');
                        if (text) contactLabel.textContent = text;
                    }
                    if (contactTitle) {
                        const text = window.__i18n.t('contact.holo.title', 'Travaillons<br>ensemble');
                        if (text) contactTitle.innerHTML = text;
                    }
                    if (contactText) {
                        const text = window.__i18n.t('contact.holo.text', 'Vous avez un projet en tête ?<br>Envie d\'échanger sur une idée ? N\'hésitez pas à me contacter, je serais ravi d\'en discuter avec vous.');
                        if (text) contactText.innerHTML = text;
                    }
                    if (contactBtn1) {
                        const text = window.__i18n.t('contact.holo.button.appointment', 'Prendre rendez-vous');
                        if (text) contactBtn1.textContent = text;
                    }
                    if (contactBtn2) {
                        const text = window.__i18n.t('contact.holo.button.linkedin', 'LinkedIn');
                        if (text) contactBtn2.textContent = text;
                    }
                }
            }, 500);
        })();
        return threeJSInitPromise;
    }

    function loadThreeJSWhenNeeded() {
        const projectsSection = document.querySelector('.projects-section');
        if (!projectsSection) return;

        let loaded = false;

        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                if (!loaded) {
                    initThreeJS().catch(console.error);
                    loaded = true;
                }
            }, { timeout: 2000 });
        } else {
            setTimeout(() => {
                if (!loaded) {
                    initThreeJS().catch(console.error);
                    loaded = true;
                }
            }, 1500);
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !loaded) {
                    initThreeJS().catch(console.error);
                    loaded = true;
                    observer.disconnect();
                }
            });
        }, {
            rootMargin: '200px'
        });

        observer.observe(projectsSection);
    }

    onReady(loadThreeJSWhenNeeded);

    function lazyLoadProjectBackgrounds() {
        const projectImages = document.querySelectorAll('.project-image[style*="--project-image"]');
        if (projectImages.length === 0) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const projectImage = entry.target;
                    const style = projectImage.getAttribute('style');
                    const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
                    if (urlMatch && urlMatch[1]) {
                        imageObserver.unobserve(projectImage);
                    }
                }
            });
        }, {
            rootMargin: '100px'
        });

        projectImages.forEach(img => imageObserver.observe(img));
    }

    onReady(lazyLoadProjectBackgrounds);

    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    onReady(() => {
        document.querySelectorAll('.stat-number').forEach(stat => {
            counterObserver.observe(stat);
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    onReady(() => {
        document.querySelectorAll('.project-card, .clients-grid, .award-item').forEach(el => {
            observer.observe(el);
        });
    });

    runWhenIdle(() => {
        const cursor = document.querySelector('.cursor');
        if (window.innerWidth < 1024 || !cursor) return;

        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            const distX = mouseX - cursorX;
            const distY = mouseY - cursorY;

            cursorX += distX * 0.1;
            cursorY += distY * 0.1;

            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';

            requestAnimationFrame(animateCursor);
        }

        animateCursor();

        const interactiveElements = document.querySelectorAll('a, button, .project-image, .client-logo');

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('expand');
            });

            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('expand');
            });
        });
    });

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
            heroContent.style.opacity = 1 - (scrolled / 600);
        }
    }, { passive: true });

    runWhenIdle(() => {
        const magneticElements = document.querySelectorAll('.magnetic');
        magneticElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translate(0, 0)';
            });
        });
    });

    onReady(() => {
        document.querySelectorAll('.award-item').forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
        });

        document.querySelectorAll('.project-card').forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.2}s`;
        });

        runWhenIdle(() => {
            const cards = Array.from(document.querySelectorAll('.project-card'));
            if (!cards.length) return;
            window.addEventListener('scroll', () => {
                cards.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    const image = card.querySelector('.project-image');
                    if (image && rect.top < window.innerHeight && rect.bottom > 0) {
                        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                        const parallaxY = (progress - 0.5) * 30;
                        image.style.transform = `translateY(${parallaxY}px)`;
                    }
                });
            }, { passive: true });
        });

        const revealElements = document.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => revealObserver.observe(el));
    });

    // Gestion simple et transparente du consentement aux cookies de mesure d’audience
    (function () {
        const STORAGE_KEY = "cookie-consent";

        const getConsent = () => {
            try {
                return localStorage.getItem(STORAGE_KEY);
            } catch {
                return null;
            }
        };

        const setConsent = (value) => {
            try {
                localStorage.setItem(STORAGE_KEY, value);
            } catch {
                // stockage indisponible, on ne bloque pas l'utilisateur
            }
        };

        const loadAnalytics = () => {
            if (window.__analyticsLoaded) return;
            window.__analyticsLoaded = true;

            const scriptMain = document.createElement("script");
            scriptMain.src = "https://va.vercel-scripts.com/v1/script.js";
            scriptMain.defer = true;

            const scriptSpeed = document.createElement("script");
            scriptSpeed.src = "https://va.vercel-scripts.com/v1/speed-insights/script.js";
            scriptSpeed.defer = true;

            document.body.appendChild(scriptMain);
            document.body.appendChild(scriptSpeed);
        };

        const scheduleAnalytics = () => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadAnalytics, { timeout: 2000 });
            } else {
                setTimeout(loadAnalytics, 1200);
            }
        };

        const banner = document.querySelector(".cookie-banner");
        if (!banner) return;

        const btnAccept = document.getElementById("cookie-accept");
        const btnReject = document.getElementById("cookie-reject");

        const existing = getConsent();
        if (existing === "granted") {
            scheduleAnalytics();
            return;
        }
        if (existing === "denied") {
            return;
        }

        banner.classList.add("cookie-banner--visible");

        if (btnAccept) {
            btnAccept.addEventListener("click", () => {
                setConsent("granted");
                scheduleAnalytics();
                banner.classList.remove("cookie-banner--visible");
            });
        }

        if (btnReject) {
            btnReject.addEventListener("click", () => {
                setConsent("denied");
                banner.classList.remove("cookie-banner--visible");
            });
        }
    })();

    window.addEventListener('load', () => {
        document.body.classList.add('page-loaded');
    });

    onReady(() => {
        const skeletonImages = document.querySelectorAll('img[data-skeleton]');
        skeletonImages.forEach((img) => {
            const markLoaded = () => img.classList.add('is-loaded');
            if (img.complete) {
                markLoaded();
            } else {
                img.addEventListener('load', markLoaded, { once: true });
                img.addEventListener('error', markLoaded, { once: true });
            }
        });
    });

    /**
     * Micro-interactions pour la section Expertise (awards-section)
     * Dépendances: avoir onReady(fn) et runWhenIdle(fn, timeout) si pas dans le même bundle.
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

        onReady(() => {
            runWhenIdle(initExpertiseAnimations);
        });
    })();
})();
