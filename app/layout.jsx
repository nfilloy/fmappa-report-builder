import localFont from "next/font/local";
import Script from "next/script";

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
  title: "Footprint Mapppppppa · Carbon Footprint Report Builder",
  description: "Configurable OCF and PCF carbon footprint report builder",
};

// Applies the saved (or system-preferred) theme before first paint to avoid a
// flash of the wrong theme. Runs synchronously in <head>.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bdoGrotesk.variable} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
