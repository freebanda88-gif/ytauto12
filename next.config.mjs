import config from "./config.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID,
  },
};

export default nextConfig;
