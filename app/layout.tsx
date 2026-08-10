import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./store.css";
import { withBasePath } from "./lib/paths";
import { ShopProvider } from "./shop";
import { SiteShell } from "./site-shell";

export const metadata: Metadata = {
  metadataBase: new URL("https://litopsatelier.ru"),
  title: {
    default: "Litops Atelier — браслеты из натуральных камней",
    template: "%s · Litops Atelier",
  },
  description:
    "Браслеты ручной работы из натуральных камней. Индивидуальный размер, авторская сборка и подарочная упаковка.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Litops Atelier",
    title: "Litops Atelier — браслеты из натуральных камней",
    description:
      "Браслеты ручной работы из натуральных камней. Индивидуальный размер и подарочная упаковка.",
    images: [{ url: "/images/hero-bracelet.webp", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Litops Atelier — браслеты из натуральных камней",
    description: "Авторские браслеты ручной работы из природных минералов.",
    images: ["/images/hero-bracelet.webp"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const brandedBackgrounds = {
    "--hero-image": `url("${withBasePath("/images/hero-bracelet.webp")}")`,
    "--detail-image": `url("${withBasePath("/images/bracelet-rutilated-quartz.jpeg")}")`,
  } as CSSProperties;

  return (
    <html lang="ru">
      <body style={brandedBackgrounds}>
        <ShopProvider>
          <SiteShell>{children}</SiteShell>
        </ShopProvider>
      </body>
    </html>
  );
}
