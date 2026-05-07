import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "MyJob — El trabajo te debe buscar a ti",
  description: "Marketplace conectando clientes con trabajadores. El trabajo te debe buscar a ti, no tú a él.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${dmSans.variable} ${instrumentSerif.variable} h-full`}
    >
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="min-h-full antialiased"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif", background: "#F8F6F1", color: "#1A1A1A" }}
      >
        {children}
      </body>
    </html>
  );
}
