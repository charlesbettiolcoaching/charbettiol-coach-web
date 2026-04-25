/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    // Ensure the Mission Control HTML asset is bundled into the
    // serverless function so readFileSync can find it at runtime.
    outputFileTracingIncludes: {
      '/mission-control': ['./src/data/mission-control.html'],
    },
  },
}
module.exports = nextConfig
