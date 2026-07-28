import "./globals.css";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "T3 Labs Content OS",
  description: "Private content operations workspace",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
