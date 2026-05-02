import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Become Team USA",
  description: "A movement archetype onboarding experience for the Team USA x Google Cloud Hackathon."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
