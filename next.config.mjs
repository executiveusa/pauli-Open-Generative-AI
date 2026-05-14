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
  // Redirect bare root — env-driven for white-label builds
  async redirects() {
    const dest = process.env.NEXT_PUBLIC_ROOT_REDIRECT ?? '/mol/dashboard';
    return [
      { source: '/', destination: dest.startsWith('/') ? dest : `/${dest}`, permanent: false },
    ];
  },
};

export default nextConfig;
