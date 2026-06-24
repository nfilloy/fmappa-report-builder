import nextVitals from "eslint-config-next/core-web-vitals";

const nextConfigs = Array.isArray(nextVitals) ? nextVitals : [nextVitals];

const config = [
  // Generated build output. `.next` is ignored by eslint-config-next already;
  // `.next-e2e` is the isolated build dir the responsive E2E spins up.
  { ignores: [".next-e2e/**"] },
  ...nextConfigs,
];

export default config;
