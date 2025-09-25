// postcss.config.cjs
module.exports = {
  plugins: [
    require('@tailwindcss/postcss')(), // ✅ v4-specific plugin
    require('autoprefixer'),
  ],
};
