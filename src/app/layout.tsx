import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mishra Classes - Master English",
  description: "Exclusive English Coaching for Class 9th-12th & Spoken English",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import MainWrapper from "@/components/MainWrapper";
import { CartProvider } from "@/contexts/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CartProvider>
          <Navbar />
          <MainWrapper>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </MainWrapper>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
