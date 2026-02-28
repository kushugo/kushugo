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

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const progress = document.querySelector('.progress-bar');
        if (progress) {
            progress.style.width = scrolled + '%';
        }
    }, { passive: true });

    onReady(() => {
        (function () {
            const slides = document.querySelectorAll('.hero-slide');
            const dots = document.querySelectorAll('.hero-dot');
            let currentSlide = 0;
            const slideInterval = 4000;

            function goToSlide(n) {
                slides[currentSlide].classList.remove('is-active');
                dots[currentSlide].classList.remove('is-active');
                currentSlide = (n + slides.length) % slides.length;
                slides[currentSlide].classList.add('is-active');
                dots[currentSlide].classList.add('is-active');
            }

            function nextSlide() {
                goToSlide(currentSlide + 1);
            }

            let autoplay = setInterval(nextSlide, slideInterval);

            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    clearInterval(autoplay);
                    goToSlide(index);
                    autoplay = setInterval(nextSlide, slideInterval);
                });
            });

            const heroSlider = document.querySelector('.hero-slider');
            if (heroSlider) {
                heroSlider.addEventListener('mouseenter', () => clearInterval(autoplay));
                heroSlider.addEventListener('mouseleave', () => {
                    autoplay = setInterval(nextSlide, slideInterval);
                });
            }
        })();

        (function () {
            const lightbox = document.getElementById('lightbox');
            if (!lightbox) return;
            const lightboxImg = lightbox.querySelector('img');
            const closeBtn = lightbox.querySelector('.lightbox-close');
            const zoomBtn = document.querySelector('.hero-zoom-button');

            function openLightbox() {
                const activeSlide = document.querySelector('.hero-slide.is-active');
                const activeImg = activeSlide ? activeSlide.querySelector('img') : null;

                if (activeImg) {
                    lightboxImg.src = activeImg.src;
                    lightboxImg.alt = activeImg.alt;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }

            function closeLightbox() {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }

            if (zoomBtn) zoomBtn.addEventListener('click', openLightbox);
            if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) closeLightbox();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                    closeLightbox();
                }
            });
        })();

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

        document.querySelectorAll('.content-section, .info-card, .step-card, .stat-card, .quote-box, .icon-list li, .timeline-item, .chart-block').forEach(el => {
            observer.observe(el);
        });

        const tocItems = document.querySelectorAll('.toc-item');
        const sections = document.querySelectorAll('.content-section');

        tocItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.dataset.section;
                const section = document.getElementById(sectionId);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
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
            const comparisonContainer = document.getElementById('comparisonContainer');
            const comparisonSlider = document.getElementById('comparisonSlider');
            const comparisonBefore = document.getElementById('comparisonBefore');

            if (comparisonContainer && comparisonSlider && comparisonBefore) {
                let isDragging = false;

                function updateSlider(x) {
                    const rect = comparisonContainer.getBoundingClientRect();
                    const position = Math.max(0, Math.min(x - rect.left, rect.width));
                    const percentage = (position / rect.width) * 100;

                    comparisonSlider.style.left = `${percentage}%`;
                    comparisonBefore.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
                }

                comparisonSlider.addEventListener('mousedown', () => isDragging = true);

                document.addEventListener('mouseup', () => isDragging = false);

                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        updateSlider(e.clientX);
                    }
                });

                comparisonContainer.addEventListener('click', (e) => {
                    updateSlider(e.clientX);
                });

                comparisonSlider.addEventListener('touchstart', () => isDragging = true);

                document.addEventListener('touchend', () => isDragging = false);

                document.addEventListener('touchmove', (e) => {
                    if (isDragging && e.touches[0]) {
                        updateSlider(e.touches[0].clientX);
                    }
                });
            }
        })();

        const initCharts = () => {
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js non chargé');
                return;
            }

            const conversionCtx = document.getElementById('conversionChart');
            if (conversionCtx) {
                new Chart(conversionCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Version initiale', 'Après optimisation UX', 'Avec vidéos intégrées'],
                        datasets: [{
                            label: 'Taux de conversion (%)',
                            data: [2.1, 3.4, 4.6],
                            backgroundColor: [
                                'rgba(245, 158, 11, 0.6)',
                                'rgba(245, 158, 11, 0.75)',
                                'rgba(245, 158, 11, 0.9)'
                            ],
                            borderColor: [
                                'rgba(245, 158, 11, 1)',
                                'rgba(245, 158, 11, 1)',
                                'rgba(245, 158, 11, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 5,
                                ticks: {
                                    callback: function (value) {
                                        return value + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const metricsCtx = document.getElementById('metricsChart');
            if (metricsCtx) {
                new Chart(metricsCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Taux de conversion', 'Temps moyen sur site', 'Partages vidéos'],
                        datasets: [{
                            label: 'Performance',
                            data: [4.6, 225, 2100],
                            backgroundColor: [
                                'rgba(234, 88, 12, 0.7)',
                                'rgba(245, 158, 11, 0.7)',
                                'rgba(251, 191, 36, 0.7)'
                            ],
                            borderColor: [
                                'rgba(234, 88, 12, 1)',
                                'rgba(245, 158, 11, 1)',
                                'rgba(251, 191, 36, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const label = context.label || '';
                                        const value = context.parsed.y;

                                        if (label.includes('conversion')) {
                                            return value + '%';
                                        } else if (label.includes('temps')) {
                                            const minutes = Math.floor(value / 60);
                                            const seconds = value % 60;
                                            return minutes + 'm ' + seconds + 's';
                                        } else if (label.includes('Partages')) {
                                            return (value / 1000).toFixed(1) + 'K partages';
                                        }
                                        return value;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        };

        const chartTargets = Array.from(document.querySelectorAll('#conversionChart, #metricsChart'));
        if (chartTargets.length) {
            const triggerCharts = () => {
                loadChartJs().then(initCharts).catch(() => {
                    console.warn('Chart.js non chargé');
                });
            };

            if ('IntersectionObserver' in window) {
                const chartObserver = new IntersectionObserver((entries, observer) => {
                    if (entries.some(entry => entry.isIntersecting)) {
                        observer.disconnect();
                        triggerCharts();
                    }
                }, { rootMargin: '200px' });

                chartTargets.forEach(target => chartObserver.observe(target));
            } else {
                triggerCharts();
            }
        }
    });
})();
