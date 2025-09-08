/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'yoga-layout': 'yoga-layout-prebuilt',
    };
    return config;
  },
};
module.exports = nextConfig;
