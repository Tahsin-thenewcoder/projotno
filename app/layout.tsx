import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "প্রযত্ন — সূচনা ছাত্র সংগঠন",
  description: "বহদ্দারকাটা উচ্চ বিদ্যালয় SSC 2020 ব্যাচের মেন্টরশিপ প্ল্যাটফর্ম",
  manifest: '/manifest.json',
  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}