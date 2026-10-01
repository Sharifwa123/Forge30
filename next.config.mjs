import path from 'node:path';
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];
export default {
  poweredByHeader: false,
  outputFileTracingIncludes: { '/api/card/image': ['./src/assets/fonts/**', './public/brand/**'], '/opengraph-image': ['./public/brand/**'] },
  webpack(config) {
    // benign notice from inside the face-detector library
    config.ignoreWarnings = [...(config.ignoreWarnings || []), { module: /face-api\.esm\.js/ }];
    config.resolve.alias['@'] = path.join(process.cwd(), 'src');
    return config;
  },
  serverExternalPackages: ['pg'],
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};
