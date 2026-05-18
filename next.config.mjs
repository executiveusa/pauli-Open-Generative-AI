import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio'],
  webpack(config) {
    // Hard-pin ai-agent and workflow-builder to committed stubs so webpack
    // never traverses the uninitialised git submodule directories, even if
    // those directories contain a package.json with a matching name.
    config.resolve.alias = {
      ...config.resolve.alias,
      'ai-agent': join(__dirname, 'stubs/ai-agent/dist/index.js'),
      'workflow-builder': join(__dirname, 'stubs/workflow-builder/dist/index.js'),
    };
    return config;
  },
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
