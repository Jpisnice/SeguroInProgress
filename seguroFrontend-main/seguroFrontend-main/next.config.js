/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    //apiUrl: 'https://access.seguro.co.nz/api/',
    apiUrl: 'http://localhost:5000/',

  },
  async headers() {
    return [
      {
        // Set Content Security Policy (CSP) header
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data:;",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
