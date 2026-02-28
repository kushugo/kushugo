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
})();
