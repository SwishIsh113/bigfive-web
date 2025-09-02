const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {};
// No Contentlayer wrapping
module.exports = withNextIntl(nextConfig);
