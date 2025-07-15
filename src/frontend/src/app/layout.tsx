import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";


export const metadata: Metadata = {
  title: "見積依頼システム",
  description: "IT部門向け見積依頼・回答管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
