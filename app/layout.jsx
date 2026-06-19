import localFont from "next/font/local";

import "./globals.css";

const bdoGrotesk = localFont({
  src: [
    { path: "../public/fonts/BDOGrotesk-Regular.woff", weight: "400", style: "normal" },
    { path: "../public/fonts/BDOGrotesk-Medium.woff", weight: "500", style: "normal" },
    { path: "../public/fonts/BDOGrotesk-DemiBold.woff", weight: "600", style: "normal" },
    { path: "../public/fonts/BDOGrotesk-Bold.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-grotesk",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata = {
  title: "Footprint Mappa · OCF Report Builder",
  description: "Configurable organisational carbon footprint report builder",
  icons: {
    icon: "/brand/logo-gradient.png",
    apple: "/brand/logo-gradient.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bdoGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
