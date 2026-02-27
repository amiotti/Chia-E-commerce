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
            className="floaty pointer-events-none fixed -left-12 top-36 w-28 rotate-[-10deg] opacity-16 mix-blend-multiply dark:opacity-14 dark:mix-blend-screen sm:-left-14 sm:top-32 sm:w-36 sm:opacity-18 md:-left-18 md:top-24 md:w-48 md:opacity-22 md:dark:opacity-16 lg:-left-24 lg:top-20 lg:w-60 lg:opacity-28 lg:dark:opacity-18 xl:-left-28 xl:w-72 xl:opacity-36 xl:dark:opacity-24"
            aria-hidden="true"
          />
          <Image
            src="/branding/hojas-rosa.png"
            alt=""
            width={768}
            height={768}
            className="floaty pointer-events-none fixed -right-6 top-20 w-24 rotate-[10deg] opacity-22 mix-blend-normal dark:opacity-18 dark:mix-blend-normal sm:-right-8 sm:top-18 sm:w-32 sm:opacity-24 md:-right-10 md:top-16 md:w-40 md:opacity-26 md:dark:opacity-22 lg:-right-16 lg:top-12 lg:w-52 lg:opacity-28 lg:dark:opacity-24 xl:-right-20 xl:top-10 xl:w-64 xl:opacity-32 xl:dark:opacity-28"
            aria-hidden="true"
          />
          <Image
            src="/branding/ondas-verde.png"
            alt=""
            width={768}
            height={768}
            className="floaty pointer-events-none fixed bottom-4 right-[-2.5rem] w-28 opacity-16 mix-blend-multiply dark:opacity-14 dark:mix-blend-screen sm:bottom-6 sm:right-[-3rem] sm:w-36 sm:opacity-18 md:bottom-10 md:right-[-4.5rem] md:w-56 md:opacity-22 md:dark:opacity-16 lg:bottom-12 lg:right-[-6rem] lg:w-72 lg:opacity-25 lg:dark:opacity-18"
            aria-hidden="true"
          />

          <RouteTransition>{children}</RouteTransition>
          <Analytics />
        </CartProvider>
      </body>
    </html>
  );
}