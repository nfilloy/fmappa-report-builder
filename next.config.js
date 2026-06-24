/** @type {import('next').NextConfig} */
const configuredDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  allowedDevOrigins: ["192.168.1.47", ...configuredDevOrigins],
  serverExternalPackages: ["@sparticuz/chromium-min"],
};

// Let the responsive E2E boot its own dev server in an isolated build dir so its
// dev lock (`<distDir>/dev/...`) never collides with a dev server already running
// against the default `.next` directory.
if (process.env.NEXT_DIST_DIR) {
  nextConfig.distDir = process.env.NEXT_DIST_DIR;
}

module.exports = nextConfig;
