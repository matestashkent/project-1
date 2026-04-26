import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TelegramInit from "@/components/TelegramInit";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Mentora AI — IELTS Репетитор",
  description: "Персональный AI-репетитор по IELTS в Telegram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.variable} font-sans bg-surface text-white`}>
        <TelegramInit />
        {children}
      </body>
    </html>
  );
}
