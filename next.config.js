/** @type {import('next').NextConfig} */
const configuredDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  allowedDevOrigins: ["192.168.1.47", ...configuredDevOrigins],
};

module.exports = nextConfig;
