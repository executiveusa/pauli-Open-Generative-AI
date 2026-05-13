/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder'],
  // Allow images from common AI provider CDNs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.huggingface.co' },
      { protocol: 'https', hostname: '**.fal.run' },
      { protocol: 'https', hostname: '**.muapi.ai' },
    ],
  },
  // Redirect bare root to mol dashboard
  async redirects() {
    return [
      { source: '/', destination: '/mol/dashboard', permanent: false },
    ];
  },
};

export default nextConfig;
