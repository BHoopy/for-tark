/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
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
    ],
  },
};

module.exports = nextConfig;
