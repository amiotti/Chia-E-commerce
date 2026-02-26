import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/components/cart/CartProvider";
import { getCurrentSession } from "@/lib/auth/session";
import "./globals.css";

const theSeasons = localFont({
  variable: "--font-the-seasons",
  display: "swap",
  src: [
    {
      path: "../../public/branding/fonts/fonnts.com-theseasons-lt.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/branding/fonts/fonnts.com-theseasons-ltit.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/branding/fonts/fonnts.com-theseasons-reg.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/branding/fonts/fonnts.com-theseasons-it.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/branding/fonts/fonnts.com-theseasons-bd.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/branding/fonts/fonnts.com-theseasons-bdit.otf",
      weight: "700",
      style: "italic",
    },
  ],
});

const alongSans = localFont({
  variable: "--font-along-sans",
  display: "swap",
  src: [
    {
      path: "../../public/branding/fonts/AlongSanss2-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/branding/fonts/AlongSanss2-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/branding/fonts/AlongSanss2-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/branding/fonts/AlongSanss2-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/branding/fonts/AlongSanss2-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/branding/fonts/AlongSanss2-SemiBoldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/branding/fonts/AlongSanss2-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/branding/fonts/AlongSanss2-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
});

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

  return (
    <html lang="es" suppressHydrationWarning className={`${theSeasons.variable} ${alongSans.variable}`}>
      <body className="antialiased">
        <CartProvider initialSession={session ? { userId: session.userId, email: session.email, role: session.role } : null}>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
