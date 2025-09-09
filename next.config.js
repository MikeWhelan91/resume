const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react$': require.resolve('react'),
      'react-dom$': require.resolve('react-dom'),
      '@': path.resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;
