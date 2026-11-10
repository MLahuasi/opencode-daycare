import type { Metadata } from "next";
import { connection } from "next/server";
import { Fredoka, Nunito } from "next/font/google";
import { getApplicationEnvironment } from "@/config/server";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenDayCare",
  description: "Comunidad de Sala Soles en OpenDayCare.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();

  return (
    <html
       lang={getApplicationEnvironment().locale}
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
