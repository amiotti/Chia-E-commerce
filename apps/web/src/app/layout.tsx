import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import Image from "next/image";
import localFont from "next/font/local";
import SessionWatchdog from "@/components/auth/SessionWatchdog";
import { CartProvider } from "@/components/cart/CartProvider";
import RouteTransition from "@/components/layout/RouteTransition";
import { getCurrentSession } from "@/lib/auth/session";
import "./globals.css";

const theSeasons = localFont({
  variable: "--font-the-seasons",
  display: "swap",
  src: [
    { path: "../../public/branding/fonts/fonnts.com-theseasons-lt.otf", weight: "300", style: "normal" },
    { path: "../../public/branding/fonts/fonnts.com-theseasons-ltit.otf", weight: "300", style: "italic" },
    { path: "../../public/branding/fonts/fonnts.com-theseasons-reg.otf", weight: "400", style: "normal" },
    { path: "../../public/branding/fonts/fonnts.com-theseasons-it.otf", weight: "400", style: "italic" },
    { path: "../../public/branding/fonts/fonnts.com-theseasons-bd.otf", weight: "700", style: "normal" },
    { path: "../../public/branding/fonts/fonnts.com-theseasons-bdit.otf", weight: "700", style: "italic" },
  ],
});

const alongSans = localFont({
  variable: "--font-along-sans",
  display: "swap",
  src: [
    { path: "../../public/branding/fonts/AlongSanss2-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/branding/fonts/AlongSanss2-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "../../public/branding/fonts/AlongSanss2-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/branding/fonts/AlongSanss2-MediumItalic.otf", weight: "500", style: "italic" },
    { path: "../../public/branding/fonts/AlongSanss2-SemiBold.otf", weight: "600", style: "normal" },
    { path: "../../public/branding/fonts/AlongSanss2-SemiBoldItalic.otf", weight: "600", style: "italic" },
    { path: "../../public/branding/fonts/AlongSanss2-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/branding/fonts/AlongSanss2-BoldItalic.otf", weight: "700", style: "italic" },
  ],
});

const themeInitScript = `
(function() {
  try {
    var storageKey = "chia_theme_mode";
    var root = document.documentElement;
    var stored = window.localStorage.getItem(storageKey);
    var mode = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.classList.toggle("theme-dark", mode === "dark");
    root.style.colorScheme = mode;
  } catch (error) {
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export const metadata: Metadata = {
  title: "CHIA | Espacio Saludable",
  description: "Tienda e-commerce SPA de CHIA Espacio Saludable",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();
  const sessionData = session ? { userId: session.userId, email: session.email, role: session.role } : null;

  return (
    <html lang="es" suppressHydrationWarning className={`${theSeasons.variable} ${alongSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <CartProvider initialSession={sessionData}>
          <SessionWatchdog enabled={Boolean(sessionData)} />

          <Image
            src="/branding/ondas-verde-claro.png"
            alt=""
            width={768}
            height={768}
            className="floaty pointer-events-none fixed -left-16 top-28 hidden w-44 rotate-[-10deg] opacity-18 mix-blend-multiply dark:opacity-12 dark:mix-blend-screen sm:block md:-left-20 md:top-24 md:w-52 md:opacity-22 md:dark:opacity-14 lg:-left-24 lg:top-20 lg:w-60 lg:opacity-28 lg:dark:opacity-18 xl:-left-28 xl:w-72 xl:opacity-36 xl:dark:opacity-24"
            aria-hidden="true"
          />
          <Image
            src="/branding/hojas-rosa.png"
            alt=""
            width={768}
            height={768}
            className="floaty pointer-events-none fixed -right-10 top-20 hidden w-36 rotate-[10deg] opacity-16 mix-blend-multiply dark:opacity-10 dark:mix-blend-screen sm:block md:-right-12 md:top-16 md:w-44 md:opacity-20 md:dark:opacity-12 lg:-right-16 lg:top-12 lg:w-52 lg:opacity-24 lg:dark:opacity-16 xl:-right-20 xl:top-10 xl:w-64 xl:opacity-30 xl:dark:opacity-22"
            aria-hidden="true"
          />
          <Image
            src="/branding/ondas-verde.png"
            alt=""
            width={768}
            height={768}
            className="floaty pointer-events-none fixed bottom-6 right-[-2.75rem] w-36 opacity-18 mix-blend-multiply dark:opacity-14 dark:mix-blend-screen sm:bottom-8 sm:right-[-3.5rem] sm:w-44 sm:opacity-20 md:bottom-10 md:right-[-4.5rem] md:w-56 md:opacity-22 md:dark:opacity-16 lg:bottom-12 lg:right-[-6rem] lg:w-72 lg:opacity-25 lg:dark:opacity-18"
            aria-hidden="true"
          />

          <RouteTransition>{children}</RouteTransition>
          <Analytics />
        </CartProvider>
      </body>
    </html>
  );
}