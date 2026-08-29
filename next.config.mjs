/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @resvg/resvg-js ships a native .node binary — webpack can't parse it as
  // a module, so it must be excluded from bundling and required natively at
  // runtime instead. Without this, `next build` fails compiling
  // app/api/social/[slug]/route.ts (confirmed against this scaffold).
  experimental: {
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
  },
};

export default nextConfig;
