import type { Metadata, Viewport } from "next";

// Add this viewport export above or below your metadata
export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming in when tapping the SOS button
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