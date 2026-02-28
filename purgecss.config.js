module.exports = {
    content: [
        './**/*.html',
        './app/**/*.{js,jsx,ts,tsx}',
        './js/**/*.js',
    ],
    css: ['./**/*.css'],
    safelist: [
        /^modal-/,
        /^tooltip-/,
        /^is-/,
        /^active$/,
    ],
    defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
};
