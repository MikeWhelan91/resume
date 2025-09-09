/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Treat anything imported with ?raw as a string (no CSS/HTML loaders)
    config.module.rules.push({
      resourceQuery: /raw/,   // enables `import x from './file.css?raw'`
      type: 'asset/source'
    })
    // Also allow plain .html files (without ?raw) to be imported as strings if needed
    config.module.rules.push({
      test: /\.html$/i,
      type: 'asset/source'
    })
    return config
  }
}
module.exports = nextConfig
