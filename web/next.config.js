// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');
const { withContentlayer } = require('next-contentlayer');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true // ✅ enable Server Actions
    }
};

module.exports = withContentlayer(withNextIntl(nextConfig));