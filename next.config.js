/** @type {import('next').NextConfig} */

function getStorageHostname() {
  try {
    if (!process.env.S3_ENDPOINT_URL) return null;
    return new URL(process.env.S3_ENDPOINT_URL).hostname;
  } catch {
    return null;
  }
}

const storageHostname = getStorageHostname();

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.worldsoccerpins.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "football-logos.cc",
        port: "",
        pathname: "/**",
      },
      // Neon object storage (direct URLs from older uploads). New uploads
      // are served from /api/uploads, but keeping this here prevents
      // `next/image` from crashing on legacy/environment-specific URLs.
      {
        protocol: "https",
        hostname: "**.neon.tech",
        port: "",
        pathname: "/**",
      },
      ...(storageHostname
        ? [
            {
              protocol: "https",
              hostname: storageHostname,
              port: "",
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

module.exports = nextConfig;
