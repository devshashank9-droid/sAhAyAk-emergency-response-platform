import type { Metadata, Viewport } from "next";
import "./globals.css"; // Ensure this matches your CSS import

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

export const metadata: Metadata = {
  title: "sAhAyAk | Emergency SOS",
  description: "Instant emergency response and volunteer dispatch platform.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "sAhAyAk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}