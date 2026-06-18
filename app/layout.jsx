import "./globals.css";

export const metadata = {
  title: "FMappa Report Builder",
  description: "Carbon footprint report builder technical challenge",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
