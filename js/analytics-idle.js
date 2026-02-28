(function () {
    const loadAnalytics = () => {
        if (window.__analyticsLoaded) return;
        window.__analyticsLoaded = true;

        const scriptMain = document.createElement('script');
        scriptMain.src = 'https://va.vercel-scripts.com/v1/script.js';
        scriptMain.defer = true;

        const scriptSpeed = document.createElement('script');
        scriptSpeed.src = 'https://va.vercel-scripts.com/v1/speed-insights/script.js';
        scriptSpeed.defer = true;

        document.body.appendChild(scriptMain);
        document.body.appendChild(scriptSpeed);
    };

    const scheduleLoad = () => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadAnalytics, { timeout: 3000 });
        } else {
            setTimeout(loadAnalytics, 1500);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleLoad);
    } else {
        scheduleLoad();
    }
})();
