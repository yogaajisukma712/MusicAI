/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.googlevideo.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '**.invidious.**' },
      { protocol: 'https', hostname: 'inv.zoomerville.com' },
      { protocol: 'https', hostname: 'yewtu.be' },
    ],
  },
};

module.exports = nextConfig;
